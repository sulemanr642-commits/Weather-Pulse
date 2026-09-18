import { test, expect } from '@playwright/test';

test.describe('WeatherPulse Critical Paths E2E', () => {
  test('Public Path: load app, pick a city, see weather data and matching background scene appear', async ({ page }) => {
    // 1. Load the application
    await page.goto('/');

    // 2. Verify brand header
    await expect(page.locator('h1', { hasText: 'WeatherPulse' })).toBeVisible();

    // 3. Verify initial city presentation (Tokyo)
    const initialCityHeading = page.locator('h2', { hasText: 'Tokyo' });
    await expect(initialCityHeading).toBeVisible({ timeout: 15000 });

    // 4. Verify 3D WebGL scene or background container is mounted
    const canvasOrScene = page.locator('canvas, [data-testid="weather-scene-container"]');
    await expect(canvasOrScene.first()).toBeAttached();

    // 5. Open City Dropdown
    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeVisible();
    await combobox.click();

    // 6. Select "London" from the options
    const londonOption = page.locator('.city-option-item', { hasText: 'London' }).first();
    await expect(londonOption).toBeVisible();
    await londonOption.click();

    // 7. Verify WeatherCard presentation updates to London
    const londonHeading = page.locator('h2', { hasText: 'London' });
    await expect(londonHeading).toBeVisible({ timeout: 15000 });

    // 8. Verify weather metrics and forecast exist
    await expect(page.getByText('5-Day Forecast')).toBeVisible();
    await expect(page.getByText(/Humidity/i).first()).toBeVisible();
  });

  test('Admin Path: log in, add a city, see it appear in the dropdown', async ({ page }) => {
    const uniqueTestCity = `TestCity${Date.now().toString().slice(-4)}`;

    await page.goto('/');

    // 1. Open Administrative Console
    const adminBtn = page.getByRole('button', { name: /Admin/i });
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // 2. Authenticate as Administrator
    await expect(page.getByRole('heading', { name: 'Administrator Authentication' })).toBeVisible();
    
    const usernameInput = page.getByLabel(/Username/i);
    const passwordInput = page.getByLabel(/Password/i);
    const authBtn = page.getByRole('button', { name: /Authenticate Operator/i });

    await usernameInput.fill('admin');
    await passwordInput.fill('AdminSecret123!');
    await authBtn.click();

    // 3. Verify Admin Control Plane active
    await expect(page.getByText('Authenticated as @admin')).toBeVisible({ timeout: 10000 });

    // 4. Fill in new city registration form
    const cityNameInput = page.getByPlaceholder('e.g. Kyoto');
    const countryCodeInput = page.getByPlaceholder('JP');
    const latInput = page.getByPlaceholder('35.0116');
    const lonInput = page.getByPlaceholder('135.7681');
    const registerBtn = page.getByRole('button', { name: /Add Tracked Target/i });

    await cityNameInput.fill(uniqueTestCity);
    await countryCodeInput.fill('IS');
    await latInput.fill('64.1466');
    await lonInput.fill('-21.9426');
    await registerBtn.click();

    // 5. Verify success feedback
    await expect(page.getByText(new RegExp(`City "${uniqueTestCity}" tracked successfully`, 'i'))).toBeVisible({ timeout: 10000 });

    // 6. Close the Admin modal
    const closeBtn = page.getByRole('button', { name: /Close modal/i });
    await closeBtn.click();

    // 7. Open CityDropdown and verify the new city appears in the list
    const combobox = page.getByRole('combobox');
    await combobox.click();
    await combobox.fill(uniqueTestCity);

    const newCityOption = page.locator('.city-option-item', { hasText: uniqueTestCity }).first();
    await expect(newCityOption).toBeVisible({ timeout: 10000 });
  });
});
