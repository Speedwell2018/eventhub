import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  workers: 1,          // shared user account — prevent cross-project state interference
  retries: 0,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },

  projects: [
    {
      // Stateless auth tests — no shared mutable state, safe to parallelise
      name: 'auth',
      testMatch: '**/auth.spec.js',
    },
    {
      // Booking tests share user state via clear() — must run serially
      name: 'booking-management',
      testMatch: '**/booking-management.spec.js',
      fullyParallel: false,
    },
    {
      // Refund tests share user state via clear() — must run serially
      name: 'refund-eligibility',
      testMatch: '**/refund-eligibility.spec.js',
      fullyParallel: false,
    },
  ],
});
