# Adele's Mobile Detailing Business Dashboard

A business dashboard I created for Adele's Mobile Detailing, my independently operated mobile detailing business in Atlanta.

I use it to track earned revenue separately from future bookings, plan service hours, and manage supplies.

## Business problem and purpose

I want to grow the business without overfilling my schedule. Comparing revenue with service hours helps me review pricing. Repeat-booking history helps me decide who to contact, while stock status guides what I need to restock.

My dashboard includes:

- An overview of booked, completed, and scheduled performance
- Monthly completed and scheduled revenue charts
- A searchable and filterable anonymized booking ledger
- A booking calendar without appointment times
- Repeat-customer and retention analysis
- Revenue, appointment-volume, and service-hour comparisons
- Inventory quantities, categories, statuses, pricing bases, and reference value
- The business story, goals, privacy practices, and methodology

## Technology

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- Recharts
- Papa Parse for CSV parsing
- React Router with hash routing for static GitHub Pages compatibility
- Vitest and React Testing Library
- Playwright desktop and mobile interaction tests
- GitHub Actions and GitHub Pages

The Vite base path is exactly `/Adeles-Detailing-Dashboard/`.

See [release checks](docs/QA.md) for the latest verification results and deployment checks that remain until publishing.

## Data structure

### `bookings.csv`

One row per completed or planned booking. Important fields include:

- `booking_id`: unique public booking identifier
- `booking_date`: service date; no booking-time field is used
- `customer_alias`: invented identity used for privacy-safe retention analysis
- `service` and `vehicle_class`: service and vehicle categories
- `booking_amount`: booked revenue
- `duration_hours`: service hours
- `status`: `completed` or `planned`
- `is_repeat_customer`: whether the row represents a return visit

`direct_material_cost` and `other_direct_cost` are currently blank for all rows. I therefore exclude them from contribution calculations.

### `inventory.csv`

One row per inventory record. Important fields include item, category, quantity in stock, package size, `reference_price`, pricing basis, status, and notes. Chemical rows also include dilution, estimated use per car, estimated cars per container, and a product-guidance link.

My verified $710.11 inventory figure is the sum of row-level `reference_price` values. It is **not** quantity multiplied by reference price. Prices are recorded/reference values rather than guaranteed current replacement prices. Fourteen rows have a $0 reference price, all `price_checked` values are blank, and one record notes that unit-versus-package meaning still needs confirmation.

Chemical coverage is per full container, not remaining stock. Ratios are product to water. Estimates combine product guidance with per-car usage; my reported Xpress dilution is 1:8 and my Brake Buster use is 6 oz per car. Xpress uses an estimated 8 oz of mixed solution per car. These are operating assumptions, not manufacturer claims. A US gallon contains 128 fluid ounces. For a product diluted 1:n, estimated cars per gallon = 128 × (1 + n) ÷ mixed ounces used per car. Coverage fields are rounded estimates stored in the CSV and should be updated together when usage changes.

### `business_info.md`

My written business background, operating philosophy, expense and funding disclosures, privacy definitions, methodology, and goals.

## Customer privacy

All displayed customer names are aliases. I exclude real names, phone numbers, email addresses, street addresses, exact locations, private calendar descriptions, and private calendar access. The interface visibly labels the public data as anonymized.

Every booking row reflects a real completed transaction or a real planned future commitment.

## Metric calculations

All headline booking and inventory metrics are calculated inside my application from the CSV records.

“Contact soon” lists customers with at least two completed visits whose latest service is more than two calendar months before today (Atlanta time), excluding customers with an upcoming planned booking. The list shows the oldest service dates first. It uses service dates because booking-creation dates are not tracked, and it does not send messages.

| Metric | Calculation |
| --- | --- |
| Total bookings | Count of all booking rows |
| Completed bookings | Count where `status = completed` |
| Planned bookings | Count where `status = planned` |
| Completed revenue | Sum of `booking_amount` for completed rows |
| Scheduled revenue | Sum of `booking_amount` for planned rows |
| Total booked revenue | Completed revenue + scheduled revenue |
| Service hours | Sum of `duration_hours`, separated by status where shown |
| Average revenue per booking | Total booked revenue ÷ total bookings |
| Revenue per service hour | Total booked revenue ÷ total service hours |
| Completed revenue per hour | Completed revenue ÷ completed service hours |
| Repeat-booking rate | Rows where `is_repeat_customer = true` ÷ all booking rows |
| Returning-customer rate | Aliases with more than one booking ÷ unique aliases |
| Inventory value | Sum of each inventory row’s `reference_price` |

My updated totals are 85 bookings, 59 completed, 26 planned, $11,240 total booked revenue, $7,545 completed revenue, $3,695 scheduled revenue, 296 total service hours, 206 completed hours, 90 planned hours, 46 inventory items, and $710.11 in recorded/reference inventory value. Automated tests protect these totals.

### Operating contribution, not profit

My only separately recorded cash business expense is $22 for business cards. I show completed cash-basis operating contribution as completed revenue less that recorded expense. It is not accounting net profit because I do not fully quantify gas and per-booking material consumption.

I paid for gas and approximately $400 of inventory using compensation and gift cards I earned through market research for technology companies. I directed those resources toward business expenses, which kept my direct cash overhead low. I had broken even on my initial expenses by the end of February.

## Install and run

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Because the production base path is configured in development too, it ends in `/Adeles-Detailing-Dashboard/`.

Run verification:

```bash
pnpm test
pnpm build
pnpm preview
```

Run the browser suite after building and installing Playwright’s Chromium browser:

```bash
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

## Update the CSV files

1. Replace `bookings.csv` and/or `inventory.csv` at the project root without changing the required headers.
2. Keep customer identifiers anonymized before the files enter the repository.
3. Use only `completed` or `planned` booking statuses unless the application and tests are intentionally updated.
4. Run `pnpm test` and `pnpm build`.
5. Investigate any failed verified-total test before publishing. Update an expected figure only when my booking or inventory records and documented business definition have intentionally changed together.

Vite imports the CSV text and Papa Parse converts it into typed application records at build time. No private API, server, calendar connection, or secret is required.


The published URL is:

<https://adixon75.github.io/Adeles-Detailing-Dashboard/>

No repository connection, push, or GitHub Pages setting should be changed until the local version has been reviewed and explicitly approved.
