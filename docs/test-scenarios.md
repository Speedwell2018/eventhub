# EventHub Test Scenarios

Generated: 2026-05-07
Scope: Complete application suite — Auth, Events, Bookings, Admin, Security
Coverage: 6 lenses per feature area — Happy Path, Business Rules, Security, Negative, Edge Cases, UI State

---

## Happy Path (TC-001–TC-099)

### TC-001: Register a new user
**Category**: Happy Path
**Priority**: P0
**Preconditions**: Email not previously registered
**Steps**:
1. Navigate to `/register`
2. Enter a unique valid email (e.g., `testuser@example.com`)
3. Enter a strong password meeting all 4 rules (e.g., `Secure@123`)
4. Repeat password in Confirm field
5. Click "Create Account" (`#register-btn`)
**Expected Results**: JWT issued; user redirected to home page; `eventhub_token` present in localStorage
**Business Rule**: Auth Flow — JWT issued on successful registration
**Suggested Layer**: E2E

---

### TC-002: Login with valid credentials
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User account exists
**Steps**:
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Sign In" (`#login-btn`)
**Expected Results**: JWT stored in localStorage under `eventhub_token`; user redirected to home page
**Business Rule**: Auth Flow — login issues 7-day JWT
**Suggested Layer**: E2E

---

### TC-003: Browse the events list
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; seed data loaded
**Steps**:
1. Navigate to `/events`
2. Observe event cards
**Expected Results**: At least 10 seeded events visible; each card shows title, category badge, city, price, and "Book Now" button
**Business Rule**: Static events shared across all users; per-user seat availability computed dynamically
**Suggested Layer**: E2E

---

### TC-004: Filter events by category
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User is logged in; seed data loaded
**Steps**:
1. Navigate to `/events`
2. Select "Conference" from category dropdown
**Expected Results**: Only Conference events shown (Tech Conference Bangalore, AI Summit Hyderabad); no other categories present
**Business Rule**: Events page filter by category field
**Suggested Layer**: E2E

---

### TC-005: Filter events by city
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User is logged in; seed data loaded
**Steps**:
1. Navigate to `/events`
2. Select "Bangalore" from city dropdown
**Expected Results**: Only Bangalore events shown (Tech Conference Bangalore, Food Festival Bangalore)
**Business Rule**: Events page filter by city field
**Suggested Layer**: E2E

---

### TC-006: Search events by keyword
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User is logged in; seed data loaded
**Steps**:
1. Navigate to `/events`
2. Type "Workshop" in the search bar
**Expected Results**: Only workshop-titled events displayed; unrelated events hidden
**Business Rule**: Search queries title, description, and venue fields
**Suggested Layer**: E2E

---

### TC-007: Book a single ticket for a static event
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; "Tech Conference Bangalore" seeded
**Steps**:
1. Navigate to `/events`; click "Book Now" on "Tech Conference Bangalore"
2. Verify quantity defaults to 1 (`#ticket-count` shows "1")
3. Fill: Full Name = "John Doe", Email (`#customer-email`) = "john@example.com", Phone = "9876543210"
4. Click "Confirm Booking" (`.confirm-booking-btn`)
**Expected Results**: Booking confirmation card appears; `.booking-ref` starts with "T" (e.g., `T-A1B2C3`); quantity = 1; total = $1,499
**Business Rule**: bookingRef prefix = first char of event title (uppercase); totalPrice = price × quantity
**Suggested Layer**: E2E

---

### TC-008: Book multiple tickets for a static event
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; "Bollywood Night Mumbai" seeded
**Steps**:
1. Navigate to event detail for "Bollywood Night Mumbai"
2. Click "+" twice to set quantity to 3
3. Fill customer details; click "Confirm Booking"
**Expected Results**: Booking confirmed; `.booking-ref` starts with "B"; total = $999 × 3 = $2,997
**Business Rule**: totalPrice = event.price × quantity; max quantity capped at min(10, availableSeats)
**Suggested Layer**: E2E

---

### TC-009: View booking list
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one booking
**Steps**:
1. Navigate to `/bookings`
**Expected Results**: Booking cards listed with booking ref, event name, quantity, total price, status "confirmed"; "View Details" link per card
**Business Rule**: User sandbox isolation — only own bookings shown
**Suggested Layer**: E2E

---

### TC-010: View booking detail page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one booking
**Steps**:
1. Navigate to `/bookings`
2. Click "View Details" on any booking card
**Expected Results**: Booking detail page at `/bookings/:id` shows Event Details, Customer Details, Payment Summary, Refund section, Booking Information sections; "Cancel Booking" button visible
**Business Rule**: Full booking data including nested event returned by `GET /api/bookings/:id`
**Suggested Layer**: E2E

---

### TC-011: Cancel a single booking
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one booking
**Steps**:
1. Navigate to `/bookings/:id`
2. Click "Cancel Booking"
3. Click "Yes, cancel it" in confirmation dialog
**Expected Results**: Toast "Booking cancelled successfully"; redirected to `/bookings`; cancelled booking no longer listed
**Business Rule**: Cancellation deletes booking record; seats freed dynamically for dynamic events
**Suggested Layer**: E2E

---

### TC-012: Clear all bookings
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has at least 2 bookings
**Steps**:
1. Navigate to `/bookings`
2. Click "Clear all bookings"
3. Confirm native browser dialog
**Expected Results**: All bookings deleted; page shows "No bookings yet" empty state
**Business Rule**: clearAllBookings removes all user bookings in one operation
**Suggested Layer**: E2E

---

### TC-013: Create a new event via Admin panel
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User logged in; fewer than 6 user-created events exist
**Steps**:
1. Navigate to `/admin/events`
2. Fill: Title = "My Test Conference", Category = "Conference", City = "Mumbai", Venue = "Convention Hall", Date = future date, Price = 500, Seats = 100
3. Click "Add Event" (`#add-event-btn`)
**Expected Results**: Toast "Event created!"; new event appears in the events table with isStatic = false
**Business Rule**: User-created events have isStatic=false; count toward 6-event limit
**Suggested Layer**: E2E

---

### TC-014: Edit a user-created event
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has at least one user-created event
**Steps**:
1. Navigate to `/admin/events`
2. Click "Edit" (`#edit-event-btn`) on a user-created event
3. Update the title; submit
**Expected Results**: Form switches to "Edit Event" mode and pre-fills with existing data; success toast shown; table reflects updated title
**Business Rule**: Only non-static events owned by the user can be edited
**Suggested Layer**: E2E

---

### TC-015: Delete a user-created event
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has at least one user-created event
**Steps**:
1. Navigate to `/admin/events`
2. Click "Delete" (`#delete-event-btn`) on a user-created event
3. Confirm in dialog
**Expected Results**: Toast "Event deleted"; row removed from table immediately (optimistic update)
**Business Rule**: Deleting an event cascades to its bookings
**Suggested Layer**: E2E

---

### TC-016: Check refund eligibility — single ticket
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has a booking with quantity = 1
**Steps**:
1. Navigate to `/bookings/:id` for a single-ticket booking
2. Click "Check eligibility for refund?" (`#check-refund-btn`)
3. Wait for spinner (`#refund-spinner`) to disappear (~4 seconds)
**Expected Results**: Green result in `#refund-result`: "Eligible for refund. Single-ticket bookings qualify for a full refund."
**Business Rule**: quantity === 1 → refund eligible (client-side logic only, no backend API)
**Suggested Layer**: E2E

---

### TC-017: Check refund eligibility — multiple tickets
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has a booking with quantity = 3
**Steps**:
1. Navigate to `/bookings/:id` for the multi-ticket booking
2. Click "Check eligibility for refund?"; wait 4 seconds
**Expected Results**: Red result: "Not eligible for refund. Group bookings (3 tickets) are non-refundable."
**Business Rule**: quantity > 1 → not eligible; message includes actual quantity
**Suggested Layer**: E2E

---

### TC-018: Booking confirmation card displays all correct fields
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User on event detail page
**Steps**:
1. Complete booking for "Marathon Chennai" (price $49), quantity 2
2. Observe confirmation card
**Expected Results**: `.booking-ref` starts with "M"; customer name correct; Tickets = 2; Total = $98; "View My Bookings" and "Browse More Events" buttons visible
**Business Rule**: bookingRef prefix from event title; totalPrice = price × quantity
**Suggested Layer**: E2E

---

### TC-019: Navigate from booking confirmation to "View My Bookings"
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User just completed a booking
**Steps**:
1. On confirmation card, click "View My Bookings"
**Expected Results**: Navigated to `/bookings`; new booking appears in list
**Business Rule**: Post-booking navigation flow
**Suggested Layer**: E2E

---

### TC-020: Paginate events list
**Category**: Happy Path
**Priority**: P2
**Preconditions**: More than 12 events exist
**Steps**:
1. Navigate to `/events`
2. Click next page in pagination controls
**Expected Results**: Second page loads; URL updates to `?page=2`; different event cards shown
**Business Rule**: Events page uses limit=12 per page
**Suggested Layer**: E2E

---

### TC-021: Look up booking by reference via API
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User authenticated; booking exists with known ref
**Steps**:
1. `GET /api/bookings/ref/:ref` with own booking ref and valid JWT
**Expected Results**: 200 OK with full booking data including nested event object
**Business Rule**: GET /api/bookings/ref/:ref endpoint with ownership check
**Suggested Layer**: API

---

## Business Rules (TC-100–TC-199)

### TC-100: Booking reference prefix matches event title first character
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Events with various starting letters exist
**Steps**:
1. Book "Tech Conference Bangalore" → note bookingRef
2. Book "Bollywood Night Mumbai" → note bookingRef
3. Book "IPL Cricket Finals" → note bookingRef
**Expected Results**: Refs start with "T-", "B-", "I-" respectively; all match `[A-Z]-[A-Z0-9]{6}` pattern
**Business Rule**: randomRef — prefix = eventTitle[0].toUpperCase()
**Suggested Layer**: E2E / API

---

### TC-101: FIFO pruning when 6-event limit reached
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has exactly 6 user-created events; oldest event title noted
**Steps**:
1. Create a 7th event via `/admin/events`
2. Check events list
**Expected Results**: Total user-created events remains 6; oldest event is gone; newest event present
**Business Rule**: MAX_USER_DYNAMIC_EVENTS = 6; oldest auto-deleted before creating new (count >= limit)
**Suggested Layer**: E2E / API

---

### TC-102: FIFO pruning when 9-booking limit reached
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has exactly 9 bookings; oldest booking noted
**Steps**:
1. Create a 10th booking via API
2. Retrieve all bookings
**Expected Results**: Total bookings remains 9; oldest booking deleted; new booking present
**Business Rule**: MAX_USER_BOOKINGS = 9; FIFO pruning fires at count >= 9
**Suggested Layer**: API

---

### TC-103: Static events show "Read-only" in Admin panel
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Seed data loaded
**Steps**:
1. Navigate to `/admin/events`
2. Locate any seeded event (shows "Featured" badge)
**Expected Results**: Actions column shows italic "Read-only" text; no Edit or Delete buttons for static events
**Business Rule**: isStatic=true events are immutable; UI hides action buttons
**Suggested Layer**: E2E

---

### TC-104: Per-user seat availability for dynamic events
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User creates event with totalSeats=10; books 3 tickets for it
**Steps**:
1. Create event with 10 total seats
2. Book 3 tickets
3. View event detail page
**Expected Results**: Available seats shows 7 (not 10); computed as totalSeats − sum(user bookings)
**Business Rule**: Dynamic events: availableSeats = totalSeats − sum(user's booking quantities for that event)
**Suggested Layer**: E2E / API

---

### TC-105: Total price = price × quantity
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User on event detail page for "Digital Marketing Workshop" ($299)
**Steps**:
1. Click "+" three times to set quantity to 4
2. Observe price summary
**Expected Results**: Shows "$299 × 4 tickets" and Total = "$1,196"; totalPrice in API response = 299 × 4
**Business Rule**: totalPrice = event.price × quantity
**Suggested Layer**: E2E

---

### TC-106: FIFO booking pruning prefers different-event booking
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has 9 bookings (8 for EventA, 1 for EventB)
**Steps**:
1. Create a new booking for EventB (10th total, triggering FIFO)
2. Check remaining bookings
**Expected Results**: One EventA booking deleted (different-event preferred); EventB booking count increases; total stays at 9
**Business Rule**: findOldestUserBookingExcludingEvent used first; same-event fallback only if no other event booking exists
**Suggested Layer**: API

---

### TC-107: Same-event FIFO fallback permanently decrements global seats
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has 9 bookings all for the same static event
**Steps**:
1. Create a 10th booking for the same event
2. Check event's availableSeats
**Expected Results**: Oldest booking deleted; new booking created; event.availableSeats permanently decremented by new quantity (seat burned via decrementSeats)
**Business Rule**: sameEventFallback=true → eventRepository.decrementSeats called to prevent infinite re-booking loop
**Suggested Layer**: API

---

### TC-108: Sandbox warning banner appears when > 5 events shown
**Category**: Business Rule
**Priority**: P2
**Preconditions**: Events list returns more than 5 results
**Steps**:
1. Navigate to `/events` with no filters (10+ seeded events visible)
**Expected Results**: Amber banner visible: "Your sandbox holds up to 9 bookings and you can create up to 6 custom events. When either limit is reached, the oldest entry is automatically replaced."
**Business Rule**: Banner conditional on events.length > 5 in EventsContent
**Suggested Layer**: E2E

---

### TC-109: Refund eligibility boundary — quantity = 2 is the first ineligible value
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has a booking with quantity = 2
**Steps**:
1. Navigate to booking detail for the 2-ticket booking
2. Click "Check eligibility for refund?"; wait 4 seconds
**Expected Results**: "Not eligible for refund. Group bookings (2 tickets) are non-refundable."
**Business Rule**: threshold is quantity === 1 exactly; quantity = 2 is first ineligible case
**Suggested Layer**: E2E

---

### TC-110: Cancelling a booking restores computed seat count
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has a dynamic event with 10 total seats; has a booking for 2 tickets
**Steps**:
1. Note available seats = 8 (10 − 2)
2. Cancel the booking from `/bookings/:id`
3. Navigate back to event detail page
**Expected Results**: Available seats now = 10; seats freed because booking record removed from DB
**Business Rule**: Dynamic events compute seats at query time; no need to update event record on cancel
**Suggested Layer**: E2E

---

### TC-111: JWT stored in localStorage and sent on all API requests
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User logs in
**Steps**:
1. Login; capture `eventhub_token` from localStorage
2. Make `GET /api/events` with `Authorization: Bearer <token>`
**Expected Results**: 200 OK with events data
**Business Rule**: All event-write and booking routes require Authorization: Bearer JWT; token stored under `eventhub_token`
**Suggested Layer**: API

---

### TC-112: Static events cannot be edited via API
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Authenticated user; static event ID known
**Steps**:
1. `PUT /api/events/:static_event_id` with any valid payload
**Expected Results**: 403 Forbidden — "Cannot modify a static event"
**Business Rule**: updateEvent — if (event.isStatic) throw ForbiddenError
**Suggested Layer**: API

---

### TC-113: Static events cannot be deleted via API
**Category**: Business Rule
**Priority**: P0
**Preconditions**: Authenticated user; static event ID known
**Steps**:
1. `DELETE /api/events/:static_event_id`
**Expected Results**: 403 Forbidden — "Cannot delete a static event"
**Business Rule**: deleteEvent — if (event.isStatic) throw ForbiddenError
**Suggested Layer**: API

---

## Security (TC-200–TC-299)

### TC-200: Cross-user booking access shows "Access Denied" in UI
**Category**: Security
**Priority**: P0
**Preconditions**: Two accounts exist; User A has a booking
**Steps**:
1. Login as User A; create booking; note booking ID
2. Logout (clear localStorage)
3. Login as User B
4. Navigate to `/bookings/:userA_booking_id`
**Expected Results**: "Access Denied" empty state shown; "You are not authorized to view this booking." description; no booking data exposed
**Business Rule**: bookingService.getBookingById — booking.userId !== userId → ForbiddenError (403); frontend renders Access Denied on 403
**Suggested Layer**: E2E

---

### TC-201: Cross-user booking access returns 403 via API
**Category**: Security
**Priority**: P0
**Preconditions**: User A has a booking; User B authenticated
**Steps**:
1. `GET /api/bookings/:userA_booking_id` with User B's JWT
**Expected Results**: HTTP 403; "You are not authorized to view this booking"
**Business Rule**: bookingService.getBookingById ownership check
**Suggested Layer**: API

---

### TC-202: Cross-user booking cancellation returns 403 via API
**Category**: Security
**Priority**: P0
**Preconditions**: User A has a booking; User B authenticated
**Steps**:
1. `DELETE /api/bookings/:userA_booking_id` with User B's JWT
**Expected Results**: HTTP 403; booking NOT deleted
**Business Rule**: bookingService.cancelBooking — booking.userId !== userId → ForbiddenError
**Suggested Layer**: API

---

### TC-203: Cross-user booking ref lookup returns 403 via API
**Category**: Security
**Priority**: P1
**Preconditions**: User A has a booking with known ref; User B authenticated
**Steps**:
1. `GET /api/bookings/ref/:userA_ref` with User B's JWT
**Expected Results**: HTTP 403; "You do not own this booking"
**Business Rule**: bookingService.getBookingByRef ownership check
**Suggested Layer**: API

---

### TC-204: Edit another user's event via API returns 403
**Category**: Security
**Priority**: P0
**Preconditions**: User A owns a dynamic event
**Steps**:
1. `PUT /api/events/:userA_event_id` with User B's JWT
**Expected Results**: 403 Forbidden — "You do not own this event"
**Business Rule**: eventService.updateEvent — event.userId !== userId → ForbiddenError
**Suggested Layer**: API

---

### TC-205: Delete another user's event via API returns 403
**Category**: Security
**Priority**: P0
**Preconditions**: User A owns a dynamic event
**Steps**:
1. `DELETE /api/events/:userA_event_id` with User B's JWT
**Expected Results**: 403 Forbidden — "You do not own this event"
**Business Rule**: eventService.deleteEvent — event.userId !== userId → ForbiddenError
**Suggested Layer**: API

---

### TC-206: Unauthenticated access to /events redirects to login
**Category**: Security
**Priority**: P0
**Preconditions**: No token in localStorage
**Steps**:
1. Clear localStorage; navigate to `/events`
**Expected Results**: Redirected to `/login`; events content not shown
**Business Rule**: AuthGuard wraps entire app shell; unauthenticated users redirected to /login
**Suggested Layer**: E2E

---

### TC-207: Unauthenticated access to /bookings redirects to login
**Category**: Security
**Priority**: P0
**Preconditions**: No token in localStorage
**Steps**:
1. Clear localStorage; navigate to `/bookings`
**Expected Results**: Redirected to `/login`
**Business Rule**: AuthGuard — all protected pages require valid JWT
**Suggested Layer**: E2E

---

### TC-208: Unauthenticated access to /admin/events redirects to login
**Category**: Security
**Priority**: P0
**Preconditions**: No token in localStorage
**Steps**:
1. Clear localStorage; navigate to `/admin/events`
**Expected Results**: Redirected to `/login`
**Business Rule**: AuthGuard — admin pages equally protected
**Suggested Layer**: E2E

---

### TC-209: API call without Authorization header returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: None
**Steps**:
1. `POST /api/bookings` with no Authorization header
**Expected Results**: HTTP 401 Unauthorized
**Business Rule**: authMiddleware — missing/invalid Bearer token rejected
**Suggested Layer**: API

---

### TC-210: API call with invalid JWT returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: None
**Steps**:
1. `GET /api/events` with `Authorization: Bearer invalid_token_xyz`
**Expected Results**: HTTP 401 Unauthorized
**Business Rule**: authMiddleware validates JWT signature; tampered tokens rejected
**Suggested Layer**: API

---

### TC-211: Duplicate email registration fails
**Category**: Security
**Priority**: P0
**Preconditions**: Account with `testuser@example.com` already exists
**Steps**:
1. Navigate to `/register`; enter same email with a new strong password
2. Click "Create Account"
**Expected Results**: Error toast "Email already registered"; no new account created
**Business Rule**: User.email is unique; authService throws ValidationError on duplicate
**Suggested Layer**: E2E / API

---

### TC-212: Unauthenticated DELETE /api/bookings returns 401
**Category**: Security
**Priority**: P0
**Preconditions**: None
**Steps**:
1. `DELETE /api/bookings` with no Authorization header
**Expected Results**: HTTP 401
**Business Rule**: clearAllBookings requires authenticated user
**Suggested Layer**: API

---

## Negative (TC-300–TC-399)

### TC-300: Register with invalid email format
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Enter "notanemail" in email field; enter strong password; click "Create Account"
**Expected Results**: Inline error "Enter a valid email"; form not submitted
**Business Rule**: Email must match `[^\s@]+@[^\s@]+\.[^\s@]+` regex
**Suggested Layer**: E2E

---

### TC-301: Register with password missing uppercase letter
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Enter password "secure@123" (no uppercase); click "Create Account"
**Expected Results**: "One uppercase letter (A–Z)" rule indicator stays gray; form rejected with error
**Business Rule**: Registration password requires uppercase, number, special char, min 8 chars
**Suggested Layer**: E2E

---

### TC-302: Register with password missing number
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Enter password "Secure@abc" (no digit); click "Create Account"
**Expected Results**: "One number (0–9)" rule stays gray; form rejected
**Business Rule**: Password must contain at least one digit
**Suggested Layer**: E2E

---

### TC-303: Register with password missing special character
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Enter password "Secure1234" (no special char); click "Create Account"
**Expected Results**: "One special character" rule stays gray; form rejected
**Business Rule**: Password must contain at least one non-alphanumeric character
**Suggested Layer**: E2E

---

### TC-304: Register with password shorter than 8 characters
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Enter password "Ab@1" (4 chars); click "Create Account"
**Expected Results**: "At least 8 characters" rule stays gray; form rejected
**Business Rule**: Minimum password length = 8 characters
**Suggested Layer**: E2E

---

### TC-305: Register with mismatching passwords
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/register` page
**Steps**:
1. Password = "Secure@123"; Confirm Password = "Secure@456"; click "Create Account"
**Expected Results**: Error "Passwords do not match" under Confirm field
**Business Rule**: Registration requires confirmation match
**Suggested Layer**: E2E

---

### TC-306: Login with wrong password
**Category**: Negative
**Priority**: P1
**Preconditions**: Account exists
**Steps**:
1. Navigate to `/login`; enter correct email, wrong password; click "Sign In"
**Expected Results**: Error toast "Invalid email or password"; user not logged in
**Business Rule**: authService returns same error for wrong password (no user enumeration)
**Suggested Layer**: E2E / API

---

### TC-307: Login with non-existent email
**Category**: Negative
**Priority**: P1
**Preconditions**: None
**Steps**:
1. Enter `nobody@nowhere.com` and any password; click "Sign In"
**Expected Results**: Error toast "Invalid email or password" — same message as wrong password (prevents user enumeration)
**Business Rule**: authService — same ValidationError for missing user and wrong password
**Suggested Layer**: E2E / API

---

### TC-308: Book with empty customer name
**Category**: Negative
**Priority**: P1
**Preconditions**: On event detail page
**Steps**:
1. Leave Full Name blank; fill email and phone; click "Confirm Booking"
**Expected Results**: Inline error "Name must be at least 2 chars"; booking not submitted
**Business Rule**: customerName min 2 chars
**Suggested Layer**: E2E

---

### TC-309: Book with single-character name
**Category**: Negative
**Priority**: P2
**Preconditions**: On event detail page
**Steps**:
1. Enter "J" in Full Name; fill other fields; click "Confirm Booking"
**Expected Results**: Inline error "Name must be at least 2 chars"
**Business Rule**: customerName.length >= 2
**Suggested Layer**: E2E

---

### TC-310: Book with invalid email in customer form
**Category**: Negative
**Priority**: P1
**Preconditions**: On event detail page
**Steps**:
1. Enter "notvalid" in Email (`#customer-email`); fill name and phone; click "Confirm Booking"
**Expected Results**: Inline error "Enter a valid email"
**Business Rule**: customerEmail must match email regex
**Suggested Layer**: E2E

---

### TC-311: Book with phone number shorter than 10 digits
**Category**: Negative
**Priority**: P1
**Preconditions**: On event detail page
**Steps**:
1. Enter "12345" in Phone field; fill name and email; click "Confirm Booking"
**Expected Results**: Inline error "Enter a valid 10-digit phone"
**Business Rule**: customerPhone — min 10 digits after stripping non-digit characters
**Suggested Layer**: E2E

---

### TC-312: Book with quantity exceeding available seats via API
**Category**: Negative
**Priority**: P0
**Preconditions**: Event with 2 available seats (per-user)
**Steps**:
1. `POST /api/bookings` with quantity=3 for that event
**Expected Results**: 400 error — "Only 2 seat(s) available, but 3 requested"
**Business Rule**: InsufficientSeatsError when personalAvailable < quantity
**Suggested Layer**: API

---

### TC-313: Book a non-existent event via API
**Category**: Negative
**Priority**: P1
**Preconditions**: Authenticated user
**Steps**:
1. `POST /api/bookings` with eventId = 99999
**Expected Results**: 404 Not Found — "Event with id 99999 not found"
**Business Rule**: Booking creation verifies event exists via eventRepository.findById
**Suggested Layer**: API

---

### TC-314: Navigate to non-existent event page
**Category**: Negative
**Priority**: P1
**Preconditions**: User logged in
**Steps**:
1. Navigate to `/events/99999`
**Expected Results**: "Event not found" empty state with "Browse Events" button
**Business Rule**: getEventById throws NotFoundError → frontend renders not-found state
**Suggested Layer**: E2E

---

### TC-315: Navigate to non-existent booking detail page
**Category**: Negative
**Priority**: P1
**Preconditions**: User logged in
**Steps**:
1. Navigate to `/bookings/99999`
**Expected Results**: "Booking not found" empty state with "View My Bookings" button
**Business Rule**: getBookingById throws NotFoundError → 404 response
**Suggested Layer**: E2E

---

### TC-316: Cancel a booking that was already deleted returns 404
**Category**: Negative
**Priority**: P1
**Preconditions**: Booking exists; then deleted
**Steps**:
1. `DELETE /api/bookings/:id` once successfully
2. Repeat same `DELETE /api/bookings/:id`
**Expected Results**: HTTP 404 — "Booking with id X not found"
**Business Rule**: cancelBooking uses findById — not found after deletion
**Suggested Layer**: API

---

### TC-317: Create event with missing required fields
**Category**: Negative
**Priority**: P1
**Preconditions**: On `/admin/events`
**Steps**:
1. Submit event form with Title field blank
**Expected Results**: Client-side validation error; form not submitted; no API call made
**Business Rule**: Event title and venue are required
**Suggested Layer**: E2E

---

### TC-318: Booking with quantity = 0 via API returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: Authenticated user
**Steps**:
1. `POST /api/bookings` with quantity=0
**Expected Results**: HTTP 400 validation error
**Business Rule**: quantity must be 1–10
**Suggested Layer**: API

---

### TC-319: Booking with quantity > 10 via API returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: Authenticated user
**Steps**:
1. `POST /api/bookings` with quantity=11
**Expected Results**: HTTP 400 validation error
**Business Rule**: quantity max = 10
**Suggested Layer**: API

---

### TC-320: Demo credential login failure shows instructional warning
**Category**: Negative
**Priority**: P2
**Preconditions**: Demo user `rahulshetty1@gmail.com` does NOT exist in DB
**Steps**:
1. Navigate to `/login`; enter `rahulshetty1@gmail.com` with any password; click "Sign In"
**Expected Results**: Amber banner: "Looks like you're using sample test credentials!" with register link; no generic toast shown
**Business Rule**: Login page special-cases DEMO_EMAILS array with instructional message instead of error toast
**Suggested Layer**: E2E

---

## Edge Cases (TC-400–TC-499)

### TC-400: Book exactly 10 tickets (maximum)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event with >= 10 available seats
**Steps**:
1. Click "+" repeatedly to quantity = 10
2. Verify "+" is now disabled; fill form; confirm
**Expected Results**: Booking succeeds with quantity=10; "+" button disabled at 10; "(max 10)" label shown
**Business Rule**: maxQty = min(10, availableSeats); UI enforces upper bound
**Suggested Layer**: E2E

---

### TC-401: Book 1 ticket when only 1 seat available
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event with exactly 1 available seat (per-user)
**Steps**:
1. Create event with totalSeats=1; navigate to detail
2. Confirm quantity=1 (max); book it
**Expected Results**: Booking succeeds; event now shows "SOLD OUT" with red text
**Business Rule**: availableSeats reaches 0 → SOLD OUT state
**Suggested Layer**: E2E

---

### TC-402: Attempt to book 2 tickets when only 1 seat remains
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event with exactly 1 available seat
**Steps**:
1. Via API: `POST /api/bookings` with quantity=2
**Expected Results**: InsufficientSeatsError — "Only 1 seat(s) available, but 2 requested"
**Business Rule**: personalAvailable (1) < quantity (2) → reject
**Suggested Layer**: API

---

### TC-403: Create free event with price = $0
**Category**: Edge Case
**Priority**: P2
**Preconditions**: On `/admin/events`
**Steps**:
1. Create event with Price = 0; Seats = 50
**Expected Results**: Event created; booking total = $0 × quantity = $0; "$0" displayed correctly
**Business Rule**: Event.price >= 0; free events allowed
**Suggested Layer**: E2E / API

---

### TC-404: Create event with minimum 1 seat
**Category**: Edge Case
**Priority**: P2
**Preconditions**: On `/admin/events`
**Steps**:
1. Create event with Total Seats = 1
**Expected Results**: Event created with totalSeats=1 and availableSeats=1
**Business Rule**: totalSeats >= 1
**Suggested Layer**: E2E / API

---

### TC-405: Customer phone with formatting characters passes validation
**Category**: Edge Case
**Priority**: P2
**Preconditions**: On event detail booking form
**Steps**:
1. Enter phone "+91 98765-43210" (space, dash, plus)
2. Submit booking
**Expected Results**: Booking succeeds — `phone.replace(/\D/g, '')` yields 12 digits ≥ 10; validation passes
**Business Rule**: customerPhone validation strips non-digits before length check
**Suggested Layer**: E2E

---

### TC-406: Customer name exactly 2 characters (minimum boundary)
**Category**: Edge Case
**Priority**: P2
**Preconditions**: On event detail booking form
**Steps**:
1. Enter "Jo" as customer name; fill other fields; submit
**Expected Results**: Booking succeeds; "Jo" accepted as valid name
**Business Rule**: customerName.length >= 2; 2 is the exact minimum
**Suggested Layer**: E2E

---

### TC-407: Same user books the same event multiple times
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User has a dynamic event with 10 seats; already booked 5 tickets
**Steps**:
1. Navigate back to event detail (shows 5 available seats)
2. Book 3 more tickets
**Expected Results**: Second booking succeeds; available seats now = 2 (10 − 5 − 3)
**Business Rule**: Per-user seat model allows multiple bookings of same event; no single-booking restriction
**Suggested Layer**: E2E

---

### TC-408: 6th dynamic event does NOT trigger pruning
**Category**: Edge Case
**Priority**: P0
**Preconditions**: User has exactly 5 user-created events
**Steps**:
1. Create a 6th event
2. Check events list
**Expected Results**: All 6 events present; no pruning yet (pruning fires at count >= 6 BEFORE creation, so current 5 < 6)
**Business Rule**: count >= MAX_USER_DYNAMIC_EVENTS triggers pruning; adding 6th from 5 existing is safe
**Suggested Layer**: API

---

### TC-409: 7th event creation removes the oldest
**Category**: Edge Case
**Priority**: P0
**Preconditions**: User has exactly 6 user-created events; oldest event title noted
**Steps**:
1. Create a 7th event
2. Check events list
**Expected Results**: 6 user-created events remain; oldest is gone; newest present; any bookings for oldest event also deleted (cascade)
**Business Rule**: count (6) >= MAX (6) → findOldestUserDynamic → delete → then create new
**Suggested Layer**: E2E / API

---

### TC-410: Booking ref collision retry — uniqueness guaranteed
**Category**: Edge Case
**Priority**: P3
**Preconditions**: Many bookings starting with same prefix letter
**Steps**:
1. Via API: create 50 bookings for events all starting with "T"
2. Check all bookingRefs in DB
**Expected Results**: All 50 refs are unique; no duplicates; timestamp-based fallback ref used after 10 failed collision retries
**Business Rule**: generateUniqueRef — up to 10 retries; fallback: `${prefix}-${Date.now().toString(36).toUpperCase().slice(-8)}`
**Suggested Layer**: Unit / API

---

### TC-411: Event title starting with a digit — ref prefix is the digit
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Event created with title "100 Days Festival"
**Steps**:
1. Book the event; check bookingRef
**Expected Results**: bookingRef starts with "1-XXXXXX"; digit used as prefix (toUpperCase has no effect on digits)
**Business Rule**: prefix = (eventTitle[0] ?? 'E').toUpperCase()
**Suggested Layer**: API / Unit

---

### TC-412: Pagination on bookings — page 2 with partial results
**Category**: Edge Case
**Priority**: P2
**Preconditions**: More than default limit bookings exist in API
**Steps**:
1. `GET /api/bookings?page=2&limit=5`
**Expected Results**: Returns page 2 results; pagination.page=2; data array has ≤ 5 items
**Business Rule**: Pagination in bookingService.getBookings
**Suggested Layer**: API

---

### TC-413: Clear all bookings when only one booking exists
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User has exactly 1 booking
**Steps**:
1. Navigate to `/bookings`; click "Clear all bookings"; confirm
**Expected Results**: Booking deleted; empty state shown; API returns `{ deleted: 1 }`
**Business Rule**: clearAllBookings — deleteAllForUser returns count of deleted records
**Suggested Layer**: E2E / API

---

## UI State (TC-500–TC-599)

### TC-500: Sandbox warning banner visible when > 5 events in results
**Category**: UI State
**Priority**: P1
**Preconditions**: Events list returns > 5 results
**Steps**:
1. Navigate to `/events` with no filters (10+ seeded events)
**Expected Results**: Amber banner visible containing "sandbox holds up to 9 bookings" and "6 custom events"
**Business Rule**: Banner conditioned on events.length > 5 in EventsContent
**Suggested Layer**: E2E

---

### TC-501: Sandbox warning banner hidden when <= 5 events in results
**Category**: UI State
**Priority**: P2
**Preconditions**: User applies filters leaving only 2 results
**Steps**:
1. Navigate to `/events`; filter to get 2 results
**Expected Results**: Amber sandbox banner NOT visible
**Business Rule**: events.length > 5 is false → banner not rendered
**Suggested Layer**: E2E

---

### TC-502: Event detail shows "SOLD OUT" button when availableSeats = 0
**Category**: UI State
**Priority**: P0
**Preconditions**: Event has 0 available seats (per-user)
**Steps**:
1. Navigate to event detail for a sold-out event
**Expected Results**: Available seats meta shows "SOLD OUT" in red; "Confirm Booking" button reads "Sold Out" and has `disabled` attribute
**Business Rule**: soldOut = event.availableSeats === 0; Button disabled when soldOut
**Suggested Layer**: E2E

---

### TC-503: Decrement button disabled at quantity = 1
**Category**: UI State
**Priority**: P1
**Preconditions**: On event detail page
**Steps**:
1. Observe "−" button state when quantity = 1 (default)
**Expected Results**: "−" button has disabled attribute and reduced opacity; clicking has no effect
**Business Rule**: quantity >= 1 minimum; button disabled when form.quantity <= 1
**Suggested Layer**: E2E

---

### TC-504: Increment button disabled at max quantity
**Category**: UI State
**Priority**: P1
**Preconditions**: Event with 3 available seats
**Steps**:
1. Click "+" three times to reach quantity = 3
**Expected Results**: "+" button is disabled; count stays at 3; "(max 3)" label shown
**Business Rule**: maxQty = min(10, availableSeats); button disabled when form.quantity >= maxQty
**Suggested Layer**: E2E

---

### TC-505: Refund spinner shown for ~4 seconds before result
**Category**: UI State
**Priority**: P1
**Preconditions**: On booking detail page
**Steps**:
1. Click "Check eligibility for refund?" (`#check-refund-btn`)
2. Immediately check for spinner
3. Wait ~4 seconds; check for result
**Expected Results**: `#refund-spinner` immediately visible; `#refund-result` absent during spinner; after 4 seconds result appears and spinner gone
**Business Rule**: setTimeout(..., 4000) in RefundEligibility component; status machine: idle → checking → eligible/ineligible
**Suggested Layer**: E2E

---

### TC-506: Admin table shows "Read-only" for static events; Edit/Delete for user events
**Category**: UI State
**Priority**: P0
**Preconditions**: Mix of static and user-created events
**Steps**:
1. Navigate to `/admin/events`; inspect Actions column
**Expected Results**: Static rows show italic "Read-only"; user-created rows show `#edit-event-btn` and `#delete-event-btn`
**Business Rule**: event.isStatic controls which actions are rendered
**Suggested Layer**: E2E

---

### TC-507: Bookings page shows empty state with "Browse Events" CTA
**Category**: UI State
**Priority**: P1
**Preconditions**: User has zero bookings
**Steps**:
1. Navigate to `/bookings`
**Expected Results**: Empty state renders "No bookings yet"; "You haven't booked any events yet..."; "Browse Events" button linking to `/events`
**Business Rule**: bookings.length === 0 branch in BookingsContent
**Suggested Layer**: E2E

---

### TC-508: Events page shows empty state when no results match filters
**Category**: UI State
**Priority**: P1
**Preconditions**: On `/events`
**Steps**:
1. Apply a category + city combination that returns no events
**Expected Results**: "No events found" empty state shown; "Try adjusting your filters" instruction; no crash
**Business Rule**: events.length === 0 branch; graceful empty state
**Suggested Layer**: E2E

---

### TC-509: Events page shows 12 skeleton cards while fetching
**Category**: UI State
**Priority**: P2
**Preconditions**: Initial page load or network slow
**Steps**:
1. Navigate to `/events` (observe before data loads)
**Expected Results**: 12 `EventCardSkeleton` placeholders rendered while isLoading = true
**Business Rule**: isLoading → grid of skeleton cards (Array.from({ length: 12 }))
**Suggested Layer**: E2E / Component

---

### TC-510: Admin form switches to "Edit Event" mode when editing
**Category**: UI State
**Priority**: P1
**Preconditions**: User has at least one user-created event
**Steps**:
1. Navigate to `/admin/events`; click "Edit" on a user-created event
**Expected Results**: Page scrolls to top; form heading changes to "Edit Event"; form pre-populated with existing event data; cancel edit clears form
**Business Rule**: selectedEvent state drives EventForm mode
**Suggested Layer**: E2E

---

### TC-511: Available seats shown in amber when <= 10 seats
**Category**: UI State
**Priority**: P2
**Preconditions**: Event with 5 available seats
**Steps**:
1. Navigate to event detail page
**Expected Results**: Available seats displayed with `text-amber-600` styling
**Business Rule**: UI color: 0 = red (SOLD OUT), 1–10 = amber, >10 = green
**Suggested Layer**: E2E

---

### TC-512: Available seats shown in green when > 10 seats
**Category**: UI State
**Priority**: P2
**Preconditions**: Event with 50 available seats
**Steps**:
1. Navigate to event detail page
**Expected Results**: Available seats displayed with `text-emerald-600` styling
**Business Rule**: UI color coding — > 10 seats = green
**Suggested Layer**: E2E

---

### TC-513: Price summary updates in real-time as ticket quantity changes
**Category**: UI State
**Priority**: P1
**Preconditions**: On event detail page for a $299 event
**Steps**:
1. Observe total at quantity=1 ($299)
2. Click "+" → quantity=2; observe total
3. Click "+" → quantity=3; observe total
**Expected Results**: Total updates instantly: $299 → $598 → $897; label shows "× 1 ticket", "× 2 tickets", "× 3 tickets"
**Business Rule**: total = parseFloat(event.price) × form.quantity; computed client-side in real-time
**Suggested Layer**: E2E

---

### TC-514: Booking detail "Access Denied" state for 403 responses
**Category**: UI State
**Priority**: P0
**Preconditions**: User B navigates to User A's booking
**Steps**:
1. Navigate to `/bookings/:userA_booking_id` as User B
**Expected Results**: EmptyState with title "Access Denied" and description "You are not authorized to view this booking."; NOT "Booking not found"
**Business Rule**: Frontend checks error.status === 403 to choose correct empty state message
**Suggested Layer**: E2E

---

### TC-515: Cancel booking dialog confirms before deletion
**Category**: UI State
**Priority**: P0
**Preconditions**: On a booking detail page
**Steps**:
1. Click "Cancel Booking"
2. Observe ConfirmDialog
**Expected Results**: Dialog shows title "Cancel this booking?"; description references bookingRef and seat count; "Yes, cancel it" confirm button; close button
**Business Rule**: Two-step confirm prevents accidental deletions
**Suggested Layer**: E2E

---

### TC-516: Dismiss cancel dialog without confirming preserves booking
**Category**: UI State
**Priority**: P1
**Preconditions**: On a booking detail page; cancel dialog open
**Steps**:
1. Click "Cancel Booking"; dialog opens
2. Click close/dismiss (not "Yes, cancel it")
**Expected Results**: Dialog closes; booking still exists; no API call made
**Business Rule**: onClose sets confirm=false; handleCancel only runs on confirm action
**Suggested Layer**: E2E

---

### TC-517: Static event detail shows "Featured" badge and info banner
**Category**: UI State
**Priority**: P2
**Preconditions**: Any static seeded event
**Steps**:
1. Navigate to event detail for "Tech Conference Bangalore"
**Expected Results**: "Featured" green badge shown; emerald info banner: "This is a featured event — always available for practice"
**Business Rule**: event.isStatic drives featured indicators; static events are always bookable
**Suggested Layer**: E2E

---

### TC-518: Password strength indicators update in real-time during registration
**Category**: UI State
**Priority**: P2
**Preconditions**: On `/register` page
**Steps**:
1. Start typing a password; observe 4 rule indicators below the field
**Expected Results**: Each indicator turns green (checkmark) as its condition is satisfied; unmet rules stay gray
**Business Rule**: PASSWORD_RULES evaluated live on each keystroke; visual feedback before submit
**Suggested Layer**: E2E

---

### TC-519: "Clear all bookings" shows "Clearing..." loading text during API call
**Category**: UI State
**Priority**: P2
**Preconditions**: User has bookings
**Steps**:
1. Click "Clear all bookings"; confirm native dialog
2. Observe button text during API call
**Expected Results**: Button text changes to "Clearing…" and is disabled; after completion, bookings list refetched and empty state shown
**Business Rule**: clearing state variable disables button and changes label during async operation
**Suggested Layer**: E2E / Component

---

### TC-520: Bookings page loading shows 5 skeleton cards
**Category**: UI State
**Priority**: P2
**Preconditions**: Navigate to `/bookings` on slow network
**Steps**:
1. Navigate to `/bookings` (observe before data loads)
**Expected Results**: 5 `BookingCardSkeleton` placeholders shown while isLoading = true
**Business Rule**: isLoading branch renders Array.from({ length: 5 }) skeleton cards
**Suggested Layer**: E2E / Component

---

### TC-521: Bookings page error state shows Retry button
**Category**: UI State
**Priority**: P2
**Preconditions**: Backend unavailable when navigating to `/bookings`
**Steps**:
1. Navigate to `/bookings` with backend down
**Expected Results**: Error empty state: "Couldn't load bookings", "Failed to connect to the server. Please try again.", "Retry" button; clicking Retry re-fetches
**Business Rule**: isError branch in BookingsContent
**Suggested Layer**: Component / E2E
