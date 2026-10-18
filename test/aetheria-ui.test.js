import { describe, it, expect, afterEach } from 'vitest';
import * as Aetheria from '../src/aetheria-ui/aetheria-ui.js';
import { Jetz, stateOf, computed, listOf } from '../src/lib/jetz.js';
import { div, span } from '../src/lib/jetz-ui.js';

/** Dismissed panels stay mounted while their exit animation plays; wait it out. */
const settled = () => new Promise(resolve => setTimeout(resolve, 200));

describe('Aetheria UI in Jetz', () => {
    // Portalled dialogs and ripples attach to body, so every test starts from a clean one.
    afterEach(() => { document.body.innerHTML = ''; });


    it('exports all roadmap components', () => {
        expect(Aetheria.Button).toBeDefined();
        expect(Aetheria.IconButton).toBeDefined();
        expect(Aetheria.TextInput).toBeDefined();
        expect(Aetheria.TextArea).toBeDefined();
        expect(Aetheria.Checkbox).toBeDefined();
        expect(Aetheria.Radio).toBeDefined();
        expect(Aetheria.Switch).toBeDefined();
        expect(Aetheria.Select).toBeDefined();
        expect(Aetheria.MultiSelect).toBeDefined();
        expect(Aetheria.Slider).toBeDefined();
        expect(Aetheria.RangeSlider).toBeDefined();
        expect(Aetheria.Badge).toBeDefined();
        expect(Aetheria.Avatar).toBeDefined();
        expect(Aetheria.Card).toBeDefined();
        expect(Aetheria.Spinner).toBeDefined();
        expect(Aetheria.ProgressBar).toBeDefined();
        expect(Aetheria.Dropdown).toBeDefined();
        expect(Aetheria.ContextMenu).toBeDefined();
        expect(Aetheria.Autocomplete).toBeDefined();
        expect(Aetheria.Tabs).toBeDefined();
        expect(Aetheria.Accordion).toBeDefined();
        expect(Aetheria.Modal).toBeDefined();
        expect(Aetheria.Drawer).toBeDefined();
        expect(Aetheria.Tooltip).toBeDefined();
        expect(Aetheria.Popover).toBeDefined();
        expect(Aetheria.DatePicker).toBeDefined();
        expect(Aetheria.DateRangePicker).toBeDefined();
        expect(Aetheria.Calendar).toBeDefined();
        expect(Aetheria.FormValidation).toBeDefined();
        expect(Aetheria.Pagination).toBeDefined();
        expect(Aetheria.Breadcrumb).toBeDefined();
        expect(Aetheria.DataGrid).toBeDefined();
        expect(Aetheria.TreeView).toBeDefined();
        expect(Aetheria.TreeGrid).toBeDefined();
        expect(Aetheria.ListView).toBeDefined();
        expect(Aetheria.CommandToolbar).toBeDefined();
        expect(Aetheria.FileManager).toBeDefined();
        expect(Aetheria.SortableList).toBeDefined();
        expect(Aetheria.Chart).toBeDefined();
        expect(Aetheria.Sparkline).toBeDefined();
        expect(Aetheria.Scheduler).toBeDefined();
        expect(Aetheria.Gantt).toBeDefined();
        expect(Aetheria.Spreadsheet).toBeDefined();
        expect(Aetheria.RichTextEditor).toBeDefined();
        expect(Aetheria.PivotGrid).toBeDefined();
        expect(Aetheria.PdfViewer).toBeDefined();
    });

    it('can render Button and Card components', () => {
        const btn = new Aetheria.Button().render({ label: 'Hello Glass' });
        expect(btn).toBeDefined();
        const card = new Aetheria.Card().render({ title: 'Glass Card' });
        expect(card).toBeDefined();
    });

    it('renders a spaced, responsive Pagination control and preserves navigation', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        const changedPages = [];
        Jetz.mount(new Aetheria.Pagination().render({
            totalPages: 5,
            currentPage: 2,
            onchange: page => changedPages.push(page)
        }), target);

        const pagination = target.querySelector('.aetheria-pagination');
        const activePage = () => target.querySelector('[aria-current="page"]');
        expect(pagination.getAttribute('aria-label')).toBe('Pagination');
        expect(activePage().textContent).toBe('2');
        expect(target.querySelector('.aetheria-pagination-pages').children).toHaveLength(5);
        expect(getComputedStyle(pagination).flexWrap).toBe('nowrap');
        expect(getComputedStyle(target.querySelector('.aetheria-pagination-pages')).flexWrap).toBe('nowrap');
        const paginationStyles = document.querySelector('#aetheria-styles').textContent;
        expect(paginationStyles).toMatch(/\.aetheria-pagination-btn[\s\S]{0,220}?min-width: var\(--aetheria-control-md\)/);
        expect(paginationStyles).toMatch(/\.aetheria-pagination-btn[\s\S]{0,220}?padding: 0 var\(--aetheria-space-2\)/);
        expect(paginationStyles).toContain('--aetheria-control-md: 44px');
        expect(document.querySelector('#aetheria-styles').textContent).toContain('.aetheria-pagination-pages');

        target.querySelector('[aria-label="Next page"]').click();
        expect(activePage().textContent).toBe('3');
        target.querySelector('[aria-label="Page 5"]').click();
        expect(activePage().textContent).toBe('5');
        expect(target.querySelector('[aria-label="Next page"]').disabled).toBe(true);
        target.querySelector('[aria-label="Previous page"]').click();
        expect(activePage().textContent).toBe('4');
        expect(changedPages).toEqual([3, 5, 4]);
    });

    it('transitions modal and drawer open and closed with reduced-motion support', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        const modalOpen = stateOf(true);
        const drawerOpen = stateOf(true);
        Jetz.mount(div(
            new Aetheria.Modal().render({ open: modalOpen, title: 'Animated modal' }),
            new Aetheria.Drawer().render({ open: drawerOpen, title: 'Animated drawer' })
        ), target);

        const modalBackdrop = target.querySelector('.aetheria-modal-backdrop');
        const modalDialog = target.querySelector('.aetheria-modal-dialog');
        const drawerBackdrop = target.querySelector('.aetheria-drawer-backdrop');
        const drawer = target.querySelector('.aetheria-drawer');
        expect(modalBackdrop.classList.contains('is-open')).toBe(true);
        expect(modalDialog.classList.contains('is-open')).toBe(true);
        expect(drawerBackdrop.classList.contains('is-open')).toBe(true);
        expect(drawer.classList.contains('is-open')).toBe(true);

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toMatch(/\.aetheria-modal-backdrop[\s\S]*opacity: 0/);
        expect(styles).toMatch(/\.aetheria-modal-dialog\.is-open\s*\{\s*transform: none; opacity: 1/);
        expect(styles).toMatch(/\.aetheria-drawer\s*\{[\s\S]*?transform: translateX\(100%\)/);
        expect(styles).toMatch(/\.aetheria-drawer\.is-open\s*\{\s*transform: none/);
        expect(styles).toContain('transition: opacity var(--aetheria-fast), visibility var(--aetheria-fast)');
        expect(styles).toContain('@media (prefers-reduced-motion: reduce)');

        modalDialog.querySelector('[aria-label="Close dialog"]').click();
        drawer.querySelector('[aria-label="Close drawer"]').click();
        expect(modalBackdrop.classList.contains('is-open')).toBe(false);
        expect(modalBackdrop.getAttribute('aria-hidden')).toBe('true');
        expect(drawerBackdrop.classList.contains('is-open')).toBe(false);
        expect(drawerBackdrop.getAttribute('aria-hidden')).toBe('true');
        expect(target.contains(modalBackdrop)).toBe(true);
        expect(target.contains(drawerBackdrop)).toBe(true);
    });

    it('renders the docs modal and drawer outside clipped showcase previews', async () => {
        const { AetheriaDocs } = await import('../src/aetheria-ui/aetheria-docs.js');
        const target = document.createElement('div');
        Jetz.mount(new AetheriaDocs().render(), target);

        const buttons = [...target.querySelectorAll('button')];
        buttons.find(button => button.textContent === 'Open Dialog').click();
        const modal = target.querySelector('.aetheria-modal-backdrop');
        expect(modal).not.toBeNull();
        expect(modal.closest('.aetheria-glass')).toBeNull();
        modal.querySelector('button').click();
        expect(modal.classList.contains('is-open')).toBe(false);
        expect(target.contains(modal)).toBe(true);

        buttons.find(button => button.textContent === 'Open Drawer').click();
        const drawer = target.querySelector('.aetheria-drawer-backdrop');
        expect(drawer).not.toBeNull();
        expect(drawer.closest('.aetheria-glass')).toBeNull();
        drawer.querySelector('button').click();
        expect(drawer.classList.contains('is-open')).toBe(false);
        expect(target.contains(drawer)).toBe(true);
    });

    it('renders the custom Select options inside the unclipped live preview', async () => {
        const { AetheriaDocs } = await import('../src/aetheria-ui/aetheria-docs.js');
        const target = document.createElement('div');
        Jetz.mount(new AetheriaDocs().render(), target);

        const heading = [...target.querySelectorAll('h3')]
            .find(item => item.textContent === 'Select & MultiSelect');
        const showcase = heading.closest('.aetheria-showcase-overflow-visible');
        const preview = showcase.querySelector('.aetheria-showcase-preview');
        const select = preview.querySelector('[role="combobox"]');
        expect(showcase).not.toBeNull();
        expect(getComputedStyle(showcase).overflow).toBe('visible');
        expect(getComputedStyle(preview).overflow).toBe('visible');
        select.click();
        const options = preview.querySelectorAll('[role="option"]');
        expect(options).toHaveLength(3);
        expect(options[1].textContent).toContain('Frontend and platform development');
        expect(options[1].classList.contains('is-active')).toBe(true);
        expect(getComputedStyle(preview.querySelector('.aetheria-select-menu')).position).toBe('absolute');
    });

    it('supports styled Select options, keyboard selection, disabled options, and change callbacks', () => {
        const target = document.createElement('div');
        const value = stateOf('engineering');
        const changes = [];
        Jetz.mount(new Aetheria.Select().render({
            value,
            options: [
                { value: 'design', label: 'Design', description: 'Create product visuals' },
                { value: 'engineering', label: 'Engineering', description: 'Build and maintain software' },
                { value: 'disabled', label: 'Unavailable', disabled: true }
            ],
            onchange: next => changes.push(next)
        }), target);

        const trigger = target.querySelector('[role="combobox"]');
        expect(trigger.textContent).toContain('Engineering');
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        const options = [...target.querySelectorAll('[role="option"]')];
        expect(options[2].disabled).toBe(true);
        expect(options[2].classList.contains('is-active')).toBe(false);
        expect(target.querySelector('[role="option"].is-active').textContent).toContain('Design');
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(value.value).toBe('design');
        expect(changes).toEqual(['design']);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(target.querySelector('[role="listbox"]').getAttribute('aria-hidden')).toBe('true');
        expect(target.querySelector('[role="option"][aria-selected="true"]').textContent).toContain('Design');
    });

    it('filters and sorts DataGrid rows', () => {
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.DataGrid().render({
            columns: ['name', 'city'],
            rows: [
                { name: 'Grace Hopper', city: 'New York' },
                { name: 'Ada Lovelace', city: 'London' },
                { name: 'Alan Turing', city: 'Manchester' }
            ]
        }), target);

        const gridRows = () => [...target.querySelectorAll('tbody tr')].map(row => row.textContent);
        expect(gridRows()).toHaveLength(3);

        const filter = target.querySelector('input[type="search"]');
        filter.value = 'Grace';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
        expect(gridRows()).toEqual(['Grace HopperNew York']);

        filter.value = '';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
        const sortButtons = target.querySelectorAll('.aetheria-datagrid-sort');
        expect(sortButtons).toHaveLength(2);
        expect(sortButtons[0].classList.contains('aetheria-btn')).toBe(false);
        const gridStyles = document.querySelector('#aetheria-styles').textContent;
        expect(sortButtons[0].querySelector('.aetheria-datagrid-sort-icon svg.aetheria-icon')).not.toBeNull();
        expect(sortButtons[0].getAttribute('aria-sort')).toBe('none');
        expect(getComputedStyle(sortButtons[0]).cursor).toBe('pointer');
        expect(gridStyles).toMatch(/button\.aetheria-datagrid-sort\s*\{[^}]*padding: 0;/);
        expect(gridStyles).toMatch(/\.aetheria-datagrid\s*\{[^}]*padding: var\(--aetheria-space-4\)/);
        expect(gridStyles).toMatch(/\.aetheria-datagrid-table tbody td\s*\{[^}]*padding: var\(--aetheria-space-3\)/);
        expect(gridStyles).toContain('.aetheria-datagrid-sort-icon');
        target.querySelector('.aetheria-datagrid-sort').click();
        expect(target.querySelector('.aetheria-datagrid-sort').getAttribute('aria-sort')).toBe('ascending');
        expect(gridRows()[0]).toBe('Ada LovelaceLondon');
        target.querySelector('.aetheria-datagrid-sort').click();
        expect(target.querySelector('.aetheria-datagrid-sort').getAttribute('aria-sort')).toBe('descending');
        expect(gridRows()[0]).toBe('Grace HopperNew York');
        expect(target.querySelector('thead th').getAttribute('scope')).toBe('col');
        expect(document.querySelector('#aetheria-styles').textContent).toContain('.aetheria-datagrid-table tbody td');
        expect(document.querySelector('#aetheria-styles').textContent).toContain('.aetheria-datagrid-sort-icon');
    });

    it('supports paging, selectable rows, custom cells, expandable details, and row events', () => {
        const target = document.createElement('div');
        const pageChanges = [];
        const selectionChanges = [];
        const rowClicks = [];
        const expansionChanges = [];
        const filterChanges = [];
        const sortChanges = [];
        const data = [
            { id: 1, name: 'Ada', score: 9 },
            { id: 2, name: 'Alan', score: 8 },
            { id: 3, name: 'Grace', score: 10 }
        ];
        Jetz.mount(new Aetheria.DataGrid().render({
            columns: [
                { key: 'name', label: 'Engineer', render: value => span(`@${value}`) },
                { key: 'score', label: 'Score', align: 'right', sortable: false }
            ],
            rows: data,
            pageable: true,
            pageSize: 2,
            pageSizeOptions: [2, 3],
            selectable: true,
            expandable: true,
            renderDetails: row => div({ class: 'row-detail' }, `${row.name} details`),
            onpagechange: (page, size) => pageChanges.push([page, size]),
            onselectionchange: rows => selectionChanges.push(rows.map(row => row.id)),
            onrowclick: row => rowClicks.push(row.id),
            onrowexpand: (row, expanded) => expansionChanges.push([row.id, expanded]),
            onfilterchange: query => filterChanges.push(query),
            onsortchange: (key, direction) => sortChanges.push([key, direction])
        }), target);

        expect([...target.querySelectorAll('tbody tr')]).toHaveLength(2);
        expect(target.querySelector('tbody tr td:nth-child(3)').textContent).toBe('@Ada');
        expect(getComputedStyle(target.querySelector('tbody tr td:nth-child(4)')).textAlign).toBe('right');
        expect(target.querySelector('.aetheria-datagrid-page-current').textContent).toBe('Page 1 of 2');
        expect(target.querySelector('.aetheria-datagrid-page-size').value).toBe('2');
        expect(target.querySelector('.aetheria-datagrid-page-size option:checked').textContent).toBe('2');

        const firstRowCheckbox = target.querySelector('[aria-label="Select row 1"]');
        firstRowCheckbox.checked = true;
        firstRowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        expect(target.querySelector('tbody tr').classList.contains('is-selected')).toBe(true);
        expect(selectionChanges).toEqual([[1]]);
        const selectPageCheckbox = target.querySelector('[aria-label="Select all rows on this page"]');
        selectPageCheckbox.checked = true;
        selectPageCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        expect(selectionChanges).toEqual([[1], [1, 2]]);
        expect(target.querySelectorAll('tbody tr.is-selected')).toHaveLength(2);
        target.querySelector('[aria-label="Expand row details"]').click();
        expect(target.querySelector('.row-detail').textContent).toBe('Ada details');
        expect(expansionChanges).toEqual([[1, true]]);

        target.querySelector('[aria-label="Next grid page"]').click();
        expect(target.querySelector('tbody tr td:nth-child(3)').textContent).toBe('@Grace');
        expect(target.querySelector('.aetheria-datagrid-page-current').textContent).toBe('Page 2 of 2');
        expect(pageChanges).toEqual([[2, 2]]);
        target.querySelector('tbody tr').click();
        expect(rowClicks).toEqual([3]);
        target.querySelector('[aria-label="Previous grid page"]').click();
        target.querySelector('.aetheria-datagrid-page-size').value = '3';
        target.querySelector('.aetheria-datagrid-page-size').dispatchEvent(new Event('change', { bubbles: true }));
        expect(pageChanges).toEqual([[2, 2], [1, 2], [1, 3]]);
        expect(target.querySelector('.aetheria-datagrid-page-size').value).toBe('3');
        expect(target.querySelector('.aetheria-datagrid-page-size option:checked').textContent).toBe('3');
        expect(target.querySelectorAll('tbody tr:not(.aetheria-datagrid-detail-row)')).toHaveLength(3);
        const filter = target.querySelector('input[type="search"]');
        filter.value = 'Ada';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
        expect(filterChanges).toEqual(['Ada']);
        expect(target.querySelectorAll('tbody tr:not(.aetheria-datagrid-detail-row)')).toHaveLength(1);
        filter.value = '';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
        target.querySelector('.aetheria-datagrid-sort').click();
        expect(sortChanges).toEqual([['name', 'ascending']]);
    });

    it('supports callback-driven server paging with external row totals', () => {
        const target = document.createElement('div');
        const requestedPages = [];
        const page = stateOf(1);
        Jetz.mount(new Aetheria.DataGrid().render({
            columns: ['name'],
            rows: [{ name: 'Current page row' }],
            pageable: true,
            serverSide: true,
            totalRows: 11,
            page,
            pageSize: 5,
            onpagechange: (requestedPage, size) => requestedPages.push([requestedPage, size])
        }), target);

        expect(target.querySelector('.aetheria-datagrid-page-summary').textContent).toBe('1–5 of 11');
        target.querySelector('[aria-label="Next grid page"]').click();
        expect(page.value).toBe(2);
        expect(requestedPages).toEqual([[2, 5]]);
        expect(target.querySelector('.aetheria-datagrid-page-current').textContent).toBe('Page 2 of 3');
        expect(target.querySelector('tbody td').textContent).toBe('Current page row');
    });

    it('updates the virtual ListView window on scroll', () => {
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.ListView().render({
            items: Array.from({ length: 20 }, (_, index) => `Item ${index + 1}`),
            itemHeight: 20,
            visibleCount: 3
        }), target);

        const scroller = target.firstElementChild;
        const visibleItems = () => [...target.querySelector('.aetheria-glass > div').children]
            .map(item => item.textContent);

        expect(visibleItems()[0]).toBe('Item 1');
        scroller.scrollTop = 100;
        scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
        expect(visibleItems()[0]).toBe('Item 6');
        expect(visibleItems()).toHaveLength(5);
    });

    it('renders grouped glass tabs with an aligned active underline', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.Tabs().render({
            label: 'Account settings',
            tabs: [
                { label: 'Profile', content: 'Profile settings' },
                { label: 'Security', content: 'Security settings' }
            ]
        }), target);

        const tabs = [...target.querySelectorAll('[role="tab"]')];
        expect(target.querySelector('[role="tablist"]').getAttribute('aria-label')).toBe('Account settings');
        expect(tabs).toHaveLength(2);
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
        expect(tabs[0].getAttribute('tabindex')).toBe('0');
        expect(tabs[1].getAttribute('aria-selected')).toBe('false');
        expect(target.querySelector('[role="tabpanel"]').textContent).toBe('Profile settings');

        tabs[1].click();
        expect(tabs[0].getAttribute('aria-selected')).toBe('false');
        expect(tabs[1].getAttribute('aria-selected')).toBe('true');
        expect(target.querySelector('[role="tabpanel"]').textContent).toBe('Security settings');

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toContain('.aetheria-tab-btn.active::after');
        expect(styles).toContain('.aetheria-tab-panel {');
        expect(styles).toContain('padding: var(--aetheria-space-5)');
    });

    it('stacks accordion cards with aligned trigger and body padding', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.Accordion().render({
            items: [
                { title: 'General', content: 'Core configuration.' },
                { title: 'Advanced', content: 'Expert controls.' }
            ]
        }), target);

        const root = target.querySelector('.aetheria-accordion');
        const items = [...target.querySelectorAll('.aetheria-accordion-item')];
        expect(root).not.toBeNull();
        expect(target.querySelector('.aetheria-accordion-list').children).toHaveLength(2);
        expect(items).toHaveLength(2);
        expect(items[0].classList.contains('aetheria-glass')).toBe(true);
        expect(items[0].querySelector('.aetheria-accordion-trigger').getAttribute('aria-expanded')).toBe('false');
        expect(items[0].querySelector('.aetheria-accordion-body').textContent).toBe('Core configuration.');

        items[0].querySelector('.aetheria-accordion-trigger').click();
        expect(items[0].querySelector('.aetheria-accordion-trigger').getAttribute('aria-expanded')).toBe('true');
        expect(items[0].querySelector('.aetheria-accordion-content').classList.contains('is-open')).toBe(true);
        expect(items[1].querySelector('.aetheria-accordion-content').classList.contains('is-open')).toBe(false);

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toContain('.aetheria-accordion-list');
        expect(styles).not.toContain('.aetheria-accordion-item { border-bottom');
    });

    it('provides readable contrast and visible hover feedback across component surfaces', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        Jetz.mount(div(
            new Aetheria.Dropdown().render({ items: ['Open item'] }),
            new Aetheria.Autocomplete().render({ items: ['Matching item'] }),
            new Aetheria.Calendar().render(),
            new Aetheria.Accordion().render({ items: [{ title: 'Section', content: 'Content' }] }),
            new Aetheria.TreeView().render({ nodes: [{ label: 'Folder', children: [] }] }),
            new Aetheria.FileManager().render({ files: [{ name: 'Document' }] }),
            new Aetheria.SortableList().render({ items: ['Sortable'] }),
            new Aetheria.ListView().render({ items: ['List row'] })
        ), target);

        target.querySelector('.aetheria-btn-secondary').click();
        const autocomplete = target.querySelector('input.aetheria-field');
        autocomplete.value = 'Matching';
        autocomplete.dispatchEvent(new Event('input', { bubbles: true }));

        expect(target.querySelector('.aetheria-dropdown-item')).not.toBeNull();
        expect(target.querySelector('.aetheria-autocomplete-item')).not.toBeNull();
        expect(target.querySelector('.aetheria-calendar-day')).not.toBeNull();
        expect(target.querySelector('.aetheria-accordion-trigger')).not.toBeNull();
        expect(target.querySelector('.aetheria-tree-trigger')).not.toBeNull();
        expect(target.querySelector('.aetheria-file-item')).not.toBeNull();
        expect(target.querySelector('.aetheria-sortable-item')).not.toBeNull();
        expect(target.querySelector('.aetheria-list-item')).not.toBeNull();

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toContain('.aetheria-dropdown-item:hover');
        expect(styles).toContain('.aetheria-autocomplete-item:hover');
        expect(styles).toContain('.aetheria-calendar-day:not(.is-selected):hover');
        expect(styles).toContain('.aetheria-accordion-trigger:hover');
        expect(styles).toContain('.aetheria-tree-trigger:hover');
        expect(styles).toContain('.aetheria-file-item:hover');
        expect(styles).toContain('.aetheria-sortable-item:hover');
        expect(styles).toContain('.aetheria-list-item:hover');
        expect(styles).toContain('--aetheria-text-muted: #bac9e0');
        expect(styles).toContain('--aetheria-accent: #8ab4ff');
        expect(styles).toContain('color: var(--aetheria-text-muted)');
        expect(styles).toContain('.aetheria-btn-muted:hover:not(:disabled)');
    });

    it('keeps flush tables aligned with card padding and controls tappable', () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        Jetz.mount(div(
            new Aetheria.Calendar().render(),
            new Aetheria.Checkbox().render({ label: 'Accept terms' }),
            new Aetheria.DataGrid().render({ columns: ['name'], rows: [{ name: 'Ada' }] }),
            new Aetheria.Spreadsheet().render({ rows: 1, cols: 1 }),
            new Aetheria.PivotGrid().render()
        ), target);

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toContain('--aetheria-space-4: 16px');
        expect(styles).toContain('--aetheria-radius-lg: 16px');
        expect(styles).toContain('box-sizing: border-box');
        // Bleeding a table past the card padding would push its 12px cell text
        // out of alignment with the 20px inset every other card child uses.
        expect(styles).toContain('.aetheria-table-flush { margin: 0; }');
        expect(styles).not.toContain('.aetheria-panel .aetheria-table-flush');
        expect(styles).not.toContain('backdrop-filter: blur(22px)');
        expect(styles).toMatch(/\.aetheria-tree-trigger\s*\{[^}]*height: 24px/);
        expect(styles).toMatch(/button\.aetheria-datagrid-sort\s*\{[^}]*min-height: 24px/);
        expect(styles).toContain('--aetheria-control-md: 44px');
        expect(styles).toMatch(/\.aetheria-calendar-day\s*\{[^}]*min-height: var\(--aetheria-control-md\)/);
        expect(target.querySelector('.aetheria-control-label')).not.toBeNull();
        expect(target.querySelector('.aetheria-table-scroll .aetheria-table').classList.contains('aetheria-table-flush')).toBe(false);
        expect(target.querySelectorAll('.aetheria-table-flush')).toHaveLength(2);
    });

    it('supports calendar view changes, navigation, selection, and date constraints', () => {
        const target = document.createElement('div');
        const selectedDates = [];
        Jetz.mount(new Aetheria.Calendar().render({
            value: '2024-05-15',
            min: '2024-05-10',
            max: '2025-06-10',
            disabledDates: ['2024-05-20'],
            onchange: (date, key) => selectedDates.push(key)
        }), target);

        expect(target.querySelector('[aria-label="Choose month, May 2024"]')).not.toBeNull();
        expect(target.querySelector('[aria-label="Wednesday, May 8, 2024"]').disabled).toBe(true);
        expect(target.querySelector('[aria-label="Monday, May 20, 2024"]').disabled).toBe(true);
        expect(target.querySelector('.aetheria-calendar-mode-list')).toBeNull();
        target.querySelector('[aria-label="Thursday, May 16, 2024"]').click();
        expect(selectedDates).toEqual(['2024-05-16']);
        expect(target.querySelector('[aria-label="Thursday, May 16, 2024"]').getAttribute('aria-pressed')).toBe('true');

        target.querySelector('[aria-label="Choose month, May 2024"]').click();
        expect(target.querySelector('[aria-label="Choose June"]')).not.toBeNull();
        target.querySelector('[aria-label="Choose year, 2024"]').click();
        expect(target.querySelector('.aetheria-calendar-year-grid')).not.toBeNull();
        target.querySelector('[aria-label="Choose year 2025"]').click();
        expect(target.querySelector('[aria-label="Choose June"]')).not.toBeNull();
        target.querySelector('[aria-label="Choose June"]').click();
        expect(target.querySelector('[aria-label="Choose month, June 2025"]')).not.toBeNull();
    });

    it('commits custom DatePicker dates only on Apply and preserves cancel behavior', () => {
        const target = document.createElement('div');
        const value = stateOf('2024-05-15');
        const changes = [];
        Jetz.mount(new Aetheria.DatePicker().render({
            value,
            onchange: (key, date) => changes.push([key, date.getDate()])
        }), target);

        target.querySelector('.aetheria-datepicker-trigger').click();
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).not.toBeNull();
        expect(dialog.classList.contains('aetheria-calendar-dialog')).toBe(true);
        expect(document.querySelector('#aetheria-styles').textContent)
            .toMatch(/\.aetheria-calendar-dialog\s*\{[^}]*padding: var\(--aetheria-space-4\)/);
        expect(getComputedStyle(dialog.querySelector('.aetheria-calendar')).width).toBe('100%');
        expect(getComputedStyle(dialog.querySelector('.aetheria-calendar-grid')).width).toBe('100%');
        document.querySelector('[aria-label="Thursday, May 16, 2024"]').click();
        document.querySelector('.aetheria-calendar-actions .aetheria-btn-muted').click();
        expect(value.value).toBe('2024-05-15');
        expect(changes).toEqual([]);

        target.querySelector('.aetheria-datepicker-trigger').click();
        document.querySelector('[aria-label="Friday, May 17, 2024"]').click();
        document.querySelector('.aetheria-calendar-actions .aetheria-btn-primary').click();
        expect(value.value).toBe('2024-05-17');
        expect(document.querySelector('.aetheria-calendar-modal').classList.contains('is-open')).toBe(false);
        expect(changes).toEqual([['2024-05-17', 17]]);
    });

    it('raises the date dialog out of the isolated card that hosts it', async () => {
        const card = document.createElement('div');
        card.className = 'aetheria-glass';
        const target = document.createElement('div');
        card.append(target);
        document.body.append(card);
        Jetz.mount(new Aetheria.DatePicker().render({ value: stateOf('2024-05-15') }), target);

        const trigger = target.querySelector('.aetheria-datepicker-trigger');
        trigger.click();
        const modal = document.querySelector('.aetheria-calendar-modal');
        expect(modal.parentElement).toBe(document.body);
        expect(modal.classList.contains('aetheria-root')).toBe(true);
        expect(modal.classList.contains('is-open')).toBe(true);

        // Closing hands the dialog back to the tree, so the card owns it again.
        modal.querySelector('.aetheria-calendar-actions .aetheria-btn-muted').click();
        expect(modal.parentElement).toBe(target.querySelector('.aetheria-datepicker'));

        trigger.click();
        expect(document.querySelectorAll('.aetheria-calendar-modal')).toHaveLength(1);
        expect(modal.parentElement).toBe(document.body);

        const styles = document.querySelector('#aetheria-styles').textContent;
        const modalRules = [...styles.matchAll(/\.aetheria-calendar-modal\s*\{[^}]*\}/g)].map(rule => rule[0]);
        expect(modalRules).toHaveLength(1);
        expect(modalRules[0]).toContain('z-index: var(--aetheria-z-modal)');

        // Tearing down with the dialog still open must not leave the portal behind.
        Jetz.unmount(target);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(document.querySelectorAll('.aetheria-calendar-modal')).toHaveLength(0);
        card.remove();
    });

    it('reorders SortableList items when dropped before or after a target', () => {
        const target = document.createElement('div');
        const changes = [];
        Jetz.mount(new Aetheria.SortableList().render({
            items: ['First', 'Second', 'Third'],
            onchange: items => changes.push(items)
        }), target);

        const sortableItems = () => [...target.querySelectorAll('.aetheria-sortable-item')];
        const labels = () => sortableItems().map(item => item.firstElementChild.textContent);
        const transfer = {
            value: '',
            effectAllowed: '',
            dropEffect: '',
            setData(_type, value) { this.value = value; },
            getData() { return this.value; }
        };
        const dispatchDrag = (element, type, clientY = 0) => {
            const event = new Event(type, { bubbles: true, cancelable: true });
            Object.defineProperties(event, {
                dataTransfer: { value: transfer },
                clientY: { value: clientY }
            });
            element.dispatchEvent(event);
        };

        const [first, , third] = sortableItems();
        dispatchDrag(first, 'dragstart');
        expect(first.classList.contains('is-dragging')).toBe(true);
        expect(transfer.value).toBe(first.dataset.sortableId);
        dispatchDrag(third, 'dragover');
        expect(third.classList.contains('is-over')).toBe(true);
        dispatchDrag(third, 'drop');
        expect(third.classList.contains('is-over')).toBe(false);
        dispatchDrag(first, 'dragend');
        expect(first.classList.contains('is-dragging')).toBe(false);
        expect(labels()).toEqual(['Second', 'First', 'Third']);
        expect(changes[0]).toEqual(['Second', 'First', 'Third']);

        const [second, , last] = sortableItems();
        last.getBoundingClientRect = () => ({ top: 0, height: 20 });
        dispatchDrag(second, 'dragstart');
        dispatchDrag(last, 'drop', 15);
        expect(labels()).toEqual(['First', 'Third', 'Second']);
    });

    it('opens ContextMenu on right-click and calls the selected action', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const selected = [];
        Jetz.mount(new Aetheria.ContextMenu().render({
            items: ['Open', 'Rename', { label: 'Delete', disabled: true }],
            onselect: item => selected.push(item),
            children: div('Right-click target')
        }), target);

        const contextTarget = target.querySelector('.aetheria-context-menu-area');
        const rightClick = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 64,
            clientY: 72
        });
        contextTarget.dispatchEvent(rightClick);

        expect(rightClick.defaultPrevented).toBe(true);
        const portal = document.body.querySelector('.aetheria-context-menu-backdrop');
        // Host pages scope their resets under .aetheria-root, and this portal is
        // appended outside the mounted tree, so it must carry the class itself.
        expect(portal.classList.contains('aetheria-root')).toBe(true);
        const menu = portal?.querySelector('[role="menu"]');
        expect(menu).not.toBeNull();
        expect(menu.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
        expect(menu.querySelector('[role="menuitem"]:disabled').textContent).toBe('Delete');

        // The portal is appended outside .aetheria-root and never gains an
        // is-open class, so it must not inherit the hidden modal-layer state.
        const portalStyles = getComputedStyle(portal);
        expect(portalStyles.visibility).toBe('visible');
        expect(portalStyles.opacity).toBe('1');
        expect(portalStyles.position).toBe('fixed');
        expect(menu.style.left).toBe('64px');
        expect(menu.style.top).toBe('72px');

        const firstAction = menu.querySelector('[role="menuitem"]');
        const menuStyles = document.querySelector('#aetheria-styles').textContent;
        expect(menuStyles).toMatch(/\.aetheria-context-menu-backdrop \[role="menuitem"\]:not\(:disabled\):hover/);
        firstAction.dispatchEvent(new MouseEvent('mouseenter'));
        expect(firstAction.style.backgroundColor).toBe('');
        firstAction.focus();
        expect(firstAction.classList.contains('is-active')).toBe(true);
        firstAction.blur();
        expect(firstAction.classList.contains('is-active')).toBe(false);
        firstAction.click();
        expect(selected).toEqual(['Open']);
        // The portal is plain DOM, so it plays its exit animation before removal.
        const closing = document.body.querySelector('.aetheria-context-menu-backdrop');
        expect(closing?.classList.contains('is-closing')).toBe(true);
        await settled();
        expect(document.body.querySelector('.aetheria-context-menu-backdrop')).toBeNull();
        target.remove();
    });

    it('closes ContextMenu with Escape and when its source is removed', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(new Aetheria.ContextMenu().render({
            items: ['Open'],
            children: div('Right-click target')
        }), target);

        const contextTarget = target.querySelector('.aetheria-context-menu-area');
        const openMenu = () => {
            contextTarget.dispatchEvent(new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 24,
                clientY: 24
            }));
            return document.body.querySelector('.aetheria-context-menu-backdrop');
        };

        expect(openMenu()).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(document.body.querySelector('.aetheria-context-menu-backdrop.is-closing')).not.toBeNull();
        await settled();
        expect(document.body.querySelector('.aetheria-context-menu-backdrop')).toBeNull();

        expect(openMenu()).not.toBeNull();
        target.remove();
        await Promise.resolve();
        expect(document.body.querySelector('.aetheria-context-menu-backdrop.is-closing')).not.toBeNull();
        await settled();
        expect(document.body.querySelector('.aetheria-context-menu-backdrop')).toBeNull();
    });

    it('renders Chart and Sparkline as visible SVG graphics', () => {
        const target = document.createElement('div');
        Jetz.mount(div(
            new Aetheria.Chart().render({ data: [-10, 0, 10], width: 200, height: 80 }),
            new Aetheria.Sparkline().render({ data: [4], width: 90, height: 28 })
        ), target);

        const svgs = [...target.querySelectorAll('svg')];
        expect(svgs).toHaveLength(2);
        expect(svgs.every(svg => svg.namespaceURI === 'http://www.w3.org/2000/svg')).toBe(true);
        expect(svgs.map(svg => svg.querySelector('polyline')?.getAttribute('points')))
            .toEqual(['0,77 100,40 200,3', '45,14']);
    });

    it('aggregates PivotGrid data and shows matching documentation example', async () => {
        const gridTarget = document.createElement('div');
        Jetz.mount(new Aetheria.PivotGrid().render({
            data: [
                { category: 'Hardware', region: 'North', sales: 100 },
                { category: 'Hardware', region: 'North', sales: 50 },
                { category: 'Software', region: 'South', sales: 200 }
            ]
        }), gridTarget);

        expect([...gridTarget.querySelectorAll('tbody tr')].map(row => row.textContent))
            .toEqual(['Hardware1500150', 'Software0200200', 'Grand Total150200350']);

        const { AetheriaDocs } = await import('../src/aetheria-ui/aetheria-docs.js');
        const docsTarget = document.createElement('div');
        Jetz.mount(new AetheriaDocs().render(), docsTarget);
        const pivotHeading = [...docsTarget.querySelectorAll('h3')]
            .find(heading => heading.textContent === 'Pivot Grid (Sales)');
        const pivotPanel = pivotHeading.closest('.aetheria-panel');
        const pivotTable = pivotPanel.querySelector('table');
        expect(pivotTable.querySelectorAll('tbody tr')).toHaveLength(4);
        expect(pivotTable.textContent).toContain('Grand Total');
        expect(docsTarget.textContent).toContain('"category": "Hardware"');
        expect(docsTarget.textContent).toContain('"region": "South America"');
    });

    it('keeps the chosen item in the dropdown trigger and dismisses on outside click', async () => {
        Aetheria.injectAetheriaStyles();
        const target = document.createElement('div');
        const picked = [];
        Jetz.mount(new Aetheria.Dropdown().render({
            trigger: 'Select Operation',
            items: ['Deploy Container', 'Restart Engine'],
            onselect: item => picked.push(item)
        }), target);

        const trigger = target.querySelector('button');
        const panel = () => target.querySelector('.aetheria-dropdown-panel');
        expect(trigger.textContent).toContain('Select Operation');

        trigger.click();
        expect(panel()).not.toBeNull();
        panel().querySelectorAll('.aetheria-dropdown-item')[1].click();
        expect(picked).toEqual(['Restart Engine']);
        expect(panel().classList.contains('is-closing')).toBe(true);
        expect(trigger.textContent).toContain('Restart Engine');
        await settled();
        expect(panel()).toBeNull();

        trigger.click();
        expect(panel()).not.toBeNull();
        expect(panel().classList.contains('is-closing')).toBe(false);
        expect(panel().querySelectorAll('.aetheria-dropdown-item')[1].classList.contains('is-active')).toBe(true);
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(panel().classList.contains('is-closing')).toBe(true);
        await settled();
        expect(panel()).toBeNull();

        trigger.click();
        expect(panel()).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(panel().classList.contains('is-closing')).toBe(true);
        await settled();
        expect(panel()).toBeNull();
    });

    it('dismisses an open popover on outside click and Escape', async () => {
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.Popover().render({ trigger: 'Details', content: 'Popover body' }), target);

        const trigger = target.querySelector('button');
        const panel = () => target.querySelector('.aetheria-popover-panel');
        trigger.click();
        expect(panel()).not.toBeNull();
        panel().click();
        expect(panel()).not.toBeNull();
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(panel().classList.contains('is-closing')).toBe(true);
        await settled();
        expect(panel()).toBeNull();
        trigger.click();
        expect(panel()).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(panel().classList.contains('is-closing')).toBe(true);
        await settled();
        expect(panel()).toBeNull();
    });

    it('lifts the isolating card above its siblings while the popover is open', async () => {
        const card = document.createElement('div');
        card.className = 'aetheria-glass';
        card.style.position = 'relative';
        const target = document.createElement('div');
        card.append(target);
        document.body.append(card);
        Jetz.mount(new Aetheria.Popover().render({ trigger: 'Details', content: 'Popover body' }), target);

        const trigger = target.querySelector('button');
        trigger.click();
        expect(card.classList.contains('aetheria-layer-host')).toBe(true);
        expect(document.querySelector('#aetheria-styles').textContent)
            .toMatch(/\.aetheria-layer-host\s*\{\s*z-index: var\(--aetheria-z-menu\)/);

        trigger.click();
        expect(card.classList.contains('aetheria-layer-host')).toBe(true);
        await settled();
        expect(card.classList.contains('aetheria-layer-host')).toBe(false);
    });

    it('renders an Ae factory component that Jetz adopts as an instance', () => {
        const clicks = [];
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(div(Aetheria.Ae.Button({
            label: 'Save',
            variant: 'secondary',
            onclick: (event) => clicks.push(event.target.textContent)
        })), target);

        const node = target.querySelector('.aetheria-btn');
        expect(node.textContent).toBe('Save');
        expect(node.classList.contains('aetheria-btn-secondary')).toBe(true);
        node.click();
        expect(clicks).toEqual(['Save']);
    });

    // The whole namespace goes through the instance path, so a class that still
    // reads a dropped argument instead of its constructor props fails here.
    it('renders every Ae factory with the props given to it', () => {
        const props = {
            items: ['Alpha', 'Beta'],
            columns: [{ key: 'alpha', label: 'Alpha' }],
            rows: [{ alpha: 1 }],
            label: 'Aetheria',
            value: '2025-04-15',
            text: 'Hint',
            content: 'Body',
            trigger: 'Toggle'
        };
        const target = document.createElement('div');
        document.body.append(target);
        const built = Object.entries(Aetheria.Ae).map(([name, create]) => {
            Jetz.mount(div(create(props)), target);
            const node = target.querySelector('[class*="aetheria-"]');
            const rendered = { name, ok: !!node, classes: node ? node.className.toString().slice(0, 40) : '' };
            Jetz.unmount(target);
            target.innerHTML = '';
            return rendered;
        });
        expect(built.filter(row => !row.ok)).toEqual([]);
        expect(built).toHaveLength(46);
    });

    it('keeps the eager new X().render(props) form working', () => {
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(new Aetheria.Button().render({ label: 'Legacy', variant: 'border' }), target);

        const node = target.querySelector('.aetheria-btn');
        expect(node.textContent).toBe('Legacy');
        expect(node.classList.contains('aetheria-btn-border')).toBe(true);
    });

    it('releases the ancestor lift when a popover host is unmounted mid-open', async () => {
        const card = document.createElement('div');
        card.className = 'aetheria-glass';
        card.style.position = 'relative';
        const target = document.createElement('div');
        card.append(target);
        document.body.append(card);
        Jetz.mount(div(Aetheria.Ae.Popover({ trigger: 'Details', content: 'Popover body' })), target);

        target.querySelector('button').click();
        expect(card.classList.contains('aetheria-layer-host')).toBe(true);

        // No close click: the host simply leaves the page while the panel is up.
        Jetz.unmount(target);
        await settled();
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(document.querySelectorAll('.aetheria-layer-host')).toHaveLength(0);
    });

    it('closes the autocomplete results on outside click after their exit animation', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(new Aetheria.Autocomplete().render({ items: ['Deploy', 'Destroy'] }), target);

        const field = target.querySelector('input');
        field.value = 'Dep';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        const results = () => target.querySelector('.aetheria-autocomplete-results');
        expect(results()).not.toBeNull();

        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(results().classList.contains('is-closing')).toBe(true);
        await settled();
        expect(results()).toBeNull();

        field.value = 'De';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        expect(results()).not.toBeNull();
        expect(results().classList.contains('is-closing')).toBe(false);
        target.remove();
    });

    it('bursts a ripple from a pressed control and cleans it up', async () => {
        Aetheria.injectAetheriaStyles();
        // The ripple is delegated from document, so the tree has to be attached.
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(new Aetheria.Button().render({ label: 'Deploy' }), target);

        const host = target.querySelector('.aetheria-btn');
        host.getBoundingClientRect = () => ({ width: 120, height: 44, left: 10, top: 5 });
        host.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 40, clientY: 20 }));

        const dot = host.querySelector('.aetheria-ripple');
        expect(dot).not.toBeNull();
        expect(host.classList.contains('aetheria-rippling')).toBe(true);
        expect(dot.style.width).toBe('240px');
        expect(dot.style.left).toBe('-90px');
        // jsdom never fires animationend, so only the fallback cleanup can end it.
        await new Promise(resolve => setTimeout(resolve, 700));
        expect(host.querySelector('.aetheria-ripple')).toBeNull();
        expect(host.classList.contains('aetheria-rippling')).toBe(false);
        target.remove();
    });

    it('carries the cornflower palette through the motion layer', () => {
        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toContain('--aetheria-spring');
        expect(styles).toContain('@keyframes aetheria-panel-in');
        expect(styles).toContain('@keyframes aetheria-panel-out');
        expect(styles).toContain('@keyframes aetheria-ripple-burst');
        expect(styles).toMatch(/\.aetheria-dropdown-panel, \.aetheria-popover-panel/);
        expect(styles).toMatch(/\.aetheria-dropdown-panel[\s\S]{0,120}\.is-closing/);
        expect(styles).toMatch(/\.aetheria-sortable-item\.is-dragging\s*\{[^}]*rotate\(-\.5deg\)/);
        expect(styles).toMatch(/\.aetheria-range:active::-webkit-slider-thumb\s*\{\s*transform: scale\(1\.3\)/);
        expect(styles).toMatch(/\.aetheria-check:checked::after,\s*\.aetheria-radio:checked::after\s*\{\s*animation: aetheria-pop-in/);
        expect(styles).toMatch(/\.aetheria-gantt-bar\s*\{[^}]*animation: aetheria-grow-in/);
        // Nothing from the old violet palette survives.
        expect(styles).not.toMatch(/#6d44e0|#b9a5ff|#c4b5fd|--aetheria-lav|--aetheria-pink/);
    });

    it('paints the selected length of the slider tracks through range custom properties', () => {
        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toMatch(/\.aetheria-range::-webkit-slider-runnable-track\s*\{[\s\S]*?var\(--aetheria-range-from\)[\s\S]*?var\(--aetheria-range-to\)/);
        expect(styles).toMatch(/\.aetheria-range::-moz-range-track\s*\{[\s\S]*?var\(--aetheria-range-from\)/);

        const target = document.createElement('div');
        const sliderValue = stateOf(60);
        Jetz.mount(div(
            new Aetheria.Slider().render({ min: 0, max: 100, value: sliderValue }),
            new Aetheria.RangeSlider().render({ min: 0, max: 100, low: 20, high: 80 })
        ), target);

        const ranges = [...target.querySelectorAll('.aetheria-range')];
        expect(ranges).toHaveLength(3);
        expect(ranges[0].getAttribute('style')).toContain('--aetheria-range-to: 60%');
        expect(ranges[1].getAttribute('style')).toContain('--aetheria-range-to: 20%');
        expect(ranges[2].getAttribute('style')).toContain('--aetheria-range-from: 20%');
        expect(ranges[2].getAttribute('style')).toContain('--aetheria-range-to: 80%');

        sliderValue.value = 25;
        expect(ranges[0].getAttribute('style')).toContain('--aetheria-range-to: 25%');
    });

    it('keeps the switch knob inside the track', () => {
        const styles = document.querySelector('#aetheria-styles').textContent;
        const knob = styles.match(/\.aetheria-switch::before\s*\{[\s\S]*?\}/)[0];
        expect(knob).toContain('top: 3px');
        expect(knob).toContain('left: 3px');
        expect(knob).not.toMatch(/margin:\s*auto/);
        expect(knob).not.toMatch(/\binset:/);
        // 46px track, 1px borders, 18px knob, 3px gaps: the travel must fit exactly.
        expect(styles).toMatch(/\.aetheria-switch\s*\{[\s\S]*?width: 46px/);
        expect(styles).toMatch(/\.aetheria-switch:checked::before\s*\{\s*transform: translateX\(20px\)/);
    });

    it('renders the rows-per-page select as a themed control with its own chevron', () => {
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.DataGrid().render({
            columns: [{ key: 'name', label: 'Name' }],
            rows: Array.from({ length: 12 }, (_, index) => ({ name: `Row ${index}` })),
            pageable: true,
            pageSize: 5
        }), target);

        const select = target.querySelector('.aetheria-datagrid-page-size');
        expect(select).not.toBeNull();
        expect(select.tagName).toBe('SELECT');
        expect(select.classList.contains('aetheria-field')).toBe(false);
        expect(select.parentElement.classList.contains('aetheria-datagrid-page-size-wrap')).toBe(true);
        expect(select.parentElement.querySelector('.aetheria-datagrid-page-size-chevron')).not.toBeNull();

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toMatch(/\.aetheria-datagrid-page-size\s*\{[\s\S]*?appearance: none/);
        expect(styles).toMatch(/\.aetheria-datagrid-page-size\s*\{[\s\S]*?min-height: var\(--aetheria-control-sm\)/);
        expect(styles).toMatch(/\.aetheria-datagrid-page-size option\s*\{[\s\S]*?background: var\(--aetheria-surface-solid\)/);
    });

    it('resizes spreadsheet columns from the header handles and centres the row gutter', () => {
        const target = document.createElement('div');
        Jetz.mount(new Aetheria.Spreadsheet().render({ rows: 3, cols: 3 }), target);

        const headers = [...target.querySelectorAll('thead th')];
        expect(headers).toHaveLength(4);
        expect(headers[0].classList.contains('aetheria-spreadsheet-gutter')).toBe(true);
        const handles = [...target.querySelectorAll('.aetheria-spreadsheet-resizer')];
        expect(handles).toHaveLength(4);
        expect(handles.map(handle => handle.getAttribute('aria-label')))
            .toEqual(['Resize row number column', 'Resize column A', 'Resize column B', 'Resize column C']);
        expect([...target.querySelectorAll('tbody td:first-child')]
            .every(cell => cell.classList.contains('aetheria-spreadsheet-gutter'))).toBe(true);

        const handle = handles[1];
        handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }));
        expect(target.querySelector('table').classList.contains('is-resizing')).toBe(true);
        document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 160 }));
        document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
        expect(target.querySelector('table').classList.contains('is-resizing')).toBe(false);
        expect(handle.parentElement.style.width).toBe('60px');

        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(handle.parentElement.style.width).toBe('68px');

        const styles = document.querySelector('#aetheria-styles').textContent;
        expect(styles).toMatch(/\.aetheria-spreadsheet-table\s*\{[^}]*table-layout: fixed/);
        expect(styles).toMatch(/\.aetheria-spreadsheet-resizer\s*\{[\s\S]*?cursor: col-resize/);
        expect(styles).toMatch(/\.aetheria-spreadsheet-gutter\s*\{[\s\S]*?vertical-align: middle/);
        // Fixed layout would otherwise squeeze every column below its minimum.
        expect(target.querySelector('.aetheria-spreadsheet-table').getAttribute('style')).toContain('min-width: 260px');
    });

    it('picks a two-click range and emits an ISO interval', () => {
        const target = document.createElement('div');
        const range = stateOf('2025-04-10/2025-04-18');
        const emitted = [];
        Jetz.mount(new Aetheria.DateRangePicker().render({
            value: range,
            onchange: (interval, span) => emitted.push([interval, `${span.start?.toISOString().slice(0, 10)}..${span.end?.toISOString().slice(0, 10)}`])
        }), target);

        const trigger = target.querySelector('.aetheria-datepicker-trigger');
        expect(trigger.textContent).toContain('Apr 10, 2025');
        expect(trigger.textContent).toContain('Apr 18, 2025');

        trigger.click();
        const modal = document.querySelector('.aetheria-calendar-modal');
        expect(modal.classList.contains('is-open')).toBe(true);
        const day = number => [...document.querySelectorAll('.aetheria-calendar-day')]
            .find(cell => cell.textContent === String(number) && !cell.classList.contains('aetheria-calendar-outside'));
        expect(document.querySelector('.aetheria-calendar-day.is-range-start')).not.toBeNull();
        expect(document.querySelector('.aetheria-calendar-day.is-range')).not.toBeNull();
        expect(document.querySelector('.aetheria-calendar-day.is-range-end')).not.toBeNull();

        day(5).click();
        expect(document.querySelector('.aetheria-calendar-day.is-range-end')).toBeNull();
        day(12).click();
        document.querySelectorAll('.aetheria-calendar-actions button')[2].click();

        expect(range.value).toBe('2025-04-05/2025-04-12');
        expect(emitted[0][0]).toBe('2025-04-05/2025-04-12');
        expect(trigger.textContent).toContain('Apr 5, 2025');
        expect(document.querySelector('.aetheria-calendar-modal').classList.contains('is-open')).toBe(false);
    });

    it('reorders a reversed range click and clears back to the placeholder', () => {
        const target = document.createElement('div');
        const emitted = [];
        Jetz.mount(new Aetheria.DateRangePicker().render({
            placeholder: 'Pick dates',
            onchange: interval => emitted.push(interval)
        }), target);

        expect(target.querySelector('.aetheria-datepicker-trigger').textContent).toContain('Pick dates');
        target.querySelector('.aetheria-datepicker-trigger').click();
        const day = number => [...document.querySelectorAll('.aetheria-calendar-day')]
            .find(cell => cell.textContent === String(number) && !cell.classList.contains('aetheria-calendar-outside'));
        day(20).click();
        day(9).click();
        expect(document.querySelector('.aetheria-calendar-day.is-range-start').textContent).toBe('9');
        expect(document.querySelector('.aetheria-calendar-day.is-range-end').textContent).toBe('20');
        document.querySelectorAll('.aetheria-calendar-actions button')[2].click();
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        expect(emitted).toEqual([`${today.getFullYear()}-${month}-09/${today.getFullYear()}-${month}-20`]);

        target.querySelector('.aetheria-datepicker-trigger').click();
        document.querySelectorAll('.aetheria-calendar-actions button')[0].click();
        expect(emitted[1]).toBe('');
        expect(target.querySelector('.aetheria-datepicker-trigger').textContent).toContain('Pick dates');
    });

    it('shows the DateRangePicker showcase in the documentation page', async () => {
        const { AetheriaDocs } = await import('../src/aetheria-ui/aetheria-docs.js');
        const target = document.createElement('div');
        Jetz.mount(new AetheriaDocs().render(), target);
        const heading = [...target.querySelectorAll('h2, h3')]
            .find(title => title.textContent === 'DateRangePicker');
        expect(heading).toBeDefined();
        const section = heading.closest('.aetheria-docs-section');
        expect(section.querySelector('.aetheria-datepicker-range')).not.toBeNull();
        expect(section.textContent).toContain('YYYY-MM-DD/YYYY-MM-DD');
    });

    it('runs string rules through validate()', () => {
        const { validate } = Aetheria;
        expect(validate({ email: 'nope' }, { email: 'required|email' }).email).toBe('A valid email is required');
        // Only `required` fires on an empty field, so optional rules stay quiet.
        expect(validate({ email: '' }, { email: 'email|max:30' }).email).toBe('');
        expect(validate({ name: 'ab' }, { name: 'required|min:3|max:30' }).name).toBe('Must be at least 3 characters');
        expect(validate({ code: 'a|b' }, { code: 'regex:/^a|b$/' }).code).toBe('');
        expect(validate({ code: 'c' }, { code: 'in:a,b,c' }).code).toBe('');
        expect(validate({ role: 'operator' }, { role: 'in:root,admin,guest' }).role).toBe('Must be one of: root,admin,guest');
        expect(validate({ age: '4x' }, { age: 'numeric' }).age).toBe('Must be a number');
        expect(validate({ a: 'x', b: 'y' }, { a: 'same:b' }).a).toBe('Must match b');
        expect(validate({ pin: '1234', pin_confirm: '1234' }, { pin: 'confirmed' }).pin).toBe('');
        expect(validate({ nick: 'thelongestname' }, { nick: 'len:5' }).nick).toBe('Must be exactly 5 characters');
    });

    it('takes custom rules, checks and message overrides', () => {
        const { validate } = Aetheria;
        expect(validate({ name: 'x' }, { name: value => value.length > 1 ? '' : 'Too short' }).name).toBe('Too short');
        expect(validate({ coupon: 'nope' }, { coupon: 'required' }, {
            checks: { coupon: value => value === 'SAVE' ? '' : 'Unknown coupon' }
        }).coupon).toBe('Unknown coupon');
        expect(validate({ email: '' }, { email: 'required' }, {
            messages: { email: { required: 'We need your address' } }
        }).email).toBe('We need your address');
        expect(validate({ email: 'nope' }, { email: 'required|email' }, {
            messages: { email: { email: 'Not an address' } }
        }).email).toBe('Not an address');
    });

    it('warns about an unknown rule instead of failing the field', () => {
        const warnings = [];
        const original = console.warn;
        console.warn = message => warnings.push(message);
        const result = Aetheria.validate({ name: 'anything' }, { name: 'required|telepathic' });
        console.warn = original;
        expect(result.name).toBe('');
        expect(warnings).toEqual(['Aetheria validate: unknown rule "telepathic" on "name"']);
    });

    it('validates through the form handle and only submits a clean form', () => {
        const target = document.createElement('div');
        document.body.append(target);
        const submitted = [];
        const rejected = [];
        Jetz.mount(div(Aetheria.Ae.FormValidation({
            rules: { email: 'required|email' },
            onsubmit: data => submitted.push(data),
            oninvalid: errors => rejected.push(errors.email),
            children: form => div(
                Aetheria.Ae.TextInput({ value: form.value('email'), invalid: form.error('email') }),
                form.message('email')
            )
        })), target);

        const node = target.querySelector('.aetheria-field');
        const message = target.querySelector('.aetheria-field-error');
        const submit = () => target.querySelector('form').dispatchEvent(new Event('submit'));
        expect(message.className).toContain('aetheria-hidden');

        submit();
        expect(submitted).toEqual([]);
        expect(rejected).toEqual(['This field is required']);
        expect(message.className).not.toContain('aetheria-hidden');
        expect(message.textContent).toBe('This field is required');
        expect(node.classList.contains('is-invalid')).toBe(true);
        expect(node.getAttribute('aria-invalid')).toBe('true');

        // Only `required` fires on an empty field; the format rule takes over once
        // the field holds something, and keeps re-running live after the submit.
        node.value = 'nope';
        node.dispatchEvent(new Event('input', { bubbles: true }));
        expect(message.textContent).toBe('A valid email is required');
        node.value = 'dev@jetz.io';
        node.dispatchEvent(new Event('input', { bubbles: true }));
        expect(message.textContent).toBe('');
        expect(node.classList.contains('is-invalid')).toBe(false);

        submit();
        expect(submitted).toEqual([{ email: 'dev@jetz.io' }]);
    });

    it('hides untouched errors until submit and clears them on reset', () => {
        const target = document.createElement('div');
        document.body.append(target);
        let handle = null;
        Jetz.mount(div(Aetheria.Ae.FormValidation({
            rules: { name: 'required', nick: 'required' },
            children: form => {
                handle = form;
                return div(form.field('name'), form.message('name'), form.field('nick'), form.message('nick'));
            }
        })), target);

        const messages = () => [...target.querySelectorAll('.aetheria-field-error')];
        expect(messages().every(node => node.className.includes('aetheria-hidden'))).toBe(true);
        target.querySelector('form').dispatchEvent(new Event('submit'));
        expect(target.querySelectorAll('.aetheria-field.is-invalid')).toHaveLength(2);

        handle.reset();
        expect(target.querySelectorAll('.aetheria-field.is-invalid')).toHaveLength(0);
        expect(handle.values()).toEqual({ name: '', nick: '' });
        expect(handle.valid.value).toBe(false);
    });

    it('keeps the default two-field demo messaging', () => {
        const target = document.createElement('div');
        document.body.append(target);
        const submitted = [];
        Jetz.mount(div(Aetheria.Ae.FormValidation({ onsubmit: data => submitted.push(data) })), target);

        const fields = target.querySelectorAll('.aetheria-field');
        expect(fields).toHaveLength(2);
        expect(fields[1].getAttribute('type')).toBe('email');
        target.querySelector('form').dispatchEvent(new Event('submit'));
        expect(submitted).toEqual([]);
        expect([...target.querySelectorAll('.aetheria-field-error')].map(node => node.textContent))
            .toEqual(['Name is required', 'Valid email is required']);
    });

    it('renders a listOf into every collection prop it is given', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const options = listOf('one', 'two');
        const rows = listOf({ name: 'Ada' }, { name: 'Alan' });
        const tabs = listOf({ label: 'First', content: 'a' }, { label: 'Second', content: 'b' });
        Jetz.mount(div(
            Aetheria.Ae.Select({ value: stateOf('one'), options }),
            Aetheria.Ae.DataGrid({ columns: [{ key: 'name', label: 'Name' }], rows }),
            Aetheria.Ae.Tabs({ tabs })
        ), target);
        await settled();

        target.querySelector('.aetheria-select-trigger').click();
        await settled();
        expect(target.querySelectorAll('.aetheria-select-option')).toHaveLength(2);
        expect(target.querySelectorAll('tbody tr')).toHaveLength(2);
        expect(target.querySelectorAll('.aetheria-tab-btn')).toHaveLength(2);

        options.push('three');
        rows.push({ name: 'Grace' });
        tabs.push({ label: 'Third', content: 'c' });
        await settled();
        expect(target.querySelectorAll('.aetheria-select-option')).toHaveLength(3);
        expect(target.querySelectorAll('tbody tr')).toHaveLength(3);
        expect(target.querySelectorAll('.aetheria-tab-btn')).toHaveLength(3);
    });

    it('binds a listOf back as a multi-value prop', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const picked = listOf();
        Jetz.mount(div(Aetheria.Ae.MultiSelect({ options: ['a', 'b'], value: picked })), target);
        await settled();

        const boxes = [...target.querySelectorAll('input')];
        boxes[0].checked = true;
        boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
        await settled();
        expect(picked.value).toEqual(['a']);
        expect([...target.querySelectorAll('input')].map(box => box.checked)).toEqual([true, false]);

        picked.set([]);
        await settled();
        expect([...target.querySelectorAll('input')].map(box => box.checked)).toEqual([false, false]);
    });

    it('rebuilds an open ContextMenu when its items change', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const items = listOf('Open', 'Rename');
        Jetz.mount(div(Aetheria.Ae.ContextMenu({
            items,
            children: div('Right-click target')
        })), target);
        await settled();
        target.querySelector('.aetheria-context-menu-area').dispatchEvent(
            new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 })
        );
        await settled();

        const labels = () => [...document.querySelectorAll('.aetheria-context-menu .aetheria-dropdown-item')]
            .map(entry => entry.textContent);
        expect(labels()).toEqual(['Open', 'Rename']);

        items.removeAt(0);
        items.push('Delete');
        await settled();
        expect(labels()).toEqual(['Rename', 'Delete']);

        document.querySelector('.aetheria-context-menu-backdrop').click();
        await settled();
        items.push('Archive');
        await settled();
        expect(document.querySelector('.aetheria-context-menu')).toBeNull();
    });

    it('follows a reactive rules, placeholder and label config in FormValidation', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const strict = stateOf(false);
        const rules = computed(() => ({ email: strict.value ? 'required|email' : 'required' }));
        const placeholders = computed(() => ({ email: strict.value ? 'Work address' : 'Any address' }));
        const types = computed(() => ({ email: strict.value ? 'email' : 'text' }));
        const submitLabel = stateOf('Save');
        Jetz.mount(div(Aetheria.Ae.FormValidation({
            rules, placeholders, types, submitLabel
        })), target);
        await settled();

        const input = target.querySelector('input');
        const message = target.querySelector('.aetheria-field-error');
        expect(input.placeholder).toBe('Any address');
        expect(input.getAttribute('type')).toBe('text');
        expect(target.querySelector('button[type="submit"]').textContent).toBe('Save');

        input.value = 'nope';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await settled();
        expect(message.textContent).toBe('');

        strict.value = true;
        await settled();
        expect(input.placeholder).toBe('Work address');
        expect(input.getAttribute('type')).toBe('email');
        expect(message.textContent).toBe('Valid email is required');
        expect(target.querySelector('.aetheria-field.is-invalid')).not.toBeNull();
    });

    it('can render AetheriaDocs documentation page', async () => {
        const { AetheriaDocs } = await import('../src/aetheria-ui/aetheria-docs.js');
        const target = document.createElement('div');
        Jetz.mount(new AetheriaDocs().render(), target);
        expect(target.textContent).toContain('Aetheria UI Documentation');
        expect(target.querySelector('.aetheria-root')).not.toBeNull();
    });
});
