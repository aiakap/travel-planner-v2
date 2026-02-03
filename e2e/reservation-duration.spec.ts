import { test, expect, type Page, type Locator } from "@playwright/test"

const editPath =
  process.env.PLAYWRIGHT_RESERVATION_EDIT_PATH ||
  "/reservation/cml505ltp0009p48w3puz6mrk/edit?returnTo=%2Fview1%2Fcmkwz1gxq008hp4vgwabgjvk5%3Ftab%3Djourney"

async function selectTimezone(
  page: Page,
  section: Locator,
  searchText: string,
  optionText: RegExp
) {
  const trigger = section.getByRole("button", { name: /timezone/i }).first()
  await trigger.click()
  const searchInput = page.getByPlaceholder("Search timezones...")
  await searchInput.fill(searchText)
  await page.getByRole("button", { name: optionText }).first().click()
}

test("recalculates point-to-point duration using timezones", async ({ page }) => {
  await page.goto(editPath)
  await page.waitForLoadState("domcontentloaded")

  if (/\/api\/auth\/signin/.test(page.url())) {
    test.skip(
      true,
      "Authenticated session required. Set PLAYWRIGHT_STORAGE_STATE to a logged-in storage file."
    )
  }

  const reservationNameInput = page.getByPlaceholder("Enter reservation name...")
  if ((await reservationNameInput.count()) === 0) {
    test.skip(true, `Reservation edit form not found at ${page.url()}`)
  }
  await expect(reservationNameInput).toBeVisible()

  const departureHeading = page.locator('h3:has-text("Departure")')
  const arrivalHeading = page.locator('h3:has-text("Arrival")')
  if ((await departureHeading.count()) === 0 || (await arrivalHeading.count()) === 0) {
    test.skip(true, "Reservation is not point-to-point; no Departure/Arrival sections.")
  }

  const departureCard = departureHeading.locator("..").locator("..")
  const arrivalCard = arrivalHeading.locator("..").locator("..")

  await selectTimezone(page, departureCard, "Los Angeles", /Los Angeles/i)
  await selectTimezone(page, arrivalCard, "London", /London/i)

  const departureTimeInput = departureCard
    .locator('label:has-text("Time")')
    .locator("..")
    .locator('input[type="datetime-local"]')
  const arrivalTimeInput = arrivalCard
    .locator('label:has-text("Time")')
    .locator("..")
    .locator('input[type="datetime-local"]')

  await departureTimeInput.fill("2026-02-03T10:00")
  await arrivalTimeInput.fill("2026-02-04T10:00")

  await expect(page.getByText(/Duration:\s*~16h\s*0m/i)).toBeVisible()
})
