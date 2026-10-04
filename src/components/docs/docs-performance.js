import { Component, batch, computed, defer, lazy, listOf, loop, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, li, p, span, ul } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const BTN = css`mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950`;

export class DocsPerformance extends Component {
    render() {
        const rows = listOf(...Array.from({ length: 200 }, (_, i) => ({ id: i + 1, label: `Row ${i + 1}` })));
        const loading = stateOf(false);
        const status = stateOf("200 rows rendered with one bridge per text node.");
        const repaintCount = stateOf(0);
        const directory = listOf(
            { id: 1, name: "Ada", status: "active" },
            { id: 2, name: "Grace", status: "idle" }
        );
        const activeCount = stateOf(1);
        const size = stateOf(2);
        const toggleAda = () => {
            // Changing a field inside a row does not update this count automatically.
            const next = directory[0].status === "active" ? "idle" : "active";
            directory[0].status = next;
            activeCount.value = directory.filter(u => u.status === "active").length;
        };
        const lazyBuilds = stateOf(0);
        const lazyReads = stateOf(0);
        const lazyConfig = lazy(() => {
            lazyBuilds.value++;
            return { theme: "dark" };
        });
        const loadingLabel = computed(() => loading.value ? "yes" : "no");
        const lazyTheme = computed(() => lazyConfig.value.theme);

        const filterHeavy = () => {
            loading.value = true;
            status.value = "Filtering… the loading flag paints first.";
            defer(() => {
                batch(() => {
                    rows.splice(0, rows.length, ...Array.from({ length: 120 }, (_, i) => ({ id: i + 1, label: `Kept row ${i + 1}` })));
                    repaintCount.value++;
                    loading.value = false;
                    status.value = "Kept 120 rows in one deferred batch.";
                });
            }, { loadingState: loading });
        };

        return lesson("/docs/performance", "Reactivity", "Scale to large data sets",
            "These tools help when an app updates a lot of data. Group related changes with batch(), move slow work until after the browser has drawn the page with defer(), and consider shallow state for large rows of data. Start with ordinary State and lists; use these techniques when you need them.",
            lessonExample(
                'import { batch, computed, defer, listOf, loop, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, li, p, ul } from "@daevsoft/jetz/ui";\n\n' +
                'const rows = listOf(...Array.from({ length: 200 }, (_, i) => ({ id: i + 1, label: `Row ${i + 1}` })));\n' +
                'const loading = stateOf(false);\n' +
                'const status = stateOf("200 rows rendered with one bridge per text node.");\n' +
                'const repaintCount = stateOf(0);\n' +
                'const loadingLabel = computed(() => loading.value ? "yes" : "no");\n\n' +
                'const filterHeavy = () => {\n' +
                '  loading.value = true;\n' +
                '  defer(() => {\n' +
                '    batch(() => {\n' +
                '      rows.splice(0, rows.length, ...Array.from({ length: 120 }, (_, i) => ({ id: i + 1, label: `Kept row ${i + 1}` })));\n' +
                '      repaintCount.value++;\n' +
                '      loading.value = false;\n' +
                '      status.value = "Kept 120 rows in one deferred batch.";\n' +
                '    });\n' +
                '  }, { loadingState: loading });\n' +
                '};\n\n' +
                'p(status);\n' +
                'p("Shallow repaint count: ", repaintCount, " · loading: ", loadingLabel);\n' +
                'ul(loop(rows, row => row.id, row => li(row.label)));\n' +
                'button("Run deferred filter", filterHeavy);',
                div(CARD,
                    span(EYEBROW, "Deferred batch"),
                    p(css`mt-3 text-sm text-zinc-300`, status),
                    p(css`mt-1 text-xs text-zinc-500`, "Shallow repaint count: ", repaintCount, " · loading: ", loadingLabel),
                    div(css`mt-3 max-h-44 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3`,
                        ul(css`space-y-1 text-xs text-zinc-300`, loop(rows, row => row.id, row => li(row.label)))
                    ),
                    button({ type: "button", onclick: filterHeavy }, BTN, "Run deferred filter")
                ),
                "The button waits for the next browser draw before filtering the 200 rows. defer() shows the loading state, and batch() replaces the list and updates the status together. Click the button to keep the first 120 rows."
            ),
            div(css`mt-8 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "batch()"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Put several State or list changes inside batch(). Jetz applies their updates together instead of processing each one separately. This is useful when a single action changes several values.")
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "defer()"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "defer() waits until the browser has had a chance to draw before running a task. You can pass a loading State; Jetz turns it on while the task is pending and turns it off when the task finishes.")
                )
            ),
            div(css`mt-4 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Shallow rows"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Shallow-state helpers avoid wrapping every field of a large object in its own State. This can reduce work for table-like data, but you must tell Jetz when a row changes. Use regular stateOf() unless you have measured a need for this.")
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Lazy values"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "lazy() waits to run a calculation until you first read its value, then keeps that result. Keyed loop() helps Jetz match list items by ID when the list changes.")
                )
            ),
            div(css`mt-4`, lessonExample(
                'import { listOf, loop, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, li, p, ul } from "@daevsoft/jetz/ui";\n\n' +
                'const directory = listOf(\n' +
                '  { id: 1, name: "Ada", status: "active" },\n' +
                '  { id: 2, name: "Grace", status: "idle" }\n' +
                ');\n' +
                'const activeCount = stateOf(1);\n' +
                'const size = stateOf(2);\n\n' +
                'const toggleAda = () => {\n' +
                '  // Changing a field inside a row does not update this count automatically.\n' +
                '  const next = directory[0].status === "active" ? "idle" : "active";\n' +
                '  directory[0].status = next;\n' +
                '  activeCount.value = directory.filter(u => u.status === "active").length;\n' +
                '};\n\n' +
                'p("Active: ", activeCount, " of ", size);\n' +
                'ul(loop(directory, u => u.id, u => li(`${u.name} (${u.status})`)));\n' +
                'button("Flip Ada status", toggleAda);',
                div(CARD,
                    span(EYEBROW, "Keyed rows"),
                    p(css`mt-3 text-sm text-zinc-300`, "Active: ", activeCount, " of ", size),
                    div(css`mt-3`,
                        ul(css`space-y-1 text-xs text-zinc-300`, loop(directory, u => u.id, u => li(`${u.name} (${u.status})`)))
                    ),
                    button({
                        type: "button",
                        onclick: toggleAda,
                    }, BTN, "Flip Ada status")
                ),
                "The list holds two people, each with an id used as its key. Clicking the button changes Ada's status and recalculates activeCount. Because the status is a plain field, the example updates the separate count State explicitly."
            )),
            div(css`mt-4`, lessonExample(
                'import { computed, lazy, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, p } from "@daevsoft/jetz/ui";\n\n' +
                'const lazyBuilds = stateOf(0);\n' +
                'const lazyReads = stateOf(0);\n' +
                'const lazyConfig = lazy(() => {\n' +
                '  lazyBuilds.value++;\n' +
                '  return { theme: "dark" };\n' +
                '});\n' +
                'const lazyTheme = computed(() => lazyConfig.value.theme);\n\n' +
                'p("Theme: ", lazyTheme, " · built ", lazyBuilds, " time(s) · reads ", lazyReads);\n' +
                'button("Read lazy value", () => {\n' +
                '  lazyConfig.value.theme; // initializer runs once\n' +
                '  lazyReads.value++;      // pure reads are free\n' +
                '});',
                div(CARD,
                    span(EYEBROW, "lazy()"),
                    p(css`mt-3 text-sm text-zinc-300`, "Theme: ", lazyTheme, " · built ", lazyBuilds, " time(s) · reads ", lazyReads),
                    button({
                        type: "button",
                        onclick: () => { lazyConfig.value.theme; lazyReads.value++; },
                    }, BTN, "Read lazy value")
                ),
                "lazy() waits until lazyConfig.value is first read before building the configuration. It then reuses the same result. computed() reads its theme, and the counters show how often the configuration was built and the value was read."
            )),
        );
    }
}
