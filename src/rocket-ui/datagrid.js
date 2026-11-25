/**
 * jetz-datagrid.js — A full-featured, reactive DataGrid for Jetz (Telerik/Kendo style).
 *
 * Depends on: jetz.js, jetz-ui.js, base-ui.js
 *
 * ┌─ MAIN CONTROLS ────────────────────────────────────────────────────────────┐
 * │ sorting (single / multi), column filter row (operators per type), search,  │
 * │ paging + page-size, selection (row / checkbox / ctrl / shift), grouping    │
 * │ (+aggregates), CRUD (inline row or popup form), toolbar, export CSV        │
 * ├─ ADDITIONAL CONTROLS ──────────────────────────────────────────────────────┤
 * │ column resize, reorder (drag), show/hide chooser, column menu, group panel │
 * │ (drag headers), detail rows, custom cell templates, footer aggregates,     │
 * │ keyboard navigation, auto-refresh, persisted layout (stateKey), messages   │
 * ├─ DATA ─────────────────────────────────────────────────────────────────────┤
 * │ data: Array | State<Array>     → fully reactive (client-side operations)   │
 * │ dataSource: RestDataSource     → REST read/create/update/destroy, server   │
 * │                                  or client paging/sorting/filtering,       │
 * │                                  abort of stale requests, debounce, retry  │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * Minimal use
 * ─────────────────────────────────────────────────────────────────────────────
 *   const grid = DataGrid.new({
 *     columns: [
 *       { field: 'id',    title: 'ID',    type: 'number', width: 70 },
 *       { field: 'name',  title: 'Name' },
 *       { field: 'price', title: 'Price', type: 'number', aggregate: 'sum',
 *         format: { style: 'currency', currency: 'USD' } },
 *     ],
 *     dataSource: new RestDataSource({ url: '/api/products' }),
 *     pageSize: 10, selectable: 'multiple', editable: 'inline', groupable: true,
 *   });
 *   div(grid)                // use as any child; or DataGrid.mount('#app', {...})
 *   grid.refresh(); grid.sortBy('name', 'asc'); grid.selectedRows();
 *
 * Reactive local data
 * ─────────────────────────────────────────────────────────────────────────────
 *   const items = cell([...]);                      // from base-ui.js (or any State)
 *   DataGrid.new({ columns, data: items });
 *   items.value = [...items.value, newRow];         // grid re-renders
 *
 * Framework notes
 *  - Row views are keyed; one cached item object per row keeps DOM stable.
 *  - A State holding an array must be replaced (immutable update) to be noticed,
 *    or call grid.touch() after mutating in place.
 *  - Grouping works on the rows the grid holds (whole data set for client
 *    paging, current page for server paging).
 *  - No virtual scrolling: use paging (the grid scrolls vertically via `height`).
 */

import { State, batch, flatMap, listOf } from '../lib/jetz.js';
import { BaseUI, cell, cx, isPlain, isState, peek, unwrap } from './rocket-base.js';
import { button, div, input, label, option, select, span } from '../lib/jetz-ui.js';

/* ══════════════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════════════ */

const isEmpty = (v) => v === null || v === undefined || v === '';
const kids = (...a) => flatMap(a).filter((x) => x !== null && x !== undefined && x !== false);
const getPath = (o, p) => (typeof p === 'string' && p.includes('.') ? p.split('.').reduce((a, k) => a?.[k], o) : o?.[p]);
const humanize = (s) => String(s ?? '').replace(/[_.]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

function setPath(o, p, v) {
    if (!p.includes('.')) return void (o[p] = v);
    const parts = p.split('.');
    const last = parts.pop();
    let t = o;
    for (const k of parts) t = t[k] = isPlain(t[k]) ? { ...t[k] } : {};
    t[last] = v;
}

const dayKey = (v) => {
    if (v instanceof Date) return isNaN(v) ? '' : v.toISOString().slice(0, 10);
    if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
    return String(v ?? '').slice(0, 10);
};

const OPS = {
    string: ['contains', 'notContains', 'startsWith', 'endsWith', 'eq', 'neq', 'isEmpty', 'isNotEmpty'],
    number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
    date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
    boolean: ['eq'],
};
const defaultOp = (col) => col.filterOp ?? (col.options ? 'eq' : col.type === 'string' ? 'contains' : 'eq');

const MSG = {
    noRecords: 'No records available',
    search: 'Search…',
    add: '+ Add new',
    refresh: '↻ Refresh',
    columns: 'Columns ▾',
    export: 'Export CSV',
    clearFilters: 'Clear filters',
    deleteSelected: 'Delete selected',
    edit: 'Edit',
    delete: 'Delete',
    update: 'Update',
    insert: 'Insert',
    cancel: 'Cancel',
    loading: 'Loading…',
    retry: 'Retry',
    groupHint: 'Drag a column header here to group by that column',
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    clearSort: 'Clear sort',
    groupBy: 'Group by this column',
    hide: 'Hide column',
    itemsPerPage: 'per page',
    page: 'Page',
    of: 'of',
    items: 'items',
    first: 'First page',
    prev: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    confirmDelete: 'Delete the selected record(s)?',
    selected: 'selected',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    addTitle: 'Add record',
    editTitle: 'Edit record',
    required: 'is required',
    ops: {
        contains: 'Contains', notContains: 'Does not contain', startsWith: 'Starts with', endsWith: 'Ends with',
        eq: 'Is equal to', neq: 'Is not equal to', gt: 'Greater than', gte: 'Greater or equal',
        lt: 'Less than', lte: 'Less or equal', isEmpty: 'Is empty', isNotEmpty: 'Is not empty',
    },
};

function matches(raw, type, op, val) {
    if (op === 'isEmpty') return isEmpty(raw);
    if (op === 'isNotEmpty') return !isEmpty(raw);
    if (isEmpty(val)) return true;
    const cmp = (a, b) => {
        switch (op) {
            case 'eq': return a === b;
            case 'neq': return a !== b;
            case 'gt': return a > b;
            case 'gte': return a >= b;
            case 'lt': return a < b;
            case 'lte': return a <= b;
            default: return true;
        }
    };
    if (type === 'boolean') return cmp(String(Boolean(raw)), String(val));
    if (type === 'number') {
        const b = Number(val);
        if (Number.isNaN(b)) return true;
        return isEmpty(raw) ? op === 'neq' : cmp(Number(raw), b);
    }
    if (type === 'date') return isEmpty(raw) ? op === 'neq' : cmp(dayKey(raw), dayKey(val));
    const a = String(raw ?? '').toLowerCase();
    const b = String(val).toLowerCase();
    switch (op) {
        case 'contains': return a.includes(b);
        case 'notContains': return !a.includes(b);
        case 'startsWith': return a.startsWith(b);
        case 'endsWith': return a.endsWith(b);
        default: return cmp(a, b);
    }
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function compareValues(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a instanceof Date && b instanceof Date) return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return collator.compare(String(a), String(b));
}

const fmtCache = new WeakMap();
function formatValue(col, v, row, msg = MSG) {
    if (typeof col.format === 'function') return col.format(v, row);
    if (isEmpty(v)) return '';
    if (col.type === 'boolean') return v ? msg.yes : msg.no;
    if (col.type === 'number') {
        const n = Number(v);
        if (Number.isNaN(n)) return String(v);
        let f = fmtCache.get(col);
        if (!f) fmtCache.set(col, (f = new Intl.NumberFormat(undefined, isPlain(col.format) ? col.format : { maximumFractionDigits: 20 })));
        return f.format(n);
    }
    if (col.type === 'date') {
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        let f = fmtCache.get(col);
        if (!f) fmtCache.set(col, (f = new Intl.DateTimeFormat(undefined, isPlain(col.format) ? col.format : { dateStyle: 'medium' })));
        return f.format(d);
    }
    return String(v);
}

const AGG_LABEL = { sum: 'Sum', avg: 'Avg', min: 'Min', max: 'Max', count: 'Count' };
const AGG = {
    sum: (n) => n.reduce((x, y) => x + y, 0),
    avg: (n) => (n.length ? n.reduce((x, y) => x + y, 0) / n.length : null),
    min: (n) => (n.length ? Math.min(...n) : null),
    max: (n) => (n.length ? Math.max(...n) : null),
    count: (n) => n.length,
};
function computeAggregates(rows, cols, valueOf) {
    const out = {};
    for (const c of cols) {
        const vals = rows.map((r) => valueOf(c, r)).filter((v) => !isEmpty(v));
        if (typeof c.aggregate === 'function') { out[c.field] = c.aggregate(vals); continue; }
        const nums = c.aggregate === 'count' ? vals : vals.map(Number).filter((n) => !Number.isNaN(n));
        out[c.field] = AGG[c.aggregate]?.(nums) ?? null;
    }
    return out;
}

function pagesWindow(page, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const out = [1];
    const s = Math.max(2, page - 1);
    const e = Math.min(pages - 1, page + 1);
    if (s > 2) out.push('…');
    for (let i = s; i <= e; i++) out.push(i);
    if (e < pages - 1) out.push('…');
    out.push(pages);
    return out;
}

const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ══════════════════════════════════════════════════════════════════════════
 * RestDataSource
 * ══════════════════════════════════════════════════════════════════════════
 * new RestDataSource({
 *   url: '/api/products',                // or (state) => url
 *   idField: 'id',
 *   headers: { Authorization: '...' } | () => ({...}),
 *   credentials: 'include',
 *   serverPaging / serverSorting / serverFiltering: true (default) | false,
 *   server: false,                       // shortcut: all three false → fetch once, work client-side
 *   query: (state, ds) => ({ ...query params }),   // state = {page,pageSize,sort,filters,search,params}
 *   parse: (json, response) => ({ data, total }),
 *   create/update/destroy: (row, ds) => ({ url, method, body })   // optional overrides
 *   updateMethod: 'PUT' | 'PATCH',
 *   fetch: customFetch,
 * })
 * RestDataSource.jsonServer('/posts')    // preset for json-server style APIs
 */
export class RestDataSource {
    constructor(opts = {}) {
        this.url = opts.url;
        this.idField = opts.idField ?? 'id';
        this.headers = opts.headers ?? {};
        this.credentials = opts.credentials;
        const all = opts.server ?? true;
        this.serverPaging = opts.serverPaging ?? all;
        this.serverSorting = opts.serverSorting ?? all;
        this.serverFiltering = opts.serverFiltering ?? all;
        this.query = opts.query ?? defaultQuery;
        this.parse = opts.parse ?? defaultParse;
        this.updateMethod = opts.updateMethod ?? 'PUT';
        this.endpoints = { create: opts.create, update: opts.update, destroy: opts.destroy };
        this.fetchImpl = opts.fetch ?? ((...a) => globalThis.fetch(...a));
    }

    static jsonServer(url, opts = {}) {
        return new RestDataSource({ url, query: jsonServerQuery, ...opts });
    }

    #baseUrl(state) {
        return typeof this.url === 'function' ? this.url(state) : this.url;
    }

    async #send(url, init = {}) {
        const extra = typeof this.headers === 'function' ? this.headers() : this.headers;
        const headers = { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...extra };
        const res = await this.fetchImpl(url, { credentials: this.credentials, ...init, headers });
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}${res.statusText ? ' ' + res.statusText : ''}`);
            err.status = res.status;
            err.response = res;
            throw err;
        }
        return res;
    }

    async read(state, { signal } = {}) {
        const url = new URL(this.#baseUrl(state), globalThis.location?.href);
        const params = this.query(state, this) ?? {};
        for (const [k, v] of Object.entries(params)) {
            if (v === null || v === undefined || v === '') continue;
            if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
            else url.searchParams.set(k, v);
        }
        const res = await this.#send(url, { method: 'GET', signal });
        const text = await res.text();
        const json = text ? JSON.parse(text) : [];
        const out = this.parse(json, res);
        return { data: Array.isArray(out.data) ? out.data : [], total: Number(out.total ?? out.data?.length ?? 0) };
    }

    #rowUrl(row) {
        const base = String(this.#baseUrl({})).replace(/\/+$/, '');
        return `${base}/${encodeURIComponent(getPath(row, this.idField))}`;
    }

    async #mutate(kind, row, defaults) {
        const custom = this.endpoints[kind]?.(row, this);
        const spec = { ...defaults, ...(custom ?? {}) };
        const body = spec.body === undefined ? undefined : typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body);
        const res = await this.#send(spec.url, { method: spec.method, body });
        const text = await res.text();
        try { return text ? JSON.parse(text) : row; } catch { return row; }
    }

    create(row) { return this.#mutate('create', row, { url: this.#baseUrl({}), method: 'POST', body: row }); }
    update(row) { return this.#mutate('update', row, { url: this.#rowUrl(row), method: this.updateMethod, body: row }); }
    destroy(row) { return this.#mutate('destroy', row, { url: this.#rowUrl(row), method: 'DELETE' }); }
}

function defaultQuery(s, ds) {
    const q = {};
    if (ds.serverPaging) { q.page = s.page; q.pageSize = s.pageSize; }
    if (ds.serverSorting && s.sort.length) q.sort = s.sort.map((x) => `${x.field}:${x.dir}`).join(',');
    if (ds.serverFiltering) {
        if (s.search) q.search = s.search;
        for (const f of s.filters) q[`filter[${f.field}][${f.op}]`] = f.value ?? '';
    }
    return { ...q, ...(s.params ?? {}) };
}

function jsonServerQuery(s, ds) {
    const q = {};
    if (ds.serverPaging) { q._page = s.page; q._limit = s.pageSize; }
    if (ds.serverSorting && s.sort.length) {
        q._sort = s.sort.map((x) => x.field).join(',');
        q._order = s.sort.map((x) => x.dir).join(',');
    }
    if (ds.serverFiltering) {
        if (s.search) q.q = s.search;
        const suffix = { eq: '', neq: '_ne', gt: '_gte', gte: '_gte', lt: '_lte', lte: '_lte', contains: '_like' };
        for (const f of s.filters) {
            if (f.op === 'startsWith') q[`${f.field}_like`] = `^${f.value}`;
            else if (f.op === 'endsWith') q[`${f.field}_like`] = `${f.value}$`;
            else if (f.op in suffix) q[`${f.field}${suffix[f.op]}`] = f.value;
        }
    }
    return { ...q, ...(s.params ?? {}) };
}

function defaultParse(json, res) {
    if (Array.isArray(json)) {
        const header = Number(res?.headers?.get?.('X-Total-Count'));
        return { data: json, total: Number.isFinite(header) && header > 0 ? header : json.length };
    }
    const data = json?.data ?? json?.items ?? json?.results ?? json?.rows ?? [];
    return { data, total: json?.total ?? json?.totalCount ?? json?.count ?? data.length };
}

/* ══════════════════════════════════════════════════════════════════════════
 * Styles (injected once; override with your own CSS or set DataGrid.injectStyles = false)
 * ══════════════════════════════════════════════════════════════════════════ */

const GRID_CSS = `
.jg{--jg-bg:#fff;--jg-fg:#1f2937;--jg-muted:#6b7280;--jg-border:#e5e7eb;--jg-head:#f3f4f6;--jg-hover:#f9fafb;--jg-sel:#dbeafe;--jg-accent:#2563eb;--jg-danger:#dc2626;--jg-radius:8px;
position:relative;display:flex;flex-direction:column;background:var(--jg-bg);color:var(--jg-fg);border:1px solid var(--jg-border);border-radius:var(--jg-radius);font:14px/1.4 system-ui,sans-serif}
.jg.jg-dark{--jg-bg:#111827;--jg-fg:#e5e7eb;--jg-muted:#9ca3af;--jg-border:#374151;--jg-head:#1f2937;--jg-hover:#1a2332;--jg-sel:#1e3a5f;--jg-accent:#60a5fa}
@media (prefers-color-scheme:dark){.jg:not(.jg-light){--jg-bg:#111827;--jg-fg:#e5e7eb;--jg-muted:#9ca3af;--jg-border:#374151;--jg-head:#1f2937;--jg-hover:#1a2332;--jg-sel:#1e3a5f;--jg-accent:#60a5fa}}
.jg *{box-sizing:border-box}
.jg-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--jg-border)}
.jg-spacer{flex:1}
.jg-btn{font:inherit;padding:5px 12px;border:1px solid var(--jg-border);background:var(--jg-bg);color:inherit;border-radius:6px;cursor:pointer}
.jg-btn:hover:not(:disabled){background:var(--jg-hover);border-color:var(--jg-accent)}
.jg-btn:disabled{opacity:.45;cursor:not-allowed}
.jg-btn.jg-primary{background:var(--jg-accent);border-color:var(--jg-accent);color:#fff}
.jg-btn.jg-danger{color:var(--jg-danger)}
.jg-btn.jg-sm{padding:2px 8px;font-size:12px}
.jg-btn.jg-icon{padding:0 6px;border:0;background:transparent;line-height:1.6}
.jg-btn.jg-on{background:var(--jg-sel)}
.jg-hidden{display:none!important}
.jg-input{font:inherit;color:inherit;background:var(--jg-bg);border:1px solid var(--jg-border);border-radius:6px;padding:4px 8px;min-width:0;width:100%}
.jg-input:focus{outline:2px solid var(--jg-accent);outline-offset:-1px}
.jg-input.jg-invalid{border-color:var(--jg-danger)}
.jg-search{width:220px}
.jg-groupbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px;min-height:40px;border-bottom:1px dashed var(--jg-border);color:var(--jg-muted)}
.jg-groupbar.jg-over{background:var(--jg-sel)}
.jg-chip{display:inline-flex;gap:6px;align-items:center;padding:2px 4px 2px 10px;border-radius:999px;background:var(--jg-sel);color:var(--jg-fg)}
.jg-errorbar{display:flex;gap:10px;align-items:center;padding:8px 12px;background:#fef2f2;color:var(--jg-danger);border-bottom:1px solid var(--jg-border)}
.jg-scroll{overflow:auto;position:relative;flex:1;outline:none}
.jg-inner{min-width:var(--jg-min,0)}
.jg-sticky{position:sticky;top:0;z-index:3;background:var(--jg-head)}
.jg-row{display:grid;grid-template-columns:var(--jg-cols,none);min-width:var(--jg-min,0);align-items:stretch}
.jg-cell{padding:8px 10px;border-bottom:1px solid var(--jg-border);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;display:var(--jg-d, block)}
.jg-cell.jg-align-right{text-align:right}.jg-cell.jg-align-center{text-align:center}
.jg-sys{display:flex;align-items:center;justify-content:center;padding:4px}
.jg-head .jg-cell{position:relative;font-weight:600;user-select:none;background:var(--jg-head);display:flex;align-items:center;gap:4px;overflow:visible}
.jg-head .jg-title{flex:1;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.jg-head .jg-sort{color:var(--jg-accent);font-size:11px}
.jg-resizer{position:absolute;right:0;top:0;bottom:0;width:6px;cursor:col-resize}
.jg-resizer:hover{background:var(--jg-accent);opacity:.5}
.jg-filters .jg-cell{display:flex;gap:3px;padding:4px;background:var(--jg-head)}
.jg-filters .jg-op{width:34px;flex:none;padding:4px 0}
.jg-rowwrap:nth-child(even) .jg-row:not(.jg-editing){background:color-mix(in srgb,var(--jg-hover) 70%,transparent)}
.jg-body .jg-row:hover{background:var(--jg-hover)}
.jg-row.jg-selected{background:var(--jg-sel)!important}
.jg-row.jg-active{box-shadow:inset 3px 0 var(--jg-accent)}
.jg-row.jg-editing{background:var(--jg-hover)}
.jg-row.jg-editing .jg-cell{overflow:visible;padding:4px}
.jg-cmd{display:flex;gap:4px;justify-content:flex-end;overflow:visible}
.jg-group-row{padding:6px 10px;background:var(--jg-head);border-bottom:1px solid var(--jg-border);font-weight:600;cursor:pointer;display:flex;gap:8px;align-items:baseline}
.jg-gcount,.jg-gagg{color:var(--jg-muted);font-weight:400;font-size:12px}
.jg-detail{padding:12px 16px;border-bottom:1px solid var(--jg-border);background:var(--jg-hover)}
.jg-foot .jg-cell{font-weight:600;background:var(--jg-head);border-top:2px solid var(--jg-border)}
.jg-empty{padding:32px;text-align:center;color:var(--jg-muted)}
.jg-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:color-mix(in srgb,var(--jg-bg) 65%,transparent);z-index:5;font-weight:600}
.jg-loading.jg-on{display:flex}
.jg-pager{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;border-top:1px solid var(--jg-border)}
.jg-pager .jg-btn{min-width:30px}
.jg-pager .jg-info{margin-left:auto;color:var(--jg-muted)}
.jg-pager select{width:auto}
.jg-pages{display:inline-flex;gap:4px}
.jg-dd{position:relative;display:inline-block}
.jg-menu{position:fixed;z-index:1000;min-width:200px;max-height:320px;overflow:auto;background:var(--jg-bg);border:1px solid var(--jg-border);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.18);font-weight:400}
.jg-menu-item{display:flex;gap:8px;align-items:center;width:100%;padding:6px 10px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:4px}
.jg-menu-item:hover{background:var(--jg-hover)}
.jg-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:2000}
.jg-dialog{background:var(--jg-bg);color:var(--jg-fg);border-radius:12px;min-width:340px;max-width:92vw;max-height:90vh;overflow:auto;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.jg-dialog-title{padding:14px 18px;font-weight:600;border-bottom:1px solid var(--jg-border)}
.jg-dialog-body{padding:14px 18px;display:grid;gap:10px}
.jg-field{display:grid;gap:4px}.jg-field>label{font-size:12px;color:var(--jg-muted)}
.jg-dialog-foot{display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:12px 18px;border-top:1px solid var(--jg-border)}
.jg-formerr{color:var(--jg-danger);margin-right:auto;font-size:13px}
.jg-error{padding:12px;color:var(--jg-danger)}
`;

function ensureStyles() {
    if (typeof document === 'undefined' || document.getElementById('jg-styles')) return;
    const el = document.createElement('style');
    el.id = 'jg-styles';
    el.textContent = GRID_CSS;
    document.head.append(el);
}

let autoKeyCounter = 0;

/* ══════════════════════════════════════════════════════════════════════════
 * DataGrid
 * ══════════════════════════════════════════════════════════════════════════ */

export class DataGrid extends BaseUI {
    static baseClass = 'jg';
    static injectStyles = true;

    /**
     * Props
     * ─────
     * columns*        [{ field, title, type:'string'|'number'|'date'|'boolean', width, minWidth,
     *                    hidden, sortable, filterable, groupable, resizable, editable, required,
     *                    align, class, format(fn | Intl options), template(row, ctx), headerTemplate,
     *                    footerTemplate(aggregates), aggregate:'sum'|'avg'|'min'|'max'|'count'|fn,
     *                    options:[{value,text}], editor:'text'|'number'|'date'|'checkbox'|fn,
     *                    validate(value,row)→string|undefined, value(row), sortCompare(a,b), filterOp }]
     * data            Array | State<Array>              client data (reactive)
     * dataSource      RestDataSource | {url,...} | {read(),...}
     * params          object | State | () => object     extra request params (reactive → reload)
     * idField         'id'
     * pageable, pageSize, pageSizes
     * sortable        true | false | 'multiple'          sort                [{field,dir}] initial
     * filterable      true                               filter row
     * searchable      true                               toolbar search box
     * groupable       false                              group panel;       group ['field'] initial
     * selectable      false | 'single' | 'multiple' | true
     * checkboxColumn  default: selectable==='multiple'
     * editable        false | true|'inline' | 'popup';   commands default ['edit','destroy']
     * toolbar         array of 'add'|'refresh'|'search'|'clearFilters'|'columns'|'export'|
     *                 'deleteSelected'|'spacer'| {text,onClick,icon,disabled} | (grid)=>element ; false hides
     * detail          (row, grid) => element             expandable detail row
     * rowClass        (row) => string
     * height          '420px' (enables vertical scroll with sticky header)
     * columnMenu, resizable, reorderable, columnChooser, exportable    (default true)
     * autoRefresh     ms (polling for dataSource)
     * debounce        ms for typing filters/search → server (default 300)
     * stateKey        persist layout/sort/filter/group in localStorage
     * dark            force dark theme; messages: override texts
     * confirm         (rows)=>boolean|Promise — before delete; beforeSave(row,isNew)
     * Events (callback props / DOM 'ui:<name>'): onSort onFilter onPage onGroup onSelectionChange
     *   onRowClick onRowDblClick onDataLoaded onError onColumnResize onColumnReorder
     *   onColumnToggle onEdit onSave onCancel onDelete onReady
     */
    static propTypes = {
        columns: { type: Array, required: true },
        data: [Array, Object],
        dataSource: Object,
        params: [Object, Function],
        idField: String,
        pageable: { type: Boolean, default: true },
        pageSize: { type: Number, default: 10 },
        pageSizes: { type: Array, default: () => [5, 10, 20, 50, 100] },
        sortable: { type: [Boolean, String], default: true },
        sort: Array,
        filterable: { type: Boolean, default: true },
        searchable: { type: Boolean, default: true },
        groupable: { type: Boolean, default: false },
        group: Array,
        selectable: { type: [Boolean, String], default: false },
        checkboxColumn: Boolean,
        editable: { type: [Boolean, String], default: false },
        commands: Array,
        toolbar: [Array, Boolean],
        detail: Function,
        rowClass: Function,
        height: String,
        columnMenu: { type: Boolean, default: true },
        resizable: { type: Boolean, default: true },
        reorderable: { type: Boolean, default: true },
        columnChooser: { type: Boolean, default: true },
        exportable: { type: Boolean, default: true },
        autoRefresh: Number,
        debounce: { type: Number, default: 300 },
        stateKey: String,
        dark: Boolean,
        messages: Object,
        confirm: Function,
        beforeSave: Function,
        newRowDefaults: [Object, Function],
        exportName: { type: String, default: 'export.csv' },
    };

    static variants = null;

    /* private instance fields */
    #itemCache = new WeakMap();
    #autoKeys = new WeakMap();
    #pageRows = new Map();
    #groupKeys = [];
    #reqId = 0;
    #abort = null;
    #timer = null;
    #loadedKey = null;
    #lastTyped = null;
    #dragField = null;
    #anchor = null;

    /* ───────────────────────── setup ───────────────────────── */

    /**
     * State, columns and data source are created in the constructor, so the
     * control API (refresh(), sortBy(), select(), load() ...) works as soon as the
     * grid exists, even before it is rendered. Idempotent.
     */
    constructor(props, ...children) {
        super(props, ...children);
        this.#prepare();
    }

    #prepare() {
        if (this.st) return;
        const p = this.props;
        this.msg = { ...MSG, ...(p.messages ?? {}), ops: { ...MSG.ops, ...(p.messages?.ops ?? {}) } };
        this.ds = this.#resolveDataSource();
        this.idField = p.idField ?? this.ds?.idField ?? 'id';
        this.#initCells();
        this.#initColumns();
        this.#restore();
        if (this.ds) this.#lastTyped = this.#serverKey().typed;
    }

    /** Render-time wiring: reactive pipeline, effects and document listeners. */
    setup() {
        if (DataGrid.injectStyles) ensureStyles();
        this.#prepare();
        this.#wire();

        this.on('document', 'click', (e) => {
            if (this.st.openMenu.peek() && !e.target.closest?.('.jg-dd')) this.#closeMenu();
        });
        this.on('document', 'scroll', () => this.st.openMenu.peek() && this.#closeMenu(), true);
        this.on('document', 'keydown', (e) => {
            if (e.key === 'Escape' && this.mode === 'popup' && this.st.editing.peek()) this.cancelEdit();
            else if (e.key === 'Escape' && this.st.openMenu.peek()) this.#closeMenu();
        });
    }

    #resolveDataSource() {
        const d = this.props.dataSource;
        if (!d) return null;
        return typeof d.read === 'function' ? d : new RestDataSource(d);
    }

    #initCells() {
        const p = this.props;
        const initialData = peek(p.data);
        this.st = {
            page: cell(1),
            pageSize: cell(p.pageSize),
            search: cell(''),
            sort: cell((p.sort ?? []).map((s) => ({ ...s }))),
            group: cell([...(p.group ?? [])]),
            collapsed: cell(new Set()),
            selected: cell(new Set()),
            expanded: cell(new Set()),
            active: cell(null),
            editing: cell(null),
            newRow: cell(null),
            openMenu: cell(null),
            loading: cell(false),
            saving: cell(false),
            error: cell(null),
            raw: cell([]),
            local: cell(Array.isArray(initialData) ? [...initialData] : []),
            version: cell(0),
            serverTotal: cell(0),
            view: cell({ items: [], count: 0, dataCount: 0, pages: 1, page: 1, pageSize: p.pageSize, aggregates: {}, exportRows: [] }),
        };
        this.selMap = new Map();
        this.rows = listOf();
    }

    #initColumns() {
        this.cols = this.props.columns.map((c, index) => {
            const hasField = !isEmpty(c.field);
            const type = c.type ?? 'string';
            const col = {
                sortable: hasField,
                filterable: hasField,
                groupable: hasField,
                resizable: true,
                editable: hasField,
                searchable: hasField,
                ...c,
                type,
                index,
                field: hasField ? c.field : `__col${index}`,
                title: c.title ?? humanize(c.field),
                align: c.align ?? (type === 'number' ? 'right' : 'left'),
                hasField,
            };
            if (!hasField) col.sortable = col.filterable = col.groupable = col.editable = col.searchable = false;
            col.visible = cell(!c.hidden);
            col.width = cell(c.width ?? null);
            col.fstate = { op: cell(defaultOp(col)), value: cell('') };
            return col;
        });
        this.colMap = Object.fromEntries(this.cols.map((c) => [c.field, c]));
        this.order = cell(this.cols.map((c) => c.field));

        const p = this.props;
        this.mode = p.editable === true ? 'inline' : p.editable || false;
        this.selMode = p.selectable === true || p.selectable === 'single' ? 'single' : p.selectable === 'multiple' ? 'multiple' : null;
        this.hasCheckbox = this.selMode === 'multiple' && p.checkboxColumn !== false;
        this.commands = p.commands ?? (this.mode ? ['edit', 'destroy'] : []);
        this.hasCmd = this.commands.length > 0;
    }

    /* ───────────────────────── reactive wiring ───────────────────────── */

    /**
     * Track `compute` (reads State) and run `apply` with the result OUTSIDE of
     * tracking, coalesced in a microtask. Rendering inside an effect would leak
     * its State reads into the effect and re-run it on every unrelated change.
     */
    #derive(compute, apply, { immediate = false } = {}) {
        let first = true;
        let scheduled = false;
        let latest;
        this.effect(() => {
            const value = compute();
            if (first) {
                first = false;
                latest = value;
                if (immediate) apply(value);
                return;
            }
            latest = value;
            if (scheduled) return;
            scheduled = true;
            queueMicrotask(() => {
                scheduled = false;
                if (!this.isDestroyed) apply(latest);
            });
        });
    }

    #wire() {
        const st = this.st;

        this.#derive(() => this.#compute(), (view) => this.#applyView(view), { immediate: true });

        // new filter / search / grouping → back to page 1
        this.#derive(
            () => JSON.stringify([this.#activeFilters().map((f) => [f.field, f.op, f.value]), st.search.value, st.group.value]),
            () => st.page.peek() !== 1 && st.page.setState(1),
        );

        if (this.ds) this.#derive(() => this.#serverKey(), (k) => this.#onServerKey(k));

        if (this.props.stateKey) {
            this.#derive(
                () => JSON.stringify(this.getState({ page: false })),
                (json) => {
                    try { localStorage.setItem(`jg:${this.props.stateKey}`, json); } catch { /* storage unavailable */ }
                },
            );
        }
    }

    #applyView(view) {
        this.#pageRows = new Map(view.items.filter((i) => i.type === 'row').map((i) => [i.key, i.row]));
        batch(() => {
            this.st.view.setState(view);
            this.rows.set(view.items);
        });
    }

    #getRows() {
        this.st.version.value;
        if (this.ds) return this.st.raw.value;
        const d = this.props.data;
        if (isState(d)) return d.value ?? [];
        return this.st.local.value;
    }

    #setRows(next) {
        if (this.ds) return this.st.raw.setState(next);
        const d = this.props.data;
        if (isState(d)) d.value = next;
        else this.st.local.setState(next);
    }

    #valueOf(col, row) {
        return col.value ? col.value(row) : getPath(row, col.field);
    }

    #keyOf(row) {
        const id = getPath(row, this.idField);
        if (!isEmpty(id)) return String(id);
        let k = this.#autoKeys.get(row);
        if (!k) this.#autoKeys.set(row, (k = `~${++autoKeyCounter}`));
        return k;
    }

    #activeFilters() {
        const out = [];
        for (const col of this.cols) {
            if (!col.hasField) continue;
            const op = col.fstate.op.value;
            const value = col.fstate.value.value;
            if (op === 'isEmpty' || op === 'isNotEmpty' || !isEmpty(value)) out.push({ field: col.field, op, value, type: col.type, col });
        }
        return out;
    }

    #extraParams() {
        const p = this.props.params;
        return (typeof p === 'function' ? p() : unwrap(p)) ?? {};
    }

    /* ───────────────────────── data pipeline ───────────────────────── */

    #sortRows(rows, spec) {
        const cmps = spec.map(({ field, dir }) => {
            const col = this.colMap[field];
            const base = col?.sortCompare ?? compareValues;
            const get = col ? (r) => this.#valueOf(col, r) : (r) => getPath(r, field);
            const sign = dir === 'desc' ? -1 : 1;
            return (a, b) => {
                const va = get(a);
                const vb = get(b);
                const ea = isEmpty(va);
                const eb = isEmpty(vb);
                if (ea || eb) return ea && eb ? 0 : ea ? 1 : -1; // empty values always last
                return sign * base(va, vb);
            };
        });
        return [...rows].sort((a, b) => {
            for (const c of cmps) {
                const r = c(a, b);
                if (r) return r;
            }
            return 0;
        });
    }

    #rowItem(row, level) {
        let item = this.#itemCache.get(row);
        if (!item || item.level !== level) {
            item = { type: 'row', key: this.#keyOf(row), row, level };
            this.#itemCache.set(row, item);
        }
        return item;
    }

    #flatten(rows, groups, collapsed, aggCols) {
        if (!groups.length) {
            this.#groupKeys = [];
            return rows.map((r) => this.#rowItem(r, 0));
        }
        const out = [];
        const allKeys = [];
        const build = (list, level, path, hidden) => {
            const field = groups[level];
            const col = this.colMap[field];
            const buckets = new Map();
            for (const r of list) {
                const raw = col ? this.#valueOf(col, r) : getPath(r, field);
                const k = String(raw ?? '');
                if (!buckets.has(k)) buckets.set(k, { raw, rows: [] });
                buckets.get(k).rows.push(r);
            }
            for (const [k, b] of buckets) {
                const key = `g:${path}/${level}:${k}`;
                allKeys.push(key);
                const isCollapsed = collapsed.has(key);
                if (!hidden) {
                    out.push({
                        type: 'group', key, level, field, col, value: b.raw, count: b.rows.length,
                        collapsed: isCollapsed, aggregates: aggCols.length ? computeAggregates(b.rows, aggCols, (c, r) => this.#valueOf(c, r)) : {},
                    });
                }
                if (level + 1 < groups.length) build(b.rows, level + 1, key, hidden || isCollapsed);
                else if (!hidden && !isCollapsed) b.rows.forEach((r) => out.push(this.#rowItem(r, level + 1)));
            }
        };
        build(rows, 0, '', false);
        this.#groupKeys = allKeys;
        return out;
    }

    #compute() {
        const st = this.st;
        const ds = this.ds;
        const p = this.props;
        const sPage = !!ds?.serverPaging;
        const sSort = !!ds?.serverSorting;
        const sFilter = !!ds?.serverFiltering;

        let rows = this.#getRows();
        const search = st.search.value.trim().toLowerCase();
        const filters = this.#activeFilters();
        const sort = st.sort.value;
        const groups = st.group.value;
        const collapsed = st.collapsed.value;
        const newRow = st.newRow.value;
        const pageSize = Math.max(1, Number(st.pageSize.value) || 10);
        const serverTotal = st.serverTotal.value;

        if (!sFilter) {
            if (search) {
                rows = rows.filter((r) => this.cols.some((c) => c.searchable && String(this.#valueOf(c, r) ?? '').toLowerCase().includes(search)));
            }
            if (filters.length) rows = rows.filter((r) => filters.every((f) => matches(this.#valueOf(f.col, r), f.type, f.op, f.value)));
        }

        const groupSort = groups.map((f) => ({ field: f, dir: sort.find((s) => s.field === f)?.dir ?? 'asc' }));
        const spec = sSort ? groupSort : [...groupSort, ...sort.filter((s) => !groups.includes(s.field))];
        if (spec.length) rows = this.#sortRows(rows, spec);

        const aggCols = this.cols.filter((c) => c.aggregate && c.hasField);
        const aggregates = aggCols.length ? computeAggregates(rows, aggCols, (c, r) => this.#valueOf(c, r)) : {};

        const flat = this.#flatten(rows, groups, collapsed, aggCols);
        const count = sPage ? serverTotal : flat.length;
        const dataCount = sPage ? serverTotal : rows.length;

        let items = flat;
        let page = st.page.value;
        let pages = 1;
        if (p.pageable) {
            pages = Math.max(1, Math.ceil(count / pageSize));
            page = Math.min(Math.max(1, page), pages);
            if (!sPage) items = flat.slice((page - 1) * pageSize, page * pageSize);
        }
        if (newRow) items = [newRow, ...items];

        return { items, count, dataCount, pages, page, pageSize, aggregates, exportRows: rows };
    }

    /* ───────────────────────── server loading ───────────────────────── */

    #serverKey() {
        const st = this.st;
        const ds = this.ds;
        const typed = ds.serverFiltering
            ? JSON.stringify([this.#activeFilters().map((f) => [f.field, f.op, f.value]), st.search.value])
            : '';
        const instant = JSON.stringify([
            ds.serverPaging ? [st.page.value, st.pageSize.value] : 0,
            ds.serverSorting ? st.sort.value : 0,
            this.#extraParams(),
        ]);
        return { typed, key: typed + instant };
    }

    #onServerKey(k) {
        if (k.key === this.#loadedKey) return;
        clearTimeout(this.#timer);
        if (k.typed !== this.#lastTyped) {
            this.#lastTyped = k.typed;
            this.#timer = setTimeout(() => {
                if (!this.isDestroyed && this.#serverKey().key !== this.#loadedKey) this.load();
            }, this.props.debounce);
        } else {
            this.load();
        }
    }

    #queryState() {
        const st = this.st;
        return {
            page: st.page.peek(),
            pageSize: Number(st.pageSize.peek()),
            sort: st.sort.peek().map((s) => ({ ...s })),
            filters: this.#activeFilters().map(({ field, op, value, type }) => ({ field, op, value, type })),
            search: st.search.peek().trim(),
            params: this.#extraParams(),
        };
    }

    /** (Re)load from the data source. */
    async load({ silent = false } = {}) {
        const ds = this.ds;
        if (!ds) return undefined;
        const mine = ++this.#reqId;
        this.#abort?.abort();
        const ctl = (this.#abort = typeof AbortController !== 'undefined' ? new AbortController() : null);
        const query = this.#queryState();
        this.#loadedKey = this.#serverKey().key;
        batch(() => {
            if (!silent) this.st.loading.setState(true);
            this.st.error.setState(null);
        });
        try {
            const res = await ds.read(query, { signal: ctl?.signal });
            if (mine !== this.#reqId || this.isDestroyed) return undefined;
            batch(() => {
                this.st.raw.setState(res.data);
                this.st.serverTotal.setState(res.total);
                this.st.loading.setState(false);
            });
            this.emit('dataLoaded', res);
            return res;
        } catch (err) {
            if (err?.name === 'AbortError' || mine !== this.#reqId || this.isDestroyed) return undefined;
            batch(() => {
                this.st.error.setState(err);
                this.st.loading.setState(false);
            });
            this.emit('error', err);
            return undefined;
        }
    }

    /** Re-run the data pipeline after mutating the source array in place. */
    touch() {
        this.st.version.setState(this.st.version.peek() + 1);
        return this;
    }

    refresh() {
        return this.ds ? this.load() : this.touch();
    }

    /* ───────────────────────── lifecycle ───────────────────────── */

    mounted() {
        this.effect(() => this.#applyLayout());
        this.onCleanup(() => {
            clearTimeout(this.#timer);
            this.#abort?.abort();
        });
        // initial load; also reload when state changed after an earlier pre-mount load()
        if (this.ds && this.ds.autoLoad !== false && (this.#reqId === 0 || this.#serverKey().key !== this.#loadedKey)) this.load();
        if (this.ds && this.props.autoRefresh > 0) this.interval(() => this.load({ silent: true }), this.props.autoRefresh);
        this.emit('ready', this);
    }

    /** Writes column layout (widths / order / visibility) into CSS variables. */
    #applyLayout() {
        const root = this.dom;
        if (!root) return;
        const order = this.order.value;
        const visible = order.filter((f) => this.colMap[f].visible.value);
        const track = (c) => {
            const w = c.width.value;
            if (typeof w === 'number') return `${w}px`;
            return typeof w === 'string' ? w : `minmax(${c.minWidth ?? 90}px,1fr)`;
        };
        const sys = [];
        if (this.hasCheckbox) sys.push('40px');
        if (this.props.detail) sys.push('36px');
        const cmd = this.hasCmd ? [`${this.props.commandWidth ?? 170}px`] : [];
        const minPx = (c) => (typeof c.width.value === 'number' ? c.width.value : c.minWidth ?? 90);
        const min = sys.length * 40 + visible.reduce((a, f) => a + minPx(this.colMap[f]), 0) + (this.hasCmd ? 170 : 0);
        root.style.setProperty('--jg-cols', [...sys, ...visible.map((f) => track(this.colMap[f])), ...cmd].join(' '));
        root.style.setProperty('--jg-min', `${min}px`);
        this.cols.forEach((c, i) => {
            const pos = visible.indexOf(c.field);
            if (pos < 0) root.style.setProperty(`--jg-d-${i}`, 'none');
            else {
                root.style.removeProperty(`--jg-d-${i}`);
                root.style.setProperty(`--jg-o-${i}`, String(pos));
            }
        });
    }

    /* ───────────────────────── public API: sorting / filtering / paging ───────────────────────── */

    /** Toggle (asc → desc → none) or set a column sort. `append` keeps other sorts. */
    sortBy(field, dir, append = this.props.sortable === 'multiple') {
        if (!this.props.sortable || this.colMap[field]?.sortable === false) return this;
        const cur = this.st.sort.peek();
        const existing = cur.find((s) => s.field === field);
        const next = dir ?? (!existing ? 'asc' : existing.dir === 'asc' ? 'desc' : null);
        let list = append ? cur.filter((s) => s.field !== field) : [];
        if (next) list = append && existing ? cur.map((s) => (s.field === field ? { field, dir: next } : s)) : [...list, { field, dir: next }];
        this.st.sort.setState(list);
        this.emit('sort', list);
        return this;
    }

    clearSort() {
        this.st.sort.setState([]);
        this.emit('sort', []);
        return this;
    }

    setFilter(field, op, value) {
        const c = this.colMap[field];
        if (!c) return this;
        batch(() => {
            if (op) c.fstate.op.setState(op);
            c.fstate.value.setState(value ?? '');
        });
        this.emit('filter', this.activeFilters());
        return this;
    }

    clearFilters() {
        batch(() => {
            this.cols.forEach((c) => {
                c.fstate.op.setState(defaultOp(c));
                c.fstate.value.setState('');
            });
            this.st.search.setState('');
        });
        this.emit('filter', []);
        return this;
    }

    activeFilters() {
        return this.#activeFilters().map(({ field, op, value }) => ({ field, op, value }));
    }

    get hasFilters() {
        return this.#activeFilters().length > 0 || this.st.search.value !== '';
    }

    setSearch(text) {
        this.st.search.setState(text ?? '');
        return this;
    }

    goTo(page) {
        const n = Math.min(Math.max(1, Number(page) || 1), this.st.view.peek().pages);
        this.st.page.setState(n);
        this.emit('page', { page: n, pageSize: Number(this.st.pageSize.peek()) });
        return this;
    }

    setPageSize(size) {
        batch(() => {
            this.st.pageSize.setState(Number(size));
            this.st.page.setState(1);
        });
        this.emit('page', { page: 1, pageSize: Number(size) });
        return this;
    }

    /* ───────────────────────── public API: columns ───────────────────────── */

    showColumn(field, visible = true) {
        const c = this.colMap[field];
        if (!c) return this;
        c.visible.setState(visible);
        this.emit('columnToggle', { field, visible });
        return this;
    }

    hideColumn(field) {
        return this.showColumn(field, false);
    }

    resizeColumn(field, width) {
        this.colMap[field]?.width.setState(width);
        return this;
    }

    moveColumn(field, beforeField) {
        const order = this.order.peek().filter((f) => f !== field);
        const idx = beforeField ? order.indexOf(beforeField) : order.length;
        order.splice(idx < 0 ? order.length : idx, 0, field);
        this.order.setState(order);
        this.emit('columnReorder', { field, order });
        return this;
    }

    /* ───────────────────────── public API: grouping ───────────────────────── */

    groupBy(field) {
        const c = this.colMap[field];
        if (!c || c.groupable === false || this.st.group.peek().includes(field)) return this;
        const next = [...this.st.group.peek(), field];
        this.st.group.setState(next);
        this.emit('group', next);
        return this;
    }

    ungroup(field) {
        const next = field ? this.st.group.peek().filter((f) => f !== field) : [];
        this.st.group.setState(next);
        this.emit('group', next);
        return this;
    }

    toggleGroup(key) {
        const s = new Set(this.st.collapsed.peek());
        s.has(key) ? s.delete(key) : s.add(key);
        this.st.collapsed.setState(s);
        return this;
    }

    collapseAllGroups() {
        this.st.collapsed.setState(new Set(this.#groupKeys));
        return this;
    }

    expandAllGroups() {
        this.st.collapsed.setState(new Set());
        return this;
    }

    /* ───────────────────────── public API: selection ───────────────────────── */

    #commitSelection(keys) {
        for (const k of keys) {
            if (!this.selMap.has(k)) {
                const r = this.#pageRows.get(k) ?? this.#findRow(k);
                if (r) this.selMap.set(k, r);
            }
        }
        for (const k of [...this.selMap.keys()]) if (!keys.has(k)) this.selMap.delete(k);
        this.st.selected.setState(keys);
        this.emit('selectionChange', { keys: [...keys], rows: this.selectedRows() });
    }

    #findRow(key) {
        return this.#pageRows.get(key) ?? this.#getRows().find((r) => this.#keyOf(r) === key);
    }

    select(keys, { append = false } = {}) {
        const s = append ? new Set(this.st.selected.peek()) : new Set();
        [].concat(keys).forEach((k) => s.add(String(k)));
        this.#commitSelection(s);
        return this;
    }

    deselect(keys) {
        const s = new Set(this.st.selected.peek());
        [].concat(keys).forEach((k) => s.delete(String(k)));
        this.#commitSelection(s);
        return this;
    }

    clearSelection() {
        this.#commitSelection(new Set());
        return this;
    }

    selectedRows() {
        return [...this.st.selected.peek()].map((k) => this.selMap.get(k)).filter(Boolean);
    }

    selectedKeys() {
        return [...this.st.selected.peek()];
    }

    /* ───────────────────────── public API: editing / CRUD ───────────────────────── */

    #makeDraft(row, isNew) {
        const cells = {};
        for (const c of this.cols) {
            if (!c.hasField || c.editable === false) continue;
            let v = getPath(row, c.field);
            if (c.type === 'date' && !isEmpty(v)) v = dayKey(v);
            if (c.type === 'boolean') v = Boolean(v);
            cells[c.field] = cell(v ?? '');
        }
        return { key: isNew ? '__new__' : this.#keyOf(row), isNew, original: row, draft: cells, errors: cell({}), error: cell('') };
    }

    /** Begin editing a row (key or row object). */
    startEdit(target) {
        if (!this.mode) return this;
        const row = typeof target === 'object' ? target : this.#findRow(String(target));
        if (!row) return this;
        batch(() => {
            this.st.newRow.setState(null);
            this.st.editing.setState(this.#makeDraft(row, false));
        });
        this.emit('edit', { row });
        return this;
    }

    /** Insert a new record (inline row at the top, or popup form). */
    addNew(defaults) {
        if (!this.mode) return this;
        const base = typeof this.props.newRowDefaults === 'function' ? this.props.newRowDefaults() : this.props.newRowDefaults;
        const row = { ...(base ?? {}), ...(defaults ?? {}) };
        batch(() => {
            this.st.newRow.setState(this.mode === 'inline' ? { type: 'row', key: '__new__', row, isNew: true, level: this.st.group.peek().length } : null);
            this.st.editing.setState(this.#makeDraft(row, true));
        });
        this.emit('edit', { row, isNew: true });
        return this;
    }

    cancelEdit() {
        const had = this.st.editing.peek();
        batch(() => {
            this.st.editing.setState(null);
            this.st.newRow.setState(null);
        });
        if (had) this.emit('cancel', { row: had.original, isNew: had.isNew });
        return this;
    }

    #collect(ed) {
        const values = {};
        const errors = {};
        const draftRow = { ...ed.original };
        for (const c of this.cols) {
            const src = ed.draft[c.field];
            if (!src) continue;
            let v = src.peek();
            if (c.type === 'number') v = isEmpty(v) ? null : Number(v);
            else if (c.type === 'boolean') v = Boolean(v);
            else if (c.type === 'date') v = isEmpty(v) ? null : v;
            if (c.required && (isEmpty(v) || Number.isNaN(v))) errors[c.field] = `${c.title} ${this.msg.required}`;
            else if (c.type === 'number' && v !== null && Number.isNaN(v)) errors[c.field] = `${c.title}: invalid number`;
            values[c.field] = v;
            setPath(draftRow, c.field, v);
        }
        for (const c of this.cols) {
            if (errors[c.field] || !c.validate || !(c.field in values)) continue;
            const msg = c.validate(values[c.field], draftRow);
            if (msg) errors[c.field] = msg;
        }
        return { values, errors, draftRow };
    }

    /** Validate and persist the current edit. Resolves true on success. */
    async saveEdit() {
        const ed = this.st.editing.peek();
        if (!ed || this.st.saving.peek()) return false;
        const { errors, draftRow } = this.#collect(ed);
        if (Object.keys(errors).length) {
            batch(() => {
                ed.errors.setState(errors);
                ed.error.setState(Object.values(errors)[0]);
            });
            return false;
        }
        const row = { ...ed.original };
        for (const c of this.cols) if (ed.draft[c.field]) setPath(row, c.field, getPath(draftRow, c.field));

        try {
            if (this.props.beforeSave && (await this.props.beforeSave(row, ed.isNew)) === false) return false;
            this.st.saving.setState(true);
            if (this.ds) {
                const saved = ed.isNew ? await this.ds.create(row) : await this.ds.update(row);
                this.cancelEditSilently();
                await this.load({ silent: true });
                this.emit('save', { row: isPlain(saved) ? saved : row, isNew: ed.isNew });
            } else {
                const rows = this.#getRows();
                let saved = row;
                if (ed.isNew) {
                    if (isEmpty(getPath(row, this.idField))) {
                        const ids = rows.map((r) => Number(getPath(r, this.idField))).filter((n) => !Number.isNaN(n));
                        setPath(row, this.idField, ids.length ? Math.max(...ids) + 1 : globalThis.crypto?.randomUUID?.() ?? Date.now());
                    }
                    this.#setRows([row, ...rows]);
                } else {
                    saved = row;
                    this.#setRows(rows.map((r) => (r === ed.original ? row : r)));
                }
                this.cancelEditSilently();
                this.emit('save', { row: saved, isNew: ed.isNew });
            }
            return true;
        } catch (err) {
            ed.error.setState(err?.message ?? String(err));
            this.emit('error', err);
            return false;
        } finally {
            this.st.saving.setState(false);
        }
    }

    cancelEditSilently() {
        batch(() => {
            this.st.editing.setState(null);
            this.st.newRow.setState(null);
        });
    }

    /** Delete rows by key / row object; with no argument deletes the selection. */
    async deleteRows(targets) {
        const list = (targets === undefined ? this.selectedRows() : [].concat(targets))
            .map((t) => (t !== null && typeof t === 'object' ? t : this.#findRow(String(t))))
            .filter(Boolean);
        if (!list.length) return false;
        const ok = this.props.confirm ? await this.props.confirm(list) : globalThis.confirm ? globalThis.confirm(this.msg.confirmDelete) : true;
        if (!ok) return false;
        try {
            if (this.ds) {
                await Promise.all(list.map((r) => this.ds.destroy(r)));
                await this.load({ silent: true });
            } else {
                const gone = new Set(list);
                this.#setRows(this.#getRows().filter((r) => !gone.has(r)));
            }
            const keys = new Set(this.st.selected.peek());
            list.forEach((r) => keys.delete(this.#keyOf(r)));
            this.#commitSelection(keys);
            this.emit('delete', { rows: list });
            return true;
        } catch (err) {
            this.st.error.setState(err);
            this.emit('error', err);
            return false;
        }
    }

    /* ───────────────────────── public API: export / state ───────────────────────── */

    toCsv() {
        const cols = this.order.peek().map((f) => this.colMap[f]).filter((c) => c.visible.peek() && c.hasField);
        const rows = this.st.view.peek().exportRows;
        const lines = [cols.map((c) => csvCell(c.title)).join(',')];
        for (const r of rows) lines.push(cols.map((c) => csvCell(c.exportValue ? c.exportValue(r) : this.#valueOf(c, r))).join(','));
        return lines.join('\r\n');
    }

    exportCsv(name = this.props.exportName) {
        const blob = new Blob([`\ufeff${this.toCsv()}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return this;
    }

    /** Serializable layout/query state (what stateKey persists). */
    getState({ page = true } = {}) {
        return {
            ...(page ? { page: this.st.page.value } : {}),
            pageSize: this.st.pageSize.value,
            sort: this.st.sort.value,
            group: this.st.group.value,
            search: this.st.search.value,
            filters: Object.fromEntries(this.cols.filter((c) => c.hasField).map((c) => [c.field, { op: c.fstate.op.value, value: c.fstate.value.value }])),
            order: this.order.value,
            widths: Object.fromEntries(this.cols.map((c) => [c.field, c.width.value])),
            hidden: this.cols.filter((c) => !c.visible.value).map((c) => c.field),
        };
    }

    setState(s = {}) {
        batch(() => {
            if (s.pageSize) this.st.pageSize.setState(Number(s.pageSize));
            if (s.page) this.st.page.setState(Number(s.page));
            if (s.sort) this.st.sort.setState(s.sort);
            if (s.group) this.st.group.setState(s.group);
            if (s.search !== undefined) this.st.search.setState(s.search);
            if (s.order) this.order.setState([...s.order.filter((f) => this.colMap[f]), ...this.cols.map((c) => c.field).filter((f) => !s.order.includes(f))]);
            for (const c of this.cols) {
                if (s.filters?.[c.field]) {
                    c.fstate.op.setState(s.filters[c.field].op ?? defaultOp(c));
                    c.fstate.value.setState(s.filters[c.field].value ?? '');
                }
                if (s.widths && c.field in s.widths) c.width.setState(s.widths[c.field]);
                if (s.hidden) c.visible.setState(!s.hidden.includes(c.field));
            }
        });
        return this;
    }

    #restore() {
        if (!this.props.stateKey) return;
        try {
            const raw = localStorage.getItem(`jg:${this.props.stateKey}`);
            if (raw) this.setState(JSON.parse(raw));
        } catch { /* ignore corrupt state */ }
    }

    /* ───────────────────────── interaction handlers ───────────────────────── */

    #closeMenu() {
        this.st.openMenu.setState(null);
    }

    #toggleMenu(id, e) {
        if (this.st.openMenu.peek()?.id === id) return this.#closeMenu();
        const r = e.currentTarget.getBoundingClientRect();
        this.st.openMenu.setState({ id, x: Math.max(4, Math.min(r.left, window.innerWidth - 230)), y: r.bottom + 2 });
    }

    /** A trigger + fixed-position popup menu. */
    #dropdown(id, trigger, content) {
        return span(
            { class: 'jg-dd' },
            trigger({ onclick: (e) => this.#toggleMenu(id, e) }),
            this.when(
                () => this.st.openMenu.value?.id === id,
                () => {
                    const m = this.st.openMenu.peek();
                    return div({ class: 'jg-menu', role: 'menu', style: { left: `${m.x}px`, top: `${m.y}px` } }, ...kids(content()));
                },
            ),
        );
    }

    #menuItem(text, onClick) {
        return button({ class: 'jg-menu-item', role: 'menuitem', onclick: () => { this.#closeMenu(); onClick(); } }, text);
    }

    #onRowClick(item, e) {
        if (e.target.closest('button, input, select, textarea, a, .jg-cmd')) return;
        const key = item.key;
        this.st.active.setState(key);
        if (this.selMode) {
            let keys = new Set(this.st.selected.peek());
            if (this.selMode === 'multiple' && e.shiftKey && this.#anchor) {
                const list = this.rows.values.filter((i) => i.type === 'row' && !i.isNew).map((i) => i.key);
                const a = list.indexOf(this.#anchor);
                const b = list.indexOf(key);
                if (a >= 0 && b >= 0) list.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((k) => keys.add(k));
            } else if (this.selMode === 'multiple' && (e.ctrlKey || e.metaKey || this.hasCheckbox)) {
                keys.has(key) ? keys.delete(key) : keys.add(key);
                this.#anchor = key;
            } else {
                keys = new Set([key]);
                this.#anchor = key;
            }
            this.#commitSelection(keys);
        }
        this.emit('rowClick', { row: item.row, key, event: e });
    }

    #toggleRow(item, on) {
        const keys = new Set(this.st.selected.peek());
        on ? keys.add(item.key) : keys.delete(item.key);
        this.#anchor = item.key;
        this.#commitSelection(keys);
    }

    #toggleAllOnPage(on) {
        const keys = new Set(this.st.selected.peek());
        this.rows.values.filter((i) => i.type === 'row' && !i.isNew).forEach((i) => (on ? keys.add(i.key) : keys.delete(i.key)));
        this.#commitSelection(keys);
    }

    #allOnPageSelected() {
        const sel = this.st.selected.value;
        const items = this.st.view.value.items.filter((i) => i.type === 'row' && !i.isNew);
        return items.length > 0 && items.every((i) => sel.has(i.key));
    }

    toggleDetail(key) {
        const s = new Set(this.st.expanded.peek());
        s.has(key) ? s.delete(key) : s.add(key);
        this.st.expanded.setState(s);
        return this;
    }

    #onKey(e) {
        if (e.target.closest('input, select, textarea')) return;
        const items = this.rows.values.filter((i) => i.type === 'row' && !i.isNew);
        if (!items.length) return;
        const cur = items.findIndex((i) => i.key === this.st.active.peek());
        const focusRow = (i) => {
            const it = items[Math.max(0, Math.min(items.length - 1, i))];
            this.st.active.setState(it.key);
            if (this.selMode === 'single') this.#commitSelection(new Set([it.key]));
            this.query(`[data-key="${CSS.escape(it.key)}"]`)?.scrollIntoView({ block: 'nearest' });
        };
        if (e.key === 'ArrowDown') { e.preventDefault(); focusRow(cur + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); focusRow(cur < 0 ? 0 : cur - 1); }
        else if (e.key === ' ' && cur >= 0 && this.selMode) {
            e.preventDefault();
            const k = items[cur].key;
            const keys = this.selMode === 'single' ? new Set([k]) : new Set(this.st.selected.peek());
            if (this.selMode === 'multiple') keys.has(k) ? keys.delete(k) : keys.add(k);
            this.#commitSelection(keys);
        } else if (e.key === 'Enter' && cur >= 0 && this.mode === 'inline') {
            e.preventDefault();
            this.startEdit(items[cur].row);
        } else if (e.key === 'PageDown') { e.preventDefault(); this.goTo(this.st.view.peek().page + 1); }
        else if (e.key === 'PageUp') { e.preventDefault(); this.goTo(this.st.view.peek().page - 1); }
    }

    #startResize(col, e) {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = e.target.closest('.jg-cell').getBoundingClientRect().width;
        const move = (ev) => col.width.setState(Math.max(col.minWidth ?? 50, Math.round(startW + ev.clientX - startX)));
        const up = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            this.emit('columnResize', { field: col.field, width: col.width.peek() });
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    }

    /* ═════════════════════════ rendering ═════════════════════════ */

    build() {
        const p = this.props;
        const st = this.st;
        return div(
            this.rootAttrs({
                role: 'grid',
                'aria-busy': () => String(st.loading.value),
                ...(p.dark ? { class: 'jg-dark' } : {}),
            }),
            ...kids(
                this.#toolbar(),
                p.groupable ? this.#groupPanel() : null,
                this.#errorBar(),
                div(
                    { class: 'jg-scroll', tabindex: '0', onkeydown: (e) => this.#onKey(e), ...(p.height ? { style: { maxHeight: p.height } } : {}) },
                    div(
                        { class: 'jg-inner' },
                        div({ class: 'jg-sticky' }, this.#headerRow(), p.filterable ? this.#filterRow() : null),
                        div(
                            { class: 'jg-body', role: 'rowgroup' },
                            this.each(this.rows, (it) => it.key, (it) => this.#renderItem(it)),
                            this.when(() => st.view.value.items.length === 0 && !st.loading.value, () => div({ class: 'jg-empty' }, this.msg.noRecords)),
                        ),
                        this.#footerRow(),
                    ),
                ),
                div({ class: cx('jg-loading', { 'jg-on': () => st.loading.value }) }, this.msg.loading),
                p.pageable ? this.#pager() : null,
                this.mode === 'popup' ? this.when(() => !!st.editing.value, () => this.#popup()) : null,
            ),
        );
    }

    #errorBar() {
        return this.when(
            () => !!this.st.error.value,
            () => div(
                { class: 'jg-errorbar', role: 'alert' },
                span({ class: 'jg-spacer' }, this.computed(() => `⚠ ${this.st.error.value?.message ?? this.st.error.value}`)),
                ...kids(this.ds ? button({ class: 'jg-btn jg-sm', onclick: () => this.load() }, this.msg.retry) : null),
            ),
        );
    }

    /* ───────────── toolbar ───────────── */

    #toolbar() {
        const p = this.props;
        if (p.toolbar === false) return null;
        const tools = p.toolbar ?? [
            this.mode && 'add',
            this.ds && 'refresh',
            this.mode && this.selMode === 'multiple' && 'deleteSelected',
            'spacer',
            p.searchable && 'search',
            'clearFilters',
            p.columnChooser && 'columns',
            p.exportable && 'export',
        ].filter(Boolean);
        const els = tools.map((t) => this.#tool(t)).filter(Boolean);
        return els.length ? div({ class: 'jg-toolbar', role: 'toolbar' }, ...els) : null;
    }

    #tool(t) {
        const m = this.msg;
        const st = this.st;
        if (typeof t === 'function') return t(this);
        if (typeof t === 'object') {
            return button(
                { class: cx('jg-btn', t.class), disabled: typeof t.disabled === 'function' ? t.disabled : !!t.disabled, onclick: (e) => t.onClick?.(this, e) },
                t.icon ? `${t.icon} ` : '',
                t.text ?? '',
            );
        }
        switch (t) {
            case 'spacer': return span({ class: 'jg-spacer' });
            case 'add': return this.mode ? button({ class: 'jg-btn jg-primary', onclick: () => this.addNew() }, m.add) : null;
            case 'refresh': return button({ class: 'jg-btn', onclick: () => this.refresh() }, m.refresh);
            case 'search': return input({ class: 'jg-input jg-search', type: 'search', placeholder: m.search, 'aria-label': m.search, bind: st.search });
            case 'clearFilters':
                return button({ class: cx('jg-btn', { 'jg-hidden': () => !this.hasFilters }), onclick: () => this.clearFilters() }, m.clearFilters);
            case 'deleteSelected':
                return button(
                    { class: 'jg-btn jg-danger', disabled: () => st.selected.value.size === 0, onclick: () => this.deleteRows() },
                    this.computed(() => `${m.deleteSelected}${st.selected.value.size ? ` (${st.selected.value.size})` : ''}`),
                );
            case 'columns':
                return this.#dropdown('columns', (a) => button({ class: 'jg-btn', ...a }, m.columns), () =>
                    this.cols.filter((c) => c.hasField || c.title).map((c) =>
                        label({ class: 'jg-menu-item' }, input({ type: 'checkbox', bind: c.visible, onchange: () => this.emit('columnToggle', { field: c.field, visible: c.visible.peek() }) }), c.title)));
            case 'export': return button({ class: 'jg-btn', onclick: () => this.exportCsv() }, m.export);
            default: return null;
        }
    }

    /* ───────────── group panel ───────────── */

    #groupPanel() {
        const st = this.st;
        return div(
            {
                class: 'jg-groupbar',
                ondragover: (e) => this.#dragField && (e.preventDefault(), e.currentTarget.classList.add('jg-over')),
                ondragleave: (e) => e.currentTarget.classList.remove('jg-over'),
                ondrop: (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('jg-over');
                    const f = this.#dragField;
                    this.#dragField = null;
                    if (f) this.groupBy(f);
                },
            },
            this.computed(() => {
                const g = st.group.value;
                if (!g.length) return span({ class: 'jg-hint' }, this.msg.groupHint);
                return span(
                    { style: { display: 'inline-flex', gap: '6px', flexWrap: 'wrap' } },
                    ...g.map((f) =>
                        span({ class: 'jg-chip' }, this.colMap[f]?.title ?? f,
                            button({ class: 'jg-btn jg-icon', 'aria-label': `Remove group ${f}`, onclick: () => this.ungroup(f) }, '✕'))),
                );
            }),
        );
    }

    /* ───────────── header / filter / footer ───────────── */

    #sysCell(order, ...content) {
        return div({ class: 'jg-cell jg-sys', role: 'gridcell', style: { order: String(order) } }, ...kids(content));
    }

    #colStyle(col, fallback = 'block') {
        return { order: `var(--jg-o-${col.index}, 0)`, display: `var(--jg-d-${col.index}, ${fallback})` };
    }

    #headerRow() {
        const st = this.st;
        return div(
            { class: 'jg-row jg-head', role: 'row' },
            ...kids(
                this.hasCheckbox
                    ? this.#sysCell(-3, input({
                        type: 'checkbox', 'aria-label': 'Select all on page',
                        checked: () => this.#allOnPageSelected(),
                        onchange: (e) => this.#toggleAllOnPage(e.target.checked),
                    }))
                    : null,
                this.props.detail ? this.#sysCell(-2) : null,
                this.cols.map((c) => this.#headerCell(c)),
                this.hasCmd ? this.#sysCell(9999) : null,
            ),
        );
        void st;
    }

    #headerCell(col) {
        const p = this.props;
        const st = this.st;
        const sortable = p.sortable && col.sortable !== false;
        const dnd = p.reorderable || p.groupable;
        const indicator = this.computed(() => {
            const list = st.sort.value;
            const i = list.findIndex((s) => s.field === col.field);
            if (i < 0) return '';
            return `${list[i].dir === 'asc' ? '▲' : '▼'}${list.length > 1 ? i + 1 : ''}`;
        });
        return div(
            {
                class: cx('jg-cell jg-hcell', `jg-align-${col.align}`, col.headerClass),
                role: 'columnheader',
                'data-field': col.field,
                'aria-sort': () => {
                    const s = st.sort.value.find((x) => x.field === col.field);
                    return s ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none';
                },
                style: this.#colStyle(col, 'flex'),
                ...(dnd && col.hasField
                    ? {
                        draggable: 'true',
                        ondragstart: (e) => {
                            this.#dragField = col.field;
                            e.dataTransfer.setData('text/plain', col.field);
                            e.dataTransfer.effectAllowed = 'move';
                        },
                        ondragend: () => { this.#dragField = null; },
                        ondragover: (e) => this.#dragField && p.reorderable && e.preventDefault(),
                        ondrop: (e) => {
                            if (!p.reorderable || !this.#dragField) return;
                            e.preventDefault();
                            const f = this.#dragField;
                            this.#dragField = null;
                            if (f !== col.field) this.moveColumn(f, col.field);
                        },
                    }
                    : {}),
            },
            ...kids(
                span(
                    { class: 'jg-title', ...(sortable ? { onclick: (e) => this.sortBy(col.field, undefined, e.shiftKey || p.sortable === 'multiple') } : {}) },
                    col.headerTemplate ? col.headerTemplate(col, this) : col.title,
                ),
                sortable ? span({ class: 'jg-sort' }, indicator) : null,
                p.columnMenu && col.hasField ? this.#columnMenu(col, sortable) : null,
                p.resizable && col.resizable !== false
                    ? span({
                        class: 'jg-resizer', role: 'separator',
                        onpointerdown: (e) => this.#startResize(col, e),
                        onmousedown: (e) => e.preventDefault(),
                        ondragstart: (e) => e.preventDefault(),
                    })
                    : null,
            ),
        );
    }

    #columnMenu(col, sortable) {
        const m = this.msg;
        return this.#dropdown(
            `col:${col.field}`,
            (a) => button({ class: 'jg-btn jg-icon', 'aria-label': `${col.title} menu`, 'aria-haspopup': 'menu', ...a }, '⋮'),
            () => [
                sortable ? this.#menuItem(`▲ ${m.sortAsc}`, () => this.sortBy(col.field, 'asc')) : null,
                sortable ? this.#menuItem(`▼ ${m.sortDesc}`, () => this.sortBy(col.field, 'desc')) : null,
                sortable ? this.#menuItem(m.clearSort, () => this.st.sort.setState(this.st.sort.peek().filter((s) => s.field !== col.field))) : null,
                this.props.groupable && col.groupable !== false ? this.#menuItem(m.groupBy, () => this.groupBy(col.field)) : null,
                this.#menuItem(m.hide, () => this.hideColumn(col.field)),
            ],
        );
    }

    #filterRow() {
        return div(
            { class: 'jg-row jg-filters', role: 'row' },
            ...kids(
                this.hasCheckbox ? this.#sysCell(-3) : null,
                this.props.detail ? this.#sysCell(-2) : null,
                this.cols.map((c) => this.#filterCell(c)),
                this.hasCmd ? this.#sysCell(9999) : null,
            ),
        );
    }

    #filterCell(col) {
        const style = this.#colStyle(col, 'flex');
        if (!col.hasField || col.filterable === false) return div({ class: 'jg-cell', style }, '');
        const m = this.msg;
        const fs = col.fstate;
        const ops = col.options ? ['eq'] : OPS[col.type] ?? OPS.string;
        let editor;
        if (col.options || col.type === 'boolean') {
            const opts = col.options ?? [{ value: 'true', text: m.yes }, { value: 'false', text: m.no }];
            editor = select(
                { class: 'jg-input', bind: fs.value, 'aria-label': `Filter ${col.title}` },
                option({ value: '' }, m.all),
                ...opts.map((o) => option({ value: String(o.value) }, o.text)),
            );
        } else {
            editor = input({
                class: 'jg-input', bind: fs.value, 'aria-label': `Filter ${col.title}`,
                type: col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text',
            });
        }
        return div(
            { class: 'jg-cell', style },
            ...kids(
                ops.length > 1
                    ? select({ class: 'jg-input jg-op', bind: fs.op, title: 'Operator', 'aria-label': `Operator ${col.title}` },
                        ...ops.map((o) => option({ value: o }, m.ops[o])))
                    : null,
                editor,
            ),
        );
    }

    #footerRow() {
        if (!this.cols.some((c) => c.aggregate || c.footerTemplate)) return null;
        const st = this.st;
        return div(
            { class: 'jg-row jg-foot', role: 'row' },
            ...kids(
                this.hasCheckbox ? this.#sysCell(-3) : null,
                this.props.detail ? this.#sysCell(-2) : null,
                this.cols.map((c) =>
                    div({ class: cx('jg-cell', `jg-align-${c.align}`), style: this.#colStyle(c) },
                        this.computed(() => {
                            const a = st.view.value.aggregates;
                            if (c.footerTemplate) return String(c.footerTemplate(a, this) ?? '');
                            if (!c.aggregate || a[c.field] === undefined || a[c.field] === null) return '';
                            const label = typeof c.aggregate === 'string' ? `${AGG_LABEL[c.aggregate]}: ` : '';
                            return `${label}${formatValue({ ...c, format: c.format }, a[c.field], null, this.msg)}`;
                        }))),
                this.hasCmd ? this.#sysCell(9999) : null,
            ),
        );
    }

    /* ───────────── rows ───────────── */

    #renderItem(item) {
        if (item.type === 'group') return this.#groupRow(item);
        const key = item.key;
        return div(
            { class: 'jg-rowwrap', role: 'presentation' },
            ...kids(
                this.mode === 'inline'
                    ? this.when(() => this.st.editing.value?.key === key, () => this.#editRow(item), () => this.#viewRow(item))
                    : this.#viewRow(item),
                this.props.detail
                    ? this.when(() => this.st.expanded.value.has(key), () => div({ class: 'jg-detail', role: 'row' }, ...kids(this.props.detail(item.row, this))))
                    : null,
            ),
        );
    }

    #groupRow(item) {
        const col = item.col;
        const aggText = col && Object.keys(item.aggregates).length
            ? this.cols
                .filter((c) => c.aggregate && item.aggregates[c.field] !== null && item.aggregates[c.field] !== undefined)
                .map((c) => `${c.title} ${typeof c.aggregate === 'string' ? AGG_LABEL[c.aggregate].toLowerCase() : 'agg'}: ${formatValue(c, item.aggregates[c.field], null, this.msg)}`)
                .join(' · ')
            : '';
        return div(
            {
                class: 'jg-group-row', role: 'row', 'data-key': item.key, 'aria-expanded': String(!item.collapsed),
                style: { paddingLeft: `${item.level * 18 + 10}px` },
                onclick: () => this.toggleGroup(item.key),
            },
            span({ class: 'jg-caret' }, item.collapsed ? '▶' : '▼'),
            span({ class: 'jg-gtitle' }, `${col?.title ?? item.field}: ${col ? formatValue(col, item.value, null, this.msg) : item.value}`),
            span({ class: 'jg-gcount' }, `(${item.count})`),
            ...kids(aggText ? span({ class: 'jg-gagg' }, aggText) : null),
        );
    }

    #cellContent(col, row, item) {
        if (col.template) return col.template(row, { grid: this, item, column: col }) ?? '';
        return formatValue(col, this.#valueOf(col, row), row, this.msg);
    }

    #viewRow(item) {
        const { key, row } = item;
        const st = this.st;
        const p = this.props;
        return div(
            {
                class: cx('jg-row', {
                    'jg-selected': () => st.selected.value.has(key),
                    'jg-active': () => st.active.value === key,
                }, p.rowClass?.(row)),
                role: 'row',
                'data-key': key,
                'aria-selected': () => String(st.selected.value.has(key)),
                onclick: (e) => this.#onRowClick(item, e),
                ondblclick: (e) => {
                    if (e.target.closest('button, input, select, a')) return;
                    if (this.mode === 'inline' || this.mode === 'popup') this.startEdit(row);
                    this.emit('rowDblClick', { row, key });
                },
            },
            ...kids(
                this.hasCheckbox
                    ? this.#sysCell(-3, input({
                        type: 'checkbox', 'aria-label': 'Select row',
                        checked: () => st.selected.value.has(key),
                        onclick: (e) => e.stopPropagation(),
                        onchange: (e) => this.#toggleRow(item, e.target.checked),
                    }))
                    : null,
                p.detail
                    ? this.#sysCell(-2, button({
                        class: 'jg-btn jg-icon', 'aria-label': 'Toggle detail',
                        onclick: (e) => { e.stopPropagation(); this.toggleDetail(key); },
                    }, this.computed(() => (st.expanded.value.has(key) ? '▾' : '▸'))))
                    : null,
                this.cols.map((c) => {
                    const content = this.#cellContent(c, row, item);
                    return div(
                        {
                            class: cx('jg-cell', `jg-align-${c.align}`, c.class),
                            role: 'gridcell',
                            style: this.#colStyle(c),
                            ...(!c.template && typeof content === 'string' && content ? { title: content } : {}),
                        },
                        ...kids(content),
                    );
                }),
                this.hasCmd ? this.#commandCell(item, false) : null,
            ),
        );
    }

    #commandCell(item, editing) {
        const m = this.msg;
        const row = item.row;
        const ed = this.st.editing;
        const btn = (text, cls, fn, extra = {}) => button({ class: `jg-btn jg-sm ${cls}`, onclick: (e) => { e.stopPropagation(); fn(e); }, ...extra }, text);
        let buttons;
        if (editing) {
            buttons = [
                btn(item.isNew ? m.insert : m.update, 'jg-primary', () => this.saveEdit(), { disabled: () => this.st.saving.value }),
                btn(m.cancel, '', () => this.cancelEdit()),
            ];
        } else {
            buttons = this.commands.map((c) => {
                if (c === 'edit') return this.mode ? btn(m.edit, '', () => this.startEdit(row), { 'data-cmd': 'edit' }) : null;
                if (c === 'destroy') return btn(m.delete, 'jg-danger', () => this.deleteRows(row), { 'data-cmd': 'destroy' });
                if (c.visible && !c.visible(row)) return null;
                return btn(c.text ?? c.name, c.class ?? '', () => c.onClick?.(row, this), { 'data-cmd': c.name });
            });
        }
        void ed;
        return div({ class: 'jg-cell jg-cmd', role: 'gridcell', style: { order: '9999' } }, ...kids(buttons));
    }

    /* ───────────── editing ───────────── */

    #editor(col, ed) {
        const src = ed.draft[col.field];
        if (!src) return span({}, formatValue(col, this.#valueOf(col, ed.original), ed.original, this.msg));
        if (typeof col.editor === 'function') return col.editor(src, { column: col, grid: this, draft: ed });
        const cls = cx('jg-input', { 'jg-invalid': () => !!ed.errors.value[col.field] });
        const common = { class: cls, 'aria-label': col.title, title: () => ed.errors.value[col.field] ?? '', 'data-field': col.field };
        if (col.options) {
            const cur = String(src.peek() ?? '');
            return select({ ...common, bind: src },
                ...col.options.map((o) => option({ value: String(o.value), selected: String(o.value) === cur }, o.text)));
        }
        if (col.type === 'boolean' || col.editor === 'checkbox') return input({ type: 'checkbox', bind: src, 'aria-label': col.title, 'data-field': col.field });
        const type = col.editor && col.editor !== 'text' ? col.editor : col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text';
        return input({ ...common, type, bind: src });
    }

    #editRow(item) {
        const ed = this.st.editing.peek();
        return div(
            {
                class: 'jg-row jg-editing', role: 'row', 'data-key': item.key,
                onkeydown: (e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); this.saveEdit(); }
                    else if (e.key === 'Escape') { e.preventDefault(); this.cancelEdit(); }
                },
            },
            ...kids(
                this.hasCheckbox ? this.#sysCell(-3) : null,
                this.props.detail ? this.#sysCell(-2) : null,
                this.cols.map((c) =>
                    div({ class: 'jg-cell', role: 'gridcell', style: this.#colStyle(c) }, this.#editor(c, ed))),
                this.hasCmd
                    ? div({ class: 'jg-cell jg-cmd', role: 'gridcell', style: { order: '9999' } },
                        button({ class: 'jg-btn jg-sm jg-primary', 'data-cmd': 'save', disabled: () => this.st.saving.value, onclick: () => this.saveEdit() }, item.isNew ? this.msg.insert : this.msg.update),
                        button({ class: 'jg-btn jg-sm', 'data-cmd': 'cancel', onclick: () => this.cancelEdit() }, this.msg.cancel))
                    : null,
                // inline validation message under the row
            ),
        );
    }

    #popup() {
        const ed = this.st.editing.peek();
        const m = this.msg;
        // move focus into the dialog once it is in the document
        setTimeout(() => this.query('.jg-dialog input:not([type=checkbox]), .jg-dialog select, .jg-dialog input')?.focus(), 0);
        return div(
            { class: 'jg-modal', onmousedown: (e) => { if (e.target === e.currentTarget) this.cancelEdit(); } },
            div(
                {
                    class: 'jg-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': ed.isNew ? m.addTitle : m.editTitle,
                    onkeydown: (e) => {
                        if (e.key === 'Escape') { e.preventDefault(); this.cancelEdit(); }
                        else if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); this.saveEdit(); }
                    },
                },
                div({ class: 'jg-dialog-title' }, ed.isNew ? m.addTitle : m.editTitle),
                div({ class: 'jg-dialog-body' },
                    ...this.cols.filter((c) => ed.draft[c.field]).map((c) => div({ class: 'jg-field' }, label({}, c.title), this.#editor(c, ed)))),
                div({ class: 'jg-dialog-foot' },
                    span({ class: 'jg-formerr', role: 'alert' }, this.computed(() => ed.error.value)),
                    button({ class: 'jg-btn', 'data-cmd': 'cancel', onclick: () => this.cancelEdit() }, m.cancel),
                    button({ class: 'jg-btn jg-primary', 'data-cmd': 'save', disabled: () => this.st.saving.value, onclick: () => this.saveEdit() }, ed.isNew ? m.insert : m.update)),
            ),
        );
    }

    /* ───────────── pager ───────────── */

    #pager() {
        const st = this.st;
        const m = this.msg;
        const v = () => st.view.value;
        const nav = (text, title, target, disabled) =>
            button({ class: 'jg-btn', title, 'aria-label': title, disabled, onclick: () => this.goTo(target()) }, text);
        return div(
            { class: 'jg-pager', role: 'navigation', 'aria-label': 'Pagination' },
            nav('⏮', m.first, () => 1, () => v().page <= 1),
            nav('◀', m.prev, () => v().page - 1, () => v().page <= 1),
            this.computed(() =>
                span({ class: 'jg-pages' },
                    ...pagesWindow(v().page, v().pages).map((n) =>
                        n === '…'
                            ? span({}, '…')
                            : button({ class: cx('jg-btn', { 'jg-on': n === v().page }), 'aria-current': n === v().page ? 'page' : 'false', 'data-page': String(n), onclick: () => this.goTo(n) }, String(n))))),
            nav('▶', m.next, () => v().page + 1, () => v().page >= v().pages),
            nav('⏭', m.last, () => v().pages, () => v().page >= v().pages),
            select(
                {
                    class: 'jg-input', 'aria-label': m.itemsPerPage, value: () => String(st.pageSize.value),
                    onchange: (e) => this.setPageSize(e.target.value),
                },
                ...[...new Set([...this.props.pageSizes, this.props.pageSize])].sort((a, b) => a - b)
                    .map((n) => option({ value: String(n), selected: n === this.props.pageSize }, String(n))),
            ),
            span({ class: 'jg-muted' }, m.itemsPerPage),
            span({ class: 'jg-info', role: 'status' },
                this.computed(() => {
                    const view = v();
                    if (!view.count) return `0 ${m.items}`;
                    if (st.group.value.length) return `${view.dataCount} ${m.items}`;
                    const from = (view.page - 1) * view.pageSize + 1;
                    return `${from} - ${Math.min(view.page * view.pageSize, view.count)} ${m.of} ${view.count} ${m.items}`;
                })),
        );
    }
}

export default DataGrid;