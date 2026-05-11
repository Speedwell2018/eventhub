// Page Object: /bookings
export class BookingsPage {
  constructor(page) {
    this.page         = page;
    // Priority 1 — data-testid present on production
    this.bookingCards = page.getByTestId('booking-card');
    // Priority 2 — ARIA role
    this.clearAllBtn  = page.getByRole('button', { name: /clear all bookings/i });
    this.emptyState   = page.getByText('No bookings yet');
  }

  async goto() {
    await this.page.goto('/bookings');
  }

  // Clears all bookings. Safe to call when the list is already empty.
  async clear() {
    await this.goto();
    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    if (isEmpty) return;
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clearAllBtn.click();
    await this.emptyState.waitFor({ state: 'visible' });
  }

  // Opens the booking detail page for a given booking reference.
  // Navigates to /bookings/:id — caller should switch to BookingDetailPage.
  async openDetail(bookingRef) {
    const card = this.bookingCards.filter({ hasText: bookingRef });
    await card.getByRole('link', { name: 'View Details' }).click();
  }
}
