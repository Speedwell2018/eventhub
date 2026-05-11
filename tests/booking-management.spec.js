import { test, expect } from '@playwright/test';
import { LoginPage }         from './pages/LoginPage.js';
import { EventsPage }        from './pages/EventsPage.js';
import { EventDetailPage }   from './pages/EventDetailPage.js';
import { BookingsPage }      from './pages/BookingsPage.js';
import { BookingDetailPage } from './pages/BookingDetailPage.js';

const USER_EMAIL    = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Workflow Helper ─────────────────────────────────────────────────────────────

/**
 * Books the first available (non-sold-out) event on the events page.
 * Returns { bookingRef, eventTitle } from the confirmation card.
 * Precondition: user must be logged in before calling.
 */
async function bookEvent(eventsPage, eventDetailPage) {
  await eventsPage.goto();
  const eventTitle = await eventsPage.selectFirstAvailable();
  console.log(`Booking event: "${eventTitle}"`);
  await eventDetailPage.fillForm('Test User', 'testuser@example.com', '9876543210');
  await eventDetailPage.submit();
  const bookingRef = await eventDetailPage.getBookingRef();
  console.log(`Booking confirmed. Ref: ${bookingRef}`);
  return { bookingRef, eventTitle };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Booking Management — Critical Happy Paths', () => {
  let loginPage;
  let eventsPage;
  let eventDetailPage;
  let bookingsPage;
  let bookingDetailPage;

  test.beforeEach(async ({ page }) => {
    loginPage         = new LoginPage(page);
    eventsPage        = new EventsPage(page);
    eventDetailPage   = new EventDetailPage(page);
    bookingsPage      = new BookingsPage(page);
    bookingDetailPage = new BookingDetailPage(page);

    // Shared setup: authenticate + clean slate
    await loginPage.goto();
    await loginPage.login(USER_EMAIL, USER_PASSWORD);
    await bookingsPage.clear();
  });

  // TC-001 ───────────────────────────────────────────────────────────────────
  test('TC-001: displays booking card on bookings list page', async () => {
    // -- Step 1: Create one booking --
    const { bookingRef, eventTitle } = await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Navigate to /bookings --
    await bookingsPage.goto();

    // -- Step 3: Assert booking card appears with correct data --
    const card = bookingsPage.bookingCards.filter({ hasText: bookingRef });
    await expect(card).toBeVisible();
    await expect(card).toContainText(eventTitle);
    await expect(card).toContainText('confirmed');
    await expect(card).toContainText(bookingRef);
  });

  // TC-002 ───────────────────────────────────────────────────────────────────
  test('TC-002: shows all sections on booking detail page', async ({ page }) => {
    // -- Step 1: Create one booking --
    const { bookingRef, eventTitle } = await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Navigate to /bookings and click View Details --
    await bookingsPage.goto();
    await bookingsPage.openDetail(bookingRef);
    await expect(page).toHaveURL(/\/bookings\/\d+/);

    // -- Step 3: Verify booking ref badge in page header shows booking ref --
    await expect(bookingDetailPage.bookingRefBadge).toContainText(bookingRef);

    // -- Step 4: Verify event details section --
    await expect(page.getByText('Event Details')).toBeVisible();
    await expect(page.getByText(eventTitle).first()).toBeVisible();

    // -- Step 5: Verify customer details section --
    await expect(page.getByText('Customer Details')).toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible();

    // -- Step 6: Verify payment summary section --
    await expect(page.getByText('Payment Summary')).toBeVisible();
    await expect(page.getByText('Total Paid')).toBeVisible();

    // -- Step 7: Verify refund eligibility check button is present --
    await expect(bookingDetailPage.refundBtn).toBeVisible();
  });

  // TC-006 ───────────────────────────────────────────────────────────────────
  test('TC-006: navigates to bookings list after booking via View My Bookings link', async ({ page }) => {
    // -- Step 1: Book the first available event --
    const { bookingRef } = await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Click "View My Bookings" link on confirmation card --
    await page.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(page).toHaveURL('/bookings');

    // -- Step 3: Assert the new booking appears in the list --
    const bookingCard = bookingsPage.bookingCards.filter({ hasText: bookingRef });
    await expect(bookingCard).toBeVisible();
  });

  // TC-102 ───────────────────────────────────────────────────────────────────
  test('TC-102: booking reference starts with first letter of event title (uppercase)', async () => {
    // -- Step 1: Book first available event and capture title --
    const { bookingRef, eventTitle } = await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Assert ref starts with the event title's first char --
    const expectedPrefix = eventTitle[0].toUpperCase();
    expect(bookingRef).toMatch(new RegExp(`^${expectedPrefix}-[A-Z0-9]{6}$`));
    console.log(`Ref "${bookingRef}" correctly starts with "${expectedPrefix}-" (event: "${eventTitle}")`);
  });

  // TC-003 + TC-506 ──────────────────────────────────────────────────────────
  test('TC-003: cancels booking from detail page — shows toast and redirects', async ({ page }) => {
    // -- Step 1: Create one booking --
    const { bookingRef } = await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Navigate to booking detail via View Details --
    await bookingsPage.goto();
    await bookingsPage.openDetail(bookingRef);
    await expect(page).toHaveURL(/\/bookings\/\d+/);

    // -- Step 3: Click Cancel Booking button on detail page --
    await bookingDetailPage.cancelBtn.click();

    // -- Step 4: Assert React confirmation dialog appears --
    await expect(page.getByText('Cancel this booking?')).toBeVisible();
    await expect(bookingDetailPage.confirmCancelBtn).toBeVisible();

    // -- Step 5: Confirm cancellation --
    await bookingDetailPage.confirmCancelBtn.click();

    // -- Step 6: Assert redirect to /bookings and success toast --
    await expect(page).toHaveURL('/bookings');
    await expect(page.getByText('Booking cancelled successfully')).toBeVisible();

    // -- Step 7: Assert booking is no longer in the list --
    await expect(bookingsPage.emptyState).toBeVisible();
  });

  // TC-004 ───────────────────────────────────────────────────────────────────
  test('TC-004: clears all bookings and shows empty state', async ({ page }) => {
    // -- Step 1: Create one booking --
    await bookEvent(eventsPage, eventDetailPage);

    // -- Step 2: Navigate to /bookings and verify booking exists --
    await bookingsPage.goto();
    await expect(bookingsPage.bookingCards.first()).toBeVisible();

    // -- Step 3: Click "Clear all bookings" and accept browser confirm dialog --
    page.once('dialog', (dialog) => dialog.accept());
    await bookingsPage.clearAllBtn.click();

    // -- Step 4: Assert empty state --
    await expect(bookingsPage.emptyState).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Browse Events' })).toBeVisible();
  });

});
