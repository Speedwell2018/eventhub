import { expect } from '@playwright/test';

// Page Object: /login
export class LoginPage {
  constructor(page) {
    this.page = page;
    // Priority 3 — no data-testid on email/password inputs
    this.emailInput    = page.getByPlaceholder('you@email.com');
    this.passwordInput = page.getByLabel('Password');
    // Priority 4 — no data-testid on login button yet (pending deployment)
    this.submitBtn     = page.locator('#login-btn');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
    // Confirm auth completed — expect produces better failure messages than waitFor
    await expect(this.page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
  }
}
