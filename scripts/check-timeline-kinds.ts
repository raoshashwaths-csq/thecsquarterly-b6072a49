#!/usr/bin/env bun
/**
 * Timeline-kinds audit — verifies every event `kind` written into
 * cs_account_events (server functions, route handlers, components) has a
 * matching renderer registered in src/components/csfactors/AccountTimeline.tsx
 * (the VECTORS array).
 *
 * Without this gate, the server silently drops events into the table that
 * the timeline UI cannot label correctly.
 *
 * Exit code 1 on any unregistered kind.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const SRC = join(ROOT, "src");
const TIMELINE = join(SRC, "components/csfactors/AccountTimeline.tsx");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

// ── Registered kinds: parse VECTORS in AccountTimeline.tsx ───────────────────
const timelineSrc = readFileSync(TIMELINE, "utf8");
const registered = new Set<string>();
for (const m of timelineSrc.matchAll(/{\s*kind:\s*"([a-z][a-z0-9._]*)"/g)) {
  registered.add(m[1]);
}

// ── Emitted kinds: scan source for `kind: "..."` near cs_account_events writes
// We capture two shapes:
//   A) Block that contains both `.from("cs_account_events")` and `kind: "..."`.
//   B) A call to logAccountEvent / logEv(...) whose argument object has
//      `kind: "..."`.
const emitted = new Map<string, { file: string; line: number }[]>();

function record(kind: string, file: string, line: number) {
  if (!emitted.has(kind)) emitted.set(kind, []);
  emitted.get(kind)!.push({ file, line });
}

function lineOf(src: string, idx: number): number {
  return src.slice(0, idx).split("\n").length;
}

const FILES = walk(SRC).filter(
  (f) =>
    !f.endsWith(".gen.ts") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".test.tsx") &&
    !f.includes("__tests__"),
);

for (const file of FILES) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  // Shape A — windows of ~600 chars around each cs_account_events reference.
  const eventsRe = /cs_account_events/g;
  let m: RegExpExecArray | null;
  while ((m = eventsRe.exec(src))) {
    const start = Math.max(0, m.index - 400);
    const end = Math.min(src.length, m.index + 600);
    const window = src.slice(start, end);
    for (const k of window.matchAll(/\bkind:\s*"([a-z][a-z0-9._]*)"/g)) {
      record(k[1], rel, lineOf(src, start + (k.index ?? 0)));
    }
  }

  // Shape B — `logAccountEvent({ ..., kind: "..." })` or `logEv({ ..., kind: "..." })`.
  const callRe = /\b(?:logAccountEvent|logEv)\s*\(\s*\{[\s\S]{0,400}?\bkind:\s*"([a-z][a-z0-9._]*)"/g;
  while ((m = callRe.exec(src))) {
    record(m[1], rel, lineOf(src, m.index));
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const missing: string[] = [];
for (const k of emitted.keys()) {
  if (!registered.has(k)) missing.push(k);
}

console.log(
  `Timeline-kinds audit — ${registered.size} registered, ${emitted.size} emitted.`,
);
console.log("Registered:", [...registered].sort().join(", "));
console.log("Emitted:   ", [...emitted.keys()].sort().join(", "));

if (missing.length === 0) {
  console.log(
    "\n✓ Every server-emitted event kind has a matching renderer in AccountTimeline.tsx.",
  );
  process.exit(0);
}

console.error(`\n✗ ${missing.length} unregistered event kind(s):`);
for (const k of missing) {
  console.error(`\n  kind "${k}" — written from:`);
  for (const site of emitted.get(k)!) {
    console.error(`    ${site.file}:${site.line}`);
  }
}
console.error(
  "\nFix: add an entry for each kind to the VECTORS array in\n" +
    "  src/components/csfactors/AccountTimeline.tsx\n" +
    "(use { hidden: true } if the kind is system-emitted and should not appear\n" +
    "in the manual picker).\n",
);
process.exit(1);
