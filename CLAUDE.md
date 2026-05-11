# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start frontend (port 3000) + backend (port 3001) concurrently
npm run setup        # Install deps in both /backend and /frontend
```

### Database
```bash
npm run db:push      # Push schema changes non-interactively (no migration files)
npm run migrate      # Run prisma migrate dev (interactive, creates migration files)
npm run seed         # Insert 10 sample static events
cd backend && npx prisma studio   # Open Prisma visual DB browser
```

### Build & Lint
```bash
npm run build        # Build Next.js frontend for production
npm run lint         # ESLint on frontend
```

### Testing (Playwright — requires both servers running)
```bash
npm test                          # Run all Playwright tests (headless)
npm run test:ui                   # Open Playwright UI mode
npx playwright test <file>        # Run a single test file
npx playwright test --headed      # Run with visible browser
npm run test:report               # Open last HTML test report
```

Tests live in `/tests/`. They run serially (`fullyParallel: false`, `retries: 0`) against `http://localhost:3000`. Hardcoded test credentials are `rahulshetty1@gmail.com` / `Magiclife1!` — that user must exist in the DB before running tests.

## Architecture

### Overview
Monorepo with three concerns: `/backend` (Express REST API), `/frontend` (Next.js 14 App Router), and `/tests` (Playwright E2E). Coordinated from root `package.json`.

### Backend (`/backend`)
Layered architecture: **Routes → Controllers → Services → Repositories → Prisma**

- **`app.js`** — Express app wiring: CORS, body parsing, route mounting, Swagger UI at `/api/docs`, global error handler.
- **`server.js`** — HTTP server start, DB connection, graceful shutdown.
- **`src/config/env.js`** — Centralised env vars. `JWT_SECRET` has a hardcoded fallback (`eventhub_jwt_secret_2025`) — override in production via `.env`.
- **`src/middleware/authMiddleware.js`** — Validates `Authorization: Bearer <jwt>` header; sets `req.user = { userId, email }`.
- **`src/middleware/errorHandler.js`** — Maps domain errors (`NotFoundError`, `ValidationError`, `InsufficientSeatsError`, `ForbiddenError`) to HTTP responses.
- **`src/utils/errors.js`** — Domain error classes; each has a `.statusCode` property used by the error handler.
- **Services** contain all business logic. **Repositories** contain only Prisma calls — no logic.

### Data Model (Prisma/MySQL)
Three models: `User`, `Event`, `Booking`.

Key design decisions:
- `Event.isStatic` — seed events are static (`isStatic: true`) and cannot be edited/deleted; user-created events are dynamic (`isStatic: false`, `userId` set).
- **Per-user seat availability** — `availableSeats` on the `Event` model is only decremented for static-event same-user fallback cases. For dynamic events, available seats are computed at query time in `eventService.withPersonalSeats()` by counting the user's existing bookings and subtracting from `totalSeats`. This means seat counts are user-specific, not global.
- **FIFO limits** — users are capped at 6 dynamic events and 9 bookings. Exceeding the cap auto-prunes the oldest record.
- `Booking.bookingRef` format: `<first-char-of-event-title>-<6-alphanumeric>` (e.g. `T-A3B2C1`).

### Auth Flow
JWT-based. Tokens are issued on register/login (`/api/auth/register`, `/api/auth/login`) and expire in 7 days. The frontend stores the token in `localStorage` under key `eventhub_token`. All event-write and booking routes require `authMiddleware`.

### Frontend (`/frontend`)
Next.js 14 App Router. All data fetching goes through React Query v5 hooks in `frontend/lib/hooks/`.

**Provider hierarchy** (in `lib/providers.jsx`):
```
AuthProvider → QueryClientProvider → ToastProvider → children
```

**`AuthProvider`** (`lib/hooks/useAuth.tsx`) — manages `user`, `token`, and auth actions; reads/writes `localStorage`. On mount it calls `GET /auth/me` to rehydrate session.

**`AuthGuard`** (`components/auth/AuthGuard.tsx`) — wraps the entire app shell; redirects unauthenticated users to `/login`.

**API layer** (`lib/api/`):
- `client.js` — Axios instance with a request interceptor that attaches the JWT and a response interceptor that unwraps the `{ success, data }` envelope and redirects to `/login` on 401.
- `eventsApi.js`, `bookingsApi.js`, `authApi.js` — thin wrappers over `apiClient`.

**React Query cache** — `staleTime: 30s`, `retry: 1`, `refetchOnWindowFocus: false`. Mutations invalidate the relevant `['events']` or `['bookings']` query keys on success.

### Playwright Tests
Tests use a mix of selectors — `data-testid`, CSS classes (`.booking-ref`, `.confirm-booking-btn`), element IDs (`#login-btn`, `#ticket-count`, `#customer-email`), ARIA roles, labels, and placeholders. When adding new testable UI, prefer `data-testid` for stable selection.

## Environment Variables

**`/backend/.env`:**
```
DATABASE_URL="mysql://root:<password>@localhost:3306/eventhub"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<strong-secret>
```

**`/frontend/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
