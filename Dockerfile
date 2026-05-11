# ── Playwright Test Runner ────────────────────────────────────────────────────
#
# Uses the official Microsoft Playwright image which ships with Node.js and
# all required browser binaries pre-installed — no local setup needed.
#
# The image version is pinned to match @playwright/test in package.json
# to guarantee browser ↔ driver compatibility.
# ─────────────────────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install Node dependencies in a separate layer so Docker can cache it.
# This layer is only rebuilt when package.json or package-lock.json changes.
COPY package*.json ./
RUN npm ci

# Copy Playwright config and test source.
# These are copied last so code changes don't invalidate the npm ci cache layer.
COPY playwright.config.ts ./
COPY tests/ ./tests/

# Default command — can be overridden at runtime, e.g.:
#   docker compose run playwright npx playwright test --project=auth
CMD ["npx", "playwright", "test"]
