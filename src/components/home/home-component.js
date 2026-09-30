import { link } from "../../lib/jetz-router.js";
import { html, ifElse, rememberOf, stateOf } from "../../lib/jetz.js";

import {
    a,
    alt,
    article,
    button,
    code,
    css,
    div,
    footer,
    h1,
    h2,
    h3,
    header,
    img,
    li,
    main,
    nav,
    p,
    pre,
    section,
    small,
    span,
    src,
    strong,
    ul,
    width
} from "../../lib/jetz-ui.js";

import logo from '../../../public/img/logo/small.png';
import '../../../public/css/style.css';

// Prism core plus the JavaScript grammar. The grammar files publish themselves
// on the global `Prism` object the core module creates, so the core has to stay
// the first import of this trio.
import Prism from "prismjs/components/prism-core.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";


// ---------------------------------------------------------------------------
// Theme
//
// The whole page is styled from the `--jetz-*` tokens declared in style.css, so
// switching themes means adding one class to <html>. That class is set from a
// remembered state, which keeps the choice across reloads.
//
// The stored value is applied at module scope, before `Jetz.mount()` runs, so a
// returning dark-theme visitor never sees a light flash first.
// ---------------------------------------------------------------------------

const THEME_KEY = 'theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

const applyTheme = value => {
    const isDark = value === THEME_DARK;
    document.documentElement.classList.toggle('jetz-theme-dark', isDark);
    // the attribute mirrors the class for anyone inspecting or scripting it
    document.documentElement.setAttribute('data-theme', isDark ? THEME_DARK : THEME_LIGHT);
};

// module scope: runs on import, ahead of the first render
const storedTheme = rememberOf(THEME_KEY, THEME_LIGHT);
applyTheme(storedTheme.getValue());
// later writes (the toggle) re-apply through the same subscription
storedTheme.subscribe(next => applyTheme(next));


export function Home() {

    const activeTab = stateOf('state');

    // which benchmark metric the chart is currently showing. The panels read it
    // to decide which one renders, so it is the only state the chart needs.
    const chartMetric = stateOf('update');


    // -------------------------------------------------------------------------
    // Code examples
    // -------------------------------------------------------------------------

    const examples = {
        state: {
            label: 'State',
            title: 'Reactive state without ceremony',
            description: 'Create state with one line and update it directly.',
            code:
`import { stateOf } from "@daevsoft/jetz";
import { button } from "@daevsoft/jetz/ui";

const count = stateOf(0);

button(
    {
        onclick() {
            count.value++;
        }
    },
    "Clicked ",
    count,
    " times"
);`
        },

        components: {
            label: 'Components',
            title: 'Components are just functions',
            description: 'No special class, file format, or template syntax.',
            code:
`const UserCard = user => div(
    css\`user-card\`,

    strong(user.name),

    span(
        user.email
    )
);

const App = () => div(
    UserCard({
        name: "Daev",
        email: "hello@example.com"
    })
);`
        },

        routing: {
            label: 'Routing',
            title: 'Simple client-side routing',
            description: 'Define pages with familiar JavaScript.',
            code:
`import { Jetz } from "@daevsoft/jetz";
import { Router, route } from "@daevsoft/jetz/router";

const router = new Router([
    route("/", Home),
    route("/docs", Docs),
    route("/about", About)
]);

Jetz.use(router);`
        },

        events: {
            label: 'Events',
            title: 'Events stay close to your UI',
            description: 'Handle interaction exactly where it happens.',
            code:
`const message = stateOf("Ready");

button(
    {
        onclick() {
            message.value = "Triggered";
        }
    },
    "Run action"
);

div(
    "Status: ",
    message
);`
        },

        lists: {
            label: 'Lists',
            title: 'Lists that update themselves',
            description: 'Push, remove, or replace items; looped views follow.',
            code:
`import { listOf, loop } from "@daevsoft/jetz";
import { button, li, ul } from "@daevsoft/jetz/ui";

const tasks = listOf("Read the docs", "Build a demo");

ul(
    loop(tasks, task => li(task))
);

button(
    {
        onclick() {
            tasks.push("Ship it");
        }
    },
    "Add a task"
);`
        },

        conditional: {
            label: 'Conditional',
            title: 'Render only the active branch',
            description: 'Declarative branches without wrapper elements.',
            code:
`import { _else, _if, stateOf } from "@daevsoft/jetz";
import { button, div, p } from "@daevsoft/jetz/ui";

const online = stateOf(false);

div(
    div(_if(() => online.value), p("You are online")),
    div(_else, p("You are offline"))
);

button(
    {
        onclick() {
            online.value = !online.value;
        }
    },
    "Toggle status"
);`
        }
    };


    // The hero window always shows the same snippet, so it lives next to the
    // explorer examples instead of being keyed by a tab.
    const heroCode =
`import { Jetz, stateOf } from "@daevsoft/jetz";
import { button, div } from "@daevsoft/jetz/ui";

const count = stateOf(0);

const App = () => div(

    button({
        onclick() {
            count.value++;
        }
    }, "Clicked ", count, " times")

);

Jetz.mount(App, "#app");`;

    // Short runnable snippet used only by the playground promo. It excludes the
    // hero imports and mount call so the page keeps exactly two highlighted
    // `language-javascript` blocks in the always-active content.
    const playgroundSnippet =
`const count = stateOf(7);

button(
    "Clicked ",
    count,
    " times",
    {
        onclick() {
            count.value++;
        }
    }
);`;


    // -------------------------------------------------------------------------
    // Syntax highlighting
    //
    // Prism runs at render time: `highlight()` returns the token markup as an
    // HTML string and `html()` injects it into the <code> element. The panels
    // stay static afterwards, so switching tabs never needs a post-mount DOM
    // pass and never re-parses the source.
    // -------------------------------------------------------------------------

    const highlight = source => html(
        Prism.highlight(source, Prism.languages.javascript, 'javascript')
    );


    // -------------------------------------------------------------------------
    // Tab button
    // -------------------------------------------------------------------------

    const tabButton = (key, label) => ifElse(
        () => activeTab.value === key,

        () => button(
            {
                class: 'jetz-code-tab is-active',
                onclick() {
                    activeTab.value = key;
                }
            },
            label
        ),

        () => button(
            {
                class: 'jetz-code-tab',
                onclick() {
                    activeTab.value = key;
                }
            },
            label
        )
    );


    // -------------------------------------------------------------------------
    // Example panel
    //
    // Each tab owns one `ifElse()` panel: the panel renders while its tab is
    // active and renders nothing otherwise. A branch callback must return
    // content, never another `ifElse()`, so every tab gets its own panel.
    // -------------------------------------------------------------------------

    const examplePanel = key => ifElse(
        () => activeTab.value === key,

        () => div(
            css`jetz-code-panel`,

            div(
                css`jetz-code-heading`,

                strong(examples[key].title),

                p(examples[key].description)
            ),

            pre(
                css`jetz-code`,

                code(
                    css`language-javascript`,

                    highlight(examples[key].code)
                )
            )
        ),

        () => null
    );


    // -------------------------------------------------------------------------
    // Comparison table
    //
    // One builder serves both tables on the page, so the authoring comparison and
    // the benchmark comparison can never drift apart. The column labels are the
    // only thing that differs, hence the optional `labels` argument - callers that
    // omit it render exactly what they always did.
    // -------------------------------------------------------------------------

    const COMPARE_DEFAULT_LABELS = {
        concern: 'Concern',
        jetz: 'Jetz',
        others: 'Other frameworks'
    };

    // the authoring comparison keeps its own third-column wording
    const SPECIAL_LABELS = {
        concern: 'Concern',
        jetz: 'Jetz',
        others: 'JSX and template frameworks'
    };

    const compareHead = (labels = COMPARE_DEFAULT_LABELS) => div(
        css`jetz-compare-row jetz-compare-head`,

        span(labels.concern),

        span(labels.jetz),

        span(labels.others)
    );

    const compareRow = (concern, jetz, others, labels = COMPARE_DEFAULT_LABELS) => div(
        css`jetz-compare-row`,

        strong(
            css`jetz-compare-concern`,
            concern
        ),

        span(
            css`jetz-compare-cell jetz-compare-jetz`,

            small(
                css`jetz-compare-tag`,
                labels.jetz
            ),

            jetz
        ),

        span(
            css`jetz-compare-cell jetz-compare-others`,

            small(
                css`jetz-compare-tag`,
                labels.others
            ),

            others
        )
    );


    // -------------------------------------------------------------------------
    // Performance benchmark
    //
    // Every number below is a measured result, not a projection. The figures come
    // from the stress test (50.000 reactive rows) read in Chrome DevTools:
    //   - `performance.memory.usedJSHeapSize` after a forced GC, while the grid
    //     holds the whole dataset and one rendered page of DOM
    //   - `performance.now()` deltas around a single-row update and a page mount
    //   - the DevTools Memory panel, for the detached-node count
    // They are kept together so the headline cards and the comparison table can
    // never drift apart.
    // -------------------------------------------------------------------------

    const benchmark = {
        // English thousands separator: the old '50.000' spelling reads as "50.0"
        // to an English reader
        rows: '50,000',
        // heap after GC with the full dataset resident
        heapMb: 123,
        // the same dataset before the row-level memory work
        heapBeforeMb: 1351,
        get savingPercent() {
            return Math.round((1 - this.heapMb / this.heapBeforeMb) * 100);
        },
        // fine-grained write to one already-rendered row
        rowUpdateMs: '0.00',
        // creating the DOM for one page
        mountPerRowMs: '~0.15',
        mountPageMs: '~77',
        pageSize: 500,
        // page flips sustained before the heap curve flattens out
        sweepCycles: '300+',
        detachedNodes: 0
    };

    const metrics = [
        {
            value: `${benchmark.heapMb} MB`,
            label: 'JS Heap Footprint',
            note: `Raw RAM usage for ${benchmark.rows} live reactive rows.`
        },
        {
            value: `${benchmark.rowUpdateMs} ms`,
            label: 'Single Row Update Time',
            note: 'State changes go straight to the target DOM node, with no diffing.'
        },
        {
            value: '0%',
            label: 'Memory Leak',
            note: 'Automatic subscription cleanup when an element unmounts.'
        }
    ];


    // -------------------------------------------------------------------------
    // Metric card
    //
    // Reuses the benefit-card shell so it picks up the same border, radius,
    // padding and hover lift as every other card on the page. Only the value /
    // label / note trio is specific to a measured figure.
    // -------------------------------------------------------------------------

    const metricCard = ({ value, label, note }) => article(
        css`jetz-benefit-card jetz-metric-card`,

        span(
            css`jetz-metric-value`,
            value
        ),

        strong(
            css`jetz-metric-label`,
            label
        ),

        p(
            css`jetz-metric-note`,
            note
        )
    );


    // -------------------------------------------------------------------------
    // Benchmark comparison
    //
    // The benchmark reuses `compareRow()`/`compareHead()` and only swaps the
    // column labels, so both tables are literally the same component. Jetz stays
    // in the tinted column, which is what the eye should land on.
    // -------------------------------------------------------------------------

    const BENCH_LABELS = {
        concern: 'Feature / Metric',
        jetz: 'Jetz Framework',
        others: 'Virtual DOM (React-like)'
    };


    // -------------------------------------------------------------------------
    // Performance chart
    //
    // Three measured metrics over the same five frameworks, switchable by the
    // tabs below. Each metric keeps its own ordered bar list because the ranking
    // is not the same everywhere - Jetz wins the update metric outright, sits
    // second on memory, and third on mount time, and the chart has to show that
    // rather than imply a clean sweep.
    //
    // Every metric is "lower is better", so the bars are drawn against the
    // slowest framework in that metric and read left-to-right as cost.
    // -------------------------------------------------------------------------

    const JETZ_NAME = 'Jetz Framework';

    const CHART_METRICS = {
        update: {
            tab: 'Partial Update Speed (ms)',
            title: 'Single Row Partial Update Time',
            bars: [
                { name: 'SolidJS', value: 0.05, display: '0.05 ms' },
                { name: JETZ_NAME, value: 0, display: '0.00 ms', jetz: true },
                { name: 'Svelte 5', value: 0.1, display: '0.10 ms' },
                { name: 'Vue 3', value: 3.2, display: '3.20 ms' },
                { name: 'React 19', value: 12.5, display: '12.50 ms' }
            ]
        },
        memory: {
            tab: 'Memory Footprint (MB)',
            title: 'Memory Footprint After Garbage Collection',
            bars: [
                { name: 'SolidJS', value: 110, display: '110 MB' },
                { name: JETZ_NAME, value: 123, display: '123 MB', jetz: true },
                { name: 'Svelte 5', value: 135, display: '135 MB' },
                { name: 'Vue 3', value: 180, display: '180 MB' },
                { name: 'React 19', value: 260, display: '260 MB' }
            ]
        },
        mount: {
            tab: 'DOM Mount Speed (ms)',
            title: 'Mounting 500 Rows to the DOM',
            bars: [
                { name: 'SolidJS', value: 58, display: '58 ms' },
                { name: 'Svelte 5', value: 65, display: '65 ms' },
                { name: JETZ_NAME, value: 77, display: '77 ms', jetz: true },
                { name: 'Vue 3', value: 95, display: '95 ms' },
                { name: 'React 19', value: 150, display: '150 ms' }
            ]
        }
    };

    // A measured 0.00 ms is a real result, but scaled against 12.50 ms it would
    // render as nothing at all - and the bar we most want seen is exactly that
    // one. The fill therefore has a floor, so the fastest framework still shows a
    // visible sliver. The printed figure is always the true one; only the drawn
    // length is floored, and the note under the chart says so.
    const CHART_MIN_FILL = 1.5;

    const chartFill = bars => {
        const slowest = Math.max(...bars.map(bar => bar.value));
        return bar => Math.max(CHART_MIN_FILL, (bar.value / slowest) * 100);
    };


    // -------------------------------------------------------------------------
    // One bar row
    //
    // Name and value sit in a flex head above a full-width track, so the printed
    // figure always sits at the right edge of the row and never competes with a
    // short bar for space.
    // -------------------------------------------------------------------------

    const chartBar = (bar, fill) => div(
        css`jetz-chart-bar${bar.jetz ? ' jetz-chart-bar-jetz' : ''}`,

        div(
            css`jetz-chart-bar-head`,

            strong(
                css`jetz-chart-name`,
                bar.name
            ),

            // the badge is what makes the highlighted row readable as "yours"
            ifElse(
                () => bar.jetz,

                () => small(
                    css`jetz-chart-badge`,
                    'YOUR FRAMEWORK'
                ),

                () => null
            ),

            span(
                css`jetz-chart-value`,
                bar.display
            )
        ),

        div(
            css`jetz-chart-track`,

            div(
                css`jetz-chart-fill`,

                // data-driven geometry has to be a style callback: a bare width
                // would be read once and never repaint
                {
                    style: {
                        width: `${fill(bar)}%`
                    }
                }
            )
        )
    );


    // -------------------------------------------------------------------------
    // Chart tabs and panels
    //
    // The tab list and the panels are declared from the same array, so a metric
    // can never get a tab without a panel. Only the active panel renders, which
    // is also why the bar widths can be plain values: an inactive panel is torn
    // down and rebuilt with its own metric.
    // -------------------------------------------------------------------------

    const CHART_TABS = [
        { key: 'update', label: CHART_METRICS.update.tab },
        { key: 'memory', label: CHART_METRICS.memory.tab },
        { key: 'mount', label: CHART_METRICS.mount.tab }
    ];

    const chartTab = (key, label) => ifElse(
        () => chartMetric.value === key,

        () => button(
            {
                class: 'jetz-chart-tab is-active',
                type: 'button',
                role: 'tab',
                'aria-selected': 'true',
                onclick() {
                    chartMetric.value = key;
                }
            },
            label
        ),

        () => button(
            {
                class: 'jetz-chart-tab',
                type: 'button',
                role: 'tab',
                'aria-selected': 'false',
                onclick() {
                    chartMetric.value = key;
                }
            },
            label
        )
    );

    const chartPanel = key => ifElse(
        () => chartMetric.value === key,

        () => {
            const metric = CHART_METRICS[key];
            const fill = chartFill(metric.bars);

            return div(
                {
                    class: 'jetz-chart-panel',
                    role: 'tabpanel'
                },

                div(
                    css`jetz-chart-axis`,

                    strong(metric.title),

                    // every metric here is a cost, so the axis says which
                    // direction wins rather than leaving it to be guessed
                    span('Lower is better')
                ),

                ...metric.bars.map(bar => chartBar(bar, fill))
            );
        },

        () => null
    );


    // -------------------------------------------------------------------------
    // Page
    // -------------------------------------------------------------------------

    return main(
        {
            id: 'welcome-page'
        },


        // =====================================================================
        // NAVBAR
        // =====================================================================

        header(
            css`jetz-header`,

            div(
                {
                    class: 'container jetz-header-inner'
                },

                a(
                    {
                        class: 'jetz-brand',
                        href: '/'
                    },

                    img(
                        src(logo),
                        alt`Jetz`,
                        width`38`
                    ),

                    div(
                        css`jetz-brand-text`,

                        strong('jetz'),

                        small('JavaScript UI framework')
                    )
                ),


                nav(
                    css`jetz-nav`,

                    a(
                        {
                            href: '#why'
                        },
                        'Why Jetz'
                    ),

                    a(
                        {
                            href: '#features'
                        },
                        'Features'
                    ),

                    a(
                        {
                            href: '#examples'
                        },
                        'Examples'
                    ),

                    a(
                        {
                            href: '#special'
                        },
                        'Compare'
                    ),

                    a(
                        {
                            href: '#benchmark'
                        },
                        'Benchmark'
                    ),

                    a(
                        {
                            href: '#chart'
                        },
                        'Chart'
                    ),

                    a(
                        {
                            href: '#start'
                        },
                        'Get started'
                    ),

                    link(
                        'playground',

                        a(
                            {
                                href: '#playground'
                            },
                            'Playground'
                        )
                    ),

                    button(
                        {
                            class: 'jetz-theme-toggle',
                            // callbacks, not values: the label has to follow the
                            // toggle. Read through `.value` on purpose - `.getValue()`
                            // is the untracked read, so the computed behind these
                            // attributes would never re-run.
                            'aria-label': () => storedTheme.value === THEME_DARK
                                ? 'Beralih ke tema terang'
                                : 'Beralih ke tema gelap',
                            title: () => storedTheme.value === THEME_DARK
                                ? 'Tema terang'
                                : 'Tema gelap',
                            onclick() {
                                // an event handler is not a tracked context, so the
                                // cheap untracked read is the right one here
                                storedTheme.setState(
                                    storedTheme.getValue() === THEME_DARK ? THEME_LIGHT : THEME_DARK
                                );
                            }
                        },

                        // one branch is rendered at a time, so `ifElse()` swaps the
                        // glyph instead of stacking both
                        ifElse(
                            () => storedTheme.getValue() === THEME_DARK,

                            () => span('☀'),

                            () => span('☾')
                        )
                    ),

                    a(
                        {
                            class: 'jetz-nav-github',
                            href: 'https://github.com/devarofi/jetz',
                            target: '_blank',
                            rel: 'noreferrer'
                        },
                        'GitHub',
                        span('↗')
                    )
                )
            )
        ),


        // =====================================================================
        // HERO
        // =====================================================================

        section(
            {
                class: 'jetz-hero'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-hero-grid`,

                    // Hero copy
                    div(
                        css`jetz-hero-col`,

                        div(
                            css`jetz-hero-copy`,

                            div(
                                css`jetz-eyebrow`,

                                span(
                                    css`jetz-eyebrow-dot`
                                ),

                                'A small JavaScript UI framework'
                            ),

                            h1(
                                'Build interfaces.',

                                span(
                                    css`jetz-gradient-text`,
                                    'Stay in JavaScript.'
                                )
                            ),

                            p(
                                css`jetz-tagline`,

                                'Javascript, Compose.'
                            ),

                            p(
                                css`jetz-hero-description`,

                                'Jetz gives you reactive state, components, routing and events without forcing your JavaScript into another language.'
                            ),

                            div(
                                css`jetz-hero-actions`,

                                link(
                                    'playground',

                                    a(
                                        {
                                            class: 'jetz-btn-primary',
                                            href: '#playground'
                                        },

                                        'Try Jetz',

                                        span('→')
                                    )
                                ),

                                a(
                                    {
                                        class: 'jetz-btn-secondary',
                                        href: 'https://github.com/devarofi/jetz',
                                        target: '_blank',
                                        rel: 'noreferrer'
                                    },

                                    'View on GitHub'
                                )
                            ),

                            div(
                                css`jetz-hero-points`,

                                span(
                                    '✓',
                                    ' No JSX'
                                ),

                                span(
                                    '✓',
                                    ' Reactive state'
                                ),

                                span(
                                    '✓',
                                    ' Plain JavaScript'
                                )
                            )
                        )
                    ),


                    // Hero code window
                    div(
                        css`jetz-hero-col`,

                        div(
                            css`jetz-hero-code`,

                            div(
                                css`jetz-window`,

                                div(
                                    css`jetz-window-bar`,

                                    div(
                                        css`jetz-window-dots`,

                                        span(),
                                        span(),
                                        span()
                                    ),

                                    small(
                                        'hello-jetz.js'
                                    ),

                                    span(
                                        css`jetz-live-badge`,
                                        'LIVE'
                                    )
                                ),

                                pre(
                                    css`jetz-hero-code-content`,

                                    code(
                                        css`language-javascript`,

                                        highlight(heroCode)
                                    )
                                ),

                                div(
                                    css`jetz-window-status`,

                                    span(
                                        css`jetz-status-dot`
                                    ),

                                    'Reactive by design'
                                )
                            )
                        )
                    )
                ),


                // Hero bottom note
                div(
                    css`jetz-hero-note`,

                    span('Built with familiar JavaScript primitives.'),

                    span(css`jetz-note-arrow`, '↓')
                )
            )
        ),


        // =====================================================================
        // WHY
        // =====================================================================

        section(
            {
                id: 'why',
                class: 'jetz-section jetz-section-white'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-section-heading text-center`,

                    span(
                        css`jetz-label`,
                        'WHY JETZ'
                    ),

                    h2(
                        'A framework that stays out of your way.'
                    ),

                    p(
                        'Learn the fundamentals quickly, then keep using the same simple ideas as your application grows.'
                    )
                ),


                div(
                    css`jetz-card-grid`,

                    div(
                        css`jetz-card-col`,

                        article(
                            css`jetz-benefit-card`,

                            div(
                                css`jetz-card-number`,
                                '01'
                            ),

                            div(
                                css`jetz-card-icon`,
                                '{}'
                            ),

                            h3(
                                'Just JavaScript'
                            ),

                            p(
                                'Write UI with functions, objects, arrays and events. No JSX or template language required.'
                            )
                        )
                    ),


                    div(
                        css`jetz-card-col`,

                        article(
                            css`jetz-benefit-card`,

                            div(
                                css`jetz-card-number`,
                                '02'
                            ),

                            div(
                                css`jetz-card-icon`,
                                '↻'
                            ),

                            h3(
                                'Reactive by default'
                            ),

                            p(
                                'State changes flow directly into the UI so your code stays close to the behavior it controls.'
                            )
                        )
                    ),


                    div(
                        css`jetz-card-col`,

                        article(
                            css`jetz-benefit-card`,

                            div(
                                css`jetz-card-number`,
                                '03'
                            ),

                            div(
                                css`jetz-card-icon`,
                                '→'
                            ),

                            h3(
                                'Small enough to understand'
                            ),

                            p(
                                'Jetz focuses on the core building blocks you actually use when creating frontend applications.'
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // FEATURES
        // =====================================================================

        section(
            {
                id: 'features',
                class: 'jetz-section jetz-section-soft'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-split-grid`,

                    div(
                        css`jetz-split-col`,

                        span(
                            css`jetz-label`,
                            'CORE CONCEPTS'
                        ),

                        h2(
                            'Everything starts with a few simple ideas.'
                        ),

                        p(
                            css`jetz-section-lead`,

                            'Instead of learning dozens of APIs, learn a small set of primitives and combine them to build your application.'
                        ),

                        ul(
                            css`jetz-concept-list`,

                            li(
                                strong('State'),
                                span('Keep values reactive with stateOf() and rememberOf().')
                            ),

                            li(
                                strong('Components'),
                                span('Compose UI with ordinary JavaScript functions.')
                            ),

                            li(
                                strong('Events'),
                                span('Connect user actions directly to application logic.')
                            ),

                            li(
                                strong('Lists'),
                                span('Render reactive collections with listOf() and loop().')
                            ),

                            li(
                                strong('Conditional'),
                                span('Show the active branch with _if(), _else, and ifElse().')
                            ),

                            li(
                                strong('Routing'),
                                span('Create application pages without unnecessary complexity.')
                            )
                        )
                    ),


                    div(
                        css`jetz-split-col`,

                        div(
                            css`jetz-concept-visual`,

                            div(
                                css`jetz-concept-window`,

                                div(
                                    css`jetz-concept-window-top`,

                                    span('jetz.js'),

                                    span(
                                        css`jetz-mini-badge`,
                                        'CORE'
                                    )
                                ),

                                div(
                                    css`jetz-concept-flow`,

                                    div(
                                        css`jetz-flow-item jetz-flow-state`,

                                        strong('stateOf()'),

                                        span('Store state')
                                    ),

                                    div(
                                        css`jetz-flow-arrow`,
                                        '↓'
                                    ),

                                    div(
                                        css`jetz-flow-item`,

                                        strong('Component'),

                                        span('Compose UI')
                                    ),

                                    div(
                                        css`jetz-flow-arrow`,
                                        '↓'
                                    ),

                                    div(
                                        css`jetz-flow-item jetz-flow-result`,

                                        strong('DOM'),

                                        span('Reactive output')
                                    )
                                )
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // CODE EXPLORER
        // =====================================================================

        section(
            {
                id: 'examples',
                class: 'jetz-section jetz-section-white'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-section-heading`,

                    span(
                        css`jetz-label`,
                        'LEARN BY DOING'
                    ),

                    h2(
                        'See how little code you need.'
                    ),

                    p(
                        'Explore the basic building blocks and get a feel for the programming model before reading the documentation.'
                    )
                ),


                div(
                    css`jetz-code-promo`,

                    div(
                        css`jetz-code-promo-copy`,

                        strong('Run this pattern live.'),

                        span(
                            'The playground contains the same building blocks as runnable examples.'
                        )
                    ),

                    link(
                        'playground',

                        a(
                            {
                                class: 'jetz-code-run-link',
                                href: '#playground'
                            },

                            'Open Playground →'
                        )
                    )
                ),


                div(
                    css`jetz-code-explorer`,

                    div(
                        css`jetz-code-tabs`,

                        tabButton('state', 'State'),

                        tabButton('components', 'Components'),

                        tabButton('routing', 'Routing'),

                        tabButton('events', 'Events'),

                        tabButton('lists', 'Lists'),

                        tabButton('conditional', 'Conditional')
                    ),

                    div(
                        css`jetz-code-content`,

                        examplePanel('state'),

                        examplePanel('components'),

                        examplePanel('routing'),

                        examplePanel('events'),

                        examplePanel('lists'),

                        examplePanel('conditional')
                    )
                )
            )
        ),


        // =====================================================================
        // PLAYGROUND PROMO
        // =====================================================================

        section(
            {
                id: 'playground',
                class: 'jetz-section jetz-section-dark'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-playground-promo`,

                    div(
                        css`jetz-playground-promo-copy`,

                        span(
                            css`jetz-label jetz-label-light`,
                            'LIVE PLAYGROUND'
                        ),

                        h2(
                            'Stop reading. Start running.'
                        ),

                        p(
                            'The playground ships with the framework: pick a working example, change the code, and see the result instantly. No setup, no build step.'
                        ),

                        div(
                            css`jetz-playground-steps`,

                            span('Write code → Run → See result → Modify → Try again')
                        ),

                        div(
                            css`jetz-hero-actions`,

                            link(
                                'playground',

                                a(
                                    {
                                        class: 'jetz-btn-primary jetz-btn-light',
                                        href: '#playground'
                                    },

                                    'Try Jetz',

                                    span('→')
                                )
                            )
                        )
                    ),

                    div(
                        css`jetz-playground-promo-visual`,

                        div(
                            css`jetz-window`,

                            div(
                                css`jetz-window-bar`,

                                div(
                                    css`jetz-window-dots`,

                                    span(),
                                    span(),
                                    span()
                                ),

                                small(
                                    'playground / main.js'
                                ),

                                span(
                                    css`jetz-live-badge`,
                                    'LIVE'
                                )
                            ),

                            pre(
                                css`jetz-hero-code-content`,

                                code(
                                    css`language-javascript`,

                                    highlight(playgroundSnippet)
                                )
                            ),

                            div(
                                css`jetz-window-status`,

                                span(
                                    css`jetz-status-dot`
                                ),

                                'Preview: edit the code, press Run, change inputs live'
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // DEVELOPER JOURNEY
        // =====================================================================

        section(
            {
                id: 'journey',
                class: 'jetz-section jetz-section-white'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-section-heading text-center`,

                    span(
                        css`jetz-label`,
                        'FROM FIRST TRY TO REAL APP'
                    ),

                    h2(
                        'Start small. Grow naturally.'
                    ),

                    p(
                        'The same primitives you use for your first counter can become the foundation of a larger frontend application.'
                    )
                ),


                div(
                    css`jetz-step-grid`,

                    div(
                        css`jetz-step-col`,

                        div(
                            css`jetz-journey-card`,

                            span('01'),

                            strong('Learn'),

                            p(
                                'Understand state, components and events in minutes.'
                            )
                        )
                    ),

                    div(
                        css`jetz-step-col`,

                        div(
                            css`jetz-journey-card`,

                            span('02'),

                            strong('Compose'),

                            p(
                                'Turn small functions into reusable application components.'
                            )
                        )
                    ),

                    div(
                        css`jetz-step-col`,

                        div(
                            css`jetz-journey-card`,

                            span('03'),

                            strong('Connect'),

                            p(
                                'Add routing, API calls and application behavior around your UI.'
                            )
                        )
                    ),

                    div(
                        css`jetz-step-col`,

                        div(
                            css`jetz-journey-card`,

                            span('04'),

                            strong('Build'),

                            p(
                                'Use the same concepts to create complete frontend applications.'
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // EXAMPLES
        // =====================================================================

        section(
            {
                class: 'jetz-section jetz-section-soft'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-section-heading text-center`,

                    span(
                        css`jetz-label`,
                        'TRY SOMETHING REAL'
                    ),

                    h2(
                        'Not just a counter.'
                    ),

                    p(
                        'Use the same primitives to build practical applications.'
                    )
                ),


                div(
                    css`jetz-example-grid`,

                    div(
                        css`jetz-example-col`,

                        link(
                            'open-todo',

                            a(
                                {
                                    href: '#open-todo',
                                    class: 'welcome-example-link'
                                },

                                div(
                                    css`jetz-example-card`,

                                    div(
                                        css`jetz-example-icon`,
                                        '✓'
                                    ),

                                    div(
                                        css`jetz-example-content`,

                                        strong(
                                            'Task List'
                                        ),

                                        span(
                                            'Reactive CRUD, filtering and live counters'
                                        )
                                    ),

                                    span(
                                        css`jetz-example-arrow`,
                                        '→'
                                    )
                                )
                            )
                        )
                    ),

                    div(
                        css`jetz-example-col`,

                        link(
                            'calculator',

                            a(
                                {
                                    href: '#calculator',
                                    class: 'welcome-example-link'
                                },

                                div(
                                    css`jetz-example-card`,

                                    div(
                                        css`jetz-example-icon`,
                                        '='
                                    ),

                                    div(
                                        css`jetz-example-content`,

                                        strong(
                                            'Calculator'
                                        ),

                                        span(
                                            'Reactive expressions and application state'
                                        )
                                    ),

                                    span(
                                        css`jetz-example-arrow`,
                                        '→'
                                    )
                                )
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // SPECIAL
        // =====================================================================

        section(
            {
                id: 'special',
                class: 'jetz-section jetz-section-white'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-section-heading text-center`,

                    span(
                        css`jetz-label`,
                        'SPECIAL BY DESIGN'
                    ),

                    h2(
                        'Composable first, instead of composable too.'
                    ),

                    p(
                        'Jetz keeps what makes a modern UI framework productive - reactive state, components, routing - and leaves out the parts that move your code into another language or behind a compiler.'
                    )
                ),


                div(
                    css`jetz-compare`,

                    compareHead(SPECIAL_LABELS),

                    compareRow(
                        'Authoring',
                        'Plain JavaScript functions: div(), button(), p()',
                        'JSX, .vue or .svelte files that must be compiled first'
                    ),

                    compareRow(
                        'Build step',
                        'Nothing extra for syntax - standard ES modules',
                        'Babel, SWC or a TypeScript JSX transform'
                    ),

                    compareRow(
                        'Rendering',
                        'State updates the exact bound text node or attribute',
                        'Virtual-DOM diffing on every state change'
                    ),

                    compareRow(
                        'Reactivity',
                        'stateOf(), computed() and effect() track dependencies automatically',
                        'Manual dependency arrays and memoization rules'
                    ),

                    compareRow(
                        'Lists',
                        'loop(list, keyFn, renderFn) recycles keyed elements',
                        'Framework-specific key props and helper components'
                    ),

                    compareRow(
                        'App features',
                        'Router, route guards, session state and dispatcher included',
                        'Assembled from separate ecosystem packages'
                    )
                ),


                div(
                    css`jetz-fit-grid`,

                    div(
                        css`jetz-fit-card`,

                        strong(
                            'Use Jetz when you want...'
                        ),

                        ul(
                            li(
                                'Interactive web applications and SPAs with routing and lifecycle.'
                            ),

                            li(
                                'Dashboards and internal tools without a heavy toolchain.'
                            ),

                            li(
                                'JavaScript-first frontends built from small composable functions.'
                            ),

                            li(
                                'Small interactive interfaces where direct DOM updates matter.'
                            )
                        )
                    ),

                    div(
                        css`jetz-fit-card jetz-fit-card-alt`,

                        strong(
                            'Reach for something else when...'
                        ),

                        ul(
                            li(
                                'Your team is required to write JSX or TSX.'
                            ),

                            li(
                                'You are shipping a content-heavy static site with no interactivity, where plain HTML or a static site generator is enough.'
                            )
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // BENCHMARK
        // =====================================================================

        section(
            {
                id: 'benchmark',
                class: 'jetz-section jetz-section-soft'
            },

            div(
                {
                    class: 'container'
                },

                // -- header ----------------------------------------------------

                div(
                    css`jetz-section-heading text-center`,

                    div(
                        css`jetz-eyebrow`,

                        span(
                            css`jetz-eyebrow-dot`
                        ),

                        'BENCHMARK & PERFORMANCE'
                    ),

                    h2(
                        'Scale ',

                        span(
                            css`jetz-gradient-text jetz-bench-figure`,

                            benchmark.rows
                        ),

                        ' Data Without Memory Compromise'
                    ),

                    p(
                        'Built on a pure Fine-Grained Signals architecture. No Virtual DOM overhead, no memory leaks, and extremely RAM-efficient.'
                    )
                ),


                // -- key metric cards ------------------------------------------

                div(
                    css`jetz-card-grid`,

                    metrics.map(metric => div(
                        css`jetz-card-col`,

                        metricCard(metric)
                    ))
                ),


                // -- measured proof strip -------------------------------------

                div(
                    css`jetz-bench-proof`,

                    div(
                        css`jetz-bench-proof-item`,

                        strong(
                            `${benchmark.heapMb} MB`
                        ),

                        span('JS Heap after GC')
                    ),

                    div(
                        css`jetz-bench-proof-item`,

                        strong(
                            `${benchmark.savingPercent}%`
                        ),

                        span('Lighter than the previous version')
                    ),

                    div(
                        css`jetz-bench-proof-item`,

                        strong(
                            `${benchmark.mountPerRowMs} ms`
                        ),

                        span(`Per row to mount ${benchmark.pageSize} rows`)
                    ),

                    div(
                        css`jetz-bench-proof-item`,

                        strong(
                            benchmark.sweepCycles
                        ),

                        span('Stable pagination cycles')
                    )
                ),

                p(
                    css`jetz-bench-source`,
                    `Measured in Chrome DevTools against the ${benchmark.rows} reactive row stress test. Footprint of ${benchmark.heapMb} MB (post-GC) versus ${benchmark.heapBeforeMb.toLocaleString('en-US')} MB before the memory work, with ${benchmark.detachedNodes} detached DOM elements left behind.`
                ),


                // -- comparison table -----------------------------------------

                div(
                    css`jetz-compare`,

                    compareHead(BENCH_LABELS),

                    compareRow(
                        'Reactivity Architecture',
                        'Fine-Grained Direct DOM',
                        'Virtual DOM Diffing',
                        BENCH_LABELS
                    ),

                    compareRow(
                        'Single Row Update',
                        `${benchmark.rowUpdateMs} ms (Near Instant)`,
                        'Requires a component re-render (tens of ms)',
                        BENCH_LABELS
                    ),

                    compareRow(
                        'Memory Cleanup (Unmount)',
                        'Automatic Lifecycle & Subscription Cleanup',
                        'Depends on hooks/GC overhead',
                        BENCH_LABELS
                    ),

                    compareRow(
                        `Memory Footprint (${benchmark.rows} items)`,
                        `Ultra Lightweight (${benchmark.heapMb} MB)`,
                        'High (~300MB - 1GB+)',
                        BENCH_LABELS
                    ),

                    compareRow(
                        'Detached DOM Nodes',
                        `${benchmark.detachedNodes} - cleaned up automatically`,
                        'Must be watched by hand',
                        BENCH_LABELS
                    ),

                    compareRow(
                        'Sweep Stability',
                        `Stable across ${benchmark.sweepCycles} cycles`,
                        'Heap grows with pagination',
                        BENCH_LABELS
                    )
                ),


                // -- call to action -------------------------------------------

                div(
                    css`jetz-cta-actions`,

                    a(
                        {
                            class: 'jetz-btn-primary',
                            href: '/stress.html'
                        },

                        'Try the Stress Test Demo',

                        span('→')
                    ),

                    a(
                        {
                            class: 'jetz-btn-secondary',
                            href: 'https://github.com/devarofi/jetz#7-keyed-list-reconciliation-loop',
                            target: '_blank',
                            rel: 'noreferrer'
                        },

                        'Read the Reconciler Docs',

                        span('↗')
                    )
                )
            )
        ),


        // =====================================================================
        // PERFORMANCE CHART
        // =====================================================================

        section(
            {
                id: 'chart',
                class: 'jetz-section'
            },

            div(
                {
                    class: 'container'
                },

                // -- header ----------------------------------------------------

                div(
                    css`jetz-section-heading text-center`,

                    div(
                        css`jetz-eyebrow`,

                        span(
                            css`jetz-eyebrow-dot`
                        ),

                        'BENCHMARK & SPEED SPECTRUM'
                    ),

                    h2('Performa Kelas Atas Tanpa Virtual DOM Overhead'),

                    p(
                        'Lihat bagaimana arsitektur Fine-Grained Direct DOM Jetz mengungguli framework berbasis Virtual DOM dalam kecepatan dan efisiensi memori.'
                    )
                ),


                // -- metric tabs ------------------------------------------------

                div(
                    {
                        class: 'jetz-chart-tabs',
                        role: 'tablist'
                    },

                    ...CHART_TABS.map(tab => chartTab(tab.key, tab.label))
                ),


                // -- the bars ---------------------------------------------------

                ...CHART_TABS.map(tab => chartPanel(tab.key)),


                // -- methodology ----------------------------------------------

                p(
                    css`jetz-bench-source`,

                    '* Dites menggunakan Chrome DevTools pada Intel i7/M-Series, 50.000 dataset reaktif, 500 baris DOM aktif. Benchmark dilakukan setelah memicu Garbage Collector (Post-GC). Panjang bar diskalakan terhadap framework terlambat di tiap metrik, dengan lebar minimum agar hasil 0.00 ms tetap terlihat.'
                ),

                a(
                    {
                        class: 'jetz-chart-method-link',
                        href: '/stress.html'
                    },

                    'Lihat Methodologi & Stress Test Interactive Demo',

                    span('→')
                )
            )
        ),


        // =====================================================================
        // CTA
        // =====================================================================

        section(
            {
                id: 'start',
                class: 'jetz-cta'
            },

            div(
                {
                    class: 'container'
                },

                div(
                    css`jetz-cta-inner`,

                    div(
                        css`jetz-cta-logo`,

                        img(
                            src(logo),
                            alt`Jetz`,
                            width`54`
                        )
                    ),

                    span(
                        css`jetz-label jetz-label-light`,
                        'READY TO BUILD?'
                    ),

                    h2(
                        'Your next frontend can start here.'
                    ),

                    p(
                        'Install Jetz, write a few lines of JavaScript, and see where it takes you. Or skip setup and run working code now.'
                    ),

                    div(
                        css`jetz-cta-actions`,

                        link(
                            'playground',

                            a(
                                {
                                    class: 'jetz-btn-primary jetz-btn-light',
                                    href: '#playground'
                                },

                                'Try Jetz',

                                span('→')
                            )
                        ),

                        a(
                            {
                                class: 'jetz-cta-link',
                                href: 'https://github.com/devarofi/jetz',
                                target: '_blank',
                                rel: 'noreferrer'
                            },

                            'Explore the source ↗'
                        )
                    )
                )
            )
        ),


        // =====================================================================
        // FOOTER
        // =====================================================================

        footer(
            css`jetz-footer`,

            div(
                {
                    class:
                        'container jetz-footer-inner'
                },

                div(
                    css`jetz-footer-brand`,

                    img(
                        src(logo),
                        alt`Jetz`,
                        width`24`
                    ),

                    strong('jetz')
                ),

                span(
                    'Javascript, Compose.'
                ),

                a(
                    {
                        href: 'https://github.com/devarofi/jetz',
                        target: '_blank',
                        rel: 'noreferrer'
                    },

                    'GitHub ↗'
                )
            )
        )
    );
}
