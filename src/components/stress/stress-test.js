/**
 * Jetz stress test — interactive table grid with pagination.
 *
 * Loads thousands of rows into a reactive `<table>`, renders one page at a time
 * with `loop(list, keyFn, renderFn)` keyed reconciliation, and measures every
 * render so the cost of pagination, sorting, filtering and per-row updates is
 * visible instead of guessed.
 *
 * Conventions follow the Jetz README: `stateOf` / `computed` / `effect` for
 * reactive state, `listOf` + keyed `loop` for collections, `css()` for reactive
 * classes and Tailwind utility classes for styling.
 *
 * Run it with any static server that serves the project root, e.g.
 *   npx serve .        (then open http://localhost:3000)
 * Tailwind is loaded from node_modules (browser build), so no CSS build step.
 */
import {
    Jetz, batch, computed, effect, ifElse, listOf, loop, rawOf, rowOf, stateOf, touchRow
} from "../../lib/jetz.js";
import {
    button, css, div, footer, h1, header, inputCheckbox, inputNumber, inputText,
    label, main, p, section, small, span, strong, table, tbody, td, th, thead, tr
} from "../../lib/jetz-ui.js";

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
    { key: null, label: "Actions", align: "text-right" }
];
/** Columns that are not sortable (email has thousands of near-duplicate values). */
const NOT_SORTABLE = new Set(["email", null]);

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
 * Builds one row. Text columns are plain (immutable) values while the columns
 * users mutate are `stateOf` so a click updates only the cells bound to them.
 * Derived values (scoreLabel / statusClass / rowClass) are intentionally NOT
 * created here: they are built JIT inside `RowView`, so only the rows actually
 * in the DOM hold computed subscriptions and off-screen rows stay cheap
 * plain objects + 4 states. Destroyed pages are then GC-able by V8.
 */
function createRow(id, rnd) {
    const first = FIRST_NAMES[(rnd() * FIRST_NAMES.length) | 0];
    const last = LAST_NAMES[(rnd() * LAST_NAMES.length) | 0];
    return {
        id,
        idLabel: id.toLocaleString("en-US"),
        name: `${first} ${last}`,
        email: `${first}.${last}${id}@jetz.dev`.toLowerCase(),
        department: DEPARTMENTS[(rnd() * DEPARTMENTS.length) | 0],
        region: REGIONS[(rnd() * REGIONS.length) | 0],
        score: stateOf((rnd() * 100000) | 0),
        visits: stateOf(1 + ((rnd() * 999) | 0)),
        status: stateOf(STATUSES[(rnd() * STATUSES.length) | 0]),
        selected: stateOf(false)
    };
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
let dataset = [];

const query = stateOf("");
const statusFilter = stateOf("all");
const selectedOnly = stateOf(false);
const sortKey = stateOf("id");
const sortDir = stateOf("asc");
const page = stateOf(1);
const pageSize = stateOf(25);
const jumpText = stateOf("1");
const sizeInput = stateOf(String(DEFAULT_DATASET_SIZE));

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
    domRows: 0,   // <tr> currently attached to the tbody
    heapMb: 0
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

/** Sort comparators. Values are read through `.value` so sorting stays reactive. */
const COMPARATORS = {
    id: (a, b) => a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
    department: (a, b) => a.department.localeCompare(b.department),
    region: (a, b) => a.region.localeCompare(b.region),
    score: (a, b) => a.score.value - b.score.value,
    visits: (a, b) => a.visits.value - b.visits.value,
    status: (a, b) => a.status.value.localeCompare(b.status.value)
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

    dataset = rows;
    timings.length = 0;
    stats.buildMs.value = +buildMs.toFixed(2);
    stats.lastMs.value = 0;
    stats.updateMs.value = 0;
    stats.bulkMs.value = 0;
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
loadDataset(DEFAULT_DATASET_SIZE);

/** Signature of the filter/sort inputs: changing it sends the grid back to page 1. */
let lastFilterSignature = "";

/**
 * The single reactive pipeline: filter -> sort -> slice -> `rows.set()`.
 *
 * Dependencies are read dynamically: per-row states are only touched when the
 * matching filter/sort is active, so an unused column never re-runs the pass,
 * while a status change under an active status filter re-runs it immediately.
 */
effect(() => {
    dataVersion.value;
    const needle = query.value.trim().toLowerCase();
    const status = statusFilter.value;
    const onlySelected = selectedOnly.value;
    const key = sortKey.value;
    const descending = sortDir.value === "desc";
    const size = pageSize.value;

    const signature = [dataVersion.getValue(), needle, status, onlySelected, key, descending, size].join("|");
    const requestedPage = page.value;                        // tracked: page changes re-run the pipeline
    let wantedPage = requestedPage;
    if (signature !== lastFilterSignature) {
        lastFilterSignature = signature;
        wantedPage = 1;
        if (requestedPage !== 1) page.setState(1);
    }

    const filtered = [];
    for (const row of dataset) {
        if (onlySelected && !row.selected.value) continue;
        if (status !== "all" && row.status.value !== status) continue;
        if (needle && !(
            row.name.toLowerCase().includes(needle) ||
            row.email.includes(needle) ||
            row.department.toLowerCase().includes(needle) ||
            row.region.toLowerCase().includes(needle)
        )) continue;
        filtered.push(row);
    }
    const compare = COMPARATORS[key] ?? COMPARATORS.id;
    filtered.sort(descending ? (a, b) => compare(b, a) : compare);

    // Publish the scalars, then hand the page slice to the keyed list.
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.max(1, Math.min(pages, wantedPage));
    const start = (current - 1) * size;
    const slice = filtered.slice(start, start + size);

    filteredCount.value = total;
    pageCount.value = pages;
    visiblePage.value = current;
    rowsOnPage.value = slice.length;
    rangeStart.value = total === 0 ? 0 : start + 1;
    rangeEnd.value = Math.min(total, start + size);
    if (jumpText.getValue() !== String(current)) jumpText.setState(String(current));

    rows.set(slice);
    refreshDomStats();
});

const selectedCount = computed(() => {
    dataVersion.value;
    let count = 0;
    for (const row of dataset) if (row.selected.value) count++;
    return count;
});

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

/** Fine-grained update: only the cells bound to `row.score` are touched. */
function bumpRow(row) {
    const startedAt = performance.now();
    row.score.value += 1;
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

function cycleStatus(row) {
    const startedAt = performance.now();
    const next = (STATUSES.indexOf(row.status.value) + 1) % STATUSES.length;
    row.status.value = STATUSES[next];
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

function toggleRow(row) {
    const startedAt = performance.now();
    row.selected.value = !row.selected.value;
    stats.updateMs.value = +(performance.now() - startedAt).toFixed(2);
}

/** One state write per row, flushed as a single batch. */
function bumpAllScores() {
    const startedAt = performance.now();
    batch(() => {
        for (const row of dataset) row.score.value += 1;
    });
    stats.bulkMs.value = +(performance.now() - startedAt).toFixed(2);
}

function clearSelection() {
    if (selectedCount.getValue() === 0) return;
    const startedAt = performance.now();
    batch(() => {
        for (const row of dataset) if (row.selected.value) row.selected.value = false;
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
            span(css`rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 ring-1 ring-inset ring-white/10`, selectionLabel)
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
                        () => loadDataset(size)
                    ))
                ),
                div(css`mt-3 flex items-center gap-2`,
                    label(css`text-xs text-slate-400`, "Custom size"),
                    inputNumber(css`${INPUT} w-28`, { min: 1, bind: sizeInput }),
                    button(css`${BTN}`, { onclick: () => loadDataset(Number.parseInt(sizeInput.getValue(), 10)) }, "Load")
                )
            ),
            div(
                div(css`${LABEL}`, "Filter"),
                div(css`${CHIP_ROW} mt-2`,
                    chip("All statuses", () => statusFilter.value === "all", () => statusFilter.setState("all")),
                    ...STATUSES.map(status => chip(
                        status,
                        () => statusFilter.value === status,
                        () => statusFilter.setState(status)
                    ))
                ),
                div(css`mt-3 flex items-center gap-2`,
                    inputText(css`${INPUT} w-full`, { bind: query, placeholder: "Search name, email, department, region…" }),
                    button(css`${BTN}`, { onclick: () => query.setState("") }, "Clear")
                ),
                div(css`mt-3 flex flex-wrap items-center gap-3`,
                    label(css`flex items-center gap-2 text-xs text-slate-400`,
                        inputCheckbox(css`size-3.5 accent-emerald-400`, { bind: selectedOnly },),
                        "Selected rows only"
                    ),
                    button(css`${BTN}`, { onclick: clearSelection }, "Clear selection")
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
    if (sortable) attributes.onclick = () => toggleSort(column.key);
    return th(attributes, column.label, span(css`text-emerald-400`, indicator));
}

/**
 * One table row. Plain function, no `computed()` wrapper.
 *
 * Score/status/selection cells stay reactive because the mutable `State`
 * instances are passed straight through: text children subscribe via
 * `generateMutable()`, and `css(fn)` lifts a plain function into a derived
 * state internally (`#bindClassParts`). The plain derivation functions are
 * created per mounted row, so off-screen rows keep zero subscriptions and
 * destroyed pages are GC-able.
 */
function RowView(row) {
    return tr(
        css`cursor-pointer hover:bg-white/5`,
        css(() => row.selected.value
            ? "bg-sky-500/10 ring-1 ring-inset ring-sky-400/30"
            : ""),
        { onclick: () => toggleRow(row) },
        td(css`${CELL} text-right text-slate-500`, row.idLabel),
        td(css`${CELL} font-medium text-slate-100`, row.name),
        td(css`${CELL} text-slate-400`, row.email),
        td(css`${CELL} text-white`, row.department),
        td(css`${CELL} text-white`, row.region),
        td(css`${CELL} text-white text-right tabular-nums`, row.score),
        td(css`${CELL}`, span(
            css`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset`,
            css(() => STATUS_CLASSES[row.status.value]),
            row.status
        )),
        td(css`${CELL} text-right tabular-nums text-slate-300`, row.visits),
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
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value === 1), onclick: () => gotoPage(1) }, "« First"),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value === 1), onclick: () => gotoPage(visiblePage.value - 1) }, "‹ Prev"),
                span(css`px-2 text-xs font-medium text-slate-300`, pageLabel),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value >= pageCount.value), onclick: () => gotoPage(visiblePage.value + 1) }, "Next ›"),
                button(css`${BTN}`, { disabled: computed(() => visiblePage.value >= pageCount.value), onclick: () => gotoPage(pageCount.value) }, "Last »")
            ),
            div(css`flex items-center gap-2`,
                label(css`text-xs text-slate-400`, "Go to"),
                inputNumber(css`${INPUT} w-24`, { bind: jumpText, onkeydown: event => { if (event.key === "Enter") applyJump(); } },),
                button(css`${BTN}`, { onclick: applyJump }, "Jump")
            ),
            span(css`text-xs text-slate-400`, domRowsLabel)
        ),
        div(css`mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3`,
            span(css`${LABEL}`, "Rows per page"),
            ...PAGE_SIZES.map(size => chip(
                String(size),
                () => pageSize.value === size,
                () => pageSize.setState(size)
            ))
        )
    );
}

function StatsPanel() {
    return section(css`${PANEL}`,
        div(css`flex flex-wrap items-center justify-between gap-2`,
            div(css`${LABEL}`, "Render metrics"),
            div(css`flex flex-wrap items-center gap-2`,
                button(css`${BTN}`, { onclick: bumpAllScores }, "Bump every score (+1)"),
                button(css`${BTN}`, { onclick: resetMetrics }, "Reset metrics")
            )
        ),
        div(css`mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5`,
            statCard("Rows loaded", totalLabel, computed(() => `build ${msLabel(stats.buildMs.value)}`)),
            statCard("Rows after filter", filteredLabel, computed(() => `${numberFormat(pageCount.value)} pages · ${numberFormat(pageSize.value)}/page`)),
            statCard("Rows in DOM", computed(() => numberFormat(stats.domRows.value)), computed(() => `first render ${msLabel(stats.loadMs.value)}`)),
            statCard("Last page change", lastMsLabel, computed(() => `${numberFormat(stats.changes.value)} samples`)),
            statCard("Average page change", avgMsLabel, computed(() => `min ${msLabel(stats.minMs.value)}`)),
            statCard("p95 / max", computed(() => `${msLabel(stats.p95Ms.value)} / ${msLabel(stats.maxMs.value)}`), computed(() => `mount ${msLabel(stats.mountMs.value)}`)),
            statCard("Single row update", updateMsLabel, "row state write → DOM"),
            statCard("Batch all rows", bulkMsLabel, "one state write per row"),
            statCard("Selection", selectionLabel, "click a row to toggle"),
            statCard("JS heap", heapLabel, "Chrome only")
        )
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
        div(css`mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5`,
            statCard("Progress", computed(() => `${sweep.progress.value}%`), computed(() => `${numberFormat(sweep.pages.value)} page changes`)),
            statCard("Wall time", computed(() => `${Math.round(sweep.totalMs.value)} ms`), computed(() => `${sweep.rounds.value} round(s)`)),
            statCard("Average", computed(() => msLabel(sweep.avgMs.value))),
            statCard("p95 / max", computed(() => `${msLabel(sweep.p95Ms.value)} / ${msLabel(sweep.maxMs.value)}`)),
            statCard("Pages / second", computed(() => sweep.pps.value ? numberFormat(sweep.pps.value) : "—"))
        )
    );
}

function Footer() {
    return footer(css`flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px] text-slate-500`,
        small("Reactive pieces: stateOf · computed · effect · listOf · keyed loop — see the Jetz README for the full API."),
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

/* -------------------------------------------------------------------------- */
/* 7. Styles & mount                                                           */
/* -------------------------------------------------------------------------- */

// Tailwind handles the look; this only adds the scrollbar polish for the grid.
Jetz.style(`
    #grid-body tr:last-child { border-bottom: 0; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 9999px; }
`);

const mountStart = performance.now();
Jetz.mount(App, "#app");
stats.mountMs.value = +(performance.now() - mountStart).toFixed(2);

// `loadDataset()` ran before the table existed, so re-run the pipeline once
// against the mounted DOM to measure a real first render.
const initialRenderStart = performance.now();
dataVersion.value++;
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
