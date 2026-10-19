import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [390, 768, 1024, 1440]) {
  test(`has no detectable accessibility violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("keeps a visible focus indicator on line summaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const summary = page.locator(".line-summary").first();
  await expect(summary).toBeFocused();
  const outline = await summary.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");
});
