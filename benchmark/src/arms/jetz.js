import { batch, computed, Jetz, listOf, loop, rawOf, rowOf, touchRow } from '../../../packages/jetz/src/jetz.js';
import { a, css, span, table, tbody, td, tr } from '../../../packages/jetz/src/jetz-ui.js';
import { dataCells } from '../data.js';

/**
 * Jetz — reactive list + keyed loop.
 *
 * Rows are `rowOf` records: one version signal per row rather than one State per
 * property, which is the shape Jetz documents for large tables. Immutable cells
 * (the text column and the six data cells) are plain children written once; only
 * the label cell and the row's class are bound, so a label write repaints one
 * anchor and a select repaints two rows — never the table.
 *
 * The list itself is a `listOf` reconciled by `loop(rows, row => row.id, …)`, so
 * a swap moves the existing row views instead of rebuilding them.
 */
export const meta = {
    id: 'jetz',
    label: 'Jetz',
    detail: 'listOf + keyed loop + rowOf records'
};

export function create(container) {
    const rows = listOf();
    let selected = -1;

    const RowView = row => tr(
        css(() => row.selected ? 'danger' : ''),
        td({ class: 'col1' }, a(computed(() => row.label))),
        td({ class: 'col-md-hidden' }, a(row.text)),
        ...dataCells(row).map(cell => td(
            { class: 'col-sm-hidden' },
            span({ class: cell.cls }, cell.pair),
            a(cell.link)
        ))
    );

    Jetz.mount(
        table({ class: 'bench' }, tbody(loop(rows, row => row.id, RowView))),
        container
    );

    return {
        tbody: container.querySelector('tbody'),
        render(specs) {
            rows.set(specs.map(spec => rowOf({ ...spec, selected: false })));
        },
        updateTenth(indices, text) {
            batch(() => {
                for (const i of indices) {
                    const row = rows.values[i];
                    if (!row) continue;
                    rawOf(row).label = text;
                    touchRow(row);
                }
            });
        },
        select(index, text) {
            batch(() => {
                const previous = rows.values[selected];
                if (previous) {
                    rawOf(previous).selected = false;
                    rawOf(previous).label = '';
                    touchRow(previous);
                }
                const row = rows.values[index];
                if (!row) return;
                rawOf(row).selected = true;
                rawOf(row).label = text;
                touchRow(row);
            });
            selected = index;
        },
        swap(aIndex, bIndex) {
            // The honest move: exchange the two entries and commit once, letting
            // the keyed reconciler re-anchor the rows. The reconciler keeps the
            // longest already-ordered run and moves only the rest, so this swap
            // costs 4 node operations, not the ~1,900 a forward-only walk used to
            // pay. Two `replaceAt()` calls instead would look cheap (8 mutations)
            // only because the intermediate list briefly holds one row twice and
            // drops the other, so the reconciler deletes and rebuilds a row view
            // instead of moving it. That is a different operation, so the
            // benchmark pays for the real move.
            const values = rows.values.slice();
            const itemA = values[aIndex];
            const itemB = values[bIndex];
            if (!itemA || !itemB) return;
            values[aIndex] = itemB;
            values[bIndex] = itemA;
            rows.set(values);
        },
        remove(index) {
            rows.removeAt(index);
            if (selected === index) selected = -1;
            else if (selected > index) selected -= 1;
        },
        clear() {
            selected = -1;
            rows.clear();
        },
        destroy() {
            Jetz.unmount(container);
        }
    };
}
