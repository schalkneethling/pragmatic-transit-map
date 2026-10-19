import { expect, test } from "@playwright/test";

/**
 * Breakpoints, in em so they scale with the reader's default font size.
 * At the default 16px: 30em = 480px, 64em = 1024px, 80em = 1280px.
 *
 * small:  width < 30em          one column, stops run vertically, lines collapsed
 * medium: 30em <= width < 64em  cards in a grid, stops run vertically, lines collapsed
 * large:  64em <= width < 80em  stops run horizontally, line name above its stops
 * xlarge: width >= 80em         stops run horizontally, line name beside its stops
 */
const viewports = [
  { width: 390, tier: "small" },
  { width: 479, tier: "small" },
  { width: 480, tier: "medium" },
  { width: 768, tier: "medium" },
  { width: 1023, tier: "medium" },
  { width: 1024, tier: "large" },
  { width: 1279, tier: "large" },
  { width: 1280, tier: "xlarge" },
  { width: 1440, tier: "xlarge" },
];

const stacked = new Set(["small", "medium"]);

async function box(locator) {
  const result = await locator.boundingBox();
  expect(result, "element should be rendered").not.toBeNull();
  return result;
}

async function openStates(page) {
  return page.locator(".line-details").evaluateAll((all) => all.map((details) => details.open));
}

for (const { width, tier } of viewports) {
  test.describe(`${tier} at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
    });

    test("does not scroll the page sideways", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("opens the lines that suit the layout", async ({ page }) => {
      const states = await openStates(page);
      expect(states).toHaveLength(9);
      if (stacked.has(tier)) {
        expect(states).toEqual([true, false, false, false, false, false, false, false, false]);
      } else {
        expect(states.every(Boolean)).toBe(true);
      }
    });

    test("orients the stops of an open line for the layout", async ({ page }) => {
      const firstLine = page.locator(".line").first();
      const stops = firstLine.locator(".stop");
      const firstStop = await box(stops.nth(0));
      const secondStop = await box(stops.nth(1));

      if (stacked.has(tier)) {
        expect(secondStop.y).toBeGreaterThan(firstStop.y);
        expect(Math.abs(secondStop.x - firstStop.x)).toBeLessThan(1);
      } else {
        expect(Math.abs(secondStop.y - firstStop.y)).toBeLessThan(1);
        expect(secondStop.x).toBeGreaterThan(firstStop.x);
      }
    });

    test("places each line name relative to its stops for the layout", async ({ page }) => {
      const firstLine = page.locator(".line").first();
      const summary = await box(firstLine.locator(".line-summary"));
      const stops = await box(firstLine.locator(".stops"));

      if (tier === "xlarge") {
        expect(summary.x + summary.width).toBeLessThanOrEqual(stops.x);
      } else {
        expect(summary.y + summary.height).toBeLessThanOrEqual(stops.y);
      }
    });
  });
}

test.describe("line grid in the medium tier", () => {
  test("uses a single column at 480px", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await page.goto("/");
    const lines = page.locator(".line");
    const first = await box(lines.nth(0));
    const second = await box(lines.nth(1));
    expect(second.y).toBeGreaterThan(first.y);
    expect(Math.abs(second.x - first.x)).toBeLessThan(1);
  });

  test("uses two columns at 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    const lines = page.locator(".line");
    const first = await box(lines.nth(0));
    const second = await box(lines.nth(1));
    expect(Math.abs(second.y - first.y)).toBeLessThan(1);
    expect(second.x).toBeGreaterThan(first.x);
  });
});

test.describe("crossing the stacking breakpoint", () => {
  test("collapses lines when narrowing and reopens them when widening", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect((await openStates(page)).every(Boolean)).toBe(true);

    await page.setViewportSize({ width: 390, height: 900 });
    await expect.poll(() => openStates(page)).toEqual([true, false, false, false, false, false, false, false, false]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(async () => (await openStates(page)).every(Boolean)).toBe(true);
  });
});

test.describe("opening and closing lines", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
  });

  test("opens a collapsed line with a pointer", async ({ page }) => {
    const second = page.locator(".line-details").nth(1);
    await second.locator("summary").click();
    await expect(second).toHaveAttribute("open", "");
    await expect(second.locator(".stop").first()).toBeVisible();
  });

  test("opens a collapsed line with the keyboard", async ({ page }) => {
    const second = page.locator(".line-details").nth(1);
    await second.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("open", "");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows every line open on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    expect((await openStates(page)).every(Boolean)).toBe(true);
  });
});
