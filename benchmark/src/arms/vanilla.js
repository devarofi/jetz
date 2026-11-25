import { dataCells } from '../data.js';

/**
 * Raw DOM — the reference baseline every published chart normalizes to.
 *
 * No framework: rows are built once with createElement and then mutated in
 * place (textContent for a label change, insertBefore for a swap, removeChild
 * for a delete). This is the floor the other three arms are measured against;
 * anything here costs the same in every browser without a runtime.
 *
 * Ops contract shared by all arms:
 *   render(specs)              replace the whole table
 *   updateTenth(indices, text) write a label into the given indices
 *   select(index, text)        mark one row selected, clear the previous
 *   swap(a, b)                 exchange two rows, moving their DOM nodes
 *   remove(index)              drop one row
 *   clear()                    empty the table
 *   destroy()                  tear the arm down
 */
export const meta = {
    id: 'vanilla',
    label: 'Raw DOM',
    detail: 'createElement + textContent, no runtime'
};

export function create(container) {
    const table = document.createElement('table');
    table.className = 'bench';
    const tbody = document.createElement('tbody');
    table.append(tbody);
    container.append(table);

    /** @type {{spec: object, tr: HTMLTableRowElement, labelEl: HTMLAnchorElement, selected: boolean}[]} */
    let items = [];
    let selected = -1;

    function build(spec) {
        const tr = document.createElement('tr');

        const col1 = document.createElement('td');
        col1.className = 'col1';
        const label = document.createElement('a');
        label.textContent = spec.label;
        col1.append(label);

        const md = document.createElement('td');
        md.className = 'col-md-hidden';
        const mdLink = document.createElement('a');
        mdLink.textContent = spec.text;
        md.append(mdLink);

        tr.append(col1, md);
        for (const cell of dataCells(spec)) {
            const td = document.createElement('td');
            td.className = 'col-sm-hidden';
            const span = document.createElement('span');
            span.className = cell.cls;
            span.textContent = cell.pair;
            const link = document.createElement('a');
            link.textContent = cell.link;
            td.append(span, link);
            tr.append(td);
        }
        return { spec, tr, labelEl: label, selected: false };
    }

    function mark(item) {
        item.tr.className = item.selected ? 'danger' : '';
        item.labelEl.textContent = item.spec.label;
    }

    return {
        tbody,
        render(specs) {
            items = specs.map(build);
            const frag = document.createDocumentFragment();
            for (const item of items) frag.append(item.tr);
            tbody.replaceChildren(frag);
        },
        updateTenth(indices, text) {
            for (const i of indices) {
                const item = items[i];
                if (!item) continue;
                item.spec.label = text;
                item.labelEl.textContent = text;
            }
        },
        select(index, text) {
            if (selected >= 0 && items[selected]) {
                items[selected].selected = false;
                items[selected].spec.label = '';
                mark(items[selected]);
            }
            const item = items[index];
            if (!item) return;
            item.selected = true;
            item.spec.label = text;
            mark(item);
            selected = index;
        },
        swap(a, b) {
            const itemA = items[a];
            const itemB = items[b];
            if (!itemA || !itemB) return;
            items[a] = itemB;
            items[b] = itemA;
            // A real node move, not a rebuild: this is what a keyed list pays for.
            const marker = document.createComment('swap');
            tbody.insertBefore(marker, itemB.tr);
            tbody.insertBefore(itemB.tr, itemA.tr);
            tbody.insertBefore(itemA.tr, marker);
            marker.remove();
        },
        remove(index) {
            const item = items[index];
            if (!item) return;
            items.splice(index, 1);
            item.tr.remove();
        },
        clear() {
            items = [];
            selected = -1;
            tbody.replaceChildren();
        },
        destroy() {
            items = [];
            table.remove();
        }
    };
}
