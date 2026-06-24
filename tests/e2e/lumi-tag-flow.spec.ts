/**
 * E2E: complete a Lumi run, tag it to a CSFactors account via the
 * tree-aware account-tagging dropdown, and confirm the
 * `lumi.run.tagged` event lands on the account timeline with the
 * correct stakeholder.
 *
 * Run locally (auth required — a signed-in Vanguard/Operator user with at
 * least one CSFactors account):
 *
 *   bun run dev                      # in another shell
 *   bunx playwright install chromium
 *   E2E_BASE_URL=http://localhost:8080 \
 *   E2E_ACCOUNT_NAME="Acme Co" \
 *   E2E_TREE_ID=T1 \
 *   E2E_STAKEHOLDER="Champion" \
 *   bunx playwright test tests/e2e/lumi-tag-flow.spec.ts
 *
 * This test is intentionally excluded from `bun test`; wire it into CI
 * once an authenticated test user + seeded account are provisioned.
 */
import { test, expect } from "@playwright/test";
import { TREES } from "../../src/lib/q-trees";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const ACCOUNT_NAME = process.env.E2E_ACCOUNT_NAME ?? "Acme Co";
const TREE_ID = (process.env.E2E_TREE_ID as (typeof TREES)[number]["id"]) ?? "T1";
const STAKEHOLDER = process.env.E2E_STAKEHOLDER ?? "Champion";

test.describe("Lumi run → tag → account timeline", () => {
  test(`tags a ${TREE_ID} run to ${ACCOUNT_NAME} with stakeholder "${STAKEHOLDER}"`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // 1. Open the operator canvas for the requested tree.
    await page.goto(`${BASE_URL}/agent/framework?tree=${TREE_ID}`, {
      waitUntil: "domcontentloaded",
    });
    const tree = TREES.find((t) => t.id === TREE_ID)!;
    await expect(page.getByRole("heading", { name: tree.title }).first()).toBeVisible();

    // 2. Drive the tree to a terminal node + run Lumi. The canvas exposes
    //    L2/L3 nodes as buttons; pick the first terminal in this tree.
    const branchButtons = page.getByRole("button").filter({ hasText: /./ });
    await branchButtons.first().click();
    // The "Run Lumi" CTA appears once a terminal node is selected.
    await page.getByRole("button", { name: /run lumi|ask lumi|generate/i }).first().click();

    // 3. Wait for the response page; URL becomes /agent/response/<runId>.
    await page.waitForURL(/\/agent\/response\/[\w-]+/, { timeout: 60_000 });

    // 4. Locate the RunAccountTagger card and pick the account.
    const taggerSection = page.getByText("Tag this run to an account").locator("..").locator("..");
    await expect(taggerSection).toBeVisible({ timeout: 30_000 });

    const accountSelect = taggerSection.locator("select");
    await accountSelect.selectOption({ label: new RegExp(`^${ACCOUNT_NAME}`) });

    // 5. Enter the tree-aware stakeholder. The datalist offers suggestions
    //    based on TREE_ID; typing the literal also works.
    const stakeholderInput = taggerSection.locator("input[list]");
    await stakeholderInput.fill(STAKEHOLDER);

    // 6. Save the tag and confirm the success state.
    await taggerSection.getByRole("button", { name: /tag run|update tag/i }).click();
    await expect(taggerSection.getByText(/^Tagged$/i)).toBeVisible({ timeout: 15_000 });

    // 7. Navigate to CSFactors, open the account drawer, verify timeline.
    await page.goto(`${BASE_URL}/csfactors`, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("row", { name: new RegExp(ACCOUNT_NAME, "i") })
      .first()
      .click()
      .catch(async () => {
        // Fall back to clicking the account name directly if the grid
        // renders non-table semantics.
        await page.getByText(ACCOUNT_NAME, { exact: false }).first().click();
      });

    // 8. The timeline kind label is "Lumi run tagged" and the payload
    //    surfaces the stakeholder string.
    await expect(page.getByText("Lumi run tagged").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(STAKEHOLDER, { exact: false }).first()).toBeVisible();

    // 9. The CSFactors widget should now reflect this run.
    await page.locator('[data-testid="tagged-lumi-runs-widget"]').scrollIntoViewIfNeeded();
    const widget = page.locator('[data-testid="tagged-lumi-runs-widget"]');
    await expect(widget.getByText(STAKEHOLDER, { exact: false }).first()).toBeVisible();
    await expect(widget.getByText(new RegExp(`${TREE_ID} ·`)).first()).toBeVisible();

    expect(errors, `Runtime errors: ${errors.join(" | ")}`).toEqual([]);
  });
});
