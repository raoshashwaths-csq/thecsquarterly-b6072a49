#!/usr/bin/env bun
/**
 * Automated WCAG contrast check for theme tokens.
 *
 * Parses src/styles.css, extracts token values for :root (light) and .dark
 * blocks, then computes contrast ratios for common text-on-surface pairings —
 * including translucent card overlays (bg-card/40, bg-card/60) composited over
 * the page background.
 *
 * Fails the build (exit 1) if any normal-text pair drops below WCAG AA 4.5:1.
 * Warns (does not fail) between 4.5 and 7 (AAA threshold).
 *
 * Run: `bun scripts/check-contrast.ts`
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// -------- OKLCH → sRGB --------
// Reference: https://www.w3.org/TR/css-color-4/#color-conversion-code
function oklchToRgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = Math.cos(h) * C;
  const b = Math.sin(h) * C;
  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  // LMS → linear sRGB
  let r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = (v: number) => {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };
  return [toSrgb(r), toSrgb(g), toSrgb(bl)];
}

// Parse `oklch(L C H)` or `oklch(L C H / A)`. L may be `0.5` or `50%`.
function parseOklch(raw: string): { rgb: [number, number, number]; a: number } | null {
  const m = raw.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  const pct = (s: string) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s));
  const L = pct(m[1]);
  const C = m[2].endsWith("%") ? (parseFloat(m[2]) / 100) * 0.4 : parseFloat(m[2]);
  const H = parseFloat(m[3]);
  const A = m[4] != null ? pct(m[4]) : 1;
  return { rgb: oklchToRgb(L, C, H), a: A };
}

function relLum([r, g, b]: [number, number, number]) {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: [number, number, number], bg: [number, number, number]) {
  const L1 = relLum(fg), L2 = relLum(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

// Composite a translucent color over an opaque backdrop, both in linear-sRGB space
// gives a more accurate result than doing it in gamma-encoded sRGB.
function composite(fg: [number, number, number], fgA: number, bg: [number, number, number]): [number, number, number] {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const gam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  const [fr, fg2, fb] = fg.map(lin) as [number, number, number];
  const [br, bg3, bb] = bg.map(lin) as [number, number, number];
  return [
    gam(fr * fgA + br * (1 - fgA)),
    gam(fg2 * fgA + bg3 * (1 - fgA)),
    gam(fb * fgA + bb * (1 - fgA)),
  ];
}

// -------- token extraction --------
type Tokens = Record<string, { rgb: [number, number, number]; a: number }>;

function extractBlock(css: string, selector: string): Tokens {
  // Match `<selector> {` so we skip prefixes like `@custom-variant dark (...)`
  // or descendant selectors such as `.dark .foo`.
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{", "g");
  const match = re.exec(css);
  if (!match) throw new Error(`Selector ${selector} not found`);
  const brace = match.index + match[0].length - 1;
  // Find matching close brace
  let depth = 1, i = brace + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  const body = css.slice(brace + 1, i - 1);
  const tokens: Tokens = {};
  const tokenRe = /--([a-z0-9-]+)\s*:\s*(oklch\([^)]+\))\s*;/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const parsed = parseOklch(m[2]);
    if (parsed) tokens[m[1]] = parsed;
  }
  return tokens;
}

// -------- pairings under audit --------
type Pair = { fg: string; bg: string; label: string; fgAlpha?: number; bgAlpha?: number };

const PAIRS: Pair[] = [
  { fg: "card-foreground", bg: "card", label: "text-card-foreground on bg-card" },
  { fg: "muted-foreground", bg: "muted", label: "text-muted-foreground on bg-muted" },
  { fg: "popover-foreground", bg: "popover", label: "text-popover-foreground on bg-popover" },
  { fg: "foreground", bg: "background", label: "text-foreground on bg-background" },
  { fg: "accent-foreground", bg: "accent", label: "text-accent-foreground on bg-accent" },
  { fg: "secondary-foreground", bg: "secondary", label: "text-secondary-foreground on bg-secondary" },
  { fg: "primary-foreground", bg: "primary", label: "text-primary-foreground on bg-primary" },
  { fg: "destructive-foreground", bg: "destructive", label: "text-destructive-foreground on bg-destructive" },
  // Accent-colored text on canvas surfaces (used for eyebrows, links)
  { fg: "accent", bg: "background", label: "text-accent on bg-background" },
  { fg: "accent", bg: "card", label: "text-accent on bg-card" },
  { fg: "secondary-accent", bg: "background", label: "text-secondary-accent on bg-background" },
  { fg: "secondary-accent", bg: "card", label: "text-secondary-accent on bg-card" },
  // Translucent card overlays composited over the page background
  { fg: "card-foreground", bg: "card", bgAlpha: 0.4, label: "text-card-foreground on bg-card/40 (over bg-background)" },
  { fg: "card-foreground", bg: "card", bgAlpha: 0.6, label: "text-card-foreground on bg-card/60 (over bg-background)" },
  { fg: "muted-foreground", bg: "card", bgAlpha: 0.4, label: "text-muted-foreground on bg-card/40 (over bg-background)" },
];

const AA_NORMAL = 4.5;
const AAA_NORMAL = 7;

function resolveColor(
  name: string,
  tokens: Tokens,
  overrideAlpha?: number,
): { rgb: [number, number, number]; a: number } {
  const t = tokens[name];
  if (!t) throw new Error(`Missing token --${name}`);
  return { rgb: t.rgb, a: overrideAlpha != null ? overrideAlpha : t.a };
}

function evaluate(theme: string, tokens: Tokens): { failures: string[]; warnings: string[]; report: string[] } {
  const failures: string[] = [];
  const warnings: string[] = [];
  const report: string[] = [];
  const bgCanvas = resolveColor("background", tokens).rgb;

  for (const p of PAIRS) {
    let fg = resolveColor(p.fg, tokens, p.fgAlpha);
    let bg = resolveColor(p.bg, tokens, p.bgAlpha);

    // Composite translucent surfaces over the canvas
    let bgRgb = bg.rgb;
    if (bg.a < 1) bgRgb = composite(bg.rgb, bg.a, bgCanvas);
    let fgRgb = fg.rgb;
    if (fg.a < 1) fgRgb = composite(fg.rgb, fg.a, bgRgb);

    const ratio = contrast(fgRgb, bgRgb);
    const rounded = ratio.toFixed(2);
    const line = `  ${rounded.padStart(5)}:1  ${p.label}`;
    if (ratio < AA_NORMAL) {
      failures.push(`[${theme}] FAIL ${rounded}:1 — ${p.label} (need ≥ ${AA_NORMAL})`);
      report.push(line + "  ✗ FAIL");
    } else if (ratio < AAA_NORMAL) {
      warnings.push(`[${theme}] WARN ${rounded}:1 — ${p.label} (AA only, below AAA)`);
      report.push(line + "  ⚠ AA");
    } else {
      report.push(line + "  ✓ AAA");
    }
  }
  return { failures, warnings, report };
}

function main() {
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
  const light = extractBlock(css, ":root");
  const dark = extractBlock(css, ".dark");

  const l = evaluate("light", light);
  const d = evaluate("dark", dark);

  console.log("── Contrast audit: light theme ──");
  l.report.forEach((r) => console.log(r));
  console.log("\n── Contrast audit: dark theme ──");
  d.report.forEach((r) => console.log(r));

  const failures = [...l.failures, ...d.failures];
  const warnings = [...l.warnings, ...d.warnings];

  if (warnings.length) {
    console.log("\nWarnings (AA but below AAA):");
    warnings.forEach((w) => console.log("  " + w));
  }
  if (failures.length) {
    console.error("\nContrast failures:");
    failures.forEach((f) => console.error("  " + f));
    console.error(`\n${failures.length} pair(s) below WCAG AA (4.5:1). Build failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${PAIRS.length * 2} pairings meet WCAG AA.`);
}

main();
