// Page Object: /events/:id  (booking form + confirmation card)
export class EventDetailPage {
  constructor(page) {
    this.page = page;
    // Quantity widget — no data-testid; buttons identified by exact text
    this.ticketCount  = page.locator('#ticket-count');
    this.incrementBtn = page.getByRole('button', { name: '+', exact: true });
    // Booking form inputs
    this.nameInput    = page.getByLabel('Full Name');
    this.emailInput   = page.getByTestId('customer-email'); // Priority 1
    this.phoneInput   = page.getByPlaceholder('+91 98765 43210');
    // Submit — Priority 4 (no data-testid on production yet)
    this.confirmBtn   = page.locator('#confirm-booking');
    // Confirmation card — Priority 5 (no data-testid on production yet)
    this.bookingRefEl = page.locator('.booking-ref').first();
  }

  // Clicks the increment (+) button `times` times to raise ticket count.
  async incrementQuantity(times) {
    for (let i = 0; i < times; i++) {
      await this.incrementBtn.click();
    }
    // Verify the counter updated so we don't proceed with wrong qty
    const expected = 1 + times;
    await this.ticketCount.filter({ hasText: String(expected) }).waitFor({ state: 'visible' });
  }

  async fillForm(name, email, phone) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
  }

  async submit() {
    await this.confirmBtn.click();
    // Wait for confirmation card to appear
    await this.bookingRefEl.waitFor({ state: 'visible' });
  }

  // Returns the booking reference string from the confirmation card.
  async getBookingRef() {
    return (await this.bookingRefEl.textContent())?.trim() ?? '';
  }
}
