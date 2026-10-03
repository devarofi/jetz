/**
 * Jetz stress test — interactive table grid with pagination.
 *
 * Loads thousands of rows into a reactive `<table>`, renders one page at a time
 * with `loop(list, keyFn, renderFn)` keyed reconciliation, and measures every
 * render so the cost of pagination, sorting, filtering and per-row updates is
 * visible instead of guessed. Every row also carries a reactive tagged-template
 * string (the Ticker column), so the interpolation path runs under the same
 * load and gets its own timing card.
 *
 * Conventions follow the Jetz README: `stateOf` / `computed` / `effect` for
 * reactive state, `listOf` + keyed `loop` for collections, `css()` for reactive
 * classes and Tailwind utility classes for styling.
 *
 * Heavy interactions (dataset swaps, filtering, sorting, paging) run through
 * `defer(task, { loadingState })`, so the loading indicator paints before the
 * grid re-renders instead of the click blocking the frame it caused.
 *
 * Run it with any static server that serves the project root, e.g.
 *   npx serve .        (then open http://localhost:3000)
 * Tailwind is loaded from node_modules (browser build), so no CSS build step.
 */
import {
    Jetz, batch, computed, defer, effect, ifElse, listOf, loop, lazy, rawOf, rowOf, stateOf, touchRow
} from "../../lib/jetz.js";
import {
    button, css, div, footer, h1, header, inputCheckbox, inputNumber, inputText,
    label, main, p, section, small, span, strong, table, tbody, td, text, th, thead, tr
} from "../../lib/jetz-ui.js";
import { JetzDevtools } from "../../lib/jetz-devtools.js";

/* -------------------------------------------------------------------------- */
/* 1. Fixtures & helpers                                                       */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
    "Ada", "Budi", "Chen", "Dewi", "Elena", "Farid", "Grace", "Hiro", "Indah",
    "Jonas", "Kiran", "Liam", "Maya", "Nadia", "Omar", "Priya", "Quinn", "Rizky",
    "Sinta", "Tomas", "Umar", "Vera", "Wayan", "Yuki"
];
const LAST_NAMES = [
    "Ananda", "Baskara", "Chen", "Darmawan", "Erlangga", "Firmansyah", "Gunawan",
    "Hartono", "Iskandar", "Kusuma", "Lestari", "Maulana", "Nugroho", "Pratama",
    "Ramadhan", "Santoso", "Tanaka", "Utami", "Wibowo", "Yusuf"
];
const DEPARTMENTS = [
    "Engineering", "Design", "Data", "Sales", "Support", "Finance", "Ops", "Marketing"
];
const REGIONS = ["APAC", "EMEA", "NA-East", "NA-West", "LATAM", "ANZ"];
const STATUSES = ["active", "idle", "blocked"];
const STATUS_CLASSES = {
    active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    idle: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    blocked: "bg-rose-500/15 text-rose-300 ring-rose-400/30"
};

const PAGE_SIZES = [10, 25, 50, 100, 250, 500];
const DATASET_SIZES = [1000, 5000, 10000, 25000, 50000];
const DEFAULT_DATASET_SIZE = 10000;

const COLUMNS = [
    { key: "id", label: "#", align: "text-right" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
    { key: "region", label: "Region" },
    { key: "score", label: "Score", align: "text-right" },
    { key: "status", label: "Status" },
    { key: "visits", label: "Visits", align: "text-right" },
    { key: "ticker", label: "Ticker", align: "text-right" },
    { key: null, label: "Actions", align: "text-right" }
];
/** Columns that are not sortable (email has thousands of near-duplicate values). */
const NOT_SORTABLE = new Set(["email", "ticker", null]);

/** Deterministic PRNG so a dataset size always produces the same rows. */
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Builds one row using shallow row state (rowOf).
 * One version signal per row instead of one State per cell.
 * Immutable columns (id, name, email, department, region) are plain values.
 * Mutable columns (score, visits, status, selected) are plain values that
 * trigger a row re-render when bumped via touchRow(row) or row.set().
 */
function createRow(id, rnd) {
    const first = FIRST_NAMES[(rnd() * FIRST_NAMES.length) | 0];
    const last = LAST_NAMES[(rnd() * LAST_NAMES.length) | 0];
    const name = `${first} ${last}`;
    const email = `${first}.${last}${id}@jetz.dev`.toLowerCase();
    const department = DEPARTMENTS[(rnd() * DEPARTMENTS.length) | 0];
    const region = REGIONS[(rnd() * REGIONS.length) | 0];
    return rowOf({
        id,
        idLabel: id.toLocaleString("en-US"),
        name,
        email,
        department,
        region,
        score: (rnd() * 100000) | 0,
        visits: 1 + ((rnd() * 999) | 0),
        status: STATUSES[(rnd() * STATUSES.length) | 0],
        selected: false,
        // Precomputed lowercase search key: the filter pipeline scans up to
        // 50k rows per keystroke, so pay the 4x toLowerCase once at build
        // instead of on every pipeline run.
        _search: `${name} ${email} ${department} ${region}`.toLowerCase()
    });
}

const numberFormat = value => value.toLocaleString("en-US");
const msLabel = value => `${(+value).toFixed(2)} ms`;
const readHeapMb = () => {
    const memory = performance.memory;
    return memory ? +(memory.usedJSHeapSize / 1048576).toFixed(1) : 0;
};

/* -------------------------------------------------------------------------- */
/* 2. Reactive state                                                           */
/* -------------------------------------------------------------------------- */

/** Bumped whenever `dataset` is replaced; computeds read it to invalidate. */
const dataVersion = stateOf(0);

/** Lazy dataset: only generated on first access (when pipeline runs). */
const dataset = lazy(() => {
    const rnd = mulberry32(DEFAULT_DATASET_SIZE * 7919 + 13);
    const rows = new Array(DEFAULT_DATASET_SIZE);
    for (let index = 0; index < DEFAULT_DATASET_SIZE; index++) rows[index] = createRow(index + 1, rnd);
    return rows;
});

const query = stateOf("");
const statusFilter = stateOf("all");
const selectedOnly = stateOf(false);
const selectedCount = stateOf(0);
const selectionVersion = stateOf(0);
const sortKey = stateOf("id");
const sortDir = stateOf("asc");
const page = stateOf(1);
const pageSize = stateOf(25);
const jumpText = stateOf("1");
const sizeInput = stateOf(String(DEFAULT_DATASET_SIZE));
/** Shared tick read by every row's tagged string — one write fans out to all of them. */
const stringTick = stateOf(0);
/** Loading signal for defer(): true from the click until the deferred task has rendered. */
const isBusy = stateOf(false);

const stats = stateOf({
    buildMs: 0,   // generating the dataset
    loadMs: 0,    // first render of a freshly loaded dataset
    mountMs: 0,   // initial Jetz.mount
    lastMs: 0,    // last page change
    avgMs: 0,     // aggregates over the recorded page changes
    minMs: 0,
    maxMs: 0,
    p95Ms: 0,
    changes: 0,
    updateMs: 0,  // last single-cell reactive update
    bulkMs: 0,    // last batch update across every row
    stringMs: 0,  // last one-write fan-out across every row's tagged string
    domRows: 0,   // <tr> currently attached to the tbody
    heapMb: 0,
    // defer(): paint-aware scheduling of the heavy interactions
    deferOps: 0,      // deferred tasks completed
    deferLabel: "—",  // label of the last deferred task
    deferMs: 0        // click → task start: the frame defer() waited out
});

const sweep = stateOf({
    running: false,
    rounds: 1,
    pages: 0,
    progress: 0,
    totalMs: 0,
    avgMs: 0,
    maxMs: 0,
    p95Ms: 0,
    pps: 0
});
const sweepAbort = stateOf(false);
/** Mutable sample buffer; `stats` holds the derived view of it. */
const timings = [];

/** Sort comparators. Use rawOf for untracked reads so the pipeline doesn't pin rows. */
const COMPARATORS = {
    id: (a, b) => a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
    department: (a, b) => a.department.localeCompare(b.department),
    region: (a, b) => a.region.localeCompare(b.region),
    score: (a, b) => rawOf(a).score - rawOf(b).score,
    visits: (a, b) => rawOf(a).visits - rawOf(b).visits,
    status: (a, b) => rawOf(a).status.localeCompare(rawOf(b).status)
};

function summarize(values) {
    if (values.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
    const sorted = values.slice().sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    return {
        avg: +(total / sorted.length).toFixed(2),
        min: +sorted[0].toFixed(2),
        max: +sorted[sorted.length - 1].toFixed(2),
        p95: +p95.toFixed(2)
    };
}

function refreshTimingStats() {
    const summary = summarize(timings);
    stats.avgMs.value = summary.avg;
    stats.minMs.value = summary.min;
    stats.maxMs.value = summary.max;
    stats.p95Ms.value = summary.p95;
    stats.changes.value = timings.length;
}

function recordPageTiming(ms) {
    timings.push(ms);
    if (timings.length > 4000) timings.splice(0, timings.length - 4000);
    stats.lastMs.value = +ms.toFixed(2);
    refreshTimingStats();
}

function refreshDomStats() {
    stats.domRows.value = document.querySelectorAll("#grid-body tr").length;
    stats.heapMb.value = readHeapMb();
}

/** Replaces the dataset and re-renders the grid (back to page 1, metrics reset). */
function loadDataset(size) {
    const wanted = Math.max(1, Math.min(500000, Math.floor(size) || DEFAULT_DATASET_SIZE));
    const startedAt = performance.now();
    const rnd = mulberry32(wanted * 7919 + 13);
    const rows = new Array(wanted);
    for (let index = 0; index < wanted; index++) rows[index] = createRow(index + 1, rnd);
    const buildMs = performance.now() - startedAt;

    // Replace the lazy dataset's value
    dataset.value = rows;
    selectedCount.value = 0;
    timings.length = 0;
    stats.buildMs.value = +buildMs.toFixed(2);
    stats.lastMs.value = 0;
    stats.updateMs.value = 0;
    stats.bulkMs.value = 0;
    stats.stringMs.value = 0;
    sweep.totalMs.value = 0;
    sweep.avgMs.value = 0;
    sweep.maxMs.value = 0;
    sweep.p95Ms.value = 0;
    sweep.pps.value = 0;
    sweep.progress.value = 0;

    const renderStart = performance.now();
    dataVersion.value++;               // invalidates the pipeline -> rows.set(slice)
    stats.loadMs.value = +(performance.now() - renderStart).toFixed(2);
    refreshTimingStats();
    datasetSize.value = wanted;
    sizeInput.value = String(wanted);
    return wanted;
}

/* -------------------------------------------------------------------------- */
/* 3. Derived data (filter -> sort -> paginate)                                */
/* -------------------------------------------------------------------------- */

/**
 * Holds only the rows of the current page. `loop()` (below) turns it into a
 * keyed list, so a page change removes the rows that left and builds the rows
 * that arrived instead of re-rendering the whole table.
 */
const rows = listOf();

/**
 * Scalars published by the pipeline below. `computed()` returns arrays/objects
 * unwrapped in this version, so the derived array never leaves the pipeline and
 * only the numbers the UI needs are exposed as reactive state.
 */
const datasetSize = stateOf(DEFAULT_DATASET_SIZE);
const filteredCount = stateOf(DEFAULT_DATASET_SIZE);
const pageCount = stateOf(1);
const visiblePage = stateOf(1);
const rowsOnPage = stateOf(0);
const rangeStart = stateOf(0);
const rangeEnd = stateOf(0);

// Seed the grid before the pipeline exists, so nothing renders during startup.
// Dataset is lazy - will be generated on first access (loadDataset triggers it).
loadDataset(DEFAULT_DATASET_SIZE);

/**
 * Cached filtered+sorted array. Re-built only when filter/sort/dataset inputs
 * change. A page-only change skips the filter+sort entirely and slices this.
 */
let _filteredSorted = [];
let _filterSortSignature = "";

/**
 * Stage 1: filter + sort. Runs only when data, query, status, selectedOnly,
 * sortKey, sortDir or pageSize change. Caches the result in _filteredSorted
 * so the pagination stage can slice without redoing this work.
 */
function runFilterPipeline() {
    dataVersion.value;
    const needle = query.value.trim().toLowerCase();
    const status = statusFilter.value;
    const onlySelected = selectedOnly.value;
    const selectionRevision = onlySelected ? selectionVersion.value : 0;
    const key = sortKey.value;
    const descending = sortDir.value === "desc";
    const size = pageSize.value;

    const signature = [dataVersion.getValue(), needle, status, onlySelected, selectionRevision, key, descending, size].join("|");
    if (signature === _filterSortSignature) return;
    _filterSortSignature = signature;

    const filtered = [];
    const data = dataset.value;
    for (const row of data) {
        const r = rawOf(row);  // untracked read
        if (onlySelected && !r.selected) continue;
        if (status !== "all" && r.status !== status) continue;
        if (needle && !r._search.includes(needle)) continue;
        filtered.push(row);
    }
    const compare = COMPARATORS[key] ?? COMPARATORS.id;
    filtered.sort(descending ? (a, b) => compare(b, a) : compare);
    _filteredSorted = filtered;

    // Reset to page 1 when the filter/sort changes
    if (page.getValue() !== 1) page.setState(1);

    // Publish scalars and slice
    _paginateFromCache(1, size);
}

/**
 * Stage 2: pagination only. Runs when page changes (and on initial mount).
 * Reads the cached _filteredSorted instead of re-filtering the full dataset.
 */
function runPaginationPipeline() {
    const requestedPage = page.value;      // tracked
    const size = pageSize.value;           // tracked
    dataVersion.value;                     // tracked: dataset swap invalidates
    _paginateFromCache(requestedPage, size);
}

function startPipeline() {
    effect(runFilterPipeline);
    effect(runPaginationPipeline);
}

/** Shared pagination logic: slices the cached sorted array and pushes to rows. */
function _paginateFromCache(requestedPage, size) {
    const total = _filteredSorted.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.max(1, Math.min(pages, requestedPage));
    const start = (current - 1) * size;
    const slice = _filteredSorted.slice(start, start + size);

    filteredCount.value = total;
    pageCount.value = pages;
    visiblePage.value = current;
    rowsOnPage.value = slice.length;
    rangeStart.value = total === 0 ? 0 : start + 1;
    rangeEnd.value = Math.min(total, start + size);
    if (jumpText.getValue() !== String(current)) jumpText.setState(String(current));

    rows.set(slice);
    refreshDomStats();
}

// Formatted views used by the UI (created once, so no per-render cost).
const totalLabel = computed(() => numberFormat(datasetSize.value));
const filteredLabel = computed(() => numberFormat(filteredCount.value));
const pageLabel = computed(() => `Page ${numberFormat(visiblePage.value)} of ${numberFormat(pageCount.value)}`);
const rowsOnPageLabel = computed(() => `${numberFormat(rowsOnPage.value)} rows on this page`);
const rangeLabel = computed(() => filteredCount.value === 0
    ? "0 rows"
    : `Showing ${numberFormat(rangeStart.value)}–${numberFormat(rangeEnd.value)} of ${numberFormat(filteredCount.value)}`);
const domRowsLabel = computed(() => `${numberFormat(stats.domRows.value)} rows in DOM`);
const lastMsLabel = computed(() => msLabel(stats.lastMs.value));
const avgMsLabel = computed(() => msLabel(stats.avgMs.value));
const minMsLabel = computed(() => msLabel(stats.minMs.value));
const maxMsLabel = computed(() => msLabel(stats.maxMs.value));
const p95MsLabel = computed(() => msLabel(stats.p95Ms.value));
const updateMsLabel = computed(() => msLabel(stats.updateMs.value));
const bulkMsLabel = computed(() => msLabel(stats.bulkMs.value));
const stringMsLabel = computed(() => msLabel(stats.stringMs.value));
const heapLabel = computed(() => stats.heapMb.value ? `${stats.heapMb.value} MB` : "n/a");
const selectionLabel = computed(() => `${numberFormat(selectedCount.value)} selected`);

/* -------------------------------------------------------------------------- */
/* 4. Notes on the render path                                                 */
/* -------------------------------------------------------------------------- */

// There is exactly one place where reactive data reaches the DOM: the pipeline
// effect above calls `rows.set(slice)`, which keyed-reconciles the tbody. Every
// page change, sort, filter and dataset swap flows through it, so the timings
// recorded in `gotoPage()` / `runSweep()` cover the whole pipeline.

/* -------------------------------------------------------------------------- */
/* 5. Interactions                                                             */
/* -------------------------------------------------------------------------- */

const clampPage = value => Math.max(1, Math.min(pageCount.value, value));

/**
 * Runs a heavy mutation through defer(): the loading signal flips now, the
 * browser paints the indicator, and the task runs one frame later — so the
 * click that triggers a 50k-row re-render never blocks the paint it caused.
 * Calls arriving while a task is still pending are dropped, so rapid clicks
 * cannot pile up deferred work.
 */
function deferHeavy(label, task) {
    if (isBusy.getValue()) return;
    const startedAt = performance.now();
    defer(() => {
        const paintMs = performance.now() - startedAt;
        task();
        // written after the task: a dataset swap inside it resets its own stats
        stats.deferLabel.value = label;
        stats.deferMs.value = +paintMs.toFixed(2);
        stats.deferOps.value += 1;
    }, { loadingState: isBusy });
}

/** Page change + measurement of everything it triggers (data -> DOM). */
function gotoPage(target, { measure = true } = {}) {
    const next = clampPage(Number(target) || 1);
    const startedAt = performance.now();
    page.setState(next);
    if (measure) recordPageTiming(performance.now() - startedAt);
    return next;
}

function toggleSort(key) {
    if (NOT_SORTABLE.has(key)) return;
    if (sortKey.getValue() === key) {
        sortDir.setState(sortDir.getValue() === "asc" ? "desc" : "asc");
    } else {
        sortKey.setState(key);
        sortDir.setState("asc");
    }
}

function applyJump() {
    const parsed = Number.parseInt(jumpText.getValue(), 10);
    if (!Number.isFinite(parsed)) {
        jumpText.setState(String(visiblePage.getValue()));
        return;
    }
    jumpText.setState(String(gotoPage(parsed)));
}

/** Fine-grained update: bump the row's version signal via touchRow(). */
function bumpRow(row) {
    const startedAt = performance.now();
    const r = rawOf(row);
    r.score = r.score + 1;
    touchRow(row);  // triggers row re-render
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

function cycleStatus(row) {
    const startedAt = performance.now();
    const r = rawOf(row);
    const next = (STATUSES.indexOf(r.status) + 1) % STATUSES.length;
    r.status = STATUSES[next];
    touchRow(row);
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

function toggleRow(row) {
    const startedAt = performance.now();
    const r = rawOf(row);
    r.selected = !r.selected;
    selectedCount.value += r.selected ? 1 : -1;
    selectionVersion.value += 1;
    touchRow(row);
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

/** One write per row, flushed as a single batch. */
function bumpAllScores() {
    const startedAt = performance.now();
    batch(() => {
        const data = dataset.value;
        for (const row of data) {
            const r = rawOf(row);
            r.score = r.score + 1;
        }
        for (const row of data) touchRow(row);
    });
    stats.bulkMs.value = +(performance.now() - startedAt).toFixed(2);
}

/**
 * One state write → every visible row's tagged string re-renders. The timing is
 * the pure fan-out cost of the interpolation path (N row strings flushing from
 * a single write), independent of which cells are bound to the same state.
 */
function pulseStrings() {
    const startedAt = performance.now();
    stringTick.value += 1;
    stats.stringMs.value = +(performance.now() - startedAt).toFixed(2);
}

function clearSelection() {
    if (selectedCount.getValue() === 0) return;
    const startedAt = performance.now();
    batch(() => {
        const data = dataset.value;
        for (const row of data) {
            const r = rawOf(row);
            if (!r.selected) continue;
            r.selected = false;
            touchRow(row);
        }
        selectedCount.value = 0;
        selectionVersion.value += 1;
    });
    stats.bulkMs.value = +(performance.now() - startedAt).toFixed(2);
}

function resetMetrics() {
    timings.length = 0;
    stats.lastMs.value = 0;
    refreshTimingStats();
    sweep.progress.value = 0;
    sweep.totalMs.value = 0;
    sweep.avgMs.value = 0;
    sweep.maxMs.value = 0;
    sweep.p95Ms.value = 0;
    sweep.pps.value = 0;
}

/**
 * Walks every page `rounds` times, timing each page render. Work is chunked
 * into animation frames so the browser stays responsive (and so the numbers
 * reflect real, non-blocking page changes instead of one frozen task).
 */
function runSweep(rounds = 1) {
    if (sweep.running.value) return;
    const totalPages = pageCount.value;
    if (totalPages < 2) {
        sweep.avgMs.value = 0;
        return;
    }
    const samples = [];
    const startedAt = performance.now();
    const total = totalPages * rounds;
    let done = 0;

    sweepAbort.value = false;
    sweep.running.value = true;
    sweep.rounds.value = rounds;
    sweep.pages.value = total;
    sweep.progress.value = 0;

    const finish = () => {
        const wall = performance.now() - startedAt;
        const summary = summarize(samples);
        sweep.totalMs.value = +wall.toFixed(0);
        sweep.avgMs.value = summary.avg;
        sweep.maxMs.value = summary.max;
        sweep.p95Ms.value = summary.p95;
        sweep.pps.value = samples.length ? +((samples.length / wall) * 1000).toFixed(1) : 0;
        sweep.running.value = false;
        timings.push(...samples);
        if (timings.length > 4000) timings.splice(0, timings.length - 4000);
        refreshTimingStats();
    };

    const step = () => {
        const frameStart = performance.now();
        while (done < total && !sweepAbort.value && performance.now() - frameStart < 12) {
            const target = (done % totalPages) + 1;
            const pageStart = performance.now();
            page.setState(target);
            samples.push(performance.now() - pageStart);
            done++;
        }
        sweep.progress.value = Math.round((done / total) * 100);

        if (sweepAbort.value || done >= total) {
            if (sweepAbort.value) sweep.progress.value = Math.round((done / total) * 100);
            finish();
            return;
        }
        requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------- */
/* 6. UI (Tailwind utility classes only)                                       */
/* -------------------------------------------------------------------------- */

const PANEL = "rounded-xl bg-slate-900/60 ring-1 ring-white/10 p-4";
const BTN = "rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-white/5 ring-1 ring-inset ring-white/15 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_ACTIVE = "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-500/20 ring-1 ring-inset ring-emerald-400/40";
const BTN_TINY = "rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-300 bg-white/5 ring-1 ring-inset ring-white/10 hover:bg-white/15";
const INPUT = "rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 ring-1 ring-inset ring-white/15 outline-none placeholder:text-slate-500 focus:ring-emerald-400/60";
const CELL = "px-3 py-1.5 whitespace-nowrap";
const LABEL = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const CHIP_ROW = "flex flex-wrap items-center gap-1.5";

/** Small toggle-style button whose active look is a reactive class. */
function chip(label, isActive, onPick) {
    return button(css(computed(() => (isActive() ? BTN_ACTIVE : BTN))), { onclick: onPick }, label);
}

function statCard(label, value, hint) {
    const children = [
        div(css`${LABEL}`, label),
        div(css`mt-1 text-base font-semibold tabular-nums text-slate-100`, value)
    ];
    if (hint != null) children.push(div(css`text-[11px] text-slate-500`, hint));
    return div(css`rounded-lg bg-slate-950/50 px-3 py-2 ring-1 ring-inset ring-white/10`, ...children);
}

/**
 * A titled category of stat cards, so results are arranged by what produced
 * them (dataset context, button-driven tests, sweep benchmark) instead of one
 * flat grid mixing all three.
 */
function cardGroup(title, cards, grid = "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5") {
    return section(css`mt-3`,
        div(css`${LABEL} mb-2`, title),
        div(css`grid gap-2 ${grid}`, ...cards)
    );
}

function Header() {
    return header(css`flex flex-wrap items-end justify-between gap-3`,
        div(
            h1(css`text-xl font-semibold tracking-tight text-white`, "Jetz · Table Grid Stress Test"),
            p(css`mt-1 max-w-3xl text-xs text-slate-400`,
                "Thousands of reactive rows, one page in the DOM at a time. Rows are rendered with keyed ",
                span(css`text-emerald-300`, "loop(rows, row => row.id, RowView)"),
                ", so a page change only builds the rows that arrived."
            )
        ),
        div(css`flex flex-wrap items-center gap-2`,
            span(css`rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 ring-1 ring-inset ring-white/10`, "Jetz v", Jetz.version),
            span(css`rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 ring-1 ring-inset ring-white/10`, selectionLabel),
            // defer(): the loading indicator that paints before the heavy task runs
            span(
                css(computed(() => isBusy.value
                    ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/40"
                    : "inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 ring-1 ring-inset ring-white/10")),
                ifElse(() => isBusy.value,
                    () => span(css`size-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent`),
                    () => null),
                span(computed(() => isBusy.value ? "defer · task pending" : "defer · idle"))
            )
        )
    );
}

function Toolbar() {
    return section(css`${PANEL}`,
        div(css`grid gap-4 lg:grid-cols-2`,
            div(
                div(css`${LABEL}`, "Dataset"),
                div(css`${CHIP_ROW} mt-2`,
                    ...DATASET_SIZES.map(size => chip(
                        `${numberFormat(size)} rows`,
                        () => datasetSize.value === size,
                        () => deferHeavy("dataset swap", () => loadDataset(size))
                    ))
                ),
                div(css`mt-3 flex items-center gap-2`,
                    label(css`text-xs text-slate-400`, "Custom size"),
                    inputNumber(css`${INPUT} w-28`, { min: 1, bind: sizeInput }),
                    button(css`${BTN}`, { onclick: () => deferHeavy("custom dataset", () => loadDataset(Number.parseInt(sizeInput.getValue(), 10))) }, "Load")
                )
            ),
            div(
                div(css`${LABEL}`, "Filter"),
                div(css`${CHIP_ROW} mt-2`,
                    chip("All statuses", () => statusFilter.value === "all", () => deferHeavy("status filter", () => statusFilter.setState("all"))),
                    ...STATUSES.map(status => chip(
                        status,
                        () => statusFilter.value === status,
                        () => deferHeavy("status filter", () => statusFilter.setState(status))
                    ))
                ),
                div(css`mt-3 flex items-center gap-2`,
                    inputText(css`${INPUT} w-full`, { bind: query, placeholder: "Search name, email, department, region…" }),
                    button(css`${BTN}`, { onclick: () => deferHeavy("clear search", () => query.setState("")) }, "Clear")
                ),
                div(css`mt-3 flex flex-wrap items-center gap-3`,
                    label(css`flex items-center gap-2 text-xs text-slate-400`,
                        inputCheckbox(css`size-3.5 accent-emerald-400`, { bind: selectedOnly },),
                        "Selected rows only"
                    ),
                    button(css`${BTN}`, { onclick: () => deferHeavy("clear selection", clearSelection) }, "Clear selection")
                )
            )
        )
    );
}

function columnTh(column) {
    const sortable = !NOT_SORTABLE.has(column.key);
    const indicator = computed(() => {
        if (!sortable || sortKey.value !== column.key) return "";
        return sortDir.value === "asc" ? " ▲" : " ▼";
    });
    // Joined from parts: Jetz's static `class` path passes the string straight to
    // `classList.add(...)`, which rejects empty tokens (double spaces).
    const className = [
        CELL,
        "font-semibold",
        column.align,
        sortable ? "cursor-pointer select-none hover:text-slate-100" : ""
    ].filter(Boolean).join(" ");
    const attributes = css`${className}`;
    if (sortable) attributes.onclick = () => deferHeavy("sort", () => toggleSort(column.key));
    return th(attributes, column.label, span(css`text-emerald-400`, indicator));
}

/**
 * One table row using shallow row state (rowOf).
 *
 * Immutable columns (id, name, email, department, region) are plain values —
 * read once on mount, no subscriptions.
 *
 * Mutable columns (score, visits, status, selection) use computed() to track
 * the row's version signal. A row bump via touchRow() re-evaluates only these.
 *
 * The Ticker cell uses a tagged-template string with ${() => ...} interpolations
 * that become computed text nodes, re-rendering on row bump or stringTick change.
 */
function RowView(row) {
    return tr(
        css`cursor-pointer hover:bg-white/5`,
        css(() => row.selected
            ? "bg-sky-500/10 ring-1 ring-inset ring-sky-400/30"
            : ""),
        { onclick: () => toggleRow(row) },
        td(css`${CELL} text-right text-slate-500`, row.idLabel),
        td(css`${CELL} font-medium text-slate-100`, row.name),
        td(css`${CELL} text-slate-400`, row.email),
        td(css`${CELL} text-white`, row.department),
        td(css`${CELL} text-white`, row.region),
        td(css`${CELL} text-white text-right tabular-nums`, computed(() => row.score)),
        td(css`${CELL}`, span(
            css`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset`,
            css(() => STATUS_CLASSES[row.status]),
            computed(() => row.status)
        )),
        td(css`${CELL} text-right tabular-nums text-slate-300`, computed(() => row.visits)),
        td(css`${CELL} stress-ticker text-right font-mono text-xs text-slate-400`,
            text`#${row.idLabel} · ${() => row.score} pts · t${() => stringTick.value}`
        ),
        td(css`${CELL} text-right`,
            div(css`flex justify-end gap-1`,
                button(css`${BTN_TINY}`, { onclick: event => { event.stopPropagation(); bumpRow(row); } }, "+1"),
                button(css`${BTN_TINY}`, { onclick: event => { event.stopPropagation(); cycleStatus(row); } }, "status"),
                button(css`${BTN_TINY}`, { onclick: event => { event.stopPropagation(); toggleRow(row); } }, "select")
            )
        )
    );
}

function Grid() {
    return section(css`${PANEL}`,
        div(css`mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400`,
            span(rangeLabel),
            span(ifElse(
                () => rowsOnPage.value === 0,
                () => "No rows match the current filters.",
                () => rowsOnPageLabel
            ))
        ),
        div(css`max-h-[58vh] overflow-auto rounded-lg ring-1 ring-white/10`,
            table(css`w-full border-collapse text-sm`,
                thead(css`sticky top-0 z-10 bg-slate-900/95 text-left backdrop-blur-sm`,
                    tr(css`text-[11px] uppercase tracking-wider text-slate-400`,
                        ...COLUMNS.map(columnTh)
                    )
                ),
                tbody(css`divide-y divide-white/5`, { id: "grid-body" },
                    loop(rows, row => row.id, RowView)
                )
            )
        )
    );
}

function PaginationBar() {
    return section(css`${PANEL}`,
        div(css`flex flex-wrap items-center justify-between gap-3`,
            div(css`flex items-center gap-2`,
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value === 1), onclick: () => deferHeavy("page change", () => gotoPage(1)) }, "« First"),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value === 1), onclick: () => deferHeavy("page change", () => gotoPage(visiblePage.value - 1)) }, "‹ Prev"),
                span(css`px-2 text-xs font-medium text-slate-300`, pageLabel),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value >= pageCount.value), onclick: () => deferHeavy("page change", () => gotoPage(visiblePage.value + 1)) }, "Next ›"),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value >= pageCount.value), onclick: () => deferHeavy("page change", () => gotoPage(pageCount.value)) }, "Last »")
            ),
            div(css`flex items-center gap-2`,
                label(css`text-xs text-slate-400`, "Go to"),
                inputNumber(css`${INPUT} w-24`, { bind: jumpText, onkeydown: event => { if (event.key === "Enter") deferHeavy("page jump", applyJump); } },),
                button(css`${BTN}`, { onclick: () => deferHeavy("page jump", applyJump) }, "Jump")
            ),
            span(css`text-xs text-slate-400`, domRowsLabel)
        ),
        div(css`mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3`,
            span(css`${LABEL}`, "Rows per page"),
            ...PAGE_SIZES.map(size => chip(
                String(size),
                () => pageSize.value === size,
                () => deferHeavy("rows per page", () => pageSize.setState(size))
            ))
        )
    );
}

function StatsPanel() {
    return section(css`${PANEL}`,
        div(css`flex flex-wrap items-center justify-between gap-2`,
            div(css`${LABEL}`, "Metrics by category"),
            div(css`flex flex-wrap items-center gap-2`,
                button(css`${BTN}`, { onclick: () => deferHeavy("bulk update", bumpAllScores) }, "Bump every score (+1)"),
                button(css`${BTN}`, { onclick: pulseStrings }, "Pulse strings"),
                button(css`${BTN}`, { onclick: resetMetrics }, "Reset metrics")
            )
        ),
        // Context: what is loaded and rendered right now.
        cardGroup("Dataset & DOM", [
            statCard("Rows loaded", totalLabel, computed(() => `build ${msLabel(stats.buildMs.value)}`)),
            statCard("Rows after filter", filteredLabel, computed(() => `${numberFormat(pageCount.value)} pages · ${numberFormat(pageSize.value)}/page`)),
            statCard("Rows in DOM", computed(() => numberFormat(stats.domRows.value)), computed(() => `first render ${msLabel(stats.loadMs.value)}`)),
            statCard("Selection", selectionLabel, "click a row to toggle"),
            statCard("JS heap", heapLabel, "Chrome only")
        ]),
        // Results of the manual, button-triggered tests in this panel and in
        // the grid's pagination bar — each card is written by its button.
        cardGroup("Button test results", [
            statCard("Last page change", lastMsLabel, computed(() => `${numberFormat(stats.changes.value)} samples`)),
            statCard("Average page change", avgMsLabel, computed(() => `min ${msLabel(stats.minMs.value)}`)),
            statCard("p95 / max", computed(() => `${msLabel(stats.p95Ms.value)} / ${msLabel(stats.maxMs.value)}`), computed(() => `mount ${msLabel(stats.mountMs.value)}`)),
            statCard("Single row update", updateMsLabel, "row state write → DOM"),
            statCard("Batch all rows", bulkMsLabel, "one state write per row"),
            statCard("Reactive string", stringMsLabel, computed(() => `one write → ${numberFormat(stats.domRows.value)} row strings`))
        ]),
        // Paint-aware scheduling: the chips and buttons above run their heavy
        // write through defer(), so these cards time the deferral itself.
        cardGroup("Deferred tasks (defer)", [
            statCard("Indicator", computed(() => isBusy.value ? "on — task pending" : "off"), "loadingState signal"),
            statCard("Paint gap", computed(() => msLabel(stats.deferMs.value)), "click → task start"),
            statCard("Deferred tasks", computed(() => numberFormat(stats.deferOps.value)), computed(() => `last: ${stats.deferLabel.value}`)),
            statCard("Last task", computed(() => stats.deferLabel.value), "label passed to defer()")
        ])
    );
}

function SweepPanel() {
    return section(css`${PANEL}`,
        div(css`flex flex-wrap items-center justify-between gap-2`,
            div(
                div(css`${LABEL}`, "Full sweep benchmark"),
                p(css`mt-1 text-xs text-slate-400`,
                    "Visits every page of the current filter and times each render — the worst case for the keyed reconciler."
                )
            ),
            div(css`flex flex-wrap items-center gap-2`,
                button(css`${BTN}`, { disabled: sweep.running, onclick: () => runSweep(1) }, "Sweep ×1"),
                button(css`${BTN}`, { disabled: sweep.running, onclick: () => runSweep(3) }, "Sweep ×3"),
                button(css`${BTN}`, { disabled: computed(() => !sweep.running.value), onclick: () => { sweepAbort.value = true; } }, "Abort")
            )
        ),
        div(css`mt-3 h-2 overflow-hidden rounded-full bg-slate-800`,
            div(css`h-2 rounded-full bg-emerald-400`, { style: { width: () => `${sweep.progress.value}%` } },)
        ),
        // Results of the automated sweep benchmark — kept apart from the
        // button-driven cards above so each category reads on its own.
        cardGroup("Sweep results", [
            statCard("Progress", computed(() => `${sweep.progress.value}%`), computed(() => `${numberFormat(sweep.pages.value)} page changes`)),
            statCard("Wall time", computed(() => `${Math.round(sweep.totalMs.value)} ms`), computed(() => `${sweep.rounds.value} round(s)`)),
            statCard("Average", computed(() => msLabel(sweep.avgMs.value))),
            statCard("p95 / max", computed(() => `${msLabel(sweep.p95Ms.value)} / ${msLabel(sweep.maxMs.value)}`)),
            statCard("Pages / second", computed(() => sweep.pps.value ? numberFormat(sweep.pps.value) : "—"))
        ], "sm:grid-cols-2 lg:grid-cols-5")
    );
}

function Footer() {
    return footer(css`flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px] text-slate-500`,
        small("Reactive pieces: stateOf · computed · effect · listOf · keyed loop · tagged templates — see the Jetz README for the full API."),
        small("Open DevTools ▸ Performance while sweeping to see layout/paint cost per page.")
    );
}

function App() {
    return main(css`mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6`,
        Header(),
        Toolbar(),
        StatsPanel(),
        Grid(),
        PaginationBar(),
        SweepPanel(),
        Footer()
    );
}
App.displayName = "StressTestApp";

/* -------------------------------------------------------------------------- */
/* 7. Styles & mount                                                           */
/* -------------------------------------------------------------------------- */

// Tailwind handles the look; this only adds the scrollbar polish for the grid.
Jetz.style(`
    #grid-body tr:last-child { border-bottom: 0; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(143, 168, 185, 0.35); border-radius: 9999px; }
`);

const mountStart = performance.now();
Jetz.use(new JetzDevtools());
Jetz.mount(App, "#app");
stats.mountMs.value = +(performance.now() - mountStart).toFixed(2);

// Run the pipeline after the table is attached so its first list update renders
// directly into the mounted grid.
const initialRenderStart = performance.now();
startPipeline();
stats.loadMs.value = +(performance.now() - initialRenderStart).toFixed(2);
refreshDomStats();

console.table({
    dataset: datasetSize.getValue(),
    "rows per page": pageSize.getValue(),
    pages: pageCount.getValue(),
    "rows in DOM": stats.domRows.getValue(),
    "dataset build (ms)": stats.buildMs.getValue(),
    "first render (ms)": stats.loadMs.getValue(),
    "mount (ms)": stats.mountMs.getValue()
});
