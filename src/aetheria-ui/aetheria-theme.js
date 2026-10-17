/**
 * Aetheria design tokens and component stylesheet.
 * Dark is the default; `data-aetheria-theme="light"` on the mounted root switches tokens.
 */

export const AETHERIA_CSS = `
:root {
    color-scheme: dark;

    /* Spacing scale — every padding/gap in the system resolves to one of these. */
    --aetheria-space-1: 4px;
    --aetheria-space-2: 8px;
    --aetheria-space-3: 12px;
    --aetheria-space-4: 16px;
    --aetheria-space-5: 20px;
    --aetheria-space-6: 24px;
    --aetheria-space-8: 32px;

    --aetheria-radius-sm: 8px;
    --aetheria-radius-md: 12px;
    --aetheria-radius-lg: 16px;
    --aetheria-radius-xl: 22px;
    --aetheria-radius-pill: 999px;

    /* Control heights: md is the default and clears the 44px touch target. */
    --aetheria-control-sm: 32px;
    --aetheria-control-md: 44px;
    --aetheria-control-lg: 52px;

    --aetheria-text-xs: 0.75rem;
    --aetheria-text-sm: 0.875rem;
    --aetheria-text-md: 1rem;
    --aetheria-text-lg: 1.1875rem;
    --aetheria-text-xl: 1.5rem;
    --aetheria-leading: 1.5;

    --aetheria-font: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --aetheria-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

    --aetheria-fast: 140ms;
    --aetheria-slow: 320ms;
    --aetheria-ease: cubic-bezier(.2, .8, .2, 1);

    --aetheria-z-menu: 60;
    --aetheria-z-overlay: 80;
    --aetheria-z-modal: 90;
    --aetheria-z-toast: 100;
}

/* ---------------------------------------------------------------- palette */

:root,
[data-aetheria-theme="dark"] {
    color-scheme: dark;

    --aetheria-bg: #0c0a17;
    --aetheria-bg-soft: #141024;
    --aetheria-surface: linear-gradient(135deg, rgba(255, 255, 255, .11), rgba(255, 255, 255, .04) 55%, rgba(177, 160, 255, .07));
    --aetheria-surface-solid: #191329;
    --aetheria-surface-raised: #211a35;
    --aetheria-surface-input: rgba(255, 255, 255, .06);
    --aetheria-surface-hover: rgba(255, 255, 255, .1);

    --aetheria-border: rgba(229, 224, 255, .22);
    --aetheria-border-strong: rgba(220, 210, 255, .46);
    --aetheria-border-quiet: rgba(255, 255, 255, .1);

    /* Code panels keep the dark surface in both themes so the Prism palette
       (written for dark backgrounds) stays legible in light mode. */
    --aetheria-code-bg: #141024;
    --aetheria-code-fg: #e9e5f7;
    --aetheria-code-border: rgba(255, 255, 255, .09);
    --aetheria-code-accent: #b9a5ff;

    --aetheria-text: #f3f0ff;
    --aetheria-text-strong: #ffffff;
    --aetheria-text-muted: #c1bbcf;
    --aetheria-text-faint: #9b94ad;

    --aetheria-accent: #b9a5ff;
    --aetheria-accent-hover: #d1aaff;
    --aetheria-accent-ink: #17132c;
    --aetheria-accent-soft: rgba(185, 165, 255, .16);
    --aetheria-accent-glow: rgba(192, 167, 255, .42);
    --aetheria-lav: #c4b5fd;
    --aetheria-ice: #c8d9ff;
    --aetheria-pink: #efb8ec;

    --aetheria-success: #6ee7b7;
    --aetheria-warning: #fcd34d;
    --aetheria-danger: #f472b6;
    --aetheria-ring: #d8c6ff;

    --aetheria-shadow-1: 0 1px 2px rgba(0, 0, 0, .3);
    --aetheria-shadow-2: 0 12px 35px rgba(0, 0, 0, .34);
    --aetheria-shadow-3: 0 24px 60px rgba(4, 3, 20, .5);
    --aetheria-inset-hi: inset 0 1px 0 rgba(255, 255, 255, .14);
    --aetheria-overlay: rgba(7, 5, 16, .66);
    --aetheria-scrim: rgba(255, 255, 255, .08);
}

[data-aetheria-theme="light"] {
    color-scheme: light;

    --aetheria-bg: #f6f4fb;
    --aetheria-bg-soft: #ffffff;
    --aetheria-surface: linear-gradient(135deg, rgba(255, 255, 255, .95), rgba(243, 240, 252, .82) 55%, rgba(226, 217, 250, .78));
    --aetheria-surface-solid: #ffffff;
    --aetheria-surface-raised: #f2eefc;
    --aetheria-surface-input: rgba(23, 19, 44, .04);
    --aetheria-surface-hover: rgba(23, 19, 44, .06);

    --aetheria-border: rgba(60, 40, 110, .16);
    --aetheria-border-strong: rgba(58, 38, 108, .55);
    --aetheria-border-quiet: rgba(60, 40, 110, .1);

    --aetheria-text: #241d38;
    --aetheria-text-strong: #150f26;
    --aetheria-text-muted: #5c5474;
    --aetheria-text-faint: #7d7593;

    --aetheria-accent: #6d44e0;
    --aetheria-accent-hover: #5a34c4;
    --aetheria-accent-ink: #ffffff;
    --aetheria-accent-soft: rgba(109, 68, 224, .12);
    --aetheria-accent-glow: rgba(109, 68, 224, .24);
    --aetheria-lav: #6d44e0;
    --aetheria-ice: #2f5fb3;
    --aetheria-pink: #b23a8f;

    --aetheria-success: #0f7a55;
    --aetheria-warning: #94651a;
    --aetheria-danger: #c0246c;
    --aetheria-ring: #6d44e0;

    --aetheria-shadow-1: 0 1px 2px rgba(40, 24, 82, .1);
    --aetheria-shadow-2: 0 12px 30px rgba(40, 24, 82, .12);
    --aetheria-shadow-3: 0 24px 56px rgba(40, 24, 82, .18);
    --aetheria-inset-hi: inset 0 1px 0 rgba(255, 255, 255, .8);
    --aetheria-overlay: rgba(30, 20, 58, .32);
    --aetheria-scrim: rgba(23, 19, 44, .07);
}

/* ------------------------------------------------------------------- base */

.aetheria-root {
    font-family: var(--aetheria-font);
    font-size: var(--aetheria-text-md);
    line-height: var(--aetheria-leading);
    color: var(--aetheria-text);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

.aetheria-root *,
.aetheria-root *::before,
.aetheria-root *::after,
.aetheria-glass,
.aetheria-glass *,
.aetheria-modal-dialog,
.aetheria-drawer,
.aetheria-dropdown-panel,
.aetheria-popover-panel,
.aetheria-context-menu-backdrop {
    box-sizing: border-box;
}

/* :where() keeps these base rules at element specificity so component classes
   (.aetheria-docs-title and friends) can still override weight and size. */
:where(.aetheria-root) :is(h1, h2, h3, h4) {
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--aetheria-text-strong);
}

:where(.aetheria-root) p { margin: 0; }

/* ------------------------------------------------------------ layout utils */

.aetheria-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--aetheria-space-3);
    min-width: 0;
}
.aetheria-row-tight { gap: var(--aetheria-space-2); }
.aetheria-row-start { align-items: flex-start; }
.aetheria-row-between { justify-content: space-between; }
.aetheria-row-center { justify-content: center; }
.aetheria-row-nowrap { flex-wrap: nowrap; }

.aetheria-col {
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-3);
    min-width: 0;
}
.aetheria-col-tight { gap: var(--aetheria-space-2); }

.aetheria-grow { flex: 1 1 auto; min-width: 0; }
.aetheria-shrink { flex: 0 0 auto; }

.aetheria-grid {
    display: grid;
    gap: var(--aetheria-space-4);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    min-width: 0;
}
.aetheria-grid-2 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
.aetheria-grid-3 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); }

.aetheria-stack { display: flex; flex-direction: column; gap: var(--aetheria-space-2); min-width: 0; }
.aetheria-pad-0 { padding: 0; }
.aetheria-pad-3 { padding: var(--aetheria-space-3); }
.aetheria-pad-4 { padding: var(--aetheria-space-4); }
.aetheria-pad-5 { padding: var(--aetheria-space-5); }

.aetheria-truncate {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.aetheria-wrap-anywhere { overflow-wrap: anywhere; word-break: break-word; }
.aetheria-nowrap { white-space: nowrap; }
.aetheria-text-muted { color: var(--aetheria-text-muted); font-size: var(--aetheria-text-sm); }
.aetheria-text-sm { font-size: var(--aetheria-text-sm); }
.aetheria-text-xs { font-size: var(--aetheria-text-xs); }
.aetheria-text-right { text-align: right; }
.aetheria-text-center { text-align: center; }
.aetheria-num { font-variant-numeric: tabular-nums; }

.aetheria-scroll-x { overflow-x: auto; max-width: 100%; scrollbar-width: thin; }
.aetheria-scroll-y { overflow-y: auto; max-height: 320px; scrollbar-width: thin; }
.aetheria-hidden { display: none !important; }

/* Icons are inline SVG so glyph fallbacks never shift layout. */
.aetheria-icon {
    width: 1.15em;
    height: 1.15em;
    flex: 0 0 auto;
    display: inline-block;
    vertical-align: -0.18em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.aetheria-icon-sm { width: 0.95em; height: 0.95em; }
.aetheria-icon-lg { width: 1.4em; height: 1.4em; }
.aetheria-sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
}

/* --------------------------------------------------------------- surfaces */

.aetheria-glass {
    position: relative;
    isolation: isolate;
    min-width: 0;
    overflow: hidden;
    background: var(--aetheria-surface);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-lg);
    box-shadow: var(--aetheria-inset-hi), var(--aetheria-shadow-2);
    /* No backdrop-filter here on purpose: a filter turns the card into the
       containing block for position:fixed descendants, which traps modals,
       drawers and the date dialog inside the card instead of the viewport. */
    transition: border-color var(--aetheria-slow) var(--aetheria-ease),
        box-shadow var(--aetheria-slow) var(--aetheria-ease),
        background var(--aetheria-slow) var(--aetheria-ease);
}
/* Menus and popovers escape their host panel via .aetheria-showcase-overflow-visible. */
.aetheria-glass:has(.aetheria-dropdown-panel),
.aetheria-glass:has(.aetheria-popover-panel),
.aetheria-glass:has(.aetheria-autocomplete-results),
.aetheria-glass:has(.aetheria-select-menu.is-open),
.aetheria-glass:has(.aetheria-tooltip.is-open) { overflow: visible; }

.aetheria-card {
    padding: var(--aetheria-space-5);
    transition: transform var(--aetheria-fast) var(--aetheria-ease),
        border-color var(--aetheria-fast), box-shadow var(--aetheria-fast);
}
.aetheria-card:hover {
    transform: translateY(-2px);
    border-color: var(--aetheria-border-strong);
    box-shadow: var(--aetheria-inset-hi), var(--aetheria-shadow-3);
}

.aetheria-panel { padding: var(--aetheria-space-5); }
.aetheria-panel-flush { padding: 0; }

.aetheria-panel-title {
    font-size: var(--aetheria-text-lg);
    line-height: 1.3;
    font-weight: 600;
    margin: 0 0 var(--aetheria-space-3);
    color: var(--aetheria-text-strong);
    overflow-wrap: anywhere;
}
.aetheria-panel-title:last-child { margin-bottom: 0; }
/* Inside a header row the title's own bottom margin offsets it from the row's
   centred line, so the caption sits above the middle of its close button. */
.aetheria-row > .aetheria-panel-title { margin-bottom: 0; }

/* ---------------------------------------------------------------- buttons */

.aetheria-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--aetheria-space-2);
    min-height: var(--aetheria-control-md);
    padding: var(--aetheria-space-2) var(--aetheria-space-4);
    border-radius: var(--aetheria-radius-pill);
    border: 1px solid transparent;
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--aetheria-fast), border-color var(--aetheria-fast),
        box-shadow var(--aetheria-fast), color var(--aetheria-fast), transform var(--aetheria-fast);
}
.aetheria-btn-sm { min-height: var(--aetheria-control-sm); padding: 4px var(--aetheria-space-3); font-size: var(--aetheria-text-xs); }
.aetheria-btn-lg { min-height: var(--aetheria-control-lg); padding: var(--aetheria-space-3) var(--aetheria-space-6); font-size: var(--aetheria-text-md); }
.aetheria-btn-block { width: 100%; }

.aetheria-btn:focus-visible,
.aetheria-icon-btn:focus-visible,
.aetheria-field:focus-visible,
.aetheria-check:focus-visible,
.aetheria-radio:focus-visible,
.aetheria-switch:focus-visible,
.aetheria-range:focus-visible,
.aetheria-tab-btn:focus-visible,
.aetheria-pagination-btn:focus-visible,
.aetheria-icon-close:focus-visible,
.aetheria-select-trigger:focus-visible,
.aetheria-dropdown-item:focus-visible,
.aetheria-autocomplete-item:focus-visible,
.aetheria-autocomplete-results li:focus-visible,
.aetheria-list-item:focus-visible,
.aetheria-file-item:focus-visible,
.aetheria-tree-trigger:focus-visible,
.aetheria-accordion-trigger:focus-visible,
.aetheria-calendar-day:focus-visible,
.aetheria-calendar-month:focus-visible,
.aetheria-calendar-heading:focus-visible,
.aetheria-datagrid-sort:focus-visible,
.aetheria-datagrid-page-btn:focus-visible,
.aetheria-spreadsheet-cell:focus-visible,
.aetheria-rich-editor:focus-visible,
.aetheria-rich-editor :is(button, [contenteditable]):focus-visible {
    outline: 2px solid var(--aetheria-ring);
    outline-offset: 2px;
    border-radius: var(--aetheria-radius-sm);
}

.aetheria-btn:active { transform: translateY(1px); }
.aetheria-btn:disabled,
.aetheria-icon-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.aetheria-btn-primary {
    color: var(--aetheria-accent-ink);
    background: var(--aetheria-accent);
    box-shadow: 0 0 18px var(--aetheria-accent-glow);
}
.aetheria-btn-primary:hover { background: var(--aetheria-accent-hover); box-shadow: 0 0 26px var(--aetheria-accent-glow); }

.aetheria-btn-secondary {
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border-color: var(--aetheria-border);
}
.aetheria-btn-secondary:hover { background: var(--aetheria-surface-hover); border-color: var(--aetheria-border-strong); }

.aetheria-btn-border {
    color: var(--aetheria-accent);
    background: transparent;
    border-color: var(--aetheria-accent);
}
.aetheria-btn-border:hover { background: var(--aetheria-accent-soft); color: var(--aetheria-accent-hover); }

.aetheria-btn-muted {
    color: var(--aetheria-text-muted);
    background: transparent;
}
.aetheria-btn-muted:hover:not(:disabled) { color: var(--aetheria-text); background: var(--aetheria-surface-hover); }

.aetheria-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--aetheria-control-md);
    height: var(--aetheria-control-md);
    padding: 0;
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-input);
    color: var(--aetheria-text);
    cursor: pointer;
    transition: background var(--aetheria-fast), border-color var(--aetheria-fast), color var(--aetheria-fast);
}
.aetheria-icon-btn:hover,
.aetheria-icon-btn.active {
    background: var(--aetheria-accent-soft);
    border-color: var(--aetheria-border-strong);
    color: var(--aetheria-accent-hover);
}
.aetheria-icon-btn svg.aetheria-icon { width: 20px; height: 20px; }
.aetheria-icon-btn:disabled { cursor: not-allowed; }

.aetheria-icon-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border: none;
    border-radius: var(--aetheria-radius-sm);
    background: transparent;
    color: var(--aetheria-text-muted);
    cursor: pointer;
    transition: background var(--aetheria-fast), color var(--aetheria-fast);
}
.aetheria-icon-close:hover { background: var(--aetheria-scrim); color: var(--aetheria-text-strong); }

/* ----------------------------------------------------------------- fields */

/* Checkbox / Radio / Switch wrapper: control and caption share one line, the
   whole row is clickable and carries a comfortable hit area. */
.aetheria-control-label {
    display: inline-flex;
    align-items: center;
    gap: var(--aetheria-space-2);
    min-width: 0;
    min-height: var(--aetheria-control-sm);
    margin: 0;
    font-size: var(--aetheria-text-sm);
    font-weight: 500;
    line-height: 1.25;
    color: var(--aetheria-text);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.aetheria-control-label > span { min-width: 0; }
.aetheria-control-label:has(:disabled) { color: var(--aetheria-text-muted); cursor: not-allowed; }
.aetheria-field,
.aetheria-textarea,
.aetheria-datepicker-trigger,
.aetheria-select-trigger,
.aetheria-datagrid-filter {
    width: 100%;
    min-height: var(--aetheria-control-md);
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-md);
    transition: border-color var(--aetheria-fast), background var(--aetheria-fast), box-shadow var(--aetheria-fast);
}
.aetheria-field:hover:not(:disabled),
.aetheria-textarea:hover:not(:disabled),
.aetheria-select-trigger:hover:not(:disabled) { border-color: var(--aetheria-border-strong); }

.aetheria-field:focus,
.aetheria-textarea:focus,
.aetheria-select-trigger:focus,
.aetheria-datagrid-filter:focus {
    border-color: var(--aetheria-accent);
    background: var(--aetheria-surface-hover);
    box-shadow: 0 0 0 3px var(--aetheria-accent-soft);
}
.aetheria-field::placeholder,
.aetheria-textarea::placeholder { color: var(--aetheria-text-faint); }
.aetheria-field:disabled,
.aetheria-textarea:disabled,
.aetheria-select-trigger:disabled,
.aetheria-range:disabled {
    opacity: .55;
    cursor: not-allowed;
}
.aetheria-textarea { min-height: 88px; padding: var(--aetheria-space-3); resize: vertical; line-height: var(--aetheria-leading); }

/* checkboxes / radios / switch */
.aetheria-check,
.aetheria-radio {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    margin: 0;
    border: 1.5px solid var(--aetheria-border-strong);
    background: var(--aetheria-surface-input);
    cursor: pointer;
    display: inline-grid;
    place-content: center;
    transition: border-color var(--aetheria-fast), background var(--aetheria-fast);
}
.aetheria-check { border-radius: 6px; }
.aetheria-radio { border-radius: 50%; }
.aetheria-check:checked,
.aetheria-radio:checked { background: var(--aetheria-accent); border-color: var(--aetheria-accent); }
.aetheria-control-label:hover :is(.aetheria-check, .aetheria-radio, .aetheria-switch):not(:checked):not(:disabled) { border-color: var(--aetheria-accent); }
.aetheria-control-label:hover :is(.aetheria-check, .aetheria-radio):not(:checked):not(:disabled) { background: var(--aetheria-surface-hover); }
.aetheria-check:disabled,
.aetheria-radio:disabled,
.aetheria-switch:disabled { opacity: .45; cursor: not-allowed; }
.aetheria-check:checked::after {
    content: "";
    width: 11px;
    height: 6px;
    border: 2px solid var(--aetheria-accent-ink);
    border-top: 0;
    border-right: 0;
    transform: rotate(-45deg) translate(1px, -1px);
}
.aetheria-radio:checked::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--aetheria-accent-ink);
}

.aetheria-switch {
    position: relative;
    appearance: none;
    -webkit-appearance: none;
    width: 46px;
    height: 26px;
    flex: 0 0 auto;
    margin: 0;
    border-radius: var(--aetheria-radius-pill);
    border: 1px solid var(--aetheria-border-strong);
    background: var(--aetheria-surface-input);
    cursor: pointer;
    transition: background var(--aetheria-fast), border-color var(--aetheria-fast);
}
.aetheria-switch::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 18px;
    height: 18px;
    left: 3px;
    border-radius: 50%;
    background: var(--aetheria-text-muted);
    transition: transform var(--aetheria-fast) var(--aetheria-ease), background var(--aetheria-fast);
}
.aetheria-switch:checked { background: var(--aetheria-accent); border-color: var(--aetheria-accent); }
.aetheria-switch:checked::before { transform: translateX(20px); background: var(--aetheria-accent-ink); }

.aetheria-range {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 26px;
    margin: 0;
    background: transparent;
    cursor: pointer;
}
.aetheria-range::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: var(--aetheria-radius-pill);
    background: var(--aetheria-scrim);
}
.aetheria-range::-moz-range-track {
    height: 6px;
    border-radius: var(--aetheria-radius-pill);
    background: var(--aetheria-scrim);
}
.aetheria-range::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    margin-top: -7px;
    border: none;
    border-radius: 50%;
    background: var(--aetheria-accent);
    box-shadow: 0 0 12px var(--aetheria-accent-glow);
}
.aetheria-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: var(--aetheria-accent);
}

/* select */
.aetheria-select { position: relative; min-width: 0; }
.aetheria-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--aetheria-space-2);
    text-align: left;
    cursor: pointer;
}
.aetheria-select-trigger[aria-expanded="true"] {
    border-color: var(--aetheria-accent);
    box-shadow: 0 0 0 3px var(--aetheria-accent-soft);
}
.aetheria-select-chevron { display: inline-flex; color: var(--aetheria-text-muted); transition: transform var(--aetheria-fast); }
.aetheria-select-trigger[aria-expanded="true"] .aetheria-select-chevron { transform: rotate(180deg); }
.aetheria-select-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.aetheria-select-menu {
    position: absolute;
    z-index: var(--aetheria-z-menu);
    top: calc(100% + var(--aetheria-space-2));
    left: 0;
    right: 0;
    max-height: 260px;
    overflow-y: auto;
    margin: 0;
    padding: var(--aetheria-space-1);
    list-style: none;
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition: opacity var(--aetheria-fast), transform var(--aetheria-fast), visibility var(--aetheria-fast);
}
.aetheria-select-menu.is-open { opacity: 1; visibility: visible; transform: translateY(0); }

.aetheria-select-option,
.aetheria-dropdown-item,
.aetheria-autocomplete-item,
.aetheria-context-menu-backdrop [role="menuitem"] {
    display: flex;
    align-items: center;
    gap: var(--aetheria-space-3);
    width: 100%;
    min-height: 40px;
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    text-align: left;
    color: var(--aetheria-text);
    background: transparent;
    border: none;
    border-radius: var(--aetheria-radius-sm);
    cursor: pointer;
    transition: background var(--aetheria-fast), color var(--aetheria-fast);
}
.aetheria-select-option:hover:not(:disabled),
.aetheria-select-option.is-active,
.aetheria-dropdown-item:hover,
.aetheria-autocomplete-item:hover,
.aetheria-autocomplete-item:focus-visible,
.aetheria-context-menu-backdrop [role="menuitem"]:not(:disabled):hover {
    background: var(--aetheria-accent-soft);
    color: var(--aetheria-text-strong);
}
.aetheria-select-option[aria-selected="true"],
.aetheria-dropdown-item.is-active { color: var(--aetheria-accent); font-weight: 600; }
.aetheria-select-option:disabled,
.aetheria-context-menu-backdrop [role="menuitem"]:disabled {
    opacity: .45;
    cursor: not-allowed;
}
.aetheria-select-option-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.aetheria-select-option-description { color: var(--aetheria-text-muted); font-size: var(--aetheria-text-xs); }
.aetheria-select-option-check { margin-left: auto; color: var(--aetheria-accent); display: inline-flex; }

/* --------------------------------------------------------------- feedback */

.aetheria-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--aetheria-space-1);
    padding: 3px var(--aetheria-space-3);
    border-radius: var(--aetheria-radius-pill);
    border: 1px solid var(--aetheria-border);
    background: var(--aetheria-scrim);
    color: var(--aetheria-text-muted);
    font-size: var(--aetheria-text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
}
.aetheria-badge-primary {
    color: var(--aetheria-accent);
    background: var(--aetheria-accent-soft);
    border-color: var(--aetheria-border-strong);
}

.aetheria-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--aetheria-border-strong);
    background: linear-gradient(135deg, var(--aetheria-accent-soft), var(--aetheria-scrim));
    color: var(--aetheria-text-strong);
    font-size: var(--aetheria-text-sm);
    font-weight: 700;
    letter-spacing: 0.02em;
    overflow: hidden;
    user-select: none;
}
.aetheria-avatar img { width: 100%; height: 100%; object-fit: cover; }

.aetheria-spinner {
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 2px solid var(--aetheria-scrim);
    border-top-color: var(--aetheria-accent);
    animation: aetheria-spin 900ms linear infinite;
}
@keyframes aetheria-spin { to { transform: rotate(360deg); } }

.aetheria-progressbar {
    width: 100%;
    min-width: 120px;
    height: 10px;
    appearance: none;
    -moz-appearance: none;
    border: none;
    border-radius: var(--aetheria-radius-pill);
    background: var(--aetheria-scrim);
    overflow: hidden;
}
.aetheria-progressbar::-webkit-progress-bar { background: transparent; }
.aetheria-progressbar::-webkit-progress-value { background: var(--aetheria-accent); border-radius: var(--aetheria-radius-pill); }
.aetheria-progressbar::-moz-progress-bar { background: var(--aetheria-accent); }
.aetheria-progressbar-fill {
    height: 100%;
    border-radius: var(--aetheria-radius-pill);
    background: linear-gradient(90deg, var(--aetheria-ice), var(--aetheria-accent));
    transition: width var(--aetheria-slow) var(--aetheria-ease);
}

/* ----------------------------------------------------------------- layers */

.aetheria-modal-backdrop,
.aetheria-drawer-backdrop,
.aetheria-calendar-modal {
    position: fixed;
    inset: 0;
    z-index: var(--aetheria-z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--aetheria-space-4);
    background: var(--aetheria-overlay);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--aetheria-fast), visibility var(--aetheria-fast);
}
.aetheria-modal-backdrop.is-open,
.aetheria-drawer-backdrop.is-open,
.aetheria-calendar-modal.is-open { opacity: 1; visibility: visible; }

.aetheria-modal-dialog {
    width: min(560px, 100%);
    max-height: min(80vh, 640px);
    overflow-y: auto;
    padding: var(--aetheria-space-6);
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-xl);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
    transform: translateY(8px) scale(.98);
    opacity: 0;
    transition: transform var(--aetheria-slow) var(--aetheria-ease), opacity var(--aetheria-slow);
}
.aetheria-modal-dialog.is-open { transform: none; opacity: 1; }

.aetheria-drawer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: min(400px, 100%);
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-4);
    padding: var(--aetheria-space-6);
    overflow-y: auto;
    background: var(--aetheria-surface-solid);
    border-left: 1px solid var(--aetheria-border);
    box-shadow: var(--aetheria-shadow-3);
    transform: translateX(100%);
    transition: transform var(--aetheria-slow) var(--aetheria-ease);
}
.aetheria-drawer.is-open { transform: none; }
.aetheria-drawer-title { font-size: var(--aetheria-text-lg); font-weight: 600; margin: 0; color: var(--aetheria-text-strong); }

.aetheria-dropdown-panel,
.aetheria-popover-panel {
    position: absolute;
    z-index: var(--aetheria-z-menu);
    top: calc(100% + var(--aetheria-space-2));
    left: 0;
    min-width: 200px;
    max-width: min(320px, 90vw);
    padding: var(--aetheria-space-2);
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
}
.aetheria-dropdown-panel { list-style: none; margin: 0; }
.aetheria-popover-panel { width: max-content; }

/* The menu portal lives on document.body, so its dismiss layer must stay
   transparent — unlike modal backdrops it never carries an is-open class. */
.aetheria-context-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--aetheria-z-overlay);
    background: transparent;
}
.aetheria-context-menu-backdrop [role="menu"] {
    position: absolute;
    min-width: 190px;
    margin: 0;
    padding: var(--aetheria-space-1);
    list-style: none;
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
    animation: aetheria-menu-in var(--aetheria-fast) var(--aetheria-ease);
}
@keyframes aetheria-menu-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } }
.aetheria-context-menu-area { min-width: 0; }
.aetheria-context-menu-backdrop [role="separator"] { border: none; }
.aetheria-menu-sep {
    height: 1px;
    margin: var(--aetheria-space-2) var(--aetheria-space-1);
    background: var(--aetheria-border-quiet);
}

.aetheria-tooltip {
    position: absolute;
    z-index: var(--aetheria-z-toast);
    max-width: min(240px, 80vw);
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-sm);
    background: var(--aetheria-surface-solid);
    color: var(--aetheria-text);
    font-size: var(--aetheria-text-xs);
    line-height: 1.4;
    box-shadow: var(--aetheria-shadow-2);
    overflow-wrap: anywhere;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--aetheria-fast), transform var(--aetheria-fast), visibility var(--aetheria-fast);
}
.aetheria-tooltip.is-open,
.aetheria-tooltip:hover { opacity: 1; visibility: visible; }

.aetheria-autocomplete { position: relative; min-width: 0; }
.aetheria-autocomplete-results {
    position: absolute;
    z-index: var(--aetheria-z-menu);
    top: calc(100% + var(--aetheria-space-1));
    left: 0;
    right: 0;
    max-height: 220px;
    overflow-y: auto;
    margin: 0;
    padding: var(--aetheria-space-1);
    list-style: none;
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
}

/* ------------------------------------------------------------ navigation */

.aetheria-tabs { min-width: 0; }
.aetheria-tabs-list {
    display: flex;
    gap: var(--aetheria-space-1);
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--aetheria-border);
}
.aetheria-tabs-list::-webkit-scrollbar { display: none; }
.aetheria-tab-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--aetheria-space-2);
    min-height: var(--aetheria-control-md);
    padding: 0 var(--aetheria-space-4);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-weight: 600;
    color: var(--aetheria-text-muted);
    background: transparent;
    border: none;
    border-radius: var(--aetheria-radius-sm) var(--aetheria-radius-sm) 0 0;
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--aetheria-fast), background var(--aetheria-fast);
}
.aetheria-tab-btn::after {
    content: '';
    position: absolute;
    right: var(--aetheria-space-4);
    bottom: 0;
    left: var(--aetheria-space-4);
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: var(--aetheria-accent);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform var(--aetheria-slow) var(--aetheria-ease);
}
.aetheria-tab-btn:hover { color: var(--aetheria-text); background: var(--aetheria-scrim); }
.aetheria-tab-btn.active { color: var(--aetheria-accent); }
.aetheria-tab-btn.active::after { transform: scaleX(1); }
.aetheria-tab-panel {
    margin-top: var(--aetheria-space-4);
    padding: var(--aetheria-space-5);
    min-width: 0;
}

.aetheria-accordion { min-width: 0; }
.aetheria-accordion-list {
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-3);
}
.aetheria-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--aetheria-space-3);
    width: 100%;
    min-height: var(--aetheria-control-md);
    padding: var(--aetheria-space-4);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-weight: 600;
    text-align: left;
    color: var(--aetheria-text);
    background: transparent;
    border: none;
    cursor: pointer;
}
.aetheria-accordion-trigger:hover { color: var(--aetheria-accent-hover); }
.aetheria-accordion-chevron { display: inline-flex; color: var(--aetheria-text-muted); transition: transform var(--aetheria-fast); }
.aetheria-accordion-trigger[aria-expanded="true"] .aetheria-accordion-chevron { transform: rotate(180deg); }
.aetheria-accordion-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--aetheria-slow) var(--aetheria-ease);
    color: var(--aetheria-text-muted);
    font-size: var(--aetheria-text-sm);
}
.aetheria-accordion-content.is-open { grid-template-rows: 1fr; }
.aetheria-accordion-content > * { overflow: hidden; min-width: 0; }
.aetheria-accordion-body {
    padding: 0 var(--aetheria-space-4) var(--aetheria-space-4);
    min-width: 0;
}

.aetheria-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    gap: var(--aetheria-space-2);
    max-width: 100%;
    overflow-x: auto;
}
.aetheria-pagination-pages { display: flex; align-items: center; gap: var(--aetheria-space-1); flex-wrap: nowrap; }
.aetheria-pagination-btn,
.aetheria-datagrid-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--aetheria-control-md);
    height: var(--aetheria-control-md);
    padding: 0 var(--aetheria-space-2);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-variant-numeric: tabular-nums;
    color: var(--aetheria-text-muted);
    background: transparent;
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-sm);
    cursor: pointer;
    transition: color var(--aetheria-fast), background var(--aetheria-fast), border-color var(--aetheria-fast);
}
.aetheria-datagrid-page-btn { min-width: var(--aetheria-control-sm); height: var(--aetheria-control-sm); }
.aetheria-pagination-btn:hover:not(:disabled),
.aetheria-datagrid-page-btn:hover:not(:disabled) {
    color: var(--aetheria-text-strong);
    background: var(--aetheria-surface-hover);
    border-color: var(--aetheria-border-strong);
}
.aetheria-pagination-btn.is-active,
.aetheria-datagrid-page-btn.is-active {
    color: var(--aetheria-accent-ink);
    background: var(--aetheria-accent);
    border-color: var(--aetheria-accent);
    font-weight: 700;
}
.aetheria-pagination-btn:disabled,
.aetheria-datagrid-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.aetheria-pagination-prev,
.aetheria-pagination-next { display: inline-flex; gap: 4px; }

.aetheria-breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--aetheria-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--aetheria-text-sm);
    min-width: 0;
}
.aetheria-breadcrumb-item { display: inline-flex; align-items: center; gap: var(--aetheria-space-2); min-width: 0; }
.aetheria-breadcrumb-link {
    color: var(--aetheria-text-muted);
    text-decoration: none;
    border-radius: var(--aetheria-radius-sm);
    transition: color var(--aetheria-fast);
}
.aetheria-breadcrumb-link:hover { color: var(--aetheria-accent-hover); }
.aetheria-breadcrumb-current { color: var(--aetheria-text-strong); font-weight: 600; }
.aetheria-breadcrumb-sep { color: var(--aetheria-text-faint); display: inline-flex; }

/* ------------------------------------------------------------------ data */

.aetheria-table-scroll { width: 100%; overflow-x: auto; scrollbar-width: thin; }
.aetheria-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--aetheria-text-sm);
}
.aetheria-table th,
.aetheria-table td {
    padding: var(--aetheria-space-3);
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--aetheria-border-quiet);
}
.aetheria-table th {
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--aetheria-text-faint);
}
.aetheria-table tbody tr:last-child td { border-bottom: none; }
.aetheria-table tbody tr:hover td { background: var(--aetheria-scrim); }
.aetheria-table-flush { margin: 0; }

.aetheria-datagrid { display: flex; flex-direction: column; gap: var(--aetheria-space-4); padding: var(--aetheria-space-4); }
.aetheria-datagrid-content { min-width: 0; }
.aetheria-datagrid-filter { max-width: 280px; }
.aetheria-datagrid-table { width: 100%; border-collapse: collapse; font-size: var(--aetheria-text-sm); }
.aetheria-datagrid-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: var(--aetheria-space-3);
    text-align: left;
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--aetheria-text-faint);
    background: var(--aetheria-surface-solid);
    border-bottom: 1px solid var(--aetheria-border);
    white-space: nowrap;
}
.aetheria-datagrid-table thead th:first-child { border-top-left-radius: var(--aetheria-radius-sm); }
.aetheria-datagrid-table thead th:last-child { border-top-right-radius: var(--aetheria-radius-sm); }
.aetheria-datagrid-table tbody td {
    padding: var(--aetheria-space-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--aetheria-border-quiet);
    color: var(--aetheria-text);
}
.aetheria-datagrid-table tbody tr:last-child td { border-bottom: none; }
.aetheria-datagrid-table tbody tr:hover td { background: var(--aetheria-scrim); }
.aetheria-datagrid-table tbody tr.is-selected td { background: var(--aetheria-accent-soft); }
.aetheria-datagrid-table tbody tr.is-clickable { cursor: pointer; }
.aetheria-datagrid-table tbody td:last-child { text-align: right; }
.aetheria-datagrid-table .aetheria-datagrid-utility-cell { text-align: center; width: 48px; }
button.aetheria-datagrid-sort {
    display: inline-flex;
    align-items: center;
    gap: var(--aetheria-space-1);
    min-height: 24px;
    padding: 0;
    font: inherit;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    color: inherit;
    background: none;
    border: none;
    cursor: pointer;
}
button.aetheria-datagrid-sort:hover { color: var(--aetheria-accent-hover); }
.aetheria-datagrid-sort-icon { display: inline-flex; opacity: .6; }
.aetheria-datagrid-sort[aria-sort] .aetheria-datagrid-sort-icon { opacity: 1; color: var(--aetheria-accent); }
.aetheria-datagrid-sort[aria-sort="descending"] .aetheria-datagrid-sort-icon { transform: rotate(180deg); }
.aetheria-datagrid-checkbox { accent-color: var(--aetheria-accent); cursor: pointer; }
.aetheria-datagrid-detail-row > td { background: var(--aetheria-bg-soft); padding: var(--aetheria-space-4); }
.aetheria-datagrid-empty-row > td { padding: var(--aetheria-space-8); text-align: center; color: var(--aetheria-text-muted); }
.aetheria-datagrid-expand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--aetheria-border);
    border-radius: 6px;
    background: transparent;
    color: var(--aetheria-text-muted);
    cursor: pointer;
}
.aetheria-datagrid-expand:hover { color: var(--aetheria-accent); border-color: var(--aetheria-border-strong); }
.aetheria-datagrid-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--aetheria-space-3);
    padding-top: var(--aetheria-space-3);
    border-top: 1px solid var(--aetheria-border-quiet);
    font-size: var(--aetheria-text-sm);
    color: var(--aetheria-text-muted);
}
.aetheria-datagrid-page-summary { font-variant-numeric: tabular-nums; }
.aetheria-datagrid-page-size-label { margin-right: var(--aetheria-space-2); }
.aetheria-datagrid-page-size {
    min-width: 72px;
    height: var(--aetheria-control-sm);
    padding: 0 var(--aetheria-space-2);
    font: inherit;
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-sm);
}
.aetheria-datagrid-page-current { color: var(--aetheria-text-strong); font-weight: 600; }

.aetheria-list-view { display: flex; flex-direction: column; gap: var(--aetheria-space-1); min-width: 0; }
.aetheria-list-item {
    display: flex;
    align-items: center;
    gap: var(--aetheria-space-3);
    width: 100%;
    min-height: var(--aetheria-control-md);
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    text-align: left;
    color: var(--aetheria-text);
    background: transparent;
    border: none;
    border-radius: var(--aetheria-radius-sm);
    cursor: pointer;
    transition: background var(--aetheria-fast);
}
.aetheria-list-item:hover,
.aetheria-list-item.is-selected { background: var(--aetheria-accent-soft); }
.aetheria-list-item.is-dragging { opacity: .6; }

.aetheria-sortable-list { display: flex; flex-direction: column; gap: var(--aetheria-space-2); min-width: 0; }
.aetheria-sortable-item {
    display: flex;
    align-items: center;
    gap: var(--aetheria-space-3);
    padding: var(--aetheria-space-3);
    cursor: grab;
}
.aetheria-sortable-item:hover { border-color: var(--aetheria-border-strong); }
.aetheria-sortable-item.is-over { border-color: var(--aetheria-accent); box-shadow: 0 0 0 3px var(--aetheria-accent-soft); }
.aetheria-sortable-handle { display: inline-flex; color: var(--aetheria-text-faint); cursor: grab; }

.aetheria-tree-view,
.aetheria-tree-children { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.aetheria-tree-children { margin-left: var(--aetheria-space-4); padding-left: var(--aetheria-space-3); border-left: 1px solid var(--aetheria-border-quiet); }
.aetheria-tree-row { display: flex; align-items: center; gap: var(--aetheria-space-2); min-height: 36px; min-width: 0; }
.aetheria-tree-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--aetheria-text-muted);
    cursor: pointer;
}
.aetheria-tree-trigger:hover { color: var(--aetheria-accent); background: var(--aetheria-scrim); }
.aetheria-tree-spacer { width: 24px; flex: 0 0 auto; }
.aetheria-tree-label { min-width: 0; font-size: var(--aetheria-text-sm); color: var(--aetheria-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aetheria-tree-meta { margin-left: auto; color: var(--aetheria-text-faint); font-size: var(--aetheria-text-xs); font-variant-numeric: tabular-nums; }

.aetheria-command-toolbar {
    display: flex;
    align-items: center;
    gap: var(--aetheria-space-2);
    flex-wrap: wrap;
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-input);
}
.aetheria-command-toolbar .aetheria-btn { min-height: 36px; padding: 4px var(--aetheria-space-3); }
.aetheria-command-sep { width: 1px; align-self: stretch; background: var(--aetheria-border-quiet); }

.aetheria-file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--aetheria-space-3); min-width: 0; }
.aetheria-file-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--aetheria-space-2);
    padding: var(--aetheria-space-4);
    text-align: center;
    cursor: pointer;
}
.aetheria-file-item:hover,
.aetheria-file-item.is-selected { border-color: var(--aetheria-border-strong); background: var(--aetheria-accent-soft); }
.aetheria-file-name { max-width: 100%; font-size: var(--aetheria-text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aetheria-file-meta { color: var(--aetheria-text-faint); font-size: var(--aetheria-text-xs); font-variant-numeric: tabular-nums; }

/* ------------------------------------------------------------------ date */

.aetheria-datepicker { position: relative; min-width: 0; }
.aetheria-datepicker-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--aetheria-space-2);
    text-align: left;
    cursor: pointer;
}
.aetheria-calendar-modal { z-index: var(--aetheria-z-overlay); }
.aetheria-calendar-dialog {
    width: min(420px, 100%);
    padding: var(--aetheria-space-4);
    border: 1px solid var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-lg);
    background: var(--aetheria-surface-solid);
    box-shadow: var(--aetheria-shadow-3);
    transform: translateY(8px) scale(.98);
    opacity: 0;
    transition: transform var(--aetheria-slow) var(--aetheria-ease), opacity var(--aetheria-slow);
}
.aetheria-calendar-modal.is-open .aetheria-calendar-dialog { transform: none; opacity: 1; }
.aetheria-calendar { width: 100%; min-width: 0; }
.aetheria-calendar-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--aetheria-space-2);
    margin-bottom: var(--aetheria-space-3);
}
.aetheria-calendar-title { font-size: var(--aetheria-text-md); font-weight: 600; color: var(--aetheria-text-strong); margin: 0; }
.aetheria-calendar-nav { display: flex; align-items: center; gap: var(--aetheria-space-1); }
.aetheria-calendar-heading {
    display: inline-flex;
    align-items: center;
    gap: var(--aetheria-space-1);
    padding: var(--aetheria-space-1) var(--aetheria-space-3);
    min-height: 36px;
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-weight: 600;
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-pill);
    cursor: pointer;
}
.aetheria-calendar-heading:hover { border-color: var(--aetheria-border-strong); color: var(--aetheria-accent); }
.aetheria-calendar-heading[aria-expanded="true"] { background: var(--aetheria-accent-soft); }

.aetheria-calendar-view { position: relative; min-width: 0; }
.aetheria-calendar-view.is-forward { animation: aetheria-slide-in-right var(--aetheria-slow) var(--aetheria-ease); }
.aetheria-calendar-view.is-backward { animation: aetheria-slide-in-left var(--aetheria-slow) var(--aetheria-ease); }
@keyframes aetheria-slide-in-right { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
@keyframes aetheria-slide-in-left { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }

.aetheria-calendar-weekdays,
.aetheria-calendar-grid {
    display: grid;
    width: 100%;
    min-width: 0;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--aetheria-space-1);
}
.aetheria-calendar-weekdays { margin-bottom: var(--aetheria-space-1); }
.aetheria-calendar-weekdays span {
    text-align: center;
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--aetheria-text-faint);
    padding: var(--aetheria-space-1) 0;
}
.aetheria-calendar-day {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: var(--aetheria-control-md);
    padding: 0;
    font: inherit;
    font-size: var(--aetheria-text-sm);
    font-variant-numeric: tabular-nums;
    color: var(--aetheria-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--aetheria-radius-sm);
    cursor: pointer;
    transition: background var(--aetheria-fast), color var(--aetheria-fast), border-color var(--aetheria-fast);
}
.aetheria-calendar-day:not(.is-selected):hover:not(:disabled) { background: var(--aetheria-surface-hover); border-color: var(--aetheria-border-strong); }
.aetheria-calendar-day:hover:not(:disabled) { background: var(--aetheria-surface-hover); }
.aetheria-calendar-day.is-selected,
.aetheria-calendar-day[aria-pressed="true"] {
    background: var(--aetheria-accent);
    color: var(--aetheria-accent-ink);
    font-weight: 700;
}
.aetheria-calendar-day.is-today { border-color: var(--aetheria-accent); }
.aetheria-calendar-outside { color: var(--aetheria-text-faint); opacity: .6; }
.aetheria-calendar-day:disabled,
.aetheria-calendar-month:disabled { opacity: .35; cursor: not-allowed; }

.aetheria-calendar-week-row { display: contents; }
.aetheria-calendar-week-row .aetheria-calendar-day { border-color: var(--aetheria-border-quiet); }
.aetheria-calendar-month-view { display: flex; flex-direction: column; gap: var(--aetheria-space-2); min-width: 0; }
.aetheria-calendar-year-grid,
.aetheria-calendar-month-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
    gap: var(--aetheria-space-2);
}
.aetheria-calendar-month {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: var(--aetheria-space-2);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-md);
    cursor: pointer;
}
.aetheria-calendar-month:hover:not(:disabled) { border-color: var(--aetheria-border-strong); color: var(--aetheria-accent); }
.aetheria-calendar-month.is-selected { background: var(--aetheria-accent); color: var(--aetheria-accent-ink); border-color: var(--aetheria-accent); font-weight: 700; }

.aetheria-calendar-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--aetheria-space-2);
    margin-top: var(--aetheria-space-4);
    padding-top: var(--aetheria-space-3);
    border-top: 1px solid var(--aetheria-border-quiet);
}

/* ------------------------------------------------------- complex widgets */

.aetheria-form-error,
.aetheria-field-error {
    margin-top: var(--aetheria-space-1);
    color: var(--aetheria-danger);
    font-size: var(--aetheria-text-xs);
    overflow-wrap: anywhere;
}
.aetheria-field.is-invalid,
.aetheria-field[aria-invalid="true"] { border-color: var(--aetheria-danger); }

.aetheria-chart,
.aetheria-sparkline { display: block; max-width: 100%; height: auto; overflow: visible; }
.aetheria-chart svg,
.aetheria-sparkline svg { display: block; max-width: 100%; }
.aetheria-chart-line { stroke: var(--aetheria-accent); fill: none; stroke-width: 2; }
.aetheria-chart-area { fill: var(--aetheria-accent-soft); stroke: none; }
.aetheria-chart-grid { stroke: var(--aetheria-border-quiet); stroke-width: 1; }
.aetheria-chart-label { fill: var(--aetheria-text-faint); font-size: var(--aetheria-text-xs); }

.aetheria-scheduler-row {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: center;
    gap: var(--aetheria-space-3);
    min-height: 48px;
    padding: var(--aetheria-space-2) 0;
    border-bottom: 1px solid var(--aetheria-border-quiet);
}
.aetheria-scheduler-row:last-child { border-bottom: none; }
.aetheria-scheduler-time { color: var(--aetheria-accent); font-size: var(--aetheria-text-sm); font-variant-numeric: tabular-nums; }
.aetheria-scheduler-event {
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-sm);
    background: var(--aetheria-accent-soft);
    min-width: 0;
}

.aetheria-gantt-row {
    display: grid;
    grid-template-columns: minmax(96px, 160px) minmax(0, 1fr);
    align-items: center;
    gap: var(--aetheria-space-3);
    min-width: 0;
}
.aetheria-gantt-label { font-size: var(--aetheria-text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aetheria-gantt-track {
    position: relative;
    height: 16px;
    border-radius: var(--aetheria-radius-pill);
    background: var(--aetheria-scrim);
}
.aetheria-gantt-bar {
    position: absolute;
    inset-block: 0;
    border-radius: var(--aetheria-radius-pill);
    background: linear-gradient(90deg, var(--aetheria-ice), var(--aetheria-accent));
    box-shadow: 0 0 12px var(--aetheria-accent-glow);
}

.aetheria-spreadsheet-table { width: 100%; border-collapse: collapse; font-size: var(--aetheria-text-sm); }
.aetheria-spreadsheet-table th,
.aetheria-spreadsheet-table td {
    border: 1px solid var(--aetheria-border-quiet);
    padding: 0;
    min-width: 72px;
}
.aetheria-spreadsheet-table th {
    background: var(--aetheria-surface-input);
    color: var(--aetheria-text-faint);
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    text-align: center;
    padding: var(--aetheria-space-1);
}
.aetheria-spreadsheet-cell {
    width: 100%;
    min-height: 36px;
    padding: var(--aetheria-space-2);
    font: inherit;
    color: var(--aetheria-text);
    background: transparent;
    border: none;
    outline: none;
}
.aetheria-spreadsheet-cell:focus { background: var(--aetheria-accent-soft); box-shadow: inset 0 0 0 2px var(--aetheria-accent); }

.aetheria-rich-editor {
    min-height: 120px;
    padding: var(--aetheria-space-3);
    font-size: var(--aetheria-text-sm);
    line-height: var(--aetheria-leading);
    color: var(--aetheria-text);
    background: var(--aetheria-surface-input);
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-md);
    overflow-wrap: anywhere;
}
.aetheria-rich-editor:focus { border-color: var(--aetheria-accent); box-shadow: 0 0 0 3px var(--aetheria-accent-soft); }
.aetheria-editor-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--aetheria-space-1);
    margin-bottom: var(--aetheria-space-2);
}
.aetheria-editor-toolbar button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 var(--aetheria-space-2);
    font: inherit;
    font-size: var(--aetheria-text-sm);
    color: var(--aetheria-text-muted);
    background: transparent;
    border: 1px solid var(--aetheria-border);
    border-radius: var(--aetheria-radius-sm);
    cursor: pointer;
}
.aetheria-editor-toolbar button:hover { color: var(--aetheria-accent); border-color: var(--aetheria-border-strong); }

.aetheria-pivot-table,
.aetheria-pivot { width: 100%; border-collapse: collapse; font-size: var(--aetheria-text-sm); }
.aetheria-pivot-table th,
.aetheria-pivot-table td {
    padding: var(--aetheria-space-2) var(--aetheria-space-3);
    border-bottom: 1px solid var(--aetheria-border-quiet);
    text-align: left;
}
.aetheria-pivot-table thead th {
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--aetheria-text-faint);
}
.aetheria-pivot-table td[data-type="number"],
.aetheria-pivot-total { text-align: right; font-variant-numeric: tabular-nums; }
.aetheria-pivot-total { font-weight: 700; color: var(--aetheria-text-strong); }

.aetheria-pdf-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--aetheria-space-3);
    min-height: 220px;
    padding: var(--aetheria-space-6);
    text-align: center;
    border: 1px dashed var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
    background: var(--aetheria-surface-input);
    color: var(--aetheria-text-muted);
}

.aetheria-tooltip-anchor { position: relative; display: inline-flex; }
.aetheria-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--aetheria-space-2);
    min-width: 0;
}

/* ------------------------------------------------------------ docs chrome */

.aetheria-docs {
    min-height: 100vh;
    padding: var(--aetheria-space-8) clamp(var(--aetheria-space-4), 4vw, var(--aetheria-space-8));
    color: var(--aetheria-text);
    background:
        radial-gradient(ellipse at 2% 5%, var(--aetheria-accent-soft), transparent 35%),
        radial-gradient(ellipse at 94% 3%, var(--aetheria-surface-hover), transparent 33%),
        var(--aetheria-bg);
}
.aetheria-docs-inner {
    max-width: 1180px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-6);
    min-width: 0;
}
.aetheria-docs-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--aetheria-space-4);
    flex-wrap: wrap;
}
.aetheria-docs-title {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.25rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
    background: linear-gradient(105deg, var(--aetheria-text-strong) 0%, var(--aetheria-ice) 52%, var(--aetheria-pink) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.aetheria-docs-subtitle {
    margin: var(--aetheria-space-2) 0 0;
    max-width: 62ch;
    font-size: var(--aetheria-text-md);
    color: var(--aetheria-text-muted);
}
.aetheria-docs-nav {
    display: flex;
    align-items: center;
    gap: var(--aetheria-space-2);
    flex-wrap: wrap;
}
.aetheria-docs-section {
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-4);
    padding: var(--aetheria-space-6);
    margin: 0;
    min-width: 0;
}
.aetheria-docs-section-head { display: flex; flex-direction: column; gap: var(--aetheria-space-1); min-width: 0; }
.aetheria-docs-section-title { font-size: var(--aetheria-text-xl); font-weight: 600; margin: 0; }
.aetheria-docs-section-desc { color: var(--aetheria-text-muted); font-size: var(--aetheria-text-sm); margin: 0; }

.aetheria-docs-split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--aetheria-space-4);
    align-items: start;
    min-width: 0;
}
.aetheria-docs-eyebrow {
    margin-bottom: var(--aetheria-space-2);
    font-size: var(--aetheria-text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--aetheria-text-muted);
}
.aetheria-docs-code .aetheria-docs-eyebrow { color: var(--aetheria-code-accent); }
.aetheria-docs-code {
    min-width: 0;
    padding: var(--aetheria-space-4);
    overflow-x: auto;
    scrollbar-width: thin;
    font-size: var(--aetheria-text-sm);
    background: var(--aetheria-code-bg);
    border: 1px solid var(--aetheria-code-border);
    border-radius: var(--aetheria-radius-md);
    color: var(--aetheria-code-fg);
}
.aetheria-docs-code pre { margin: 0; font-family: var(--aetheria-mono); line-height: 1.55; }
.aetheria-docs-code code { font-family: inherit; background: none; padding: 0; }
.aetheria-docs-preview {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--aetheria-space-3);
    min-height: 160px;
    padding: var(--aetheria-space-4);
    min-width: 0;
}
.aetheria-docs-preview-body { width: 100%; min-width: 0; }
.aetheria-demo-target {
    min-height: 112px;
    border: 1px dashed var(--aetheria-border-strong);
    border-radius: var(--aetheria-radius-md);
}

@media (max-width: 900px) {
    .aetheria-docs-split { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 720px) {
    .aetheria-docs { padding: var(--aetheria-space-5) var(--aetheria-space-4); }
    .aetheria-docs-section { padding: var(--aetheria-space-4); }
}

/* ------------------------------------------------------------- responsive */

.aetheria-showcase-overflow-visible,
.aetheria-glass.aetheria-showcase-overflow-visible { overflow: visible; }
.aetheria-showcase-preview,
.aetheria-glass .aetheria-showcase-preview {
    display: flex;
    flex-direction: column;
    gap: var(--aetheria-space-3);
    padding: var(--aetheria-space-4);
    min-width: 0;
    overflow: visible;
}

@media (max-width: 720px) {
    .aetheria-panel, .aetheria-card, .aetheria-modal-dialog, .aetheria-drawer { padding: var(--aetheria-space-4); }
    .aetheria-row { gap: var(--aetheria-space-2); }
    .aetheria-gantt-row { grid-template-columns: minmax(80px, 110px) minmax(0, 1fr); }
    .aetheria-scheduler-row { grid-template-columns: 60px minmax(0, 1fr); }
    .aetheria-datagrid-pager { justify-content: flex-start; }
    .aetheria-modal-dialog { max-height: 88vh; }
    .aetheria-calendar-controls { flex-wrap: wrap; }
    .aetheria-calendar-day { min-width: 36px; }
}

@media (prefers-reduced-motion: reduce) {
    .aetheria-root *,
    .aetheria-glass,
    .aetheria-modal-dialog,
    .aetheria-drawer,
    .aetheria-calendar-view {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
    }
    .aetheria-card:hover,
    .aetheria-btn:active { transform: none; }
}

@media (forced-colors: active) {
    .aetheria-glass,
    .aetheria-btn,
    .aetheria-field { border: 1px solid CanvasText; }
}
`;
