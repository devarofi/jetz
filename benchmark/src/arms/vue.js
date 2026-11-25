import { createApp, h, reactive, shallowRef } from 'vue';
import { dataCells } from '../data.js';

/**
 * Vue 3 — the published suite's shape: one render function over a keyed list.
 *
 * The list is a `shallowRef` (reassigning it is what signals a structural
 * change) and each row is a `reactive` object, so a label write is picked up
 * without deep-walking 10,000 rows on the way in. Because the whole table is a
 * single render function, any row change re-runs it and Vue's keyed diff decides
 * what actually touches the DOM.
 */
export const meta = {
    id: 'vue',
    label: 'Vue 3',
    detail: 'shallowRef list + reactive rows, keyed diff'
};

export function create(container) {
    const list = shallowRef([]);
    let selected = -1;

    const App = {
        render() {
            return h('table', { class: 'bench' },
                h('tbody', null, list.value.map(row => h('tr', {
                    key: row.id,
                    class: row.selected ? 'danger' : ''
                },
                    h('td', { class: 'col1' }, h('a', null, row.label)),
                    h('td', { class: 'col-md-hidden' }, h('a', null, row.text)),
                    ...dataCells(row).map(cell => h('td', { class: 'col-sm-hidden' },
                        h('span', { class: cell.cls }, cell.pair),
                        h('a', null, cell.link)
                    ))
                )))
            );
        }
    };

    const app = createApp(App);
    app.mount(container);

    return {
        get tbody() { return container.querySelector('tbody'); },
        render(specs) {
            list.value = specs.map(spec => reactive({ ...spec, selected: false }));
            selected = -1;
        },
        updateTenth(indices, text) {
            const rows = list.value;
            for (const i of indices) {
                const row = rows[i];
                if (row) row.label = text;
            }
        },
        select(index, text) {
            const rows = list.value;
            if (selected >= 0 && rows[selected]) {
                rows[selected].selected = false;
                rows[selected].label = '';
            }
            const row = rows[index];
            if (!row) return;
            row.selected = true;
            row.label = text;
            selected = index;
        },
        swap(aIndex, bIndex) {
            const rows = list.value.slice();
            const tmp = rows[aIndex];
            rows[aIndex] = rows[bIndex];
            rows[bIndex] = tmp;
            list.value = rows;
        },
        remove(index) {
            const rows = list.value.slice();
            rows.splice(index, 1);
            list.value = rows;
            if (selected === index) selected = -1;
            else if (selected > index) selected -= 1;
        },
        clear() {
            list.value = [];
            selected = -1;
        },
        destroy() {
            app.unmount();
        }
    };
}
