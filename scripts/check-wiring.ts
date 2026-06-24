#!/usr/bin/env bun
/**
 * Wiring check — fails CI when sidebar/route/CTA links point at
 * routes that do not exist.
 *
 * Scans:
 *   - src/components/csfactors/csfactorsNav.tsx   (sidebar TOP_LINKS / STANDALONE_LINKS)
 *   - all src/**\/*.{ts,tsx} for <Link to="..."> and navigate({ to: "..." })
 *
 * Compares the referenced paths against the set of route paths derived
 * from filenames under src/routes/. External URLs, mailto:, tel:, #hash
 * only, dynamic $params, and obvious template strings are skipped.
 *
 * Exit code 1 on broken wiring.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const ROUTES_DIR = join(ROOT, "src", "routes");
const SRC_DIR = join(ROOT, "src");

type Ref = { file: string; line: number; path: string; source: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// ── 1. Build the set of valid route paths from src/routes filenames ──────────
function routePathFromFile(rel: string): string | null {
  // strip extension
  let p = rel.replace(/\.(tsx|ts)$/, "");
  // ignore api routes (server routes, not navigable pages)
  if (p.startsWith("api/")) return null;
  // ignore the special placeholder files
  if (p.endsWith(".gen") || p === "__root") return null;
  // folder syntax → dot syntax
  p = p.replace(/\//g, ".");
  // .index → leaf
  p = p.replace(/\.index$/, "");
  if (p === "index") return "/";
  // dots → slashes for url
  const url = "/" + p.replace(/\./g, "/");
  return url;
}

const routePaths = new Set<string>(["/"]);
for (const file of walk(ROUTES_DIR)) {
  const rel = relative(ROUTES_DIR, file).replaceAll("\\", "/");
  const url = routePathFromFile(rel);
  if (url) routePaths.add(url);
}

// Normalize a referenced path against routePaths.
// Allows: exact match, $param routes (so "/csfactors/$accountId" matches
// "/csfactors/acme-123"), and known dynamic shells.
function isValidRoute(target: string): boolean {
  if (routePaths.has(target)) return true;
  // segment-by-segment match against any route with $params
  for (const route of routePaths) {
    if (!route.includes("$")) continue;
    const a = route.split("/");
    const b = target.split("/");
    if (a.length !== b.length) continue;
    let ok = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].startsWith("$")) continue;
      if (a[i] !== b[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

// ── 2. Collect every navigation reference ────────────────────────────────────
const refs: Ref[] = [];

const tsFiles = walk(SRC_DIR).filter(
  (f) =>
    (f.endsWith(".ts") || f.endsWith(".tsx")) &&
    !f.endsWith(".gen.ts") &&
    !f.includes("__tests__") &&
    !f.endsWith(".test.tsx") &&
    !f.endsWith(".test.ts"),
);

// Patterns. We capture string-literal paths only — templates / variables are skipped.
const PATTERNS: { name: string; regex: RegExp }[] = [
  // <Link to="/foo">  or to={"/foo"}
  { name: "Link to=", regex: /\bto\s*=\s*\{?["'`](\/[^"'`{}\s]*)["'`]\}?/g },
  // navigate({ to: "/foo" })  /  router.navigate({ to: "/foo" })
  { name: "navigate to:", regex: /\bto\s*:\s*["'`](\/[^"'`{}\s]*)["'`]/g },
  // redirect({ to: "/foo" }) — same shape, already captured by the rule above
];

for (const file of tsFiles) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(src))) {
      const path = m[1];
      // skip protocols + anchors + obvious assets
      if (
        path.startsWith("//") ||
        path.includes(":") ||
        /\.(png|jpg|jpeg|svg|webp|css|js|json|xml|txt|ico)$/.test(path)
      ) {
        continue;
      }
      // ignore /api/* — those are server routes, not Link targets
      if (path.startsWith("/api/")) continue;
      // ignore route loaders' own self-references that include $param tokens
      if (path.includes("$") && /\bcreateFileRoute\b/.test(src)) {
        // these are typically the route's own definition string
        continue;
      }
      // line number
      const offset = m.index;
      const upto = src.slice(0, offset);
      const line = upto.split("\n").length;
      refs.push({
        file: relative(ROOT, file),
        line,
        path,
        source: name,
      });
    }
  }
}

// ── 3. Validate ──────────────────────────────────────────────────────────────
const broken = refs.filter((r) => !isValidRoute(r.path));

console.log(`Wiring audit — ${routePaths.size} known routes, ${refs.length} navigation references.`);

if (broken.length === 0) {
  console.log("✓ All <Link to>, navigate({to}), and sidebar destinations resolve to real routes.");
  process.exit(0);
}

console.error(`\n✗ ${broken.length} broken navigation reference(s):\n`);
for (const b of broken) {
  console.error(`  ${b.file}:${b.line}   (${b.source})   →  ${b.path}`);
}
console.error(
  "\nFix: either create the missing route under src/routes/, or update the Link/navigate target.\n",
);
process.exit(1);
