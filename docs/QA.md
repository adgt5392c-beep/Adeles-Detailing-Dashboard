# Release check

Reviewed September 3, 2026. Local version ready for approval; nothing pushed or published.

## Verification

- 13 unit and interface tests pass, including all business totals, repeat-customer history, date validity, and the Contact soon cutoff.
- 20 browser checks pass across desktop Chromium and two mobile-sized Chromium profiles. One desktop run of the mobile-only menu test is intentionally skipped.
- All eight routes render and survive refresh at the case-sensitive GitHub Pages base path.
- Booking search, every service/status filter, inventory search, every category filter, empty states, and calendar navigation are exercised. The calendar accounts for all 85 bookings.
- Mobile menu opening, closing, backdrop dismissal, Escape, and keyboard focus trapping are tested.
- Charts are checked for visible data marks, not just empty SVG containers. Desktop and mobile screenshots were reviewed.
- Revenue tooltips show the expected month and amount on mouse hover and mobile taps.
- All six visible product links were reviewed for the correct product. Broken/unverifiable DSI links were replaced with matching Great Lakes Detail Supply pages. External links open a new tab with noopener and noreferrer.
- The existing GitHub repository URL returns HTTP 200.
- A clean temporary installation succeeds with the frozen lockfile; documented tests and production build also pass there.
- The Pages workflow uses main, builds dist, and targets the exact base path /Adeles-Detailing-Dashboard/.
- Publication excludes dependency caches, environment files, generated build output, and test artifacts. No credentials or private customer contact fields were found in the project files reviewed.

## Fixes from the review

Calendar months and booking rows now follow date order. The customer summary says Latest booking date because it includes scheduled visits. Inventory has an empty search state and distinguishes full-container coverage from remaining stock. Mobile navigation now supports keyboard focus and leads with the business name. Chart entrance animations were removed so data is visible immediately. Low-contrast supporting text was darkened. Repetitive wording was shortened without changing the business figures.

## Remaining verification after approval

The live Pages URL, GitHub permissions, and first deployment can only be verified after connecting and publishing the repository. Third-party product pages may change later. Mobile profiles emulate screen sizes in Chromium; they are not physical-device or native Safari tests.

Non-blocking: Vite reports a large chart-library bundle (about 210 KB gzipped). JSDOM unit tests emit a chart-size warning because that environment does not perform layout; real-browser chart rendering is covered separately.
