// Page Object: /bookings/:id
export class BookingDetailPage {
  constructor(page) {
    this.page = page;
    // Priority 1 — data-testid present on production
    this.refundBtn     = page.getByTestId('check-refund-btn');
    this.refundSpinner = page.getByTestId('refund-spinner');
    this.refundResult  = page.getByTestId('refund-result');
    // Priority 2 — ARIA role
    this.cancelBtn        = page.getByRole('button', { name: 'Cancel Booking' });
    // Priority 1 — data-testid on ConfirmDialog confirm button
    this.confirmCancelBtn = page.getByTestId('confirm-dialog-yes');
    // Priority 5 — no data-testid on production yet; pending deployment
    this.bookingRefBadge  = page.locator('span.font-mono.font-bold').first();
  }

  // Clicks the refund check button, waits for the 4-second spinner to complete.
  // After this resolves, `refundResult` is ready to be asserted against.
  async checkRefundEligibility() {
    await this.refundBtn.click();
    await this.refundSpinner.waitFor({ state: 'visible' });
    // Spinner runs for ~4 seconds — give it 6s to be safe
    await this.refundSpinner.waitFor({ state: 'hidden', timeout: 6000 });
  }
}
