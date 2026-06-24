/**
 * E2E: open each Lumi tree via the operator canvas and confirm the
 * picker grouping, category legend, and selected tree wheel render
 * without runtime errors.
 *
 * Run locally:
 *   bunx playwright install chromium
 *   bun run dev   # in another shell
 *   bunx playwright test tests/e2e/lumi-trees.spec.ts
 *
 * This test requires a signed-in Vanguard session. It is intentionally
 * kept out of the default `bun test` run; wire it into CI separately
 * once an authenticated test user is provisioned.
 */
import { test, expect } from "@playwright/test";
import { TREES, CATEGORY_COLOR, type TreeCategory } from "../../src/lib/q-trees";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

test.describe("Lumi operator canvas — all 21 trees", () => {
  for (const tree of TREES) {
    test(`renders ${tree.id} — ${tree.title}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/agent/framework?tree=${tree.id}`, {
        waitUntil: "domcontentloaded",
      });

      // Picker grouping — at least one chip per category that has trees.
      const categories: TreeCategory[] = ["core", "ops", "shared", "leadership"];
      for (const cat of categories) {
        const hasTrees = TREES.some((t) => t.category === cat);
        if (!hasTrees) continue;
        await expect(page.getByText(CATEGORY_COLOR[cat].label, { exact: false }).first()).toBeVisible();
      }

      // Legend block — blurbs for each category render.
      for (const cat of categories) {
        await expect(page.getByText(CATEGORY_COLOR[cat].blurb, { exact: false }).first()).toBeVisible();
      }

      // Active tree title + briefing/blurb.
      await expect(page.getByRole("heading", { name: tree.title }).first()).toBeVisible();
      await expect(page.getByText(tree.blurb, { exact: false }).first()).toBeVisible();

      // No runtime errors during render.
      expect(errors, `Runtime errors on ${tree.id}: ${errors.join(" | ")}`).toEqual([]);
    });
  }
});
