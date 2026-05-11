import { expect } from '@playwright/test';

// Page Object: /events
export class EventsPage {
  constructor(page) {
    this.page       = page;
    // Priority 1 — data-testid present on production
    this.eventCards = page.getByTestId('event-card');
  }

  async goto() {
    await this.page.goto('/events');
  }

  // Clicks "Book Now" on the first non-sold-out event card.
  // Filters by hasText: 'Book Now' to exclude sold-out cards (which show 'Sold Out'
  // on the same book-now-btn testid element).
  // Returns the event title captured before navigation to /events/:id.
  async selectFirstAvailable() {
    const firstBookable = this.eventCards
      .filter({ has: this.page.getByTestId('book-now-btn').filter({ hasText: 'Book Now' }) })
      .first();
    await expect(firstBookable).toBeVisible();
    const eventTitle = (await firstBookable.getByRole('heading', { level: 3 }).textContent())?.trim() ?? '';
    await firstBookable.getByTestId('book-now-btn').click();
    return eventTitle;
  }
}
