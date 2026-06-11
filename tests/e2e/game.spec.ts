import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function dismissOnboarding(page: import("@playwright/test").Page) {
  const skip = page.getByRole("button", { name: "Skip" });
  await skip.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
  if (await skip.isVisible()) await skip.click();
}

async function setSlider(page: import("@playwright/test").Page, name: string, value: number) {
  await page.getByRole("slider", { name }).evaluate((element, next) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, String(next));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function startFirstChallenge(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Choose a challenge" })).toBeVisible();
  await expect(page.locator(".challenge-tile")).toHaveCount(13);
  await page.getByRole("button", { name: "Start challenge 1", exact: true }).click();
  await expect(page.locator(".submit-button")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("first visit onboarding and deterministic winning flow", async ({ page }) => {
  await expect(page.getByText("Find a color hidden in the cosmos")).toBeVisible();
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  await setSlider(page, "Hue", 16);
  await setSlider(page, "Saturation", 77);
  await setSlider(page, "Lightness", 59);
  await page.getByRole("button", { name: "Submit first guess" }).click();
  const result = page.getByRole("dialog", { name: "You found the hidden color" });
  await expect(result).toBeVisible();
  await expect(result.getByText("Your image")).toBeVisible();
  await expect(result.getByText("Original image")).toBeVisible();
  await expect(result).toContainText("#E76F44");
});

test("five-guess loss, stats, and next image", async ({ page }) => {
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: index === 0 ? "Submit first guess" : "Submit guess" }).click();
  }
  const result = page.getByRole("dialog", { name: "The color has been revealed" });
  await expect(result).toBeVisible();
  await expect(result).toContainText("Best guess");
  await result.getByRole("button", { name: "Next challenge" }).click();
  await expect(page.getByRole("button", { name: "Submit first guess" })).toBeVisible();
  const statsButton = page.getByRole("button", { name: "Stats" }).first();
  if (!(await statsButton.isVisible())) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await statsButton.click();
  await expect(page.getByText("Losses: 1")).toBeVisible();
});

test("restores an unfinished public round after reload and supports keyboard sliders", async ({ page }) => {
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  const hue = page.getByRole("slider", { name: "Hue" });
  await hue.focus();
  await page.keyboard.press("ArrowRight");
  await page.reload();
  await expect(page.getByRole("slider", { name: "Hue" })).toHaveValue("211");
});

test("opens and closes image zoom", async ({ page }) => {
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  await page.getByRole("button", { name: "Zoom image" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("has no basic accessibility violations or horizontal mobile overflow", async ({ page }) => {
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("active target area and inspector are visible without exposing answer values", async ({ page }) => {
  await dismissOnboarding(page);
  await startFirstChallenge(page);
  await expect(page.getByRole("button", { name: "Target area. Inspect" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inspect the sample" })).toBeVisible();
  await expect(page.getByText("Match this area")).toBeVisible();
  await expect(page.getByText("Sampled near here")).not.toBeVisible();
  await expect(page.getByText("#E76F44")).not.toBeVisible();
});
