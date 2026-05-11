import { test, expect } from '@playwright/test';
import { LoginPage }         from './pages/LoginPage.js';
import { EventsPage }        from './pages/EventsPage.js';
import { EventDetailPage }   from './pages/EventDetailPage.js';
import { BookingsPage }      from './pages/BookingsPage.js';
import { BookingDetailPage } from './pages/BookingDetailPage.js';

const USER_EMAIL    = 'rahulshetty1@yahoo.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Refund Eligibility — Business Rules', () => {

  // Increase timeout: login + clear + book + 4 s spinner = ~30 s baseline
  test.setTimeout(60_000);

  let loginPage;
  let eventsPage;
  let eventDetailPage;
  let bookingsPage;
  let bookingDetailPage;

  test.beforeEach(async ({ page }) => {
    loginPage        = new LoginPage(page);
    eventsPage       = new EventsPage(page);
    eventDetailPage  = new EventDetailPage(page);
    bookingsPage     = new BookingsPage(page);
    bookingDetailPage = new BookingDetailPage(page);

    // Shared setup: authenticate + clean slate
    await loginPage.goto();
    await loginPage.login(USER_EMAIL, USER_PASSWORD);
    await bookingsPage.clear();
  });

  // REF-001 ───────────────────────────────────────────────────────────────────
  test('REF-001: single-ticket booking shows spinner then eligible result', async () => {
    // -- Step 1: Book event with default quantity (1 ticket) --
    await eventsPage.goto();
    await eventsPage.selectFirstAvailable();
    // quantity defaults to 1 — no increment needed
    await eventDetailPage.fillForm('Test User', 'testuser@example.com', '9876543210');
    await eventDetailPage.submit();
    const bookingRef = await eventDetailPage.getBookingRef();
    console.log(`Booked (qty=1). Ref: ${bookingRef}`);

    // -- Step 2: Open booking detail --
    await bookingsPage.goto();
    await bookingsPage.openDetail(bookingRef);

    // -- Step 3: Trigger refund check — spinner must appear then disappear --
    await bookingDetailPage.checkRefundEligibility();

    // -- Step 4: Assert eligible result --
    // Business rule: quantity === 1 → eligible (business-rules.md §8)
    await expect(bookingDetailPage.refundResult).toBeVisible();
    await expect(bookingDetailPage.refundResult).toContainText('Eligible for refund');
    await expect(bookingDetailPage.refundResult).toContainText('Single-ticket bookings qualify for a full refund');
    console.log('REF-001 passed: single-ticket booking is eligible for refund.');
  });

  // REF-002 ───────────────────────────────────────────────────────────────────
  test('REF-002: multi-ticket booking shows spinner then ineligible result', async () => {
    // -- Step 1: Book event with quantity = 2 --
    await eventsPage.goto();
    await eventsPage.selectFirstAvailable();
    await eventDetailPage.incrementQuantity(1); // 1 → 2 tickets
    await eventDetailPage.fillForm('Test User', 'testuser@example.com', '9876543210');
    await eventDetailPage.submit();
    const bookingRef = await eventDetailPage.getBookingRef();
    console.log(`Booked (qty=2). Ref: ${bookingRef}`);

    // -- Step 2: Open booking detail --
    await bookingsPage.goto();
    await bookingsPage.openDetail(bookingRef);

    // -- Step 3: Trigger refund check —  spinner must appear then disappear --
    await bookingDetailPage.checkRefundEligibility();

    // -- Step 4: Assert ineligible result --
    // Business rule: quantity > 1 → NOT eligible (business-rules.md §8)
    await expect(bookingDetailPage.refundResult).toBeVisible();
    await expect(bookingDetailPage.refundResult).toContainText('Not eligible for refund');
    await expect(bookingDetailPage.refundResult).toContainText('Group bookings');
    await expect(bookingDetailPage.refundResult).toContainText('2 tickets');
    console.log('REF-002 passed: multi-ticket booking is not eligible for refund.');
  });

});
