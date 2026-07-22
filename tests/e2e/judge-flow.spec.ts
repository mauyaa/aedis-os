import { expect, test } from "@playwright/test";

test("complete no-credit judge workflow", async ({ page }) => {
  await page.goto("/"); await expect(page.getByText("No API key, payment, account, or proprietary hardware is required.")).toBeVisible(); await page.getByTestId("enter-workspace").click(); await expect(page.getByTestId("engine-badge")).toContainText("Local Spatial v1");
  await page.getByTestId("fault-target").click(); await expect(page.getByAltText("Selected inspection evidence")).toBeVisible(); await page.getByTestId("inspect-button").click(); await expect(page.getByTestId("finding-panel")).toContainText("J2 connector is not fully seated"); await expect(page.getByTestId("spatial-overlay")).toBeVisible();
  await page.getByTestId("incident-button").click(); await page.getByTestId("reject-incident").click(); await page.getByTestId("incident-button").click(); await page.getByTestId("confirm-incident").click(); await expect(page.getByTestId("incident-button")).toContainText("Internal incident created");
  await page.getByTestId("corrected-target-quick").click(); await page.getByTestId("inspect-button").click(); await expect(page.getByTestId("verification-outcome")).toContainText("resolved"); await page.getByTestId("complete-button").click(); await expect(page.getByTestId("history-panel")).toContainText("1 findings");
  const download = page.waitForEvent("download"); await page.getByTestId("report-button").click(); expect((await download).suggestedFilename()).toMatch(/^aegis-.*\.pdf$/);
});
