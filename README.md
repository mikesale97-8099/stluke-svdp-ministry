# St. Luke SVdP Conference — Site Mockup

Five files, no build step required:

- `index.html` — the main content page (mission, needs preview, next drive, home visit results, campaigns, sister conferences, volunteer CTA) — this is what a QR code on a bulletin flyer should point to
- `board.html` — the dedicated, fully-interactive Needs Bulletin Board sub-page (filters + "I can help" claim interaction). Linked to from index.html's needs preview section.
- `give.html` — a **placeholder, currently unlinked** giving page mockup. Not part of the live MVP (see "Money / giving — currently off" below) — kept in the repo in case a future version needs it.
- `site.js` — shared config and data-loading logic used by both pages (see "Google Sheet" section below)
- `style.css` — shared stylesheet for both pages. Background is St. Luke's brand blue (`#25408E`, pulled from stluke.org). A few components (`.card`, `.glance-card`, `.header`, etc.) render at different sizes on each page, so those are scoped under `.page-board` / `.page-index` (set on each page's `<body>` tag) rather than sharing one rule — safe to edit either page's version without affecting the other.

## Money / giving — currently off

The conference runs on a monthly operating allowance from the parish, and the parish has asked ministries not to fundraise independently (it creates competition with the parish's own giving/operating budget). So the live MVP:

- Has **no "Give" button or donate link** anywhere (removed from both `board.html` and `index.html`)
- Shows **no dollar amounts** on Rent/Utility cards — just the status badge, title, and description
- The "This Month, At a Glance" card shows **counts only** — see the dedicated "This Month, At a Glance" section below for exactly what it computes and from where

Nothing money-related was deleted, just disconnected, in case a parish-approved giving feature comes back later (e.g. a separate "We Are SVdP" page):

- `give.html` still exists but nothing links to it
- `DONATE_URL`, the Balance Snapshot loader/sample data, `fundGoal()`, `outstandingNeedsSummary()`, and `latestSnapshot()` are all still in `site.js`, just unused — each has a `// NOT currently called` comment pointing back here
- The workbook's Results tab can still compute and publish `financial_assistance` and `people_helped`; the site reads both but only shows `people_helped` indirectly (via the glance-card sentence) — neither appears as a column in the Home Visit Results table
- `LEDGER_CSV_URL` (the published Balance Snapshot tab) is still declared but not fetched by either page

To bring it back: re-add the button markup, re-wire `renderGlance()` to include funds-related copy again (see git history for the old three-argument `buildSnapshotSentence(needs, resultsRows, snap)`), and un-comment the "NOT currently called" functions.

## View it locally

Just open `index.html` in a browser, or run a tiny local server from this folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000


## Push to GitHub and turn on Pages

1. Create a new **empty** repository on GitHub (no README/license, so there's nothing to conflict with) — e.g. `svdp-needs-board`.
2. From this folder, run:

```
git init
git add .
git commit -m "Initial mockup: landing page + needs board"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/svdp-needs-board.git
git push -u origin main
```

3. On GitHub: go to the repo's **Settings → Pages**, and under "Build and deployment" set **Source: Deploy from a branch**, branch **main**, folder **/(root)**. Save.
4. GitHub will give you a live URL, usually `https://YOUR-USERNAME.github.io/svdp-needs-board/` — that's what the QR code on your flyer should point to.

## Notes / next steps

- The "40 Days for 40 Beds," "Volunteer," and "Give" links on the landing page are placeholders (`#`) — point them at real pages when ready.
- The needs board's claim state is in-memory only (resets on refresh) since this is a mockup — a real version would need a backend or a form (e.g. a Google Form) behind "I can help."

## Making the board and results table Google-Sheet-driven

Both `index.html`'s needs preview / results table and `board.html`'s full needs board pull from `site.js` — one place to update, both pages stay in sync.

The Needs data now comes from the **svdp-needs-board-template.xlsx** workbook (one row per home visit, with Warehouse/Special Need/Rent/Utility needs tracked side by side). `site.js` expects that exact column layout — see the workbook's own Instructions tab for the full column reference. In short:

```
ServWare ID | Initial Home Visit Date | # in Household | Summary |
Warehouse Item Needed? | Distribution Center Request Date | Warehouse Item | Warehouse Status |
Special Need Item? | Special Need Item | Special Need Status | Household Combined Status |
Rent Assistance Needed? | Rent Assistance Needed | Rent Amount Needed | Rent Need Status |
Utility Assistance Needed? | Utility Assistance Needed | Utility Need Amount | Utility Need Status |
Overall Status | Month Posted
```

`site.js` expands each visit row into board cards (one per need type that's flagged "Yes"), so a family needing both rent help and a bed shows as two separate cards, sharing the same `Summary` text.

- **Household items are tracked two ways:** most go through the SVdP central warehouse (Warehouse columns) — no parishioner action needed, tracked purely for record-keeping. Occasionally an item isn't available through the warehouse and needs a parishioner to step up (Special Need columns). **The board shows only ONE household card per visit** — the Special Need if one exists (with the "I can help" claim button), otherwise the Warehouse item as a plain, non-interactive "SVdP Warehouse" info card. Both still count toward the `furniture_requests` figure in Results either way, even though only one ever renders on the board.
- Every card shows a solid-color **status badge** (Open = rust/orange, Partially Covered = gold, Covered/Claimed = sage/green — `statusColor()` in `site.js`) and the visit date, side by side on one row (`.card-top-row`) at the top of the card — badge on the left, date on the right. This is the only status indicator; there's no diagonal "stamp" anymore, to avoid showing status twice on the same card.
- The thumbtack (`.card-pin`) is always the same red — it's a physical pin holding the card to the board, not a status indicator.
- `.card` has `overflow: hidden` so nothing can ever visually render outside the card onto the blue page background.
- **Board sort order:** Special Need cards always come first (regardless of status), then everything Open/Partially Covered, then everything Covered — newest visit first within each of those three tiers (`boardPriority()` / `sortForBoard()` in `site.js`).
- **Rent/Utility items** render as status-badge cards feeding the shared fund thermometer, same as before — `Rent Amount Needed` / `Utility Need Amount` are approximate context figures only, not per-family accounts, and `Rent Need Status` / `Utility Need Status` are the manual Open/Partially Covered/Covered dropdowns from the workbook.
- The **note-worthy schema change:** there's no more `urgency` field. Card color/priority now comes entirely from status (Open = most urgent, Partially Covered, Covered = resolved) instead of a separate high/medium/low rating.

**Monthly rollover** (unchanged in spirit): a need Covered in a *prior* month disappears from the board automatically; Open/Partially Covered needs keep showing regardless of age; a same-month Covered win still shows before it rolls off. This uses each expanded need's `month_posted`, taken straight from the workbook's calculated `Month Posted` column.

**Tab "Results"** — already fully formula-driven inside the workbook itself (see its Instructions tab). The site expects (after `normalizeResultsRow()` maps the workbook's richer per-category Requested/Covered columns down to this shape):
```
month | month_key | home_visits | families_helped | people_helped | furniture_requests | rent_requests | utility_requests | financial_assistance
```
The **Home Visit Results** table on `index.html` shows four of those — Home Visits, Furniture Assists (furniture + special needs combined), Rent Assists, Utility Assists — filtered to **2026 only**, with each metric as a row and each 2026 month as a column (most recent first), plus a bolded "2026 YTD" column. Metrics-as-rows keeps the table short and lets it scroll sideways through months on a narrow phone screen, rather than growing a new row per month. `families_helped`, `people_helped`, and `financial_assistance` are still read and available on each row, just not shown in this table — the glance-card sentence uses `families_helped` and `people_helped` (see "This Month, At a Glance" below); `financial_assistance` stays hidden per "Money / giving — currently off" above.

**Row order is never assumed.** Both this table and the glance card used to just trust the sheet's row order (oldest-first) and grab the last row as "the current month" — that broke silently and picked the wrong month if the sheet ever had a stray non-month row (a blank template row for next month, a totals row, etc.) after the real data. `sortResultsByMonthDesc()` in `site.js` now explicitly sorts by `month_key` and drops any row that doesn't parse to a real `YYYY-MM`, so row order in the sheet itself no longer matters.

**A failed CSV fetch is no longer silent.** If `NEEDS_CSV_URL` or `RESULTS_CSV_URL` fails to load (wrong URL, sheet not published, network error), the site falls back to small hardcoded sample datasets so it never shows a broken page — but that used to be invisible, logged only to the browser console, and the sample numbers are plausible enough to look real at a glance. Both pages now show a red banner across the top ("Showing sample placeholder data...") whenever that happens, via `usedFallbackData` / `showFallbackWarningIfNeeded()` in `site.js`.

Each of the four shown metrics is a **Covered** count — e.g. Rent Assists counts rent requests marked Covered — bucketed by **the month the assistance was actually rendered** (check written / item distributed), not the month it was originally requested. A request that came in July but wasn't paid until August counts toward August. That bucketing happens inside the workbook's own formulas; `site.js` just displays whatever month each row already represents.

`families_helped` reads from `# Families Helped (Covered Requests Only)` — a family (furniture/special/rent/utility, any type) is counted once, in the month its *first* request was covered, even if it has other requests covered in later months. That dedup logic lives entirely in the workbook's own formula. (An earlier version of this site tried to derive a families-helped figure client-side from the Needs data, using a guessed, unconfirmed column name that turned out not to exist and always read 0 — that's been fully replaced by this real column now that it exists.)

### 1. Publish both tabs as CSV

For each of the workbook's **Needs** and **Results** tabs:
1. File → Share → **Publish to web**
2. Under "Link," choose the specific tab (not "Entire Document")
3. Choose **Comma-separated values (.csv)** as the format
4. Click **Publish**, copy the URL it gives you

### 2. Paste the URLs into the site

Open `site.js`, find this block near the top:

```js
const NEEDS_CSV_URL = "";
const RESULTS_CSV_URL = "";
```

Paste your two published CSV URLs between the quotes. Save and re-upload `site.js` to GitHub — no need to touch `index.html` or `board.html`. (`DONATE_URL` and `LEDGER_CSV_URL` also live in this block, but neither is currently used — see "Money / giving — currently off" above.)

If a URL is left blank or the fetch fails for any reason, the page quietly falls back to the built-in sample data, so it never shows a broken page.

## This Month, At a Glance

Both pages show a compact "at a glance" card with **two paragraphs**, built by `buildSnapshotSentence(resultsRows)` in `site.js`. No dollar amounts (see "Money / giving — currently off" above).

1. **This month:** home visits, plus furniture/household and rent/utility requests provided — pulled from the latest row of the **Results** tab. The copy explicitly notes that these are requests fulfilled this month, which may include ones collected in prior months (see the Results-tab note above on Covered-month bucketing).
2. **Year-to-date:** families and people helped so far in the current year — both simple sums of `families_helped` and `people_helped` across the year's Results rows. Summing `families_helped` across months is safe (no double-counting) because the workbook already counts each family only once, in the month its first request was covered — see the Results-tab note above.

The workbook's **Balance Snapshot** tab (`snapshot_date | funds_available`, with `outstanding_needs`, `assistance_provided_this_month`, and `available_balance` computed by formula from the Needs tab's Date Covered columns — see the workbook's Instructions tab) still exists and can still be published as CSV, but the site doesn't currently read it. It's what a future funds-tracking version would plug back into `LEDGER_CSV_URL` in `site.js`.
