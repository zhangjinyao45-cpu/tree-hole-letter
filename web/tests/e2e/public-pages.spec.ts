import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage presents the core journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把今晚的话 留给未来的你" })).toBeVisible();
  await expect(page.getByRole("link", { name: "写一封信" })).toBeVisible();
});

test("public pages have no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});
