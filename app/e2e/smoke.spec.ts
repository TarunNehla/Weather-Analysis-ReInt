import { expect, test } from "@playwright/test";

test("loads the dashboard from the static snapshot without API calls", async ({
  page
}) => {
  const requestUrls: string[] = [];
  page.on("request", (request) => {
    requestUrls.push(request.url());
  });

  const datasetResponse = page.waitForResponse((response) =>
    response.url().includes("/data/wind-forecast-january-2024.json")
  );

  await page.goto("/");
  await datasetResponse;

  await expect(
    page.getByRole("heading", {
      name: /compare january 2024 wind forecasts/i
    })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: /forecast vs actual/i
    })
  ).toBeVisible();

  const slider = page.getByLabel(/forecast horizon/i);

  const datasetRequestsBeforeSlider = requestUrls.filter((url) =>
    url.includes("/data/wind-forecast-january-2024.json")
  ).length;

  await slider.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "12";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(slider).toHaveValue("12");
  await expect(page.getByText("Actual points")).toBeVisible();

  await expect
    .poll(
      () =>
        requestUrls.filter((url) =>
          url.includes("/data/wind-forecast-january-2024.json")
        ).length
    )
    .toBe(datasetRequestsBeforeSlider);

  expect(requestUrls.some((url) => url.includes("/api/"))).toBe(false);
});
