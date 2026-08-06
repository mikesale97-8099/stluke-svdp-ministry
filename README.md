# St. Luke SVdP Conference — Site Mockup

Five files, no build step required:

- `index.html` — the main content page (mission, needs preview, next drive, home visit results, campaigns, sister conferences, volunteer CTA) — this is what a QR code on a bulletin flyer should point to
- `board.html` — the dedicated, fully-interactive Needs Bulletin Board sub-page (filters + "I can help" claim interaction). Linked to from index.html's needs preview section.
- `give.html` — a **placeholder** giving page mockup, styled to look like a page on St. Luke's site, with "SVdP — Families in Need" pre-selected as the fund. `DONATE_URL` in `site.js` currently points here. **Swap it for St. Luke's real online giving link** once that platform has an SVdP designation set up — this page does not process real payments, and says so clearly at the top.
- `site.js` — shared config and data-loading logic used by both pages (see "Google Sheet" section below)
- `style.css` — shared stylesheet for both pages. Background is St. Luke's brand blue (`#25408E`, pulled from stluke.org). A few components (`.card`, `.glance-card`, `.header`, etc.) render at different sizes on each page, so those are scoped under `.page-board` / `.page-index` (set on each page's `<body>` tag) rather than sharing one rule — safe to edit either page's version without affecting the other.

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
- **Rent/Utility items** render as status-badge cards feeding the shared fund thermometer, same as before — `Rent Amount Needed` / `Utility Need Amount` are approximate context figures only, not per-family accounts, and `Rent Need Status` / `Utility Need Status` are the manual Open/Partially Covered/Covered dropdowns from the workbook.
- The **note-worthy schema change:** there's no more `urgency` field. Card color/priority now comes entirely from status (Open = most urgent, Partially Covered, Covered = resolved) instead of a separate high/medium/low rating.

**Monthly rollover** (unchanged in spirit): a need Covered in a *prior* month disappears from the board automatically; Open/Partially Covered needs keep showing regardless of age; a same-month Covered win still shows before it rolls off. This uses each expanded need's `month_posted`, taken straight from the workbook's calculated `Month Posted` column.

**Tab "Results"** — already fully formula-driven inside the workbook itself (see its Instructions tab). The site just displays whatever gets published:
```
month | home_visits | people_helped | furniture_requests | rent_utility_requests | financial_assistance
```

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
const DONATE_URL = "";
const FUND_RAISED = 300;
const FUND_RAISED_MONTH = "2026-07";
```

Paste your two published CSV URLs between the quotes. Also paste in your parish giving site's SVdP donation link as `DONATE_URL`. Update `FUND_RAISED` and `FUND_RAISED_MONTH` by hand each month as you check the parish giving system. Save and re-upload `site.js` to GitHub — no need to touch `index.html` or `board.html`.

If a URL is left blank or the fetch fails for any reason, the page quietly falls back to the built-in sample data, so it never shows a broken page.

## This Month, At a Glance

Both pages show a compact "at a glance" card with a two-paragraph summary — home visits and assistance given this month, then available funds vs. outstanding requests — instead of a separate gauge widget (an earlier design; removed in favor of plain sentences, which tested better).

This is deliberately **not** a transactional ledger — the conference's detailed money-tracking lives elsewhere with whoever minds the funds. It reads from the workbook's **Balance Snapshot** tab, which only has **two manual columns**:

```
snapshot_date | funds_available
```

Everything else on that tab (`outstanding_needs`, `assistance_provided_this_month`, `available_balance`) is a **formula** computed from the Needs tab's `Rent Date Covered` / `Utility Date Covered` columns — see the workbook's own Instructions tab for the exact formulas. The site itself only ever reads `snapshot_date` and `funds_available` from this tab; the other columns exist for the treasurer's own reference and aren't consumed by `site.js`.

Because those formulas ask a historical question ("was this still outstanding as of THIS row's date?") using real covered-dates rather than a status that keeps changing, **old rows never need to be manually locked or frozen** — add a new row each week and every row, old or new, stays correct indefinitely.

Publish the tab as CSV the same way as the others, then paste its URL into `site.js`:

```js
const LEDGER_CSV_URL = "";
```
