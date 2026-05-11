# EventHub Test Strategy — Login & Authorization

Generated: 2026-05-07
Scope: `login and authorization` — Registration, Login, JWT lifecycle, AuthGuard, session rehydration, protected route enforcement

---

## 1. Scope Overview

The login and authorization domain spans three distinct layers:

| Layer | Files Involved |
|---|---|
| Backend API | `backend/src/routes/authRoutes.js`, `backend/src/controllers/authController.js`, `backend/src/services/authService.js`, `backend/src/middleware/authMiddleware.js`, `backend/src/middleware/errorHandler.js` |
| Frontend Components | `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/components/auth/AuthGuard.tsx`, `frontend/lib/hooks/useAuth.tsx` |
| Cross-cutting | Every protected route that applies `authMiddleware` (`/api/events`, `/api/bookings`) |

---

## 2. Test Distribution Table

| Layer | Count | Focus Areas | Approx. Run Time |
|---|---|---|---|
| **Unit** | 9 | Pure functions: password rules, token signing, validateAuth logic, service error paths | < 1s total |
| **API / Integration** | 16 | HTTP contracts: register/login endpoints, /auth/me, 401/403 on protected routes, duplicate email 409 | < 5s total |
| **Component** | 10 | AuthGuard redirect logic, AuthProvider session rehydration, RegisterPage strength indicators, LoginPage demo warning | < 10s total |
| **E2E** | 7 | Full user journeys: login flow, register flow, protected route guard in browser, session persistence | 30–60s total |
| **TOTAL** | **42** | | |

**Target pyramid shape:**
```
        E2E  (7)   ← Multi-page, full browser
      Comp   (10)  ← Single component, mocked context
     API    (16)   ← HTTP layer, real DB
   Unit    (9)    ← Pure functions, no I/O
```

---

## 3. Unit Tests (9 tests)

**Rule**: Pure function, no I/O, no network — fastest and most targeted.

### 3.1 `backend/src/services/authService.js`

#### UT-001 — `register()` throws ValidationError on duplicate email
- **Source**: `authService.js:17` — `if (existing) throw new ValidationError('Email already registered')`
- **Why Unit**: No DB needed; mock `userRepository.findByEmail` to return a user object → assert `ValidationError` thrown
- **Rationale**: The duplicate-email guard is a single conditional; isolated unit test is faster and more precise than a full API round-trip

#### UT-002 — `login()` throws ValidationError when user not found
- **Source**: `authService.js:29` — `if (!user) throw new ValidationError('Invalid email or password')`
- **Why Unit**: Mock `userRepository.findByEmail` to return `null` → assert same `ValidationError` message as wrong-password case

#### UT-003 — `login()` throws ValidationError on wrong password (no user enumeration)
- **Source**: `authService.js:32` — `if (!match) throw new ValidationError('Invalid email or password')`
- **Why Unit**: Mock `userRepository.findByEmail` to return a real user; mock `bcrypt.compare` to return `false` → assert error message is identical to UT-002 (confirms no enumeration)
- **Rationale**: User enumeration is a security property; it must be verified at the code level, not just observed via E2E

#### UT-004 — `signToken()` produces a JWT with correct payload and 7-day expiry
- **Source**: `authService.js:7-12` — `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })`
- **Why Unit**: Call the private function (or `login()` with a mocked repo); decode the resulting JWT without verification; assert `{ userId, email }` are present and `exp - iat === 7 * 24 * 3600`
- **Rationale**: JWT payload correctness is a contract — verifying it at the unit layer catches signing regressions instantly

### 3.2 `backend/src/routes/authRoutes.js` — `validateAuth` middleware

#### UT-005 — `validateAuth` rejects invalid email format
- **Source**: `authRoutes.js:10` — `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` → `ValidationError`
- **Why Unit**: Call the middleware function directly with a mock `req/res/next`; pass `{ email: 'notanemail', password: 'secret' }`; assert `next` is called with a `ValidationError`
- **Rationale**: Regex logic is pure; testing via full HTTP call adds unnecessary overhead for this edge case

#### UT-006 — `validateAuth` rejects password shorter than 6 characters
- **Source**: `authRoutes.js:13` — `password.length < 6`
- **Why Unit**: Same mock pattern; pass `{ email: 'valid@test.com', password: 'abc' }`; assert ValidationError with `field: 'password'`

> **Important gap discovered**: The backend `validateAuth` only enforces `password.length >= 6`. The frontend `register/page.tsx` enforces 4 stricter rules (8 chars, uppercase, number, special char). A direct API call with `password: 'secret'` (6 chars, no uppercase/number/special) will succeed on the backend. This discrepancy should be documented and tested explicitly at the API layer (see API-006 below).

### 3.3 `frontend/app/register/page.tsx` — Password strength rules

#### UT-007 — `isStrongPassword()` returns false for password missing uppercase
- **Source**: `register/page.tsx:26-31` — `PASSWORD_RULES.every(r => r.test(p))`
- **Why Unit**: The `isStrongPassword` function and `PASSWORD_RULES` array are pure — no React, no network. Export and test directly: `isStrongPassword('secure@123')` → `false`

#### UT-008 — `isStrongPassword()` returns false for password missing number
- **Source**: `register/page.tsx:28` — `/[0-9]/.test(p)`
- **Why Unit**: `isStrongPassword('Secure@abc')` → `false`

#### UT-009 — `isStrongPassword()` returns true for fully compliant password
- **Source**: `register/page.tsx:31` — all 4 rules must pass
- **Why Unit**: `isStrongPassword('Secure@123')` → `true`

---

## 4. API / Integration Tests (16 tests)

**Rule**: Backend business rule, HTTP contract, error code, or server-side validation — tested at the HTTP layer against a real (test) database.

### 4.1 `POST /api/auth/register`

#### API-001 — Happy path: registers new user, returns 201 + token + user
- **Source**: `authRoutes.js:125` — `router.post('/register', validateAuth, authController.register)`; `authController.js:5-10`
- **Assertion**: Status 201; body has `{ success: true, token: string, user: { id, email } }`; token is a valid JWT

#### API-002 — Invalid email format returns 400 with field error
- **Source**: `authRoutes.js:10` — `validateAuth` middleware
- **Input**: `{ email: 'bad-email', password: 'secret' }`
- **Assertion**: 400; body has `details[0].field === 'email'`

#### API-003 — Password shorter than 6 chars returns 400
- **Source**: `authRoutes.js:13` — `password.length < 6`
- **Input**: `{ email: 'test@test.com', password: 'abc' }`
- **Assertion**: 400; body has `details[0].field === 'password'`

#### API-004 — Missing email field returns 400
- **Source**: `authRoutes.js:10` — `!email` check
- **Input**: `{ password: 'secret123' }` (no email)
- **Assertion**: 400; field error on email

#### API-005 — Duplicate email returns 400 with "Email already registered"
- **Source**: `authService.js:18` — `throw new ValidationError('Email already registered')` → `errorHandler.js:27` → 400
- **Assertion**: 400; `body.error === 'Email already registered'`
- **Rationale**: The Prisma P2002 path (409) would also be acceptable if DB constraint fires first; test documents the actual contract

#### API-006 — Backend accepts password with only 6 chars (frontend-backend discrepancy)
- **Source**: `authRoutes.js:13` — only checks `password.length < 6`; `register/page.tsx` enforces 8 chars + strength
- **Input**: `{ email: 'unique@test.com', password: 'abcde1' }` (6 chars, no uppercase/special)
- **Assertion**: **201 Created** — documents that the backend accepts passwords the frontend would reject
- **Rationale**: This discrepancy is a security concern; the test explicitly documents the gap so it can be addressed or accepted intentionally

### 4.2 `POST /api/auth/login`

#### API-007 — Happy path: returns 200 + token + user
- **Source**: `authRoutes.js:174` — `router.post('/login', validateAuth, authController.login)`; `authService.js:27-35`
- **Assertion**: Status 200; body has `{ success: true, token: string, user: { id, email } }` where email matches the registered user

#### API-008 — Wrong password returns 400 "Invalid email or password"
- **Source**: `authService.js:32` — `!match → throw new ValidationError('Invalid email or password')`
- **Assertion**: 400; `body.error === 'Invalid email or password'`

#### API-009 — Non-existent email returns 400 — SAME message as wrong password (no enumeration)
- **Source**: `authService.js:29` — `!user → throw new ValidationError('Invalid email or password')`
- **Assertion**: 400; `body.error === 'Invalid email or password'` — must match API-008 exactly
- **Rationale**: User enumeration prevention is a security contract; testing both paths at API level confirms the server never leaks whether an account exists

#### API-010 — Invalid email format on login returns 400 before reaching service
- **Source**: `authRoutes.js:10` — `validateAuth` runs before controller
- **Input**: `{ email: 'notvalid', password: 'secret' }`
- **Assertion**: 400; service (`authService.login`) never called

### 4.3 `GET /api/auth/me`

#### API-011 — Valid token returns 200 with user identity
- **Source**: `authRoutes.js:206` — `router.get('/me', authMiddleware, authController.getMe)`; `authController.js:24-26`
- **Assertion**: 200; `body.user === { userId: <int>, email: <string> }` — note payload key is `userId`, not `id`

#### API-012 — Missing Authorization header returns 401 "Unauthorized"
- **Source**: `authMiddleware.js:6-8` — `!header?.startsWith('Bearer ')` → 401
- **Assertion**: 401; `body.error === 'Unauthorized'`

#### API-013 — Invalid/tampered JWT returns 401 "Invalid or expired token"
- **Source**: `authMiddleware.js:10-12` — `jwt.verify()` throws → catch → 401
- **Input**: `Authorization: Bearer tampered.token.here`
- **Assertion**: 401; `body.error === 'Invalid or expired token'`

### 4.4 Protected Route Enforcement (Cross-cutting)

#### API-014 — `GET /api/events` without token returns 401
- **Source**: `authMiddleware` applied to event routes
- **Assertion**: 401; confirms auth middleware guards the events API

#### API-015 — `POST /api/bookings` without token returns 401
- **Source**: `authMiddleware` applied to booking routes
- **Assertion**: 401; confirms auth middleware guards the bookings API

#### API-016 — `GET /api/bookings/:id` with another user's token returns 403
- **Source**: `bookingService.js:57` — `booking.userId !== userId → throw ForbiddenError`; `errorHandler.js:15-17` → 403
- **Assertion**: 403; `body.error` contains "authorized" or "forbidden"
- **Rationale**: Cross-user isolation is a critical authorization contract; must live at API layer (fastest layer that fully covers it)

---

## 5. Component Tests (10 tests)

**Rule**: Single component rendering or UI state — test with mocked context/props, no real API calls.

### 5.1 `frontend/components/auth/AuthGuard.tsx`

#### CT-001 — Renders children when user is authenticated
- **Source**: `AuthGuard.tsx:30-34` — `if (!user && !isPublic) return null; return <>{children}</>`
- **Mock**: `useAuth()` returns `{ user: { userId: 1, email: 'test@test.com' }, isLoading: false }`
- **Assertion**: Children rendered in DOM

#### CT-002 — Renders null and calls `router.replace('/login')` when user is null and path is protected
- **Source**: `AuthGuard.tsx:17-20` — `if (!isLoading && !user && !isPublic) router.replace('/login')`
- **Mock**: `useAuth()` returns `{ user: null, isLoading: false }`; pathname = `/events`
- **Assertion**: `router.replace` called with `/login`; component renders null

#### CT-003 — Renders children on `/login` without authentication (public path)
- **Source**: `AuthGuard.tsx:14` — `PUBLIC_PATHS = ['/login', '/register']`
- **Mock**: `useAuth()` returns `{ user: null, isLoading: false }`; pathname = `/login`
- **Assertion**: Children rendered; `router.replace` NOT called

#### CT-004 — Renders children on `/register` without authentication (public path)
- **Source**: `AuthGuard.tsx:14`
- **Mock**: pathname = `/register`; unauthenticated user
- **Assertion**: Children rendered; no redirect

#### CT-005 — Shows loading spinner while `isLoading = true`
- **Source**: `AuthGuard.tsx:22-26` — `if (isLoading) return <Spinner />`
- **Mock**: `useAuth()` returns `{ user: null, isLoading: true }`
- **Assertion**: Spinner component present in DOM; children not rendered

### 5.2 `frontend/lib/hooks/useAuth.tsx` — `AuthProvider`

#### CT-006 — On mount with valid stored token, calls `/api/auth/me` and sets user
- **Source**: `useAuth.tsx:29-45` — `useEffect` reads `eventhub_token`, calls `authApi.getMe()`
- **Mock**: `localStorage.getItem('eventhub_token')` returns a token; mock `authApi.getMe()` to resolve with `{ user: { userId: 1, email: 'x@x.com' } }`
- **Assertion**: `user` state equals the resolved user; `isLoading` transitions false → true → false

#### CT-007 — On mount, clears invalid token when `/api/auth/me` fails
- **Source**: `useAuth.tsx:40-43` — `.catch(() => { localStorage.removeItem('eventhub_token'); setToken(null); })`
- **Mock**: Token present; `authApi.getMe()` rejects
- **Assertion**: `localStorage.removeItem` called with `'eventhub_token'`; `user` remains null

#### CT-008 — `logout()` clears localStorage and redirects to `/login`
- **Source**: `useAuth.tsx:63-68` — `localStorage.removeItem('eventhub_token'); router.push('/login')`
- **Assertion**: After calling `logout()`, `localStorage.getItem('eventhub_token')` returns null; `router.push('/login')` called

### 5.3 `frontend/app/register/page.tsx` — Password strength indicators

#### CT-009 — Strength indicator turns green as each password rule is satisfied
- **Source**: `register/page.tsx:203-217` — `PASSWORD_RULES.map(({ label, test }) => { const passed = password.length > 0 && test(password) ... })`
- **Mock**: Render `RegisterPage` with React Testing Library; no API calls
- **Assertion**: Type "Secure@123" char-by-char; assert that each indicator transitions from gray (`text-gray-400`) to green (`text-emerald-600`) as its condition is met

### 5.4 `frontend/app/login/page.tsx` — Demo credential warning

#### CT-010 — Demo credential warning shown (not toast) when known email fails login
- **Source**: `login/page.tsx:53-58` — `if (DEMO_EMAILS.includes(email)) setDemoWarning(true)` instead of `toast(err.message)`
- **Mock**: Render `LoginPage`; mock `authApi.login` to reject; submit with `rahulshetty1@gmail.com`
- **Assertion**: Amber warning banner with "sample test credentials" text is visible; generic toast NOT shown

---

## 6. E2E Tests (7 tests)

**Rule**: Multi-page journey or full-stack flow — browser-level tests that verify the complete user experience including navigation, localStorage, redirects.

### 6.1 Happy Path Journeys

#### E2E-001 — Login happy path (TC-002)
- **Source**: `login/page.tsx` → `useAuth.login()` → `authApi.login()` → localStorage → `router.push('/')`
- **Steps**: Navigate to `/login`; fill `getByPlaceholder('you@email.com')`, `getByLabel('Password')`; click `#login-btn`
- **Assertion**: URL becomes `http://localhost:3000/`; `getByRole('link', { name: /Browse Events/i })` visible; `eventhub_token` in localStorage
- **Selector precedence**: Placeholder → Label → ID (`#login-btn`) per Playwright best practices

#### E2E-002 — Register happy path (TC-001)
- **Source**: `register/page.tsx` → `useAuth.register()` → `authApi.register()` → localStorage → `router.push('/')`
- **Steps**: Navigate to `/register`; fill `#register-email`, `#register-password`, confirm; click `#register-btn`
- **Assertion**: URL becomes `/`; home page content visible; `eventhub_token` in localStorage
- **Note**: Use `Date.now()` suffix in email to guarantee uniqueness: `test+${Date.now()}@example.com`

### 6.2 Protected Route Guard (AuthGuard E2E)

#### E2E-003 — Unauthenticated access to /events redirects to /login (TC-206)
- **Source**: `AuthGuard.tsx:17` — `router.replace('/login')`
- **Steps**: Clear localStorage; navigate directly to `http://localhost:3000/events`
- **Assertion**: URL becomes `/login`; login form visible; events page content absent

#### E2E-004 — Unauthenticated access to /bookings redirects to /login (TC-207)
- **Source**: `AuthGuard.tsx:17`
- **Steps**: Clear localStorage; navigate to `/bookings`
- **Assertion**: Redirected to `/login`

#### E2E-005 — Unauthenticated access to /admin/events redirects to /login (TC-208)
- **Source**: `AuthGuard.tsx:17`
- **Steps**: Clear localStorage; navigate to `/admin/events`
- **Assertion**: Redirected to `/login`
- **Rationale**: Admin routes must be guarded — critical security gate that must be verified end-to-end

### 6.3 Session Lifecycle

#### E2E-006 — Session persists after page reload (JWT rehydration)
- **Source**: `useAuth.tsx:29-45` — `useEffect` on mount reads `eventhub_token` and calls `GET /api/auth/me`
- **Steps**: Login; verify home page visible; hard-reload page (`page.reload()`); assert still authenticated
- **Assertion**: After reload, home page still shows authenticated content; NOT redirected to /login
- **Rationale**: This is the only E2E test that verifies the `authApi.getMe()` rehydration path, which cannot be tested at Component level without a real backend

#### E2E-007 — Demo credential warning shown on failed login with known email (TC-320)
- **Source**: `login/page.tsx:53-58` — `DEMO_EMAILS.includes(email.trim().toLowerCase())` → `setDemoWarning(true)`
- **Precondition**: `rahulshetty1@gmail.com` does NOT exist in the DB (so login fails)
- **Steps**: Navigate to `/login`; enter `rahulshetty1@gmail.com` with any password; click `#login-btn`
- **Assertion**: Amber banner with "sample test credentials" text visible; toast NOT shown; register link visible in banner
- **Why E2E and not Component-only**: Requires actual API failure (not mock) to confirm the full error→branch logic works in production-like conditions

---

## 7. Anti-Patterns Found in Existing Tests

Analyzed file: `tests/booking-management.spec.js`

### AP-001 — Wrong BASE_URL (critical)
- **Location**: `booking-management.spec.js:3`
- **Problem**: `const BASE_URL = 'https://eventhub.rahulshettyacademy.com'` — points to the production deployment, not localhost. The `playwright.config.ts` defines `baseURL: 'http://localhost:3000'` for local runs. Tests currently run against production, which means: (a) CI cannot run without internet access, (b) tests are not isolated from real user data, (c) local code changes are never tested.
- **Fix**: Change to `const BASE_URL = 'http://localhost:3000'` or remove the constant and use `page.goto('/login')` with the config's `baseURL`

### AP-002 — Auth test coverage gap (zero auth-specific tests)
- **Problem**: The only existing spec file (`booking-management.spec.js`) treats login as a setup helper — there are zero tests that verify registration, login error states, JWT behavior, AuthGuard redirects, or session lifecycle.
- **Fix**: Create `tests/auth.spec.js` covering E2E-001 through E2E-007 from this strategy

### AP-003 — Login helper duplicated, not extracted as shared utility
- **Location**: `booking-management.spec.js:9-16`
- **Problem**: The `login()` helper is defined inline in a single test file. Every future test file will need to re-implement or copy it. Per the Playwright best-practices POM pattern, shared auth helpers belong in `tests/pages/LoginPage.js` or a `tests/helpers/auth.js` module.
- **Fix**: Extract to `tests/helpers/auth.js`:
  ```js
  // tests/helpers/auth.js
  export async function login(page, email = USER_EMAIL, password = USER_PASSWORD) {
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.locator('#login-btn').click();
    await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
  }
  ```

### AP-004 — No assertion after login in helper (implicit trust)
- **Location**: `booking-management.spec.js:15`
- **Problem**: The `login()` helper asserts `getByRole('link', { name: /Browse Events/i })` — this is fine. However, it does not verify `eventhub_token` is set in localStorage, so if the auth API changes to use a different storage key, tests would silently break at the API call layer rather than the login assertion.
- **Fix**: Add `expect(await page.evaluate(() => localStorage.getItem('eventhub_token'))).toBeTruthy()` to the login helper (or to E2E-001 specifically)

### AP-005 — Password validation tested at wrong layer (potential)
- **Problem**: TC-301 through TC-305 (register password strength rules) should not be pure E2E tests. The 4 `PASSWORD_RULES` functions are pure JavaScript — they require no browser, no DOM, no API. Testing all edge cases at E2E level bloats the slow test tier unnecessarily.
- **Fix**: Test the rule functions as Unit tests (UT-007 through UT-009 in this strategy); use a single E2E test to verify the visual indicator renders correctly for one representative case (e.g., valid password → all green)

---

## 8. Test File Plan

| File | Layer | Description |
|---|---|---|
| `tests/unit/auth.service.test.js` | Unit | authService register/login error paths, signToken payload |
| `tests/unit/auth.validation.test.js` | Unit | validateAuth middleware, isStrongPassword, PASSWORD_RULES |
| `tests/api/auth.api.test.js` | API | All 16 API contract tests for /auth/register, /auth/login, /auth/me, cross-cutting 401s |
| `tests/components/AuthGuard.test.tsx` | Component | 5 AuthGuard render/redirect scenarios |
| `tests/components/AuthProvider.test.tsx` | Component | 3 session lifecycle scenarios |
| `tests/components/RegisterPage.test.tsx` | Component | Password strength indicator live updates |
| `tests/components/LoginPage.test.tsx` | Component | Demo credential warning branch |
| `tests/auth.spec.js` | E2E | 7 E2E tests: login/register journeys, guard redirects, session persistence |

---

## 9. Decision Rationale for Contested Assignments

| Scenario | Assigned Layer | Rejected Layer | Rationale |
|---|---|---|---|
| Password strength validation (TC-301–305) | Unit + Component | E2E | `PASSWORD_RULES[].test()` are pure functions — no I/O. Unit covers all 4 rule branches in < 1ms each. One Component test verifies the visual indicator. E2E for all 5 scenarios = 5× slower for zero additional coverage. |
| Duplicate email check (TC-211) | API | E2E | `authService.register()` check is a DB + service concern. API test hits the real endpoint with real DB, which is the authoritative test. E2E would add 10s browser overhead for something already proven at the API layer. |
| AuthGuard redirect behavior (TC-206–208) | Component + E2E (1 each) | E2E only | The redirect logic (`if (!isLoading && !user && !isPublic) router.replace('/login')`) is testable with mocked `useAuth` context at the Component layer — no browser needed. But we keep 3 E2E tests (one per protected route) because they verify the real browser navigation, localStorage state, and Next.js routing together. |
| Demo credential warning (TC-320) | Component + E2E (1) | E2E only | The branch logic is in `login/page.tsx:53-58` and uses a hardcoded `DEMO_EMAILS` constant — testable as a Component test by mocking `authApi.login` to reject. The E2E test adds value by confirming the real API failure triggers the path (backend might return a different error structure that breaks the check). |
| JWT payload content | Unit | API | JWT content is signed inside `signToken()` at `authService.js:7`. Decoding the JWT in a unit test is precise and zero-latency. The API test (API-001) already confirms a token is *returned*; verifying its *content* at unit level is cheaper and more targeted. |
| Session rehydration on refresh | E2E | Component | `authApi.getMe()` is called on mount in `AuthProvider`. At Component level, this call can be mocked — but a mocked test cannot verify that the real backend `/api/auth/me` endpoint returns a compatible payload structure. Only E2E with a live backend validates the full round-trip. |
| User enumeration (same error for missing user vs wrong password) | Unit + API | E2E | This is a security property of the *server*. Unit (UT-002, UT-003) verifies the service throws the same `ValidationError` message in both branches. API (API-008, API-009) verifies the HTTP response body is identical. E2E would only test one path (wrong password shows a toast) — it cannot distinguish error messages at the API level without parsing the toast text. |
