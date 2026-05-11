import { test, expect } from '@playwright/test';

const USER_EMAIL   = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Authentication — Login & Authorization', () => {

  // E2E-001 ──────────────────────────────────────────────────────────────────
  test('E2E-001: login with valid credentials redirects to home and stores token', async ({ page }) => {
    // -- Step 1: Navigate to login page and verify heading --
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to EventHub/i })).toBeVisible();

    // -- Step 2: Fill credentials --
    await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
    await page.getByLabel('Password').fill(USER_PASSWORD);

    // -- Step 3: Submit --
    await page.locator('#login-btn').click();

    // -- Step 4: Verify redirect to home page (Browse Events link confirms authenticated state) --
    await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
    await expect(page).toHaveURL('/');

    // -- Step 5: Verify JWT is stored in localStorage --
    const token = await page.evaluate(() => localStorage.getItem('eventhub_token'));
    expect(token).toBeTruthy();
    expect(token).toMatch(/^eyJ/); // All JWTs start with base64-encoded header "eyJ"
    console.log(`Login successful. Token prefix: ${token?.slice(0, 20)}...`);
  });

  // E2E-002 ──────────────────────────────────────────────────────────────────
  test('E2E-002: register new account redirects to home and stores token', async ({ page }) => {
    const uniqueEmail  = `testqa+${Date.now()}@example.com`; // guaranteed unique
    const strongPassword = 'Secure@123'; // satisfies all 4 rules: 8+, uppercase, number, special char

    // -- Step 1: Navigate to register page and verify heading --
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();

    // -- Step 2: Fill registration form --
    await page.getByTestId('register-email').fill(uniqueEmail);
    await page.getByTestId('register-password').fill(strongPassword);
    await page.getByPlaceholder('Repeat your password').fill(strongPassword);
    console.log(`Registering with email: ${uniqueEmail}`);

    // -- Step 3: Submit --
    await page.getByTestId('register-btn').click();

    // -- Step 4: Verify redirect to home page --
    await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
    await expect(page).toHaveURL('/');

    // -- Step 5: Verify JWT is stored in localStorage --
    const token = await page.evaluate(() => localStorage.getItem('eventhub_token'));
    expect(token).toBeTruthy();
    expect(token).toMatch(/^eyJ/);
    console.log(`Registration successful. Token prefix: ${token?.slice(0, 20)}...`);
  });

  // E2E-003 ──────────────────────────────────────────────────────────────────
  test('E2E-003: unauthenticated access to /events redirects to /login', async ({ page }) => {
    // Each test gets a fresh browser context — localStorage is empty (no token) by default

    // -- Step 1: Navigate directly to the protected /events page --
    await page.goto('/events');

    // -- Step 2: AuthGuard detects no token and redirects to /login --
    await expect(page).toHaveURL('/login');

    // -- Step 3: Verify the login form is shown, not the events list --
    await expect(page.locator('#login-btn')).toBeVisible();
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible();
    await expect(page.getByTestId('event-card')).toHaveCount(0);
    console.log('Redirect confirmed: /events → /login for unauthenticated user');
  });

});
