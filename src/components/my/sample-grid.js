
import { button, div, h2, p, span } from "../../lib/jetz-ui.js";
import DataGrid, { RestDataSource } from "../../rocket-ui/datagrid.js";
import { cell } from "../../rocket-ui/rocket-base.js";


/* ── 1. The JSON data ─────────────────────────────────────────────────────── */
const products = [
    { id: 1, name: 'Mechanical Keyboard', category: 'Peripherals', price: 89.9, stock: 34, rating: 4.6, active: true, added: '2024-01-12' },
    { id: 2, name: 'Wireless Mouse', category: 'Peripherals', price: 29.5, stock: 120, rating: 4.3, active: true, added: '2024-02-03' },
    { id: 3, name: '27" 4K Monitor', category: 'Displays', price: 389, stock: 8, rating: 4.7, active: true, added: '2023-11-20' },
    { id: 4, name: '24" Office Monitor', category: 'Displays', price: 149, stock: 52, rating: 4.1, active: true, added: '2023-09-14' },
    { id: 5, name: 'USB-C Dock', category: 'Accessories', price: 119, stock: 0, rating: 3.9, active: false, added: '2024-03-01' },
    { id: 6, name: 'Laptop Stand', category: 'Accessories', price: 39, stock: 76, rating: 4.4, active: true, added: '2024-03-18' },
    { id: 7, name: 'Webcam 1080p', category: 'Peripherals', price: 59, stock: 15, rating: 4.0, active: true, added: '2024-04-07' },
    { id: 8, name: 'Noise-Cancel Headset', category: 'Audio', price: 199, stock: 22, rating: 4.8, active: true, added: '2024-04-25' },
    { id: 9, name: 'Bluetooth Speaker', category: 'Audio', price: 79, stock: 3, rating: 4.2, active: true, added: '2024-05-09' },
    { id: 10, name: 'Studio Microphone', category: 'Audio', price: 129, stock: 11, rating: 4.5, active: false, added: '2024-05-30' },
    { id: 11, name: 'Ergonomic Chair', category: 'Furniture', price: 459, stock: 6, rating: 4.6, active: true, added: '2023-12-02' },
    { id: 12, name: 'Standing Desk', category: 'Furniture', price: 599, stock: 4, rating: 4.7, active: true, added: '2023-10-19' },
];

/* ── 2. Put the data in a State → the grid is fully reactive ──────────────── */
const rows = cell(products);

// Optional: load a .json file instead of the inline array
//   fetch('./products.json').then(r => r.json()).then(d => (rows.value = d));

/* ── 3. The grid ──────────────────────────────────────────────────────────── */
const grid = DataGrid.new({
    data: rows,                       // Array or State<Array>
    idField: 'id',
    pageSize: 5,
    pageSizes: [5, 10, 20],
    height: '420px',
    selectable: 'multiple',           // checkbox column + Ctrl/Shift
    editable: 'inline',               // or 'popup'; edits are written back into `rows`
    groupable: true,                  // drag a header into the group panel
    sort: [{ field: 'name', dir: 'asc' }],
    stateKey: 'products-demo',        // remembers layout/sort/filters in localStorage
    newRowDefaults: { active: true, stock: 0, category: 'Accessories' },
    confirm: () => globalThis.confirm('Delete the selected record(s)?'),

    columns: [
        { field: 'id', title: 'ID', type: 'number', width: 84, format: { useGrouping: false }, editable: false },
        {
            field: 'name', title: 'Product', required: true, minWidth: 180,
            validate: (v) => (v.length < 3 ? 'At least 3 characters' : undefined)
        },
        {
            field: 'category', title: 'Category',
            options: ['Peripherals', 'Displays', 'Accessories', 'Audio', 'Furniture'].map((c) => ({ value: c, text: c }))
        },
        {
            field: 'price', title: 'Price', type: 'number', width: 140, aggregate: 'sum',
            format: { style: 'currency', currency: 'USD' }
        },
        {
            field: 'stock', title: 'Stock', type: 'number', width: 120, aggregate: 'sum',
            template: (row) => span({ class: row.stock > 5 ? 'badge ok' : 'badge low' }, row.stock > 0 ? String(row.stock) : 'Out')
        },
        {
            field: 'rating', title: 'Rating', type: 'number', width: 90, aggregate: 'avg',
            format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }
        },
        { field: 'active', title: 'Active', type: 'boolean', width: 90 },
        { field: 'added', title: 'Added', type: 'date', width: 130 },
    ],

    detail: (row) => div({ class: 'detail' },
        span({}, `Stock value: ${(row.price * row.stock).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`),
        span({}, `Added: ${row.added}`)),

    // events
    onSelectionChange: ({ rows: sel }) => (document.title = `${sel.length} selected`),
    onSave: ({ row, isNew }) => console.log(isNew ? 'created' : 'updated', row),
    onDelete: ({ rows: gone }) => console.log('deleted', gone),
});

/* ── 4. Change the data from outside → grid updates by itself ─────────────── */
let nextId = 100;
const names = ['Gaming Pad', 'HDMI Cable', 'Desk Lamp', 'Smart Plug'];

const actions = div({ class: 'bar' },
    button({
        onclick: () => {                       // add: replace the array (immutable update)
            const n = names[Math.floor(Math.random() * names.length)];
            rows.value = [{ id: nextId++, name: n, category: 'Accessories', price: +(10 + Math.random() * 90).toFixed(2), stock: 10, rating: 4, active: true, added: new Date().toISOString().slice(0, 10) }, ...rows.value];
        }
    }, 'Add random product'),
    button({ onclick: () => (rows.value = rows.value.map((r) => ({ ...r, price: +(r.price * 1.1).toFixed(2) }))) }, 'Raise all prices 10%'),
    button({ onclick: () => (rows.value = rows.value.filter((r) => r.stock > 0)) }, 'Remove out-of-stock'),
    button({ onclick: () => { rows.value[0].price = 1; grid.touch(); } }, 'Mutate in place + touch()'),   // in-place change needs touch()
    button({ onclick: () => grid.sortBy('price', 'desc') }, 'Sort by price ↓'),
    button({ onclick: () => grid.setFilter('category', 'eq', 'Audio') }, 'Filter: Audio'),
    button({ onclick: () => grid.clearFilters() }, 'Clear filters'),
    button({ onclick: () => grid.groupBy('category') }, 'Group by category'),
    button({ onclick: () => grid.ungroup() }, 'Ungroup'),
    button({ onclick: () => grid.exportCsv('products.csv') }, 'Export CSV'),
    button({ onclick: () => alert(JSON.stringify(grid.selectedRows().map((r) => r.name))) }, 'Show selected'),
);

export const SampleGrid = div(
    h2({}, 'Products'),
    p({}, 'Local JSON data – sort, filter, group, page, select, edit, add, delete. No server involved.'),
    actions,
    grid,
);                    // as a child, or DataGrid.mount('#app', {...})
// grid.refresh();               // grid is also the control API
// grid.sortBy('name', 'asc');
// grid.selectedRows();