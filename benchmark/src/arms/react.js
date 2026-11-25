import { createElement as h, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { dataCells } from '../data.js';

/**
 * React 19 — the published suite's shape: one state array, one render pass over
 * it, keyed children, no memo. Every mutation therefore replaces the array and
 * re-creates all row vnodes; the diff is what keeps the DOM work down.
 *
 * State lives in a tiny external store so the harness can drive updates from
 * plain functions (like a click handler) without threading setters around.
 */
export const meta = {
    id: 'react',
    label: 'React 19',
    detail: 'createRoot + keyed map, no memo'
};

export function create(container) {
    let model = { rows: [], selected: -1 };
    const listeners = new Set();
    const subscribe = listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    const commit = next => {
        model = next;
        for (const notify of listeners) notify();
    };

    function Table() {
        const { rows, selected } = useSyncExternalStore(subscribe, () => model);
        return h('table', { className: 'bench' },
            h('tbody', null, rows.map(row => h('tr', {
                key: row.id,
                className: row.selected ? 'danger' : ''
            },
                h('td', { className: 'col1' }, h('a', null, row.label)),
                h('td', { className: 'col-md-hidden' }, h('a', null, row.text)),
                ...dataCells(row).map((cell, index) => h('td', { key: index, className: 'col-sm-hidden' },
                    h('span', { className: cell.cls }, cell.pair),
                    h('a', null, cell.link)
                ))
            )))
        );
    }

    const root = createRoot(container);
    root.render(h(Table));

    const wrap = specs => specs.map(spec => ({ ...spec, selected: false }));
    const patch = (rows, index, changes) => rows.map((row, i) => i === index ? { ...row, ...changes } : row);

    return {
        get tbody() { return container.querySelector('tbody'); },
        render(specs) {
            commit({ rows: wrap(specs), selected: -1 });
        },
        updateTenth(indices, text) {
            const targets = new Set(indices);
            commit({
                selected: model.selected,
                rows: model.rows.map((row, i) => targets.has(i) ? { ...row, label: text } : row)
            });
        },
        select(index, text) {
            let rows = model.rows;
            if (model.selected >= 0) rows = patch(rows, model.selected, { selected: false, label: '' });
            commit({ rows: patch(rows, index, { selected: true, label: text }), selected: index });
        },
        swap(aIndex, bIndex) {
            const rows = model.rows.slice();
            const tmp = rows[aIndex];
            rows[aIndex] = rows[bIndex];
            rows[bIndex] = tmp;
            commit({ rows, selected: model.selected });
        },
        remove(index) {
            const rows = model.rows.slice();
            rows.splice(index, 1);
            commit({ rows, selected: index === model.selected ? -1 : model.selected });
        },
        clear() {
            commit({ rows: [], selected: -1 });
        },
        destroy() {
            root.unmount();
        }
    };
}
