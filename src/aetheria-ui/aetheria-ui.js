import { Component, html, stateOf, computed, listOf, loop } from '../lib/jetz.js';
import {
    button, div, span, p, h1, h2, h3, input, textarea, select, option,
    label, form, svg, table, thead, tbody, tr, th, td, nav, ul, li, a,
    canvas, progress, style, css
} from '../lib/jetz-ui.js';

import { AETHERIA_CSS } from './aetheria-theme.js';

export function injectAetheriaStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('aetheria-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'aetheria-styles';
    tag.textContent = AETHERIA_CSS;
    document.head.appendChild(tag);
}

/** True for a Jetz State or computed — anything with a reactive `.value`. */
export function isReactive(value) {
    return value != null
        && typeof value !== 'string'
        && typeof value.subscribe === 'function'
        && 'value' in value;
}

/**
 * Current value of a prop that may be a literal, a State/computed, or a getter.
 * Read it inside a computed or a function attribute to stay reactive.
 */
function prop(value, fallback) {
    if (value === undefined || value === null) return fallback;
    if (isReactive(value)) return value.value === undefined ? fallback : value.value;
    if (typeof value === 'function') return value();
    return value;
}

/** A prop bound as an element child or attribute: States pass through, the rest is static. */
function bind(value, fallback) {
    if (isReactive(value)) return value;
    if (typeof value === 'function') return computed(() => prop(value, fallback));
    return value === undefined || value === null ? fallback : value;
}

/** Reactive class toggler for use inside a computed class string. */
function flag(value, on, off = '') {
    return prop(value, false) ? on : off;
}

/**
 * Reactive list holder. `stateOf(array)` expands into per-index states and loses
 * `.value`, so collections live behind an explicit version signal.
 */
function listHolder(initial) {
    const tick = stateOf(0);
    let items = Array.isArray(initial) ? [...initial] : [];
    return {
        read: () => (tick.value, items),
        write: (next) => { items = Array.isArray(next) ? next : []; tick.value++; }
    };
}

const AETHERIA_ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    arrowDown: '<path d="M19 12l-7 7-7-7"/><path d="M12 5v14"/>',
    sort: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    gitBranch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 9"/><path d="M21 3v6h-6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.6-4.6a2 2 0 0 0-2.8 0L3 21"/>',
    play: '<path d="m6 4 12 8-12 8z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>',
    italic: '<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>'
};

/** Inline Lucide-style stroke icon. Returns raw markup so glyphs never shift layout. */
export function icon(name, extraClass = '') {
    const body = AETHERIA_ICONS[name] || AETHERIA_ICONS.star;
    return html(
        `<svg class="aetheria-icon${extraClass ? ` ${extraClass}` : ''}" viewBox="0 0 24 24" ` +
        `fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ` +
        `stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
    );
}

/** Apply (or clear) the theme on the document root. */
export function setAetheriaTheme(mode) {
    if (typeof document === 'undefined') return;
    if (mode === 'light') document.documentElement.setAttribute('data-aetheria-theme', 'light');
    else document.documentElement.removeAttribute('data-aetheria-theme');
}

export class Button extends Component {
    render(props = {}) {
        const {
            variant = 'primary',
            onclick = null,
            disabled = false,
            style: customStyle = '',
            class: customClass = '',
            children = null,
            label = 'Button'
        } = props;
        return button(
            {
                class: computed(() =>
                    `aetheria-btn aetheria-btn-${prop(variant, 'primary')} ${prop(customClass, '')}`.trim()),
                type: 'button',
                onclick: onclick ? (e) => onclick(e) : null,
                disabled: computed(() => prop(disabled, false)),
                style: customStyle
            },
            children === null || children === undefined ? bind(label, 'Button') : bind(children)
        );
    }
}

export class IconButton extends Component {
    render(props = {}) {
        const {
            onclick = null,
            title = '',
            active = false,
            disabled = false,
            icon: iconName = 'star',
            children = null,
            class: customClass = ''
        } = props;
        const glyph = children ?? (typeof prop(iconName) === 'string' && AETHERIA_ICONS[prop(iconName)]
            ? icon(prop(iconName))
            : bind(prop(iconName), ''));
        return button(
            {
                class: computed(() =>
                    `aetheria-icon-btn ${flag(active, 'active')} ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                type: 'button',
                title: bind(title, ''),
                'aria-label': bind(title, ''),
                disabled: computed(() => prop(disabled, false)),
                onclick: onclick ? (e) => onclick(e) : null
            },
            glyph
        );
    }
}

export class TextInput extends Component {
    render(props = {}) {
        const {
            value = '',
            placeholder = '',
            oninput = null,
            type = 'text',
            disabled = false,
            readonly = false,
            invalid = false,
            class: customClass = ''
        } = props;
        return input({
            type,
            class: computed(() =>
                `aetheria-field ${flag(invalid, 'is-invalid')} ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
            placeholder: bind(placeholder, ''),
            value: isReactive(value) ? value : bind(value, ''),
            disabled: computed(() => prop(disabled, false)),
            readonly: computed(() => prop(readonly, false)),
            'aria-invalid': computed(() => flag(invalid, 'true', 'false')),
            oninput: (e) => {
                if (isReactive(value)) value.value = e.target.value;
                if (oninput) oninput(e.target.value, e);
            }
        });
    }
}

export class TextArea extends Component {
    render(props = {}) {
        const {
            value = '',
            placeholder = '',
            oninput = null,
            disabled = false,
            readonly = false,
            rows = 3,
            class: customClass = ''
        } = props;
        return textarea({
            class: computed(() =>
                `aetheria-field aetheria-textarea ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
            placeholder: bind(placeholder, ''),
            rows: bind(rows, 3),
            disabled: computed(() => prop(disabled, false)),
            readonly: computed(() => prop(readonly, false)),
            value: isReactive(value) ? value : bind(value, ''),
            oninput: (e) => {
                if (isReactive(value)) value.value = e.target.value;
                if (oninput) oninput(e.target.value, e);
            }
        });
    }
}

export class Checkbox extends Component {
    render(props = {}) {
        const {
            checked = false,
            label: labelText = '',
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        return label(
            {
                class: computed(() =>
                    `aetheria-control-label ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input(
                {
                    type: 'checkbox',
                    class: 'aetheria-check',
                    ...(isReactive(checked)
                        ? { bind: checked }
                        : { checked: computed(() => prop(checked, false)) }),
                    disabled: computed(() => prop(disabled, false)),
                    onchange: (e) => {
                        if (onchange) onchange(e.target.checked, e);
                    }
                }
            ),
            labelText ? span(bind(labelText, '')) : ''
        );
    }
}

export class Radio extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            name = '',
            value: radioValue = '',
            checked = false,
            label: labelText = '',
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        return label(
            {
                class: computed(() =>
                    `aetheria-control-label ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input({
                type: 'radio',
                name: bind(name, ''),
                class: 'aetheria-radio',
                value: bind(isReactive(radioValue) ? radioValue : (radioValue || labelText || ''), ''),
                checked: computed(() => prop(checked, false)),
                disabled: computed(() => prop(disabled, false)),
                onchange: (e) => {
                    if (isReactive(checked)) checked.value = e.target.checked;
                    if (onchange) onchange(e.target.checked, e);
                }
            }),
            labelText ? span(bind(labelText, '')) : ''
        );
    }
}

export class Select extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            value = '',
            options = [],
            placeholder = 'Select an option',
            onchange = null,
            disabled = false,
            ariaLabel = 'Select an option',
            class: customClass = ''
        } = props;
        const isState = isReactive(value);
        const localValue = stateOf(null);
        localValue.value = isState ? value.value : prop(value, '');
        const selectedValue = () => isState ? value.value : localValue.value;
        const open = stateOf(false);
        const activeIndex = stateOf(-1);
        const currentOptions = () => {
            const raw = prop(options, []);
            return (Array.isArray(raw) ? raw : []).map((optionItem, index) => (typeof optionItem === 'string'
                ? { value: optionItem, label: optionItem, description: '', disabled: false, index }
                : {
                    ...optionItem,
                    value: optionItem.value ?? optionItem.label ?? optionItem,
                    label: optionItem.label ?? optionItem.value ?? optionItem,
                    description: optionItem.description || '',
                    disabled: Boolean(optionItem.disabled),
                    index
                }));
        };
        const optionViews = listOf(...currentOptions());
        const optionsSignature = computed(() => currentOptions()
            .map(item => `${item.index}\u0000${String(item.value)}\u0000${String(item.label)}\u0000${item.description}\u0000${item.disabled}`)
            .join('\u0001'));
        optionsSignature.subscribe(() => optionViews.set(currentOptions()));
        const currentIndex = () => currentOptions().findIndex(item => item.value === selectedValue());
        const moveActive = direction => {
            const items = currentOptions();
            if (!items.length) return;
            let next = activeIndex.value < 0 ? (direction > 0 ? 0 : items.length - 1) : activeIndex.value;
            for (let attempt = 0; attempt < items.length; attempt++) {
                next = (next + direction + items.length) % items.length;
                if (!items[next].disabled) {
                    activeIndex.value = next;
                    return;
                }
            }
        };
        const selectOption = (item, event) => {
            if (item.disabled) return;
            if (isState) value.value = item.value;
            else localValue.value = item.value;
            open.value = false;
            if (onchange) onchange(item.value, event);
        };
        const selectedLabel = computed(() =>
            currentOptions().find(item => item.value === selectedValue())?.label || prop(placeholder, 'Select an option'));
        const closeIfFocusLeaves = event => {
            if (!event.currentTarget.contains(event.relatedTarget)) open.value = false;
        };
        const onTriggerKeydown = event => {
            const items = currentOptions();
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (!open.value) {
                    open.value = true;
                    activeIndex.value = currentIndex();
                }
                moveActive(event.key === 'ArrowDown' ? 1 : -1);
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!open.value) {
                    open.value = true;
                    activeIndex.value = currentIndex();
                } else if (items[activeIndex.value]) {
                    selectOption(items[activeIndex.value], event);
                }
            } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                if (!open.value) open.value = true;
                activeIndex.value = event.key === 'Home' ? -1 : 0;
                moveActive(event.key === 'Home' ? 1 : -1);
            } else if (event.key === 'Escape') {
                open.value = false;
            }
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-select ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                onfocusout: closeIfFocusLeaves
            },
            button({
                type: 'button',
                class: 'aetheria-select-trigger',
                role: 'combobox',
                'aria-label': bind(ariaLabel, 'Select an option'),
                'aria-haspopup': 'listbox',
                'aria-expanded': computed(() => open.value ? 'true' : 'false'),
                disabled: computed(() => prop(disabled, false)),
                onclick: () => {
                    open.value = !open.value;
                    activeIndex.value = currentIndex();
                },
                onkeydown: onTriggerKeydown
            },
            span({ class: 'aetheria-select-value' }, selectedLabel),
            span({ class: 'aetheria-select-chevron', 'aria-hidden': 'true' }, icon('chevronDown'))),
            div(
                {
                    class: computed(() => `aetheria-select-menu${open.value ? ' is-open' : ''}`),
                    role: 'listbox',
                    'aria-label': bind(ariaLabel, 'Select an option'),
                    'aria-hidden': computed(() => open.value ? 'false' : 'true')
                },
                loop(optionViews, item => `${item.index}:${String(item.value)}:${String(item.label)}`, item => {
                    const content = typeof item.render === 'function'
                        ? item.render(item)
                        : div(
                            { class: 'aetheria-select-option-copy' },
                            span(item.label),
                            item.description ? span({ class: 'aetheria-select-option-description' }, item.description) : ''
                        );
                    return button(
                        {
                            type: 'button',
                            class: computed(() => `aetheria-select-option${activeIndex.value === item.index ? ' is-active' : ''}`),
                            role: 'option',
                            'aria-selected': computed(() => selectedValue() === item.value ? 'true' : 'false'),
                            disabled: item.disabled,
                            onclick: event => selectOption(item, event)
                        },
                        content,
                        span({
                            class: computed(() =>
                                `aetheria-select-option-check${selectedValue() === item.value ? '' : ' aetheria-hidden'}`),
                            'aria-hidden': 'true'
                        }, icon('check'))
                    );
                })
            )
        );
    }
}

export class MultiSelect extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            value = [],
            options = [],
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        const isState = isReactive(value);
        const readArray = (raw) => Array.isArray(raw) ? raw : [];
        const selected = isState ? [] : [...readArray(value)];
        const selectionTick = stateOf(0);
        const currentValues = () => isState
            ? readArray(value.value)
            : (selectionTick.value, selected);
        const normalize = (item, index) => ({
            value: typeof item === 'string' ? item : (item.value ?? item.label ?? item),
            label: typeof item === 'string' ? item : (item.label ?? item.value ?? item),
            index
        });
        const currentOptions = () => readArray(prop(options, [])).map(normalize);
        const optionViews = listOf(...currentOptions());
        const optionsSignature = computed(() => currentOptions()
            .map(item => `${item.index}\u0000${String(item.value)}\u0000${String(item.label)}`)
            .join('\u0001'));
        optionsSignature.subscribe(() => optionViews.set(currentOptions()));
        const applyValues = (nextValues, event) => {
            if (isState) value.value = nextValues;
            else {
                selected.splice(0, selected.length, ...nextValues);
                selectionTick.value++;
            }
            if (onchange) onchange(nextValues, event);
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-col aetheria-col-tight ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            loop(optionViews, item => `${item.index}:${String(item.value)}:${String(item.label)}`, item => label(
                { class: 'aetheria-control-label' },
                input({
                    type: 'checkbox',
                    class: 'aetheria-check',
                    checked: computed(() => currentValues().includes(item.value)),
                    disabled: computed(() => prop(disabled, false)),
                    onchange: (e) => applyValues(e.target.checked
                        ? [...currentValues(), item.value]
                        : currentValues().filter(kept => kept !== item.value), e)
                }),
                span(item.label)
            ))
        );
    }
}

export class Switch extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            checked = false,
            label: labelText = '',
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        return label(
            {
                class: computed(() =>
                    `aetheria-control-label ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input(
                {
                    type: 'checkbox',
                    class: 'aetheria-switch',
                    ...(isReactive(checked)
                        ? { bind: checked }
                        : { checked: computed(() => prop(checked, false)) }),
                    disabled: computed(() => prop(disabled, false)),
                    onchange: (e) => {
                        if (onchange) onchange(e.target.checked, e);
                    }
                }
            ),
            labelText ? span(bind(labelText, '')) : ''
        );
    }
}

export class Slider extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            min = 0,
            max = 100,
            step = 1,
            value = 50,
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        const currentValue = isReactive(value) ? value : stateOf(Number(prop(value, 50)));
        return div(
            {
                class: computed(() =>
                    `aetheria-col ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input({
                type: 'range',
                class: 'aetheria-range',
                min: bind(min, 0),
                max: bind(max, 100),
                step: bind(step, 1),
                disabled: computed(() => prop(disabled, false)),
                value: currentValue,
                oninput: (e) => {
                    const nextValue = Number(e.target.value);
                    currentValue.value = nextValue;
                    if (onchange) onchange(nextValue, e);
                }
            })
        );
    }
}

export class RangeSlider extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            min = 0,
            max = 100,
            low = 25,
            high = 75,
            disabled = false,
            onchange = null,
            class: customClass = ''
        } = props;
        const lowState = isReactive(low) ? low : stateOf(Number(prop(low, 25)));
        const highState = isReactive(high) ? high : stateOf(Number(prop(high, 75)));

        return div(
            {
                class: computed(() =>
                    `aetheria-col ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input({
                type: 'range',
                class: 'aetheria-range',
                min: bind(min, 0),
                max: bind(max, 100),
                disabled: computed(() => prop(disabled, false)),
                value: lowState,
                oninput: (e) => {
                    const nextValue = Math.min(Number(e.target.value), Number(highState.value));
                    lowState.value = nextValue;
                    if (onchange) onchange({ low: nextValue, high: Number(highState.value) }, e);
                }
            }),
            input({
                type: 'range',
                class: 'aetheria-range',
                min: bind(min, 0),
                max: bind(max, 100),
                disabled: computed(() => prop(disabled, false)),
                value: highState,
                oninput: (e) => {
                    const nextValue = Math.max(Number(e.target.value), Number(lowState.value));
                    highState.value = nextValue;
                    if (onchange) onchange({ low: Number(lowState.value), high: nextValue }, e);
                }
            })
        );
    }
}

export class Badge extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            text = 'Badge',
            variant = 'default',
            children = null,
            class: customClass = ''
        } = props;
        return span(
            {
                class: computed(() =>
                    `aetheria-badge ${flag(prop(variant, 'default') === 'primary', 'aetheria-badge-primary')} ${prop(customClass, '')}`
                        .replace(/\s+/g, ' ').trim())
            },
            children === null || children === undefined ? bind(text, 'Badge') : bind(children)
        );
    }
}

export class Avatar extends Component {
    constructor(props = {}) {
        super();
        this._initialProps = props;
    }

    render(props = this._initialProps) {
        const {
            name = 'A',
            initials = '',
            size = '42px',
            color = '#17132c',
            children = null,
            class: customClass = ''
        } = props;
        return div(
            {
                class: computed(() =>
                    `aetheria-avatar ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: computed(() => {
                    const dimension = prop(size, '42px');
                    const font = Math.max(10, (Number.parseFloat(dimension) || 0) * 0.4);
                    return `width:${dimension}; height:${dimension}; font-size:${font}px; color:${prop(color, '#17132c')};`;
                })
            },
            children === null || children === undefined
                ? computed(() => {
                    const preset = prop(initials, '');
                    if (preset) return String(preset);
                    const fullName = prop(name, 'A');
                    if (typeof fullName !== 'string') return 'A';
                    return fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'A';
                })
                : bind(children)
        );
    }
}

export class Card extends Component {
    render(props = {}) {
        const {
            title: titleText = '',
            children = null,
            style: customStyle = '',
            class: customClass = ''
        } = props;
        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel aetheria-card ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: customStyle
            },
            computed(() => prop(titleText, '')
                ? h3({ class: 'aetheria-panel-title' }, bind(titleText, ''))
                : ''),
            children === null || children === undefined ? '' : bind(children)
        );
    }
}

export class Spinner extends Component {
    render(props = {}) {
        const { class: customClass = '' } = props;
        return div({
            class: computed(() =>
                `aetheria-spinner ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
        });
    }
}

export class ProgressBar extends Component {
    render(props = {}) {
        const {
            value = 0,
            max = 100,
            class: customClass = ''
        } = props;
        const widthStyle = computed(() => {
            const current = Number(prop(value, 0)) || 0;
            const limit = Number(prop(max, 100)) || 100;
            const pct = Math.min(100, Math.max(0, (current / limit) * 100));
            return `width: ${pct}%;`;
        });
        return div(
            {
                class: computed(() =>
                    `aetheria-progressbar ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            div({ class: 'aetheria-progressbar-fill', style: widthStyle })
        );
    }
}

export class Dropdown extends Component {
    render(props = {}) {
        const {
            trigger: triggerLabel = 'Open Dropdown',
            items = [],
            onselect = null,
            class: customClass = ''
        } = props;
        const isOpen = stateOf(false);
        return div(
            {
                class: computed(() =>
                    `aetheria-dropdown ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: 'position:relative; display:inline-block;'
            },
            button(
                {
                    type: 'button',
                    class: 'aetheria-btn aetheria-btn-secondary',
                    'aria-expanded': computed(() => flag(isOpen, 'true', 'false')),
                    onclick: () => { isOpen.value = !isOpen.value; }
                },
                bind(triggerLabel, 'Open Dropdown'),
                icon('chevronDown', 'aetheria-icon-sm')
            ),
            computed(() => {
                if (!isOpen.value) return div({ class: 'aetheria-hidden' });
                const list = prop(items, []);
                return div(
                    { class: 'aetheria-glass aetheria-dropdown-panel' },
                    ...(Array.isArray(list) ? list : []).map(item => {
                        const lbl = item && typeof item === 'object' ? item.label : item;
                        return div(
                            {
                                class: 'aetheria-dropdown-item',
                                onclick: () => {
                                    isOpen.value = false;
                                    if (onselect) onselect(item);
                                }
                            },
                            bind(lbl, '')
                        );
                    })
                );
            })
        );
    }
}

export class ContextMenu extends Component {
    render(props = {}) {
        const {
            items = [],
            onselect = null,
            children = null,
            class: customClass = ''
        } = props;
        let portal = null;
        let observer = null;
        let keydownHandler = null;

        const closeMenu = () => {
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
                keydownHandler = null;
            }
            observer?.disconnect();
            observer = null;
            portal?.remove();
            portal = null;
        };

        const openMenu = (event, source) => {
            closeMenu();

            const list = Array.isArray(prop(items, [])) ? prop(items, []) : [];

            const overlay = document.createElement('div');
            overlay.className = 'aetheria-context-menu-backdrop';
            overlay.addEventListener('click', closeMenu);
            overlay.addEventListener('contextmenu', menuEvent => menuEvent.preventDefault());

            const menu = document.createElement('div');
            menu.className = 'aetheria-context-menu';
            menu.setAttribute('role', 'menu');
            menu.addEventListener('click', menuEvent => menuEvent.stopPropagation());

            const menuWidth = Math.min(220, Math.max(0, window.innerWidth - 16));
            const menuHeight = Math.min(list.length * 48 + 16, Math.max(0, window.innerHeight - 16));
            menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8))}px`;
            menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))}px`;

            list.forEach(item => {
                if (item?.separator) {
                    const separator = document.createElement('div');
                    separator.setAttribute('role', 'separator');
                    separator.className = 'aetheria-command-sep';
                    separator.className = 'aetheria-menu-sep';
                    menu.append(separator);
                    return;
                }

                const labelText = typeof item === 'string' ? item : prop(item?.label, '');
                const disabled = typeof item === 'object' && Boolean(item.disabled);
                const action = document.createElement('button');
                action.type = 'button';
                action.setAttribute('role', 'menuitem');
                action.className = 'aetheria-dropdown-item';
                action.disabled = disabled;
                action.textContent = String(labelText ?? '');
                if (!disabled) {
                    action.addEventListener('focus', () => action.classList.add('is-active'));
                    action.addEventListener('blur', () => action.classList.remove('is-active'));
                }
                action.addEventListener('click', menuEvent => {
                    if (disabled) return;
                    closeMenu();
                    if (onselect) onselect(item, menuEvent);
                    if (typeof item === 'object' && item.action) item.action(menuEvent);
                });
                menu.append(action);
            });

            overlay.append(menu);
            document.body.append(overlay);
            portal = overlay;

            keydownHandler = keyEvent => {
                if (keyEvent.key === 'Escape') closeMenu();
            };
            document.addEventListener('keydown', keydownHandler);
            observer = new MutationObserver(() => {
                if (!source.isConnected) closeMenu();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-context-menu-area ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                oncontextmenu: (event) => {
                    event.preventDefault();
                    openMenu(event, event.currentTarget);
                }
            },
            children === null || children === undefined ? '' : bind(children)
        );
    }
}

export class Autocomplete extends Component {
    render(props = {}) {
        const {
            items = [],
            placeholder = 'Search...',
            onselect = null,
            class: customClass = ''
        } = props;
        const query = stateOf('');
        const isOpen = stateOf(false);

        return div(
            {
                class: computed(() =>
                    `aetheria-autocomplete ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            input({
                type: 'text',
                class: 'aetheria-field',
                placeholder: bind(placeholder, 'Search...'),
                value: query,
                'aria-expanded': computed(() => flag(isOpen, 'true', 'false')),
                oninput: (e) => {
                    query.value = e.target.value;
                    isOpen.value = query.value.trim().length > 0;
                }
            }),
            computed(() => {
                if (!isOpen.value) return div({ class: 'aetheria-hidden' });
                const list = Array.isArray(prop(items, [])) ? prop(items, []) : [];
                const needle = query.value.toLowerCase();
                const filtered = list.filter(i =>
                    String(i && typeof i === 'object' ? prop(i.label, '') : i)
                        .toLowerCase()
                        .includes(needle)
                );
                return div(
                    { class: 'aetheria-glass aetheria-autocomplete-results' },
                    filtered.length === 0
                        ? div({ class: 'aetheria-autocomplete-item aetheria-text-muted' }, 'No matches found')
                        : filtered.map(item => {
                            const lbl = item && typeof item === 'object' ? item.label : item;
                            return div(
                                {
                                    class: 'aetheria-autocomplete-item',
                                    onclick: () => {
                                        query.value = String(prop(lbl, ''));
                                        isOpen.value = false;
                                        if (onselect) onselect(item);
                                    }
                                },
                                bind(lbl, '')
                            );
                        })
                );
            })
        );
    }
}

export class Tabs extends Component {
    render(props = {}) {
        const {
            tabs = [],
            defaultTab = 0,
            label = '',
            class: customClass = ''
        } = props;
        const activeIdx = stateOf(Math.max(0, Number(prop(defaultTab, 0)) || 0));

        return div(
            {
                class: computed(() =>
                    `aetheria-tabs ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => {
                const list = Array.isArray(prop(tabs, [])) ? prop(tabs, []) : [];
                const count = Math.max(list.length, 1);
                return div(
                    {
                        class: 'aetheria-tabs-list',
                        role: 'tablist',
                        'aria-label': prop(label, '') || 'Tabs'
                    },
                    div({
                        class: 'aetheria-tabs-indicator',
                        'aria-hidden': 'true',
                        style: computed(() => `width:calc((100% - 8px) / ${count}); transform:translateX(${activeIdx.value * 100}%)`)
                    }),
                    ...list.map((tab, idx) => {
                        const isActive = computed(() => activeIdx.value === idx);
                        const lbl = tab && typeof tab === 'object' ? tab.label : tab;
                        return button(
                            {
                                type: 'button',
                                class: computed(() => `aetheria-tab-btn ${flag(isActive, 'active')}`.replace(/\s+/g, ' ').trim()),
                                role: 'tab',
                                'aria-selected': computed(() => flag(isActive, 'true', 'false')),
                                tabindex: computed(() => flag(isActive, '0', '-1')),
                                onclick: () => { activeIdx.value = idx; }
                            },
                            bind(lbl, `Tab ${idx + 1}`)
                        );
                    })
                );
            }),
            computed(() => {
                const list = Array.isArray(prop(tabs, [])) ? prop(tabs, []) : [];
                const current = list[activeIdx.value];
                return div(
                    {
                        class: 'aetheria-glass aetheria-tab-panel',
                        role: 'tabpanel'
                    },
                    current ? bind(current.content, '') : ''
                );
            })
        );
    }
}

export class Accordion extends Component {
    render(props = {}) {
        const { items = [], class: customClass = '' } = props;
        const openStates = [];

        return div(
            {
                class: computed(() =>
                    `aetheria-col-tight ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => {
                const list = Array.isArray(prop(items, [])) ? prop(items, []) : [];
                return div(
                    { class: 'aetheria-col-tight' },
                    ...list.map((item, idx) => {
                        const isOpen = openStates[idx] || (openStates[idx] = stateOf(false));
                        const title = item && typeof item === 'object' ? item.title : item;
                        const content = item && typeof item === 'object' ? item.content : '';
                        return div(
                            { class: 'aetheria-glass aetheria-accordion-item' },
                            button(
                                {
                                    type: 'button',
                                    class: 'aetheria-accordion-trigger',
                                    'aria-expanded': computed(() => flag(isOpen, 'true', 'false')),
                                    onclick: () => { isOpen.value = !isOpen.value; }
                                },
                                bind(title, 'Accordion Section'),
                                span({ class: 'aetheria-accordion-chevron' }, icon('chevronDown'))
                            ),
                            div(
                                {
                                    class: computed(() =>
                                        `aetheria-accordion-content ${flag(isOpen, 'is-open')}`.replace(/\s+/g, ' ').trim())
                                },
                                div({ class: 'aetheria-pad-3' }, bind(content, ''))
                            )
                        );
                    })
                );
            })
        );
    }
}

export class Modal extends Component {
    render(props = {}) {
        const {
            open = false,
            title: titleText = 'Dialog',
            onclose = null,
            children = null,
            class: customClass = ''
        } = props;

        return div(
            {
                class: computed(() =>
                    `aetheria-modal-backdrop ${flag(open, 'is-open')} ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                'aria-hidden': computed(() => flag(open, 'false', 'true')),
                onclick: (e) => {
                    if (e.target === e.currentTarget && onclose) {
                        if (isReactive(open)) open.value = false;
                        onclose();
                    }
                }
            },
            div(
                {
                    class: computed(() =>
                        `aetheria-glass aetheria-modal-dialog ${flag(open, 'is-open')}`.replace(/\s+/g, ' ').trim())
                },
                div(
                    { class: 'aetheria-row aetheria-row-between' },
                    h3({ class: 'aetheria-panel-title aetheria-grow' }, bind(titleText, 'Dialog')),
                    button(
                        {
                            type: 'button',
                            'aria-label': 'Close dialog',
                            class: 'aetheria-icon-close aetheria-shrink',
                            onclick: () => {
                                if (isReactive(open)) open.value = false;
                                if (onclose) onclose();
                            }
                        },
                        icon('close')
                    )
                ),
                div({ class: 'aetheria-text-muted aetheria-wrap-anywhere' }, children === null || children === undefined ? '' : bind(children))
            )
        );
    }
}

export class Drawer extends Component {
    render(props = {}) {
        const {
            open = false,
            title: titleText = 'Drawer Menu',
            onclose = null,
            children = null,
            class: customClass = ''
        } = props;

        const close = () => {
            if (isReactive(open)) open.value = false;
            if (onclose) onclose();
        };
        return div(
            {
                class: computed(() =>
                    `aetheria-drawer-backdrop ${flag(open, 'is-open')} ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                'aria-hidden': computed(() => flag(open, 'false', 'true')),
                onclick: close
            },
            div(
                {
                    class: computed(() =>
                        `aetheria-drawer ${flag(open, 'is-open')}`.replace(/\s+/g, ' ').trim()),
                    onclick: (e) => e.stopPropagation()
                },
                div(
                    { class: 'aetheria-row aetheria-row-between aetheria-shrink' },
                    h3({ class: 'aetheria-drawer-title aetheria-grow' }, bind(titleText, 'Drawer Menu')),
                    button(
                        {
                            type: 'button',
                            'aria-label': 'Close drawer',
                            class: 'aetheria-icon-close aetheria-shrink',
                            onclick: close
                        },
                        icon('close')
                    )
                ),
                div({ class: 'aetheria-grow' }, children === null || children === undefined ? '' : bind(children))
            )
        );
    }
}

export class Tooltip extends Component {
    render(props = {}) {
        const {
            content = '',
            text = '',
            children = null,
            class: customClass = ''
        } = props;
        const isHovered = stateOf(false);
        return span(
            {
                class: computed(() =>
                    `aetheria-tooltip-anchor ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: 'position:relative; display:inline-block; cursor:help;',
                onmouseenter: () => { isHovered.value = true; },
                onmouseleave: () => { isHovered.value = false; }
            },
            children === null || children === undefined ? span(bind(text, '')) : bind(children),
            span(
                {
                    class: computed(() =>
                        `aetheria-glass aetheria-tooltip ${flag(isHovered, 'is-open')}`.replace(/\s+/g, ' ').trim()),
                    style: 'bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);'
                },
                bind(content, '')
            )
        );
    }
}

export class Popover extends Component {
    render(props = {}) {
        const {
            trigger = 'Toggle Popover',
            content = null,
            children = null,
            class: customClass = ''
        } = props;
        const isOpen = stateOf(false);
        return div(
            {
                class: computed(() =>
                    `aetheria-popover ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: 'position:relative; display:inline-block;'
            },
            button(
                {
                    type: 'button',
                    class: 'aetheria-btn aetheria-btn-secondary',
                    'aria-expanded': computed(() => flag(isOpen, 'true', 'false')),
                    onclick: () => { isOpen.value = !isOpen.value; }
                },
                bind(trigger, 'Toggle Popover')
            ),
            computed(() => {
                if (!isOpen.value) return div({ class: 'aetheria-hidden' });
                const body = content === null || content === undefined
                    ? (children === null || children === undefined ? 'Popover Content' : children)
                    : content;
                return div(
                    { class: 'aetheria-glass aetheria-popover-panel' },
                    bind(body, 'Popover Content')
                );
            })
        );
    }
}

function parseCalendarDate(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (typeof value === 'string' && value) {
        const [year, month, day] = value.slice(0, 10).split('-').map(Number);
        if (year && month && day) {
            const parsed = new Date(year, month - 1, day);
            if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) return parsed;
        }
    }
    return null;
}

function calendarDateKey(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function shiftCalendarDate(date, mode, amount) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (mode === 'daily') next.setDate(next.getDate() + amount);
    else if (mode === 'weekly') next.setDate(next.getDate() + amount * 7);
    else if (mode === 'yearly') next.setFullYear(next.getFullYear() + amount);
    else next.setMonth(next.getMonth() + amount);
    return next;
}

function clampCalendarDay(year, month, day) {
    return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
}

function createCalendarView({ cursor, selected, level, direction, locale, min, max, disabledDates, onSelect, onNavigate, onLevel }) {
    const visibleDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    const selectedDate = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()) : null;
    const minDate = parseCalendarDate(min);
    const maxDate = parseCalendarDate(max);
    const disabledKeys = disabledDates.map(item => calendarDateKey(parseCalendarDate(item)));
    const format = (date, options) => date.toLocaleDateString(locale, options);
    const monthLabel = format(visibleDate, { month: 'long' });
    const yearLabel = String(visibleDate.getFullYear());
    const firstYear = Math.floor(visibleDate.getFullYear() / 10) * 10;
    const navigate = amount => onNavigate(shiftCalendarDate(visibleDate, level === 'days' ? 'monthly' : 'yearly', level === 'years' ? amount * 10 : amount));
    const switchLevel = nextLevel => onLevel(nextLevel);

    const dayButton = (date, label, extraClass = '') => {
        const isSelected = selectedDate && calendarDateKey(selectedDate) === calendarDateKey(date);
        const key = calendarDateKey(date);
        const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate) || disabledKeys.includes(key);
        return button(
            {
                type: 'button',
                class: `aetheria-calendar-day${isSelected ? ' is-selected' : ''}${extraClass ? ` ${extraClass}` : ''}`,
                'aria-label': format(date, { dateStyle: 'full' }),
                'aria-pressed': isSelected ? 'true' : 'false',
                disabled: isDisabled,
                onclick: () => onSelect(date)
            },
            String(label)
        );
    };

    let view;
    let previousLabel = 'Previous month';
    let nextLabel = 'Next month';
    if (level === 'years') {
        previousLabel = 'Previous decade';
        nextLabel = 'Next decade';
        view = div(
            { class: 'aetheria-calendar-year-grid' },
            ...Array.from({ length: 12 }, (_, index) => {
                const year = firstYear - 1 + index;
                const isSelected = selectedDate?.getFullYear() === year;
                const isDisabled = (minDate && year < minDate.getFullYear()) || (maxDate && year > maxDate.getFullYear());
                return button(
                    {
                        type: 'button',
                        class: `aetheria-calendar-month${isSelected ? ' is-selected' : ''}`,
                        'aria-pressed': isSelected ? 'true' : 'false',
                        'aria-label': `Choose year ${year}`,
                        disabled: isDisabled,
                        onclick: () => {
                            onNavigate(clampCalendarDay(year, visibleDate.getMonth(), visibleDate.getDate()));
                            switchLevel('months');
                        }
                    },
                    String(year)
                );
            })
        );
    } else if (level === 'months') {
        view = div(
            { class: 'aetheria-calendar-year-grid aetheria-calendar-month-grid' },
            ...Array.from({ length: 12 }, (_, month) => {
                const monthStart = new Date(visibleDate.getFullYear(), month, 1);
                const monthEnd = new Date(visibleDate.getFullYear(), month + 1, 0);
                const isDisabled = (minDate && monthEnd < minDate) || (maxDate && monthStart > maxDate);
                return button({
                    type: 'button',
                    class: `aetheria-calendar-month${selectedDate?.getFullYear() === visibleDate.getFullYear() && selectedDate?.getMonth() === month ? ' is-selected' : ''}`,
                    'aria-label': `Choose ${format(monthStart, { month: 'long' })}`,
                    disabled: isDisabled,
                    onclick: () => {
                        onNavigate(clampCalendarDay(visibleDate.getFullYear(), month, visibleDate.getDate()));
                        switchLevel('days');
                    }
                }, format(monthStart, { month: 'short' }));
            })
        );
    } else {
        const first = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
        const start = new Date(first);
        start.setDate(first.getDate() - first.getDay());
        const days = Array.from({ length: 42 }, (_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);
            const outsideMonth = date.getMonth() !== visibleDate.getMonth();
            return dayButton(date, date.getDate(), outsideMonth ? 'aetheria-calendar-outside' : '');
        });
        view = div(
            { class: 'aetheria-calendar-month-view' },
            div(
                { class: 'aetheria-calendar-weekdays', 'aria-hidden': 'true' },
                ...Array.from({ length: 7 }, (_, index) => {
                    const date = new Date(2024, 0, 7 + index);
                    return span(format(date, { weekday: 'short' }).slice(0, 2));
                })
            ),
            div({ class: 'aetheria-calendar-grid' }, ...days)
        );
    }

    return div(
        { class: `aetheria-calendar-view${direction ? ` is-${direction}` : ''}` },
        div(
            { class: 'aetheria-calendar-controls' },
            button({
                type: 'button',
                class: 'aetheria-btn aetheria-btn-muted aetheria-calendar-nav',
                'aria-label': previousLabel,
                onclick: () => navigate(-1)
            }, icon('chevronLeft')),
            div({ class: 'aetheria-calendar-title' },
                level === 'days' ? button({
                    type: 'button',
                    class: 'aetheria-calendar-heading',
                    'aria-label': `Choose month, ${monthLabel} ${yearLabel}`,
                    'aria-expanded': 'false',
                    onclick: () => switchLevel('months')
                }, monthLabel) : '',
                button({
                    type: 'button',
                    class: 'aetheria-calendar-heading',
                    'aria-label': level === 'years' ? 'Return to months' : `Choose year, ${yearLabel}`,
                    'aria-expanded': level === 'years' ? 'true' : 'false',
                    onclick: () => switchLevel(level === 'years' ? 'months' : 'years')
                }, level === 'years' ? `${firstYear - 1} – ${firstYear + 10}` : yearLabel)
            ),
            button({
                type: 'button',
                class: 'aetheria-btn aetheria-btn-muted aetheria-calendar-nav',
                'aria-label': nextLabel,
                onclick: () => navigate(1)
            }, icon('chevronRight'))
        ),
        view
    );
}

export class DatePicker extends Component {
    render(props = {}) {
        const {
            value = '',
            onchange = null,
            placeholder = 'Select a date',
            locale = undefined,
            min = null,
            max = null,
            disabledDates = [],
            label = 'Choose date',
            disabled = false,
            class: customClass = ''
        } = props;
        const controlled = isReactive(value);
        const initial = parseCalendarDate(prop(value, ''));
        const storedValue = stateOf(initial ? calendarDateKey(initial) : '');
        const draftValue = stateOf(calendarDateKey(initial) || calendarDateKey(new Date()));
        const isOpen = stateOf(false);

        const committedValue = () => controlled ? prop(value, '') : storedValue.value;
        const openDialog = () => {
            if (prop(disabled, false)) return;
            const current = parseCalendarDate(committedValue());
            draftValue.value = calendarDateKey(current || new Date());
            isOpen.value = true;
        };
        const closeDialog = () => { isOpen.value = false; };
        const commitDate = () => {
            const date = parseCalendarDate(draftValue.value) || new Date();
            const key = calendarDateKey(date);
            if (controlled) value.value = key;
            storedValue.value = key;
            isOpen.value = false;
            if (onchange) onchange(key, date);
        };
        const activeDate = () => parseCalendarDate(committedValue());

        return div(
            {
                class: computed(() =>
                    `aetheria-datepicker aetheria-grow ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            button(
                {
                    type: 'button',
                    class: 'aetheria-btn aetheria-btn-secondary aetheria-datepicker-trigger',
                    'aria-haspopup': 'dialog',
                    'aria-expanded': computed(() => isOpen.value ? 'true' : 'false'),
                    disabled: computed(() => prop(disabled, false)),
                    onclick: openDialog
                },
                span({ class: 'aetheria-truncate' }, computed(() => {
                    const date = activeDate();
                    return date
                        ? date.toLocaleDateString(prop(locale, undefined), { dateStyle: 'medium' })
                        : prop(placeholder, '');
                })),
                icon('calendar')
            ),
            div(
                {
                    class: computed(() => `aetheria-calendar-modal${isOpen.value ? ' is-open' : ''}`),
                    'aria-hidden': computed(() => isOpen.value ? 'false' : 'true'),
                    onclick: event => {
                        if (event.target === event.currentTarget) closeDialog();
                    },
                    onkeydown: event => {
                        if (event.key === 'Escape') closeDialog();
                    }
                },
                div(
                    {
                        class: 'aetheria-glass aetheria-calendar-dialog aetheria-col aetheria-col-tight',
                        role: 'dialog',
                        'aria-modal': 'true',
                        'aria-label': bind(label, 'Choose date')
                    },
                    div(
                        { class: 'aetheria-calendar-header aetheria-row aetheria-row-between aetheria-row-tight' },
                        h3({ class: 'aetheria-calendar-title aetheria-truncate' }, bind(label, 'Choose date')),
                        button({
                            type: 'button',
                            class: 'aetheria-icon-close',
                            'aria-label': 'Close date picker',
                            onclick: closeDialog
                        }, icon('close'))
                    ),
                    new Calendar().render({
                        value: draftValue,
                        locale,
                        min,
                        max,
                        disabledDates,
                        onchange: (date, key) => { draftValue.value = key; }
                    }),
                    div(
                        { class: 'aetheria-calendar-actions' },
                        button({ type: 'button', class: 'aetheria-btn aetheria-btn-muted', onclick: closeDialog }, 'Cancel'),
                        button({
                            type: 'button',
                            class: 'aetheria-btn aetheria-btn-primary',
                            onclick: commitDate
                        }, 'Apply')
                    )
                )
            )
        );
    }
}

export class Calendar extends Component {
    render(props = {}) {
        const {
            value = null,
            onchange = null,
            locale = undefined,
            mode: initialMode = 'monthly',
            min = null,
            max = null,
            disabledDates = [],
            class: customClass = ''
        } = props;
        const controlled = isReactive(value);
        const selectedDate = controlled
            ? value
            : stateOf(calendarDateKey(parseCalendarDate(prop(value, null))));
        const cursor = stateOf(calendarDateKey(parseCalendarDate(selectedDate.value)) || calendarDateKey(new Date()));
        const initialLevel = prop(initialMode, 'monthly') === 'yearly' ? 'years' : 'days';
        const viewLevel = stateOf(initialLevel);
        const direction = stateOf('');

        const disabledSource = () => {
            const list = prop(disabledDates, []);
            return Array.isArray(list) ? list : [];
        };

        const setSelected = date => {
            const key = calendarDateKey(date);
            const minDate = parseCalendarDate(prop(min, null));
            const maxDate = parseCalendarDate(prop(max, null));
            if ((minDate && date < minDate) || (maxDate && date > maxDate) ||
                disabledSource().some(item => calendarDateKey(parseCalendarDate(item)) === key)) return;
            selectedDate.value = key;
            cursor.value = key;
            if (onchange) onchange(date, key);
        };
        const navigate = next => {
            const previous = parseCalendarDate(cursor.value) || new Date();
            const offset = next < previous ? 'backward' : 'forward';
            direction.value = offset;
            cursor.value = calendarDateKey(next);
        };
        const changeLevel = nextLevel => {
            direction.value = '';
            viewLevel.value = nextLevel;
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-calendar aetheria-grow ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => createCalendarView({
                cursor: parseCalendarDate(cursor.value) || new Date(),
                selected: parseCalendarDate(selectedDate.value),
                level: viewLevel.value,
                direction: direction.value,
                locale: prop(locale, undefined),
                min: prop(min, null),
                max: prop(max, null),
                disabledDates: disabledSource(),
                onSelect: setSelected,
                onNavigate: navigate,
                onLevel: changeLevel
            }))
        );
    }
}

export class FormValidation extends Component {
    render(props = {}) {
        const { onsubmit = null, class: customClass = '' } = props;
        const nameVal = stateOf('');
        const emailVal = stateOf('');
        const nameError = stateOf('');
        const emailError = stateOf('');

        return form(
            {
                class: computed(() =>
                    `aetheria-col ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                onsubmit: (e) => {
                    e.preventDefault();
                    const nameMessage = nameVal.value.trim() ? '' : 'Name is required';
                    const emailMessage = emailVal.value.includes('@') ? '' : 'Valid email is required';
                    nameError.value = nameMessage;
                    emailError.value = emailMessage;
                    if (!nameMessage && !emailMessage && onsubmit) {
                        onsubmit({ name: nameVal.value, email: emailVal.value });
                    }
                }
            },
            div(
                { class: 'aetheria-stack' },
                input({
                    type: 'text',
                    class: computed(() =>
                        `aetheria-field ${flag(nameError, 'is-invalid')}`.replace(/\s+/g, ' ').trim()),
                    placeholder: 'Full name',
                    'aria-invalid': computed(() => flag(nameError, 'true', 'false')),
                    bind: nameVal
                }),
                p({
                    class: computed(() =>
                        `aetheria-field-error ${flag(nameError, '', 'aetheria-hidden')}`.replace(/\s+/g, ' ').trim()),
                    role: 'alert'
                }, nameError)
            ),
            div(
                { class: 'aetheria-stack' },
                input({
                    type: 'email',
                    class: computed(() =>
                        `aetheria-field ${flag(emailError, 'is-invalid')}`.replace(/\s+/g, ' ').trim()),
                    placeholder: 'Email address',
                    'aria-invalid': computed(() => flag(emailError, 'true', 'false')),
                    bind: emailVal
                }),
                p({
                    class: computed(() =>
                        `aetheria-field-error ${flag(emailError, '', 'aetheria-hidden')}`.replace(/\s+/g, ' ').trim()),
                    role: 'alert'
                }, emailError)
            ),
            button({ type: 'submit', class: 'aetheria-btn aetheria-btn-primary' }, 'Submit Form')
        );
    }
}

export class Pagination extends Component {
    render(props = {}) {
        const {
            totalPages = 5,
            currentPage = 1,
            onchange = null,
            disabled = false,
            class: customClass = ''
        } = props;
        const page = isReactive(currentPage)
            ? currentPage
            : stateOf(Number(prop(currentPage, 1)) || 1);
        const pageCount = () => Math.max(1, Number(prop(totalPages, 1)) || 1);
        const go = next => {
            const bounded = Math.max(1, Math.min(pageCount(), next));
            if (bounded === page.value) return;
            page.value = bounded;
            if (onchange) onchange(bounded);
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-pagination ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                role: 'navigation',
                'aria-label': 'Pagination'
            },
            button(
                {
                    type: 'button',
                    class: 'aetheria-pagination-btn aetheria-pagination-prev',
                    'aria-label': 'Previous page',
                    disabled: computed(() => flag(disabled, true) || page.value <= 1),
                    onclick: () => go(page.value - 1)
                },
                icon('chevronLeft'),
                span('Previous')
            ),
            computed(() => div(
                { class: 'aetheria-pagination-pages', role: 'group', 'aria-label': 'Page numbers' },
                ...Array.from({ length: pageCount() }, (_, i) => i + 1).map(pNum => {
                    return button(
                        {
                            type: 'button',
                            class: `aetheria-pagination-btn${page.value === pNum ? ' is-active' : ''}`,
                            'aria-label': `Page ${pNum}`,
                            'aria-current': page.value === pNum ? 'page' : 'false',
                            disabled: flag(disabled, true),
                            onclick: () => go(pNum)
                        },
                        String(pNum)
                    );
                })
            )),
            button(
                {
                    type: 'button',
                    class: 'aetheria-pagination-btn aetheria-pagination-next',
                    'aria-label': 'Next page',
                    disabled: computed(() => flag(disabled, true) || page.value >= pageCount()),
                    onclick: () => go(page.value + 1)
                },
                span('Next'),
                icon('chevronRight')
            )
        );
    }
}

export class Breadcrumb extends Component {
    render(props = {}) {
        const {
            items = [],
            label = 'Breadcrumb',
            class: customClass = ''
        } = props;
        const entryLabel = item => {
            if (item === null || item === undefined) return '';
            return typeof item === 'object' ? String(item.label ?? item.href ?? '') : String(item);
        };
        const entryHref = item => (item !== null && typeof item === 'object' && item.href) ? item.href : null;

        return nav(
            { 'aria-label': bind(label, 'Breadcrumb') },
            computed(() => {
                const list = prop(items, []);
                const entries = Array.isArray(list) ? list : [];
                const sepClass = 'aetheria-breadcrumb-sep';
                return ul(
                    {
                        class: `aetheria-breadcrumb ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()
                    },
                    ...entries.map((item, index) => {
                        const isLast = index === entries.length - 1;
                        const text = entryLabel(item);
                        const href = entryHref(item);
                        return li(
                            { class: 'aetheria-breadcrumb-item' },
                            isLast
                                ? span({ class: 'aetheria-breadcrumb-current aetheria-truncate', 'aria-current': 'page' }, text)
                                : (href
                                    ? a({ class: 'aetheria-breadcrumb-link aetheria-truncate', href }, text)
                                    : span({ class: 'aetheria-breadcrumb-link aetheria-truncate' }, text)),
                            isLast ? '' : span({ class: sepClass, 'aria-hidden': 'true' }, icon('chevronRight'))
                        );
                    })
                );
            })
        );
    }
}

export class DataGrid extends Component {
    render(props = {}) {
        const {
            columns = [],
            rows = [],
            searchable = true,
            pageable = false,
            page: initialPage = 1,
            pageSize: initialPageSize = 10,
            pageSizeOptions = [5, 10, 20, 50],
            totalRows = null,
            serverSide = false,
            selectable = false,
            selectedRows: initialSelectedRows = [],
            rowKey = 'id',
            expandable = false,
            renderDetails = null,
            filterPlaceholder = 'Filter grid records...',
            emptyText = 'No records to display',
            rowClassName = null,
            disabled = false,
            class: customClass = '',
            onpagechange = null,
            onselectionchange = null,
            onrowclick = null,
            onrowexpand = null,
            onfilterchange = null,
            onsortchange = null
        } = props;
        const filterText = stateOf('');
        const sortCol = stateOf(null);
        const sortAsc = stateOf(true);
        const page = isReactive(initialPage)
            ? initialPage
            : stateOf(Number(prop(initialPage, 1)) || 1);
        const pageSize = isReactive(initialPageSize)
            ? initialPageSize
            : stateOf(Number(prop(initialPageSize, 10)) || 10);
        const initialSelection = prop(initialSelectedRows, []);
        const selectedRows = isReactive(initialSelectedRows)
            ? { read: () => { const list = initialSelectedRows.value; return Array.isArray(list) ? list : []; },
                write: (next) => { initialSelectedRows.value = next; } }
            : listHolder(initialSelection);
        const expandedRows = listHolder([]);
        const hasExpandableRows = () => flag(expandable, true) || typeof renderDetails === 'function';
        const getColumns = () => {
            const list = prop(columns, []);
            return Array.isArray(list) ? list : [];
        };
        const getPageSize = () => {
            const size = Number(prop(pageSize, 10));
            return Number.isInteger(size) && size > 0 ? size : 10;
        };
        const getPageSizes = () => {
            const options = prop(pageSizeOptions, []);
            const sizes = [...new Set((Array.isArray(options) ? options : [])
                .map(Number)
                .filter(size => Number.isInteger(size) && size > 0))];
            if (!sizes.includes(getPageSize())) sizes.push(getPageSize());
            return sizes;
        };
        const sourceRows = () => {
            const list = prop(rows, []);
            return Array.isArray(list) ? list : [];
        };
        const identity = row => {
            if (typeof rowKey === 'function') return rowKey(row);
            return row?.[rowKey] ?? row;
        };
        const currentSelection = () => selectedRows.read();
        const updateSelection = next => {
            selectedRows.write(next);
            if (onselectionchange) onselectionchange(next);
        };
        const requestPage = nextPage => {
            const count = Math.max(1, Math.ceil(getTotalCount() / getPageSize()));
            const boundedPage = Math.max(1, Math.min(count, nextPage));
            if (boundedPage === page.value) return;
            page.value = boundedPage;
            if (onpagechange) onpagechange(boundedPage, getPageSize());
        };
        const getTotalCount = () => {
            const count = prop(totalRows, null);
            if (prop(serverSide, false) && count != null && Number.isFinite(Number(count))) return Number(count);
            return getFilteredRows().length;
        };
        const getFilteredRows = () => {
            const source = sourceRows();
            if (prop(serverSide, false)) return source;
            const query = filterText.value.trim().toLocaleLowerCase();
            const cols = getColumns();
            return source.filter(row => !query || cols.some(column => {
                const key = typeof column === 'object' ? column.key : column;
                return String(row?.[key] ?? '').toLocaleLowerCase().includes(query);
            }));
        };
        const getSortedRows = () => {
            const data = [...getFilteredRows()];
            const key = sortCol.value;
            if (key == null || prop(serverSide, false)) return data;
            const column = getColumns().find(item => (typeof item === 'object' ? item.key : item) === key);
            const compare = typeof column === 'object' && typeof column.compare === 'function'
                ? column.compare
                : (left, right) => String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
            data.sort((left, right) => compare(left[key], right[key]) * (sortAsc.value ? 1 : -1));
            return data;
        };
        const getPageRows = () => {
            const sorted = getSortedRows();
            return prop(pageable, false) && !prop(serverSide, false)
                ? sorted.slice((page.value - 1) * getPageSize(), page.value * getPageSize())
                : sorted;
        };
        const toggleSelection = (row, checked) => {
            const key = identity(row);
            const current = currentSelection();
            const next = checked
                ? (current.some(item => identity(item) === key) ? current : [...current, row])
                : current.filter(item => identity(item) !== key);
            updateSelection(next);
        };
        const selectPage = checked => {
            const pageRows = getPageRows();
            const pageKeys = pageRows.map(identity);
            const selectionWithoutPage = currentSelection().filter(row => !pageKeys.some(key => key === identity(row)));
            updateSelection(checked ? [...selectionWithoutPage, ...pageRows] : selectionWithoutPage);
        };
        const toggleExpanded = row => {
            const key = identity(row);
            const expanded = expandedRows.read();
            const isExpanded = expanded.some(item => item === key);
            expandedRows.write(isExpanded ? expanded.filter(item => item !== key) : [...expanded, key]);
            if (onrowexpand) onrowexpand(row, !isExpanded);
        };
        const alignClass = align => align === 'right'
            ? 'aetheria-text-right'
            : align === 'center' ? 'aetheria-text-center' : '';
        const renderHeader = () => {
            const cols = getColumns();
            const pageRows = getPageRows();
            const selection = currentSelection();
            const allPageSelected = pageRows.length > 0 && pageRows.every(row =>
                selection.some(item => identity(item) === identity(row))
            );
            const headerCells = [];
            if (prop(selectable, false)) {
                headerCells.push(th(
                    { class: 'aetheria-datagrid-utility-cell', scope: 'col' },
                    input({
                        type: 'checkbox',
                        class: 'aetheria-check aetheria-datagrid-checkbox',
                        'aria-label': 'Select all rows on this page',
                        checked: allPageSelected,
                        disabled: flag(disabled, true) || pageRows.length === 0,
                        onchange: event => selectPage(event.target.checked)
                    })
                ));
            }
            if (hasExpandableRows()) headerCells.push(th({ class: 'aetheria-datagrid-utility-cell', scope: 'col', 'aria-label': 'Expand rows' }, ''));
            cols.forEach(column => {
                const key = typeof column === 'object' ? column.key : column;
                const labelText = typeof column === 'object' ? (column.label ?? key) : column;
                const sortable = typeof column !== 'object' || column.sortable !== false;
                const align = typeof column === 'object' ? (column.align || 'left') : 'left';
                const width = typeof column === 'object' ? column.width : null;
                const cellAttrs = { scope: 'col', class: alignClass(align) };
                if (width) cellAttrs.style = `width:${width};`;
                headerCells.push(th(
                    cellAttrs,
                    sortable ? button({
                        type: 'button',
                        class: 'aetheria-datagrid-sort',
                        disabled: flag(disabled, true),
                        'aria-sort': sortCol.value !== key ? 'none' : sortAsc.value ? 'ascending' : 'descending',
                        onclick: () => {
                            if (flag(disabled, true)) return;
                            if (sortCol.value === key) sortAsc.value = !sortAsc.value;
                            else { sortCol.value = key; sortAsc.value = true; }
                            if (onsortchange) onsortchange(key, sortAsc.value ? 'ascending' : 'descending');
                        }
                    },
                    span(labelText),
                    span({ class: 'aetheria-datagrid-sort-icon', 'aria-hidden': 'true' },
                        icon(sortCol.value === key ? 'arrowUp' : 'sort'))) : labelText
                ));
            });
            return thead(tr(...headerCells));
        };
        const renderBody = () => {
            const cols = getColumns();
            const pageRows = getPageRows();
            const selection = currentSelection();
            const expanded = expandedRows.read();
            const bodyRows = [];
            pageRows.forEach((row, rowIndex) => {
                const key = identity(row);
                const isSelected = selection.some(item => identity(item) === key);
                const isExpanded = expanded.some(item => item === key);
                const rowCells = [];
                if (prop(selectable, false)) {
                    rowCells.push(td(
                        { class: 'aetheria-datagrid-utility-cell' },
                        input({
                            type: 'checkbox',
                            class: 'aetheria-check aetheria-datagrid-checkbox',
                            'aria-label': `Select row ${rowIndex + 1}`,
                            checked: isSelected,
                            disabled: flag(disabled, true),
                            onchange: event => toggleSelection(row, event.target.checked),
                            onclick: event => event.stopPropagation()
                        })
                    ));
                }
                if (hasExpandableRows()) {
                    rowCells.push(td(
                        { class: 'aetheria-datagrid-utility-cell' },
                        button({
                            type: 'button',
                            class: 'aetheria-datagrid-expand',
                            'aria-label': isExpanded ? 'Collapse row details' : 'Expand row details',
                            'aria-expanded': isExpanded ? 'true' : 'false',
                            onclick: event => {
                                event.stopPropagation();
                                toggleExpanded(row);
                            }
                        }, icon(isExpanded ? 'minus' : 'plus'))
                    ));
                }
                cols.forEach(column => {
                    const keyName = typeof column === 'object' ? column.key : column;
                    const align = typeof column === 'object' ? (column.align || 'left') : 'left';
                    const value = row?.[keyName];
                    const renderCell = typeof column === 'object' && typeof column.render === 'function'
                        ? column.render
                        : typeof column === 'object' && typeof column.renderCell === 'function'
                            ? column.renderCell
                            : null;
                    const content = renderCell ? renderCell(value, row, column) : String(value ?? '');
                    rowCells.push(td({ class: alignClass(align) }, content ?? ''));
                });
                bodyRows.push(tr(
                    {
                        class: `${isSelected ? 'is-selected ' : ''}${onrowclick ? 'is-clickable ' : ''}${typeof rowClassName === 'function' ? rowClassName(row) || '' : ''}`.trim(),
                        onclick: event => { if (onrowclick) onrowclick(row, event); }
                    },
                    ...rowCells
                ));
                if (hasExpandableRows() && isExpanded) {
                    const detail = typeof renderDetails === 'function' ? renderDetails(row) : (row.details ?? '');
                    bodyRows.push(tr(
                        { class: 'aetheria-datagrid-detail-row' },
                        td({ colspan: cols.length + Number(prop(selectable, false)) + 1 }, detail ?? '')
                    ));
                }
            });
            if (bodyRows.length === 0) {
                bodyRows.push(tr(
                    { class: 'aetheria-datagrid-empty-row' },
                    td(
                        { colspan: Math.max(1, cols.length + Number(prop(selectable, false)) + Number(hasExpandableRows())) },
                        prop(emptyText, 'No records to display')
                    )
                ));
            }
            return tbody(...bodyRows);
        };
        const renderPager = () => {
            const filteredCount = getTotalCount();
            const size = getPageSize();
            const pageCount = Math.max(1, Math.ceil(filteredCount / size));
            const summary = `${filteredCount === 0 ? 0 : (page.value - 1) * size + 1}–${Math.min(page.value * size, filteredCount)} of ${filteredCount}`;
            return div(
                { class: 'aetheria-datagrid-pager', role: 'navigation', 'aria-label': 'Grid pagination' },
                span({ class: 'aetheria-datagrid-page-summary aetheria-num' }, summary),
                label(
                    { class: 'aetheria-datagrid-page-size-label' },
                    'Rows per page',
                    select({
                        class: 'aetheria-field aetheria-datagrid-page-size',
                        disabled: flag(disabled, true),
                        onchange: event => {
                            pageSize.value = Number(event.target.value);
                            page.value = 1;
                            if (onpagechange) onpagechange(1, getPageSize());
                        }
                    }, ...getPageSizes().map(optionSize => option({
                        value: String(optionSize),
                        selected: optionSize === size
                    }, String(optionSize))))
                ),
                button({
                    type: 'button',
                    class: 'aetheria-datagrid-page-btn',
                    'aria-label': 'Previous grid page',
                    disabled: flag(disabled, true) || page.value <= 1,
                    onclick: () => requestPage(page.value - 1)
                }, icon('chevronLeft')),
                span({ class: 'aetheria-datagrid-page-current aetheria-num', 'aria-live': 'polite' }, `Page ${Math.min(page.value, pageCount)} of ${pageCount}`),
                button({
                    type: 'button',
                    class: 'aetheria-datagrid-page-btn',
                    'aria-label': 'Next grid page',
                    disabled: flag(disabled, true) || page.value >= pageCount,
                    onclick: () => requestPage(page.value + 1)
                }, icon('chevronRight'))
            );
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-datagrid ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => flag(searchable, true) ? input({
                type: 'search',
                class: 'aetheria-field aetheria-datagrid-filter',
                placeholder: prop(filterPlaceholder, 'Filter grid records...'),
                disabled: flag(disabled, true),
                bind: filterText,
                oninput: event => {
                    page.value = 1;
                    if (onfilterchange) onfilterchange(event.target.value);
                }
            }) : ''),
            div(
                { class: 'aetheria-datagrid-content' },
                div(
                    { class: 'aetheria-table-scroll' },
                    table(
                        { class: 'aetheria-table aetheria-datagrid-table' },
                        computed(() => renderHeader()),
                        computed(() => renderBody())
                    )
                ),
                computed(() => flag(pageable, true) ? renderPager() : '')
            )
        );
    }
}

function aetheriaText(value, fallback = '') {
    const current = prop(value, fallback);
    if (current == null || current === false) return fallback;
    if (typeof current === 'object' && !isReactive(current)) {
        return String(current.label ?? current.name ?? current.value ?? fallback);
    }
    return String(current);
}

function aetheriaGlyph(value, extraClass = 'aetheria-shrink') {
    const current = prop(value, null);
    if (current == null || current === false || current === '') return div({ class: 'aetheria-hidden' });
    if (typeof current === 'string') {
        return span({ class: extraClass }, AETHERIA_ICONS[current] ? icon(current) : current);
    }
    return current;
}

export class TreeView extends Component {
    render(props = {}) {
        const { nodes = [], class: customClass = '' } = props;
        const renderNode = (node) => {
            const children = Array.isArray(prop(node?.children, [])) ? prop(node.children, []) : [];
            const open = stateOf(false);
            return div(
                { class: 'aetheria-stack' },
                div(
                    { class: 'aetheria-tree-row' },
                    children.length > 0
                        ? button(
                            {
                                type: 'button',
                                class: 'aetheria-tree-trigger',
                                'aria-expanded': computed(() => String(open.value)),
                                'aria-label': computed(() => `${open.value ? 'Collapse' : 'Expand'} ${aetheriaText(node?.label, 'node')}`),
                                onclick: () => { open.value = !open.value; }
                            },
                            computed(() => span({ class: 'aetheria-shrink' }, icon(open.value ? 'chevronDown' : 'chevronRight', 'aetheria-icon-sm')))
                        )
                        : span({ class: 'aetheria-tree-trigger aetheria-tree-spacer', 'aria-hidden': 'true' }),
                    span({ class: 'aetheria-tree-label' }, computed(() => aetheriaText(node?.label, 'Node'))),
                    node?.meta == null ? '' : span({ class: 'aetheria-tree-meta' }, computed(() => aetheriaText(node.meta, '')))
                ),
                children.length > 0
                    ? computed(() => open.value
                        ? div({ class: 'aetheria-tree-children' }, ...children.map(renderNode))
                        : div({ class: 'aetheria-hidden' }))
                    : ''
            );
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => div(
                { class: 'aetheria-tree-view' },
                ...(prop(nodes, []) ?? []).map(renderNode)
            ))
        );
    }
}

export class TreeGrid extends Component {
    render(props = {}) {
        const { columns = [], data = [], class: customClass = '' } = props;
        const expanded = listHolder([]);

        const specs = () => (prop(columns, []) ?? []).map((column, index) => {
            const isObject = column !== null && typeof column === 'object' && !isReactive(column);
            const key = isObject ? String(prop(column.key ?? column.field, index)) : String(prop(column, index));
            const label = isObject ? String(prop(column.label, key)) : String(prop(column, index));
            return { key, label };
        });

        const cellText = (item, spec, index) => {
            if (item && Object.prototype.hasOwnProperty.call(item, spec.key)) {
                return aetheriaText(item[spec.key], '');
            }
            return aetheriaText([item?.name, item?.type, item?.size][index], '');
        };

        const toggle = (key) => {
            const current = expanded.read();
            expanded.write(current.includes(key)
                ? current.filter(item => item !== key)
                : [...current, key]);
        };

        const indent = (depth, content) => {
            let node = content;
            for (let level = 0; level < depth; level++) {
                node = div({ class: 'aetheria-tree-children' }, node);
            }
            return node;
        };

        const rowNode = (item, key, depth, cellSpecs) => {
            const children = Array.isArray(item?.children) ? item.children : [];
            const isOpen = expanded.read().includes(key);
            return tr(
                ...cellSpecs.map((spec, index) => {
                    const text = cellText(item, spec, index);
                    if (index > 0) return td(text);
                    return td(
                        indent(depth, div(
                            { class: 'aetheria-tree-row' },
                            children.length > 0
                                ? button(
                                    {
                                        type: 'button',
                                        class: 'aetheria-tree-trigger',
                                        'aria-expanded': String(isOpen),
                                        'aria-label': `${isOpen ? 'Collapse' : 'Expand'} ${text}`,
                                        onclick: () => toggle(key)
                                    },
                                    span({ class: 'aetheria-shrink' }, icon(isOpen ? 'chevronDown' : 'chevronRight', 'aetheria-icon-sm'))
                                )
                                : span({ class: 'aetheria-tree-trigger aetheria-tree-spacer', 'aria-hidden': 'true' }),
                            span({ class: 'aetheria-tree-label' }, text)
                        ))
                    );
                })
            );
        };

        const flatten = (list, depth, path, cellSpecs) => (list ?? []).flatMap((item, index) => {
            const key = `${path}${index}`;
            const children = Array.isArray(item?.children) ? item.children : [];
            const row = rowNode(item, key, depth, cellSpecs);
            return expanded.read().includes(key)
                ? [row, ...flatten(children, depth + 1, `${key}/`, cellSpecs)]
                : [row];
        });

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => {
                const cellSpecs = specs();
                const rows = flatten(prop(data, []) ?? [], 0, '', cellSpecs);
                return div(
                    { class: 'aetheria-scroll-x' },
                    table(
                        { class: 'aetheria-table aetheria-table-flush' },
                        thead(tr(...cellSpecs.map(spec => th(spec.label)))),
                        tbody(...rows)
                    )
                );
            })
        );
    }
}

export class ListView extends Component {
    render(props = {}) {
        const { items = [], itemHeight = 40, visibleCount = 5, class: customClass = '' } = props;
        const source = () => prop(items, []) ?? [];
        const step = () => Math.max(1, Number(prop(itemHeight, 40)) || 40);
        const windowSize = () => Math.max(1, Number(prop(visibleCount, 5)) || 5);
        const labelOf = (value) => aetheriaText(value, '');
        const visible = listOf();
        const writeWindow = (scrollTop = 0) => {
            const list = source();
            const size = step();
            const start = Math.max(0, Math.floor(scrollTop / size));
            const end = Math.min(list.length, start + windowSize() + 2);
            visible.set(list.slice(start, end).map((item, offset) => ({
                item,
                index: start + offset
            })));
        };
        writeWindow();
        if (isReactive(items)) items.subscribe(() => writeWindow());

        return div(
            {
                class: computed(() =>
                    `aetheria-glass ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim()),
                style: {
                    height: computed(() => `${step() * windowSize()}px`),
                    overflowY: 'auto'
                },
                onscroll: (e) => { writeWindow(e.target.scrollTop); }
            },
            div(
                {
                    class: 'aetheria-list-view',
                    style: {
                        height: computed(() => `${source().length * step()}px`),
                        position: 'relative'
                    }
                },
                loop(visible, entry => `${entry.index}:${labelOf(entry.item)}`, entry => div(
                    {
                        class: 'aetheria-list-item',
                        style: {
                            position: 'absolute',
                            top: `${entry.index * step()}px`,
                            left: '0',
                            right: '0',
                            height: `${step()}px`,
                            boxSizing: 'border-box'
                        }
                    },
                    labelOf(entry.item)
                ))
            )
        );
    }
}

export class CommandToolbar extends Component {
    render(props = {}) {
        const { commands = [], class: customClass = '' } = props;
        return div(
            {
                class: computed(() =>
                    `aetheria-command-toolbar ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => div(
                { class: 'aetheria-row aetheria-row-tight' },
                ...(prop(commands, []) ?? []).map(cmd => button(
                    {
                        type: 'button',
                        class: 'aetheria-btn aetheria-btn-muted',
                        disabled: computed(() => Boolean(prop(cmd?.disabled, false))),
                        onclick: () => { if (cmd?.action) cmd.action(); }
                    },
                    aetheriaGlyph(cmd?.icon),
                    computed(() => aetheriaText(cmd?.label, 'Action'))
                ))
            ))
        );
    }
}

export class FileManager extends Component {
    render(props = {}) {
        const { files = [], class: customClass = '' } = props;
        const selectedFile = stateOf(null);

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            h3({ class: 'aetheria-panel-title' }, 'File Manager'),
            computed(() => div(
                { class: 'aetheria-file-grid' },
                ...(prop(files, []) ?? []).map(file => div(
                    {
                        class: computed(() =>
                            `aetheria-glass aetheria-file-item${flag(selectedFile.value === file, ' is-selected')}`
                                .replace(/\s+/g, ' ').trim()),
                        role: 'button',
                        tabindex: '0',
                        'aria-pressed': computed(() => String(selectedFile.value === file)),
                        onclick: () => { selectedFile.value = file; },
                        onkeydown: (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                selectedFile.value = file;
                            }
                        }
                    },
                    span(
                        { class: 'aetheria-shrink aetheria-text-muted' },
                        icon(aetheriaText(file?.type, '') === 'folder' ? 'folder' : 'file', 'aetheria-icon-lg')
                    ),
                    span({ class: 'aetheria-file-name' }, aetheriaText(file?.name, 'file')),
                    file?.size == null && file?.meta == null
                        ? ''
                        : span({ class: 'aetheria-file-meta' }, aetheriaText(file?.size ?? file?.meta, ''))
                ))
            ))
        );
    }
}

export class SortableList extends Component {
    render(props = {}) {
        const { items = [], onchange = null, class: customClass = '' } = props;
        const entriesOf = (list) => (list ?? []).map((value, id) => ({ id, value }));
        const list = listOf(...entriesOf(prop(items, [])));
        if (isReactive(items)) items.subscribe(() => list.set(entriesOf(prop(items, []))));
        let draggingId = null;

        const reorder = (targetEntry, event) => {
            const transferId = event.dataTransfer?.getData('text/plain');
            const sourceId = draggingId ?? (transferId === '' ? null : Number(transferId));
            const fromIndex = list.values.findIndex(entry => entry.id === sourceId);
            const targetIndex = list.values.findIndex(entry => entry.id === targetEntry.id);
            draggingId = null;

            if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return;

            const bounds = event.currentTarget.getBoundingClientRect();
            const insertAfter = bounds.height > 0 && event.clientY > bounds.top + bounds.height / 2;
            let insertIndex = targetIndex + (insertAfter ? 1 : 0);
            const next = [...list.values];
            const [moved] = next.splice(fromIndex, 1);
            if (fromIndex < insertIndex) insertIndex--;
            next.splice(insertIndex, 0, moved);
            list.set(next);
            if (onchange) onchange(next.map(entry => entry.value));
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-sortable-list ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            loop(list, entry => `${entry.id}:${aetheriaText(entry.value, '')}`, entry => div(
                {
                    class: 'aetheria-glass aetheria-sortable-item',
                    draggable: 'true',
                    'data-sortable-id': entry.id,
                    ondragstart: (event) => {
                        draggingId = entry.id;
                        if (event.dataTransfer) {
                            event.dataTransfer.setData('text/plain', String(entry.id));
                            event.dataTransfer.effectAllowed = 'move';
                        }
                    },
                    ondragover: (event) => {
                        event.preventDefault();
                        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                    },
                    ondrop: (event) => {
                        event.preventDefault();
                        reorder(entry, event);
                    },
                    ondragend: () => { draggingId = null; }
                },
                span({ class: 'aetheria-grow' }, computed(() => aetheriaText(entry.value, ''))),
                span({ class: 'aetheria-sortable-handle', 'aria-hidden': 'true' }, icon('grip'))
            ))
        );
    }
}

function createLineSvg(data, width, height, stroke, strokeWidth, className = '') {
    const w = Math.max(1, Number(width) || 1);
    const h = Math.max(1, Number(height) || 1);
    const sw = Math.max(0.5, Number(strokeWidth) || 1);
    const values = (Array.isArray(data) ? data : []).map(Number).filter(Number.isFinite);
    const color = /^[#\w(),.%\s-]+$/.test(String(stroke)) ? String(stroke) : 'currentColor';
    const attrs = className ? ` class="${className}"` : '';
    const baseline = h - sw;
    let body = '';
    if (values.length > 0) {
        const min = Math.min(...values);
        const range = Math.max(...values) - min;
        const points = values.map((value, index) => {
            const x = values.length === 1 ? w / 2 : (index / (values.length - 1)) * w;
            const y = range === 0
                ? h / 2
                : h - sw - ((value - min) / range) * (h - sw * 2);
            return `${x},${y}`;
        }).join(' ');
        body =
            `<line class="aetheria-chart-grid" x1="0" y1="${baseline}" x2="${w}" y2="${baseline}"/>` +
            `<polyline fill="none" stroke="${color}" stroke-width="${sw}"` +
            ` stroke-linecap="round" stroke-linejoin="round" points="${points}"/>`;
    }
    return html(
        `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${attrs}>${body}</svg>`
    );
}

export class Chart extends Component {
    render(props = {}) {
        const {
            data = [10, 40, 25, 60, 45, 80],
            width = 300,
            height = 120,
            stroke = '#c084fc',
            class: customClass = ''
        } = props;

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-pad-3 ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => div(
                createLineSvg(
                    prop(data, []),
                    Number(prop(width, 300)) || 300,
                    Number(prop(height, 120)) || 120,
                    prop(stroke, '#c084fc'),
                    3,
                    'aetheria-chart'
                )
            ))
        );
    }
}

export class Sparkline extends Component {
    render(props = {}) {
        const {
            data = [5, 12, 8, 16, 22],
            width = 90,
            height = 28,
            stroke = '#818cf8',
            class: customClass = ''
        } = props;

        return span(
            {
                class: computed(() =>
                    `aetheria-nowrap aetheria-shrink ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => span(
                createLineSvg(
                    prop(data, []),
                    Number(prop(width, 90)) || 90,
                    Number(prop(height, 28)) || 28,
                    prop(stroke, '#818cf8'),
                    2,
                    'aetheria-sparkline'
                )
            ))
        );
    }
}

export class Scheduler extends Component {
    render(props = {}) {
        const { events = [], class: customClass = '' } = props;
        const listOfEvents = () => prop(events, []) ?? [];
        const timeOf = (event) => aetheriaText(event?.time, '');
        const slots = () => [...new Set(listOfEvents().map(timeOf).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            h3({ class: 'aetheria-panel-title' }, 'Scheduler'),
            computed(() => div(
                { class: 'aetheria-col-tight' },
                ...slots().map(time => {
                    const matches = listOfEvents().filter(event => timeOf(event) === time);
                    return div(
                        { class: 'aetheria-scheduler-row' },
                        span({ class: 'aetheria-scheduler-time' }, time),
                        matches.length > 0
                            ? div(
                                { class: 'aetheria-stack' },
                                ...matches.map(event => div(
                                    { class: 'aetheria-scheduler-event' },
                                    computed(() => aetheriaText(event?.title, 'Untitled event'))
                                ))
                            )
                            : span({ class: 'aetheria-text-muted' }, 'No events')
                    );
                })
            ))
        );
    }
}

export class Gantt extends Component {
    render(props = {}) {
        const { tasks = [], class: customClass = '' } = props;
        const listOfTasks = () => prop(tasks, []) ?? [];
        const startOf = (task) => Number(prop(task?.start, 0)) || 0;
        const durationOf = (task) => Number(prop(task?.duration, 30)) || 0;
        const bounds = () => {
            const list = listOfTasks();
            const starts = list.map(startOf);
            const ends = list.map(task => startOf(task) + durationOf(task));
            const min = starts.length > 0 ? Math.min(...starts) : 0;
            const max = ends.length > 0 ? Math.max(...ends) : 1;
            return { min, span: max > min ? max - min : 1 };
        };

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            h3({ class: 'aetheria-panel-title' }, 'Gantt Timeline'),
            computed(() => {
                const range = bounds();
                return div(
                    { class: 'aetheria-col' },
                    ...listOfTasks().map(task => {
                        const start = startOf(task);
                        const duration = durationOf(task);
                        const left = ((start - range.min) / range.span) * 100;
                        const width = Math.max(0, Math.min(100 - left, (duration / range.span) * 100));
                        return div(
                            { class: 'aetheria-gantt-row' },
                            span({ class: 'aetheria-gantt-label' }, aetheriaText(task?.name, 'Task')),
                            div(
                                {
                                    class: 'aetheria-gantt-track',
                                    title: `${aetheriaText(task?.name, 'Task')}: ${start} to ${start + duration}`
                                },
                                div({
                                    class: 'aetheria-gantt-bar',
                                    style: { left: `${left}%`, width: `${width}%` }
                                })
                            )
                        );
                    })
                );
            })
        );
    }
}

export class Spreadsheet extends Component {
    render(props = {}) {
        const { rows = 5, cols = 4, class: customClass = '' } = props;
        const cellData = {};
        const rowCount = () => Math.max(0, Math.min(26, Math.floor(Number(prop(rows, 5)) || 0)));
        const colCount = () => Math.max(1, Math.min(26, Math.floor(Number(prop(cols, 4)) || 4)));
        const nameOf = (index) => String.fromCharCode(65 + (index % 26));
        const keyOf = (row, col) => `${nameOf(col)}${row + 1}`;

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            computed(() => div(
                { class: 'aetheria-scroll-x' },
                table(
                    { class: 'aetheria-table aetheria-table-flush aetheria-spreadsheet-table' },
                    thead(
                        tr(
                            th('#'),
                            ...Array.from({ length: colCount() }, (_, col) => th(nameOf(col)))
                        )
                    ),
                    tbody(
                        ...Array.from({ length: rowCount() }, (_, row) => tr(
                            td({ class: 'aetheria-num aetheria-text-muted' }, String(row + 1)),
                            ...Array.from({ length: colCount() }, (_, col) => {
                                const cellKey = keyOf(row, col);
                                return td(
                                    input({
                                        type: 'text',
                                        class: 'aetheria-spreadsheet-cell',
                                        'aria-label': cellKey,
                                        value: computed(() => cellData[cellKey] ?? ''),
                                        oninput: (e) => { cellData[cellKey] = e.target.value; }
                                    })
                                );
                            })
                        ))
                    )
                )
            ))
        );
    }
}

export class RichTextEditor extends Component {
    render(props = {}) {
        const { initialContent = '<p>Start typing rich text here...</p>', class: customClass = '' } = props;
        const content = stateOf(aetheriaText(initialContent, ''));
        const run = (command) => () => {
            if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
                document.execCommand(command);
            }
        };
        const toolButton = (command, name, label) => button(
            {
                type: 'button',
                'aria-label': label,
                title: label,
                onclick: run(command)
            },
            icon(name)
        );

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            div(
                { class: 'aetheria-editor-toolbar' },
                toolButton('bold', 'bold', 'Bold'),
                toolButton('italic', 'italic', 'Italic'),
                toolButton('underline', 'underline', 'Underline')
            ),
            computed(() => div({
                contenteditable: 'true',
                role: 'textbox',
                'aria-multiline': 'true',
                class: 'aetheria-rich-editor',
                oninput: (e) => { content.value = e.target.innerHTML; }
            }, html(aetheriaText(initialContent, 'Type here...'))))
        );
    }
}

export class PivotGrid extends Component {
    render(props = {}) {
        const {
            data = [
                { category: 'Design', region: 'North', sales: 120 },
                { category: 'Design', region: 'South', sales: 80 },
                { category: 'Dev', region: 'North', sales: 200 },
                { category: 'Dev', region: 'South', sales: 150 }
            ],
            class: customClass = ''
        } = props;
        const source = () => prop(data, []) ?? [];
        const salesOf = (row) => Number(prop(row?.sales, 0)) || 0;

        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            h3({ class: 'aetheria-panel-title' }, 'Pivot Grid (Sales)'),
            computed(() => {
                const rows = source();
                const categories = [...new Set(rows.map(row => aetheriaText(row?.category, '')))];
                const regions = [...new Set(rows.map(row => aetheriaText(row?.region, '')))];
                const sumWhere = (predicate) => rows.reduce(
                    (total, row) => total + (predicate(row) ? salesOf(row) : 0),
                    0
                );
                const regionOf = (row) => aetheriaText(row?.region, '');
                const categoryOf = (row) => aetheriaText(row?.category, '');
                const grandTotal = sumWhere(() => true);

                return div(
                    { class: 'aetheria-scroll-x' },
                    table(
                        { class: 'aetheria-table aetheria-table-flush aetheria-pivot-table' },
                        thead(
                            tr(
                                th('Category'),
                                ...regions.map(region => th(region)),
                                th('Total')
                            )
                        ),
                        tbody(
                            ...categories.map(category => {
                                let total = 0;
                                const cells = regions.map(region => {
                                    const value = sumWhere(row => categoryOf(row) === category && regionOf(row) === region);
                                    total += value;
                                    return td(String(value));
                                });
                                return tr(
                                    td(category),
                                    ...cells,
                                    td({ class: 'aetheria-pivot-total' }, String(total))
                                );
                            }),
                            tr(
                                td('Grand Total'),
                                ...regions.map(region => td(
                                    { class: 'aetheria-pivot-total' },
                                    String(sumWhere(row => regionOf(row) === region))
                                )),
                                td({ class: 'aetheria-pivot-total' }, String(grandTotal))
                            )
                        )
                    )
                );
            })
        );
    }
}

export class PdfViewer extends Component {
    render(props = {}) {
        const { title = 'Document.pdf', onexport = null, class: customClass = '' } = props;
        return div(
            {
                class: computed(() =>
                    `aetheria-glass aetheria-panel ${prop(customClass, '')}`.replace(/\s+/g, ' ').trim())
            },
            div(
                { class: 'aetheria-row aetheria-row-between' },
                h3({ class: 'aetheria-panel-title aetheria-truncate' }, bind(title, 'Document.pdf')),
                button(
                    {
                        type: 'button',
                        class: 'aetheria-btn aetheria-btn-primary',
                        onclick: () => {
                            if (onexport) onexport();
                            else window.print();
                        }
                    },
                    icon('download'),
                    'Export / Print PDF'
                )
            ),
            div(
                { class: 'aetheria-pdf-frame' },
                icon('file', 'aetheria-icon-lg'),
                p({ class: 'aetheria-text-sm' }, 'PDF Preview Pane [Vector Render Ready]')
            )
        );
    }
}

