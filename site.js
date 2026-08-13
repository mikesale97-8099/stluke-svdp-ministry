// ============================================================
// SHARED CONFIG — paste your published Google Sheet CSV URLs here.
// File > Share > Publish to web > select the tab > CSV.
// Leave as "" to use the sample data below instead.
// Both index.html and board.html read from this one file.
// ============================================================
const NEEDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE43bQSjQhyQKSZDIEQaHx54j3T0GPimqq4vTOdjZQfxL1LLI8OsfeAlMSCT6DIVGMEgDrJjjRXgH8/pub?gid=187704042&single=true&output=csv";
const RESULTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE43bQSjQhyQKSZDIEQaHx54j3T0GPimqq4vTOdjZQfxL1LLI8OsfeAlMSCT6DIVGMEgDrJjjRXgH8/pub?gid=1395629985&single=true&output=csv";
const LEDGER_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE43bQSjQhyQKSZDIEQaHx54j3T0GPimqq4vTOdjZQfxL1LLI8OsfeAlMSCT6DIVGMEgDrJjjRXgH8/pub?gid=1825093622&single=true&output=csv"; // published CSV of the "Balance Snapshot" tab — NOT currently loaded by either page (see note above DONATE_URL); left here so it's a one-line change to bring back

// NOT currently used. The parish gives our conference a monthly operating
// allowance and has asked ministries not to fundraise independently (it
// creates competition with the parish's own giving/operating budget), so
// the MVP does not solicit donations anywhere on the site. Kept here —
// along with give.html itself and the balance-snapshot code below — in
// case a future, parish-approved version (e.g. a "We Are SVdP" page) needs
// it again.
const DONATE_URL = "give.html";

// When someone clicks "I can help" on a Special Need item, we open a
// pre-filled email to this address so a real person actually finds out.
// This is a stopgap — no record persists anywhere except that inbox, and
// it relies on the sender actually hitting "send" in their email client.
const CLAIM_NOTIFY_EMAIL = "maccsale@sbcglobal.net";

// Google Sheets exports currency-formatted cells with the $ and thousands
// commas baked into the CSV text (e.g. "$1,590"). Number() chokes on that,
// so every dollar figure needs to go through this first.
function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// "2026-08-02" -> "August"
function formatMonthName(dateStr) {
  if (!dateStr) return '';
  const d = new Date(parseDateSortable(dateStr) + 'T00:00:00');
  if (isNaN(d)) return '';
  return d.toLocaleString('en-US', { month: 'long' });
}
// "2026-08-02" -> "August 2026" (matches the Results tab's "month" column)
function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(parseDateSortable(dateStr) + 'T00:00:00');
  if (isNaN(d)) return '';
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
// "2026-08-17" (or "8/17/26", or any format parseDateSortable understands)
// -> "Aug 17" — feeds the small date badge in each card's corner.
function formatMonthDay(dateStr) {
  if (!dateStr) return '';
  const iso = parseDateSortable(dateStr);
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

// "August 2026" -> "Aug-26" (for tight table columns)
function formatMonthAbbrev(monthLabel) {
  if (!monthLabel) return '';
  const parts = monthLabel.trim().split(/\s+/);
  if (parts.length < 2) return monthLabel;
  const [monthName, year] = parts;
  const d = new Date(`${monthName} 1, ${year}`);
  if (isNaN(d)) return monthLabel;
  const abbrev = d.toLocaleString('en-US', { month: 'short' });
  return `${abbrev}-${String(year).slice(-2)}`;
}

// "2026-08" (or "2026-8", or a full date) -> "Aug-26". Derives from
// month_key rather than the free-text "month" column, since that column's
// format varies by how it was typed in the sheet (e.g. "August 2026" vs a
// raw date like "8/1/26") — month_key is the one field meant to be
// machine-readable, so it's the reliable source for this.
function monthAbbrevFromKey(key) {
  const k = toMonthKey(key);
  const m = k.match(/^(\d{4})-(\d{2})$/);
  if (!m) return key || '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const abbrev = d.toLocaleString('en-US', { month: 'short' });
  return `${abbrev}-${m[1].slice(-2)}`;
}

// ------------------------------------------------------------
// Sample data — one row per home visit, matching the real Needs
// tab column headers (after Google's CSV-publish header normalization:
// lowercased, spaces -> underscores, punctuation like ? and # kept).
// ------------------------------------------------------------
const SAMPLE_NEEDS = [
  {
    visitid: "1", initial_home_visit_date: "2026-08-02", "#_in_household": "4",
    summary: "Family of 4, kids sharing a room. Currently sleeping on the floor.",
    "warehouse_item_needed?": "Yes", distribution_center_request_date: "",
    warehouse_item: "Twin bed frame + mattress", warehouse_status: "Open",
    "special_need_item?": "", special_need_item: "", special_need_status: "",
    "rent_assistance_needed?": "", rent_assistance_needed: "", rent_amount_needed: "", rent_need_status: "",
    "utility_assistance_needed?": "", utility_assistance_needed: "", utility_need_amount: "", utility_need_status: "",
    overall_status: "Active", month_posted: "2026-08",
  },
  {
    visitid: "3", initial_home_visit_date: "2026-07-30", "#_in_household": "3",
    summary: "Grandmother raising two grandchildren, short after a car repair.",
    "warehouse_item_needed?": "", distribution_center_request_date: "",
    warehouse_item: "", warehouse_status: "",
    "special_need_item?": "", special_need_item: "", special_need_status: "",
    "rent_assistance_needed?": "Yes", rent_assistance_needed: "March Rent Assistance", rent_amount_needed: "420", rent_need_status: "Open",
    "utility_assistance_needed?": "", utility_assistance_needed: "", utility_need_amount: "", utility_need_status: "",
    overall_status: "Active", month_posted: "2026-07",
  },
  {
    visitid: "4", initial_home_visit_date: "2026-07-28", "#_in_household": "3",
    summary: "Household of 3, shutoff notice received this week.",
    "warehouse_item_needed?": "", distribution_center_request_date: "",
    warehouse_item: "", warehouse_status: "",
    "special_need_item?": "", special_need_item: "", special_need_status: "",
    "rent_assistance_needed?": "", rent_assistance_needed: "", rent_amount_needed: "", rent_need_status: "",
    "utility_assistance_needed?": "Yes", utility_assistance_needed: "Overdue Electric Bill", utility_need_amount: "185", utility_need_status: "Partially Covered",
    overall_status: "Active", month_posted: "2026-07",
  },
  {
    visitid: "6", initial_home_visit_date: "2026-07-21", "#_in_household": "4",
    summary: "Mom returning to work after medical leave, one month behind.",
    "warehouse_item_needed?": "", distribution_center_request_date: "",
    warehouse_item: "", warehouse_status: "",
    "special_need_item?": "", special_need_item: "", special_need_status: "",
    "rent_assistance_needed?": "Yes", rent_assistance_needed: "February Rent Assistance", rent_amount_needed: "300", rent_need_status: "Covered",
    "utility_assistance_needed?": "", utility_assistance_needed: "", utility_need_amount: "", utility_need_status: "",
    overall_status: "Inactive", month_posted: "2026-07",
  },
  {
    visitid: "7", initial_home_visit_date: "2026-07-18", "#_in_household": "2",
    summary: "Elderly couple on fixed income, house has been cold.",
    "warehouse_item_needed?": "", distribution_center_request_date: "",
    warehouse_item: "", warehouse_status: "",
    "special_need_item?": "", special_need_item: "", special_need_status: "",
    "rent_assistance_needed?": "", rent_assistance_needed: "", rent_amount_needed: "", rent_need_status: "",
    "utility_assistance_needed?": "Yes", utility_assistance_needed: "Gas Bill", utility_need_amount: "120", utility_need_status: "Open",
    overall_status: "Active", month_posted: "2026-07",
  },
  {
    // Has BOTH a warehouse item and a special need — the board shows only
    // the special need (claimable); the warehouse item still counts in
    // Results but never renders its own card.
    visitid: "127", initial_home_visit_date: "2026-08-12", "#_in_household": "4",
    summary: "Family needs both a kitchen table and help with utilities.",
    "warehouse_item_needed?": "Yes", distribution_center_request_date: "",
    warehouse_item: "Kitchen table + chairs", warehouse_status: "Open",
    "special_need_item?": "Yes", special_need_item: "High chair", special_need_status: "Open",
    "rent_assistance_needed?": "", rent_assistance_needed: "", rent_amount_needed: "", rent_need_status: "",
    "utility_assistance_needed?": "Yes", utility_assistance_needed: "Water Bill", utility_need_amount: "85", utility_need_status: "Open",
    overall_status: "Active", month_posted: "2026-08",
  },
  {
    // Special need only, no warehouse item at all.
    visitid: "129", initial_home_visit_date: "2026-08-16", "#_in_household": "3",
    summary: "Family needs a microwave — not available through the warehouse this cycle.",
    "warehouse_item_needed?": "", distribution_center_request_date: "",
    warehouse_item: "", warehouse_status: "",
    "special_need_item?": "Yes", special_need_item: "Microwave", special_need_status: "Open",
    "rent_assistance_needed?": "", rent_assistance_needed: "", rent_amount_needed: "", rent_need_status: "",
    "utility_assistance_needed?": "", utility_assistance_needed: "", utility_need_amount: "", utility_need_status: "",
    overall_status: "Active", month_posted: "2026-08",
  },
];

// The Results tab is already fully formula-driven from the Needs tab inside
// the workbook itself — the site just displays whatever it publishes.
const SAMPLE_RESULTS = [
  { month: "June 2026", month_key: "2026-06", home_visits: "10", families_helped: "9", people_helped: "32", furniture_requests: "3", rent_requests: "4", utility_requests: "3", financial_assistance: "1590" },
  { month: "July 2026", month_key: "2026-07", home_visits: "10", families_helped: "9", people_helped: "33", furniture_requests: "3", rent_requests: "5", utility_requests: "3", financial_assistance: "395" },
  { month: "August 2026", month_key: "2026-08", home_visits: "8", families_helped: "7", people_helped: "26", furniture_requests: "2", rent_requests: "4", utility_requests: "2", financial_assistance: "0" },
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
        if (c === '\r' && next === '\n') i++;
      } else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.filter(r => r.length && r.some(v => v.trim() !== '')).map(r => {
    const obj = {};
    headers.forEach((h, idx) => obj[h] = (r[idx] || '').trim());
    return obj;
  });
}

// Tracks whether any load*() call this page load had to fall back to
// hardcoded sample data — missing CSV URL, fetch failure, or a non-OK
// response. Checked after init() on both pages to show a visible warning
// banner instead of silently displaying fake-looking (but plausible)
// numbers, which is exactly what happened before this existed: a failed
// fetch quietly showed sample data and nobody could tell it wasn't real.
let usedFallbackData = false;

async function loadCSV(url, fallback) {
  if (!url) { usedFallbackData = true; return fallback; }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    return parseCSV(await res.text());
  } catch (e) {
    console.warn('Falling back to sample data for', url, e);
    usedFallbackData = true;
    return fallback;
  }
}

async function loadVisits() {
  if (!NEEDS_CSV_URL) { usedFallbackData = true; return SAMPLE_NEEDS; }
  try {
    const res = await fetch(NEEDS_CSV_URL);
    if (!res.ok) throw new Error('fetch failed');
    let text = await res.text();
    // The Needs tab has a merged group-header row ABOVE the real per-column
    // headers (e.g. "Household Items Needed?" spanning 4 columns). When
    // published to CSV that row comes through as literal, mostly-blank
    // text — strip it so row 2's real headers are what parseCSV reads.
    const firstBreak = text.indexOf('\n');
    if (firstBreak !== -1) text = text.slice(firstBreak + 1);
    return parseCSV(text);
  } catch (e) {
    console.warn('Falling back to sample data for Needs CSV', e);
    usedFallbackData = true;
    return SAMPLE_NEEDS;
  }
}
// The Results tab has since been rebuilt with a richer per-category
// Requested/Covered breakdown (separate columns for e.g. "# Furniture
// Requests" vs "# Furniture Requests Covered") instead of the original
// simple metric shape. This maps the richer shape down to the simple shape
// the table renders — using the COVERED-only columns, not raw request
// volume, per an explicit decision that these figures should reflect
// fulfilled requests, bucketed by the month the assistance was actually
// rendered (check written / item distributed) rather than the month it was
// requested — that's how these columns are computed in the workbook itself.
// Falls through unchanged if a row already has the simple field names, so
// an older/simpler Results tab still works too.
function normalizeResultsRow(r) {
  if (!r) return r;
  if ('home_visits' in r) return r;
  const num = (key) => toNumber(r[key]);
  return {
    month: r.month || '',
    month_key: r.month_key || '',
    home_visits: String(num('#_home_visits')),
    families_helped: String(num('#_families_helped_(covered_requests_only)')),
    people_helped: String(num('#_people_helped_(covered_requests_only)')),
    furniture_requests: String(num('#_furniture_requests_covered') + num('#_special_needs_requests_covered')),
    rent_requests: String(num('#_rent_assistance_requests_covered')),
    utility_requests: String(num('#_utility_assistance_requests_covered')),
    financial_assistance: String(num('$_rent_covered') + num('$_utility_covered')),
  };
}

async function loadResults() {
  const rows = await loadCSV(RESULTS_CSV_URL, SAMPLE_RESULTS);
  return rows.map(normalizeResultsRow);
}

// ------------------------------------------------------------
// Expand each visit row into board cards — this is the bridge between the
// workbook's one-row-per-visit shape and the board's one-card-per-need
// display. Household items are special: a visit tracks a Warehouse item
// and a Special Need item INDEPENDENTLY (both count toward Results), but
// the board only ever shows ONE household card per visit — the Special
// Need if one exists (claimable, "I can help"), otherwise the Warehouse
// item (informational only, no button — most items are fulfilled this way
// with no parishioner action needed).
// ------------------------------------------------------------
function expandVisitsToNeeds(visits) {
  const needs = [];
  visits.forEach(v => {
    const monthPosted = v.month_posted || '';
    const datePosted = v.initial_home_visit_date || '';
    const detail = v.summary || '';

    const hasSpecial = (v['special_need_item?'] || '').toLowerCase() === 'yes';
    const hasWarehouse = (v['warehouse_item_needed?'] || '').toLowerCase() === 'yes';

    if (hasSpecial) {
      needs.push({
        id: `${v.visitid}-H`,
        category: 'Furnishings',
        subtype: 'special',
        title: v.special_need_item || 'Household item',
        detail,
        status: v.special_need_status || 'Open',
        amount: '',
        month_posted: monthPosted,
        date_posted: datePosted,
        date_covered: '', // no Date Covered column exists yet for Special Need — falls back to month_posted in visibleNeeds()
      });
    } else if (hasWarehouse) {
      needs.push({
        id: `${v.visitid}-H`,
        category: 'Furnishings',
        subtype: 'warehouse',
        title: v.warehouse_item || 'Household item',
        detail,
        status: v.warehouse_status || 'Open',
        amount: '',
        month_posted: monthPosted,
        date_posted: datePosted,
        date_covered: v.distribution_center_request_date || '', // closest proxy — it's what actually drives Warehouse Status to "Covered"
      });
    }

    if ((v['rent_assistance_needed?'] || '').toLowerCase() === 'yes') {
      needs.push({
        id: `${v.visitid}-R`,
        category: 'Rent',
        title: v.rent_assistance_needed || 'Rent Assistance',
        detail,
        status: v.rent_need_status || 'Open',
        amount: v.rent_amount_needed ? String(toNumber(v.rent_amount_needed)) : '',
        month_posted: monthPosted,
        date_posted: datePosted,
        date_covered: v.rent_date_covered || '',
      });
    }
    if ((v['utility_assistance_needed?'] || '').toLowerCase() === 'yes') {
      needs.push({
        id: `${v.visitid}-U`,
        category: 'Utilities',
        title: v.utility_assistance_needed || 'Utility Assistance',
        detail,
        status: v.utility_need_status || 'Open',
        amount: v.utility_need_amount ? String(toNumber(v.utility_need_amount)) : '',
        month_posted: monthPosted,
        date_posted: datePosted,
        date_covered: v.utility_date_covered || '',
      });
    }
  });
  return needs;
}

async function loadNeeds() {
  const visits = await loadVisits();
  return expandVisitsToNeeds(visits);
}

// ------------------------------------------------------------
// Balance Snapshot / balance gauge — NOT currently used by either page
// (MVP dropped all $ display; see DONATE_URL note near the top of this
// file). Left intact, including the sample data and loader, so a future
// version can wire it back in without rebuilding this part. A simple
// hand-reported snapshot (not a transactional ledger; detailed
// money-tracking lives elsewhere with whoever minds the funds). The sheet
// itself also derives outstanding_needs, assistance_provided_this_month,
// and available_balance via formulas keyed on the Needs tab's Date Covered
// columns — the site only ever read snapshot_date and funds_available.
// ------------------------------------------------------------
const SAMPLE_BALANCE_SNAPSHOTS = [
  { snapshot_date: "2026-07-05", funds_available: "1700" },
  { snapshot_date: "2026-07-12", funds_available: "1700" },
  { snapshot_date: "2026-07-19", funds_available: "1650" },
  { snapshot_date: "2026-07-26", funds_available: "1700" },
  { snapshot_date: "2026-08-02", funds_available: "1700" },
];

async function loadBalanceSnapshots() { return loadCSV(LEDGER_CSV_URL, SAMPLE_BALANCE_SNAPSHOTS); }

// NOT currently called — kept alongside loadBalanceSnapshots() above for a
// possible future funds-tracking feature (see DONATE_URL note near the top
// of this file). Uses the LAST row (most recent snapshot) for
// funds_available, which was manual/treasurer-reported.
function latestSnapshot(rows) {
  return rows.length ? rows[rows.length - 1] : null;
}

// "2026-08-01" or "2026-08" or "2026-8" -> "2026-08". Handles a full date,
// a zero-padded YYYY-MM string, and an unpadded YYYY-M string (Google
// Sheets doesn't enforce padding on manually-typed month_key values, and a
// missing leading zero is an easy typo to make).
function toMonthKey(dateOrMonthStr) {
  if (!dateOrMonthStr) return '';
  const s = String(dateOrMonthStr).trim();
  const monthKeyMatch = s.match(/^(\d{4})-(\d{1,2})$/);
  if (monthKeyMatch) return `${monthKeyMatch[1]}-${monthKeyMatch[2].padStart(2, '0')}`;
  const iso = parseDateSortable(s);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(0, 7) : '';
}

// Sorts Results rows by month_key, most-recent-first, and drops any row
// whose month_key doesn't actually parse to a real YYYY-MM (a stray blank
// template row for next month, a totals/summary row, etc.). This used to
// be handled by just trusting the sheet's row order (oldest-first) and
// grabbing the last element — that broke silently and picked the wrong
// month if the sheet ever had an extra non-month row at the end, so this
// sorts explicitly instead of assuming anything about row order.
function sortResultsByMonthDesc(rows) {
  return (rows || [])
    .filter(r => /^\d{4}-\d{2}$/.test(toMonthKey(r.month_key)))
    .slice()
    .sort((a, b) => toMonthKey(b.month_key).localeCompare(toMonthKey(a.month_key)));
}

// Applies the monthly rollover rule: a Covered need drops off once the
// month it was ACTUALLY covered in has passed — not the month the need was
// originally posted. A need requested in July but covered in August stays
// visible through August, then rolls off in September. Open/Partially
// Covered needs keep showing regardless of age, and needs with no
// date_covered yet (e.g. Special Need items, which don't have that column)
// fall back to their posted month, same as before. Closed needs never show
// at all — not active, not archived. "Unknown" is deliberately left alone
// for now (falls through to the same treatment as Open) until there's a
// decision on how it should actually be handled.
function visibleNeeds(needs) {
  const thisMonth = currentMonthKey();
  return needs.filter(n => {
    const status = (n.status || 'open').toLowerCase();
    if (status === 'closed') return false;
    if (status !== 'covered') return true;
    const coveredMonth = toMonthKey(n.date_covered) || toMonthKey(n.month_posted) || thisMonth;
    return coveredMonth === thisMonth;
  });
}

// The archive counterpart to visibleNeeds() — every need ever marked
// Covered, regardless of when. This is what powers the "Families We've
// Served" section: a running record of lives touched, using the same
// no-names Summary text already shown for open needs.
function servedNeeds(needs) {
  return needs.filter(n => (n.status || '').toLowerCase() === 'covered');
}

// NOT currently called (see DONATE_URL note above) — the old fund-vs-need
// dollar comparison for the "This Month, At a Glance" card. Left in place
// in case public fund tracking comes back for a future version.
function fundGoal(needs) {
  return visibleNeeds(needs)
    .filter(n => (n.category === 'Rent' || n.category === 'Utilities') && n.amount)
    .filter(n => (n.status || 'Open').toLowerCase() !== 'covered')
    .reduce((sum, n) => sum + toNumber(n.amount), 0);
}

// NOT currently called — see fundGoal() above.
function outstandingNeedsSummary(needs) {
  const open = visibleNeeds(needs)
    .filter(n => (n.category === 'Rent' || n.category === 'Utilities') && n.amount)
    .filter(n => (n.status || 'Open').toLowerCase() !== 'covered');
  const total = open.reduce((sum, n) => sum + toNumber(n.amount), 0);
  const families = new Set(open.map(n => n.id.split('-')[0]));
  return { total, families: families.size };
}

// Latest Initial Home Visit Date across all needs, as an ISO "YYYY-MM-DD"
// string (or '' if there's no visit data at all). This is the actual date
// the glance card is "as of" — the Results row it's paired with is only
// month-granular and may still be mid-month/accumulating, so dating the
// card by that row's month name alone ("In August 2026...") reads like a
// completed month even when it isn't.
function mostRecentVisitISO(needs) {
  let latest = '';
  (needs || []).forEach(n => {
    const iso = parseDateSortable(n.date_posted);
    if (iso && iso > latest) latest = iso;
  });
  return latest;
}

// Builds the "At a Glance" copy — two short paragraphs, counts only, no
// dollar figures (see DONATE_URL note above). Paragraph 1 covers the most
// recent Results row; the actual as-of date lives in the heading instead
// (see glanceHeading() below), so this doesn't repeat it. Paragraph 2 is a
// running year-to-date total. families_helped and people_helped both come
// straight from the Results tab — the workbook counts a family only once,
// in the month its FIRST request was covered, so summing families_helped
// across the year's rows is already a correct, non-duplicated year total
// (no client-side re-derivation from the Needs data needed, unlike an
// earlier version of this function).
function buildSnapshotSentence(resultsRows) {
  const sorted = sortResultsByMonthDesc(resultsRows);
  if (!sorted.length) return '';
  const latest = sorted[0];
  const year = (toMonthKey(latest.month_key) || '').slice(0, 4) || String(new Date().getFullYear());

  const visits = toNumber(latest.home_visits);
  const furniture = toNumber(latest.furniture_requests);
  const rentUtility = toNumber(latest.rent_requests) + toNumber(latest.utility_requests);

  const p1 = `So far this month, SVdP has visited <strong>${visits}</strong> home${visits === 1 ? '' : 's'} to understand their needs. We continue to work on accumulated requests and have fulfilled <strong>${furniture}</strong> furniture/household request${furniture === 1 ? '' : 's'} and <strong>${rentUtility}</strong> rent/utility assistance request${rentUtility === 1 ? '' : 's'}.`;

  const ytdRows = sorted.filter(r => (toMonthKey(r.month_key) || '').startsWith(year));
  const familiesYTD = ytdRows.reduce((sum, r) => sum + toNumber(r.families_helped), 0);
  const peopleYTD = ytdRows.reduce((sum, r) => sum + toNumber(r.people_helped), 0);

  const p2 = `In <strong>${year}</strong>, SVdP has helped <strong>${familiesYTD}</strong> famil${familiesYTD === 1 ? 'y' : 'ies'} — <strong>${peopleYTD}</strong> people in total — through your generosity. Thank you!`;

  return `<p>${p1}</p><p>${p2}</p>`;
}

// "August Home Visits — At a Glance (8/6/26)" — the as-of date lives here
// in the heading (short M/D/YY form) rather than repeated in the sentence
// below. Derived from the same most-recent visit date used elsewhere, so
// the heading and body never disagree about what period they're covering.
function glanceHeading(needs) {
  const iso = mostRecentVisitISO(needs);
  const d = new Date(iso + 'T00:00:00');
  if (!iso || isNaN(d)) return 'Home Visits — At a Glance';
  const monthName = d.toLocaleDateString('en-US', { month: 'long' });
  const shortDate = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  return `${monthName} Home Visits — At a Glance (${shortDate})`;
}

// Parses a date string into a sortable "YYYY-MM-DD" form regardless of the
// display format Google exported it in — a sheet's date column might show
// as "6/3/26", "6/3/2026", or "2026-06-03" depending on cell formatting,
// and none of that should have to matter for sorting to work correctly.
function parseDateSortable(str) {
  if (!str) return '';
  str = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10); // already ISO-ish
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/); // M/D/YY or M/D/YYYY
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = (Number(yr) < 50 ? '20' : '19') + yr;
    return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
  }
  return str; // unrecognized format — falls back to plain text comparison
}

// Board ordering: Special Need cards first (someone specific needs to step
// up, so they get top billing regardless of status), then everything else
// split into Open/Active vs Inactive (Covered) — active needs surface above
// resolved ones so the board reads urgent-to-resolved. Newest visit first
// within each of the three tiers, so new cards actually get noticed instead
// of getting buried.
function boardPriority(need) {
  if (need.category === 'Furnishings' && need.subtype === 'special') return 0;
  const status = (need.status || 'open').toLowerCase();
  return status === 'covered' ? 2 : 1;
}
function sortForBoard(needs) {
  return [...needs].sort((a, b) => {
    const pa = boardPriority(a), pb = boardPriority(b);
    if (pa !== pb) return pa - pb;
    return parseDateSortable(b.date_posted).localeCompare(parseDateSortable(a.date_posted));
  });
}

const STATUS_COLOR = { open: "#A8492E", "partially covered": "#C9A24B", covered: "#7C8B6F" };
function statusColor(status) {
  return STATUS_COLOR[(status || 'open').toLowerCase()] || STATUS_COLOR.open;
}

// Call once after all load*() calls finish in a page's init(). Injects a
// visible banner at the top of the page if any of them fell back to sample
// data, so a broken CSV fetch can never again look like real (but wrong)
// numbers — see the usedFallbackData note near loadCSV()/loadVisits().
function showFallbackWarningIfNeeded() {
  if (!usedFallbackData) return;
  const el = document.createElement('div');
  el.className = 'fallback-warning';
  el.textContent = 'Showing sample placeholder data — the live Google Sheet failed to load. Check NEEDS_CSV_URL / RESULTS_CSV_URL in site.js, and your browser console for the specific error.';
  document.body.prepend(el);
}
