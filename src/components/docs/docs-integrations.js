import { Dispatcher, computed, createList, effect, html, listOf, loop, range, stateOf } from "../../lib/jetz.js";
import { JetzSession } from "../../lib/jetz-session.js";
import { button, css, div, find, h2, inputText, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const FIELD = css`mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`;

export function DocsIntegrations() {
    const session = new JetzSession({ draft: "" });
    const draft = stateOf(session.get("draft", ""));
    const draftLabel = computed(() => draft.value || "(empty)");
    effect(() => { session.set("draft", draft.value); });
    const utilLog = stateOf("Helpers run against this page.");
    const busLog = stateOf("No event dispatched yet.");
    const bus = new Dispatcher((action, payload) => {
        busLog.value = `${action}: ${payload.title}`;
    });
    return lesson("/docs/integrations", "Application", "Save data and use browser helpers",
        "JetzSession saves values in the browser's sessionStorage, so they can be read again during the same browser session. This page also introduces helpers for arrays, finding elements, adding scripts, and sending actions between parts of an app. Try each live example before using a helper in your own project.",
        lessonExample(
            'import { computed, effect, stateOf } from "@daevsoft/jetz";\n' +
            'import { JetzSession } from "@daevsoft/jetz/session";\n' +
            'import { button, div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
            'const session = new JetzSession({ draft: "" });\n' +
            'const draft = stateOf(session.get("draft", ""));\n' +
            'const draftLabel = computed(() => draft.value || "(empty)");\n' +
            'effect(() => session.set("draft", draft.value));\n\n' +
            'div(\n' +
            '  inputText({ bind: draft, placeholder: "Type a draft", "aria-label": "Session draft" }),\n' +
            '  p("Saved draft: ", draftLabel),\n' +
            '  button("Forget", {\n' +
            '    onclick: () => { session.destroy(); draft.value = ""; }\n' +
            '  })\n' +
            '); // reload keeps the text via sessionStorage',
            div(CARD,
                span(EYEBROW, "JetzSession"),
                inputText({ bind: draft, placeholder: "Type a draft", "aria-label": "Session draft" }, FIELD),
                p(css`mt-3 text-sm text-zinc-300`, "Saved draft: ", draftLabel),
                button("Forget", {
                    type: "button",
                    onclick: () => { session.destroy(); draft.value = ""; },
                })
            ),
            "JetzSession reads and saves the draft in sessionStorage. The input is bound to draft, and computed() supplies fallback text when it is empty. effect() saves every change. Click Forget to remove the saved session data and clear the input."
        ),
        div(css`mt-8 grid gap-4 md:grid-cols-2`,
            div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                h2(css`text-lg font-semibold text-white`, "Share a session store"),
                p(css`mt-2 text-sm leading-7 text-zinc-400`, "sessionOf() gives you a session-backed store without adding it to the global Jetz object. This is useful when you want to import and share the store directly between files.")
            ),
            div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                h2(css`text-lg font-semibold text-white`, "DOM utilities"),
                p(css`mt-2 text-sm leading-7 text-zinc-400`, "find() and findAll() look for elements in the current page. Jetz.mount() puts an app inside a page element; Jetz.unmount() removes it and runs cleanup hooks. Jetz.style() adds CSS to the page.")
            )
        ),
        div(css`mt-4`, lessonExample(
            'import { createList, range, stateOf } from "@daevsoft/jetz";\n' +
            'import { p } from "@daevsoft/jetz/ui";\n\n' +
            'const utilLog = stateOf("Helpers run against this page.");\n\n' +
            'p("range: ", range(1, 5).join(", ")); // [1, 2, 3, 4, 5]\n' +
            'p("cards: ", createList(3, i => `card-${i}`).join(", ")); // ["card-0", "card-1", "card-2"]\n' +
            'p(utilLog);',
            div(CARD,
                span(EYEBROW, "range() + createList()"),
                p(css`mt-4 text-sm text-zinc-300`, "range: ", range(1, 5).join(", ")),
                p(css`mt-1 text-sm text-zinc-300`, "cards: ", createList(3, i => `card-${i}`).join(", ")),
                p(css`mt-3 text-xs text-zinc-500`, utilLog)
            ),
            "range(1, 5) makes an array of five numbers. createList() builds three labels by calling the provided function with each index. The p() elements show the resulting values."
        )),
        div(css`mt-4`, lessonExample(
            'import { html } from "@daevsoft/jetz";\n' +
            'import { find } from "@daevsoft/jetz/ui";\n\n' +
            'div(html("<strong>Trusted markup</strong>"));\n' +
            'p("find(\'#app\') found: ", find("#app") ? "yes" : "no");',
            div(CARD,
                span(EYEBROW, "html() + find()"),
                div(css`mt-4 text-sm text-zinc-200`, html("<strong>Trusted markup</strong>")),
                p(css`mt-3 text-xs text-zinc-500`, "find('#app') found: ", find("#app") ? "yes" : "no")
            ),
            "html() inserts the supplied HTML into the page, so only use markup you trust. find('#app') looks for an element with that id and the paragraph reports whether it exists."
        )),
        div(css`mt-4`, lessonExample(
            'import { Dispatcher, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, p } from "@daevsoft/jetz/ui";\n\n' +
            'const busLog = stateOf("No event dispatched yet.");\n' +
            'const bus = new Dispatcher((action, payload) => {\n' +
            '  busLog.value = `${action}: ${payload.title}`;\n' +
            '});\n\n' +
            'p(busLog);\n' +
            'button("Dispatch todos/add", {\n' +
            '  onclick: () => bus.dispatch("todos/add", { title: "Write docs" })\n' +
            '});',
            div(CARD,
                span(EYEBROW, "Dispatcher"),
                p(css`mt-4 text-sm text-zinc-300`, busLog),
                button("Dispatch todos/add", {
                    type: "button",
                    onclick: () => bus.dispatch("todos/add", { title: "Write docs" }),
                })
            ),
            "The Dispatcher sends the action name and payload to its handler. Clicking the button dispatches todos/add; the handler reads payload.title and writes a message to busLog, which updates the paragraph."
        )),
        div(css`mt-4`, lessonExample(
            'import { Dispatcher, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, p } from "@daevsoft/jetz/ui";\n\n' +
            '// 1. Define action types upfront — like Flux / Pinia action names\n' +
            'const ACTIONS = { REFRESH: "REFRESH", CLEAR: "CLEAR" };\n\n' +
            'const users   = stateOf([]);\n' +
            'const orders  = stateOf([]);\n' +
            'const summary = stateOf("press Refresh");\n\n' +
            'const d = new Dispatcher();\n\n' +
            '// 2. Each subscriber = a store slice; guard by action type\n' +
            'd.subscribe("users", (action) => {\n' +
            '  if (action === ACTIONS.REFRESH) users.value  = [{ id: 1 }, { id: 2 }];\n' +
            '  if (action === ACTIONS.CLEAR)   users.value  = [];\n' +
            '});\n\n' +
            'd.subscribe("orders", (action) => {\n' +
            '  if (action === ACTIONS.REFRESH) orders.value = [{ id: 10 }];\n' +
            '  if (action === ACTIONS.CLEAR)   orders.value = [];\n' +
            '});\n\n' +
            '// 3. "summary" is registered first but needs fresh data from both stores.\n' +
            '//    waitFor() forces "users" and "orders" to run before this handler reads them.\n' +
            'd.subscribe("summary", (action) => {\n' +
            '  d.waitFor(["users", "orders"]);\n' +
            '  if (action === ACTIONS.REFRESH)\n' +
            '    summary.value = `${users.value.length} user(s), ${orders.value.length} order(s)`;\n' +
            '  if (action === ACTIONS.CLEAR) summary.value = "cleared";\n' +
            '});\n\n' +
            '// 4. Dispatch a known action — readable and self-documenting\n' +
            'button("Refresh", { onclick: () => d.dispatch(ACTIONS.REFRESH) });\n' +
            'button("Clear",   { onclick: () => d.dispatch(ACTIONS.CLEAR) });\n' +
            'p(summary);',
            DispatcherFanOutDemo(),
            "Define action-type constants first (like Flux or Pinia). Each named subscriber acts as a store slice and guards with if (action === ...) before mutating state. waitFor([\"users\",\"orders\"]) guarantees the two stores run to completion before \"summary\" reads them — even though \"summary\" was registered first."
        )),
        div(css`mt-4`, lessonExample(
            'import { Dispatcher, listOf, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
            'const ACTIONS = { ADD: "ADD", REMOVE: "REMOVE" };\n\n' +
            'const todos = listOf();\n' +
            'const input = stateOf("");\n' +
            'const d = new Dispatcher();\n\n' +
            '// Payload is the second arg \u2014 destructure any shape you need\n' +
            'd.subscribe("todos", (action, payload) => {\n' +
            '  if (action === ACTIONS.ADD && payload.title.trim())\n' +
            '    todos.push({ id: Date.now(), title: payload.title.trim() });\n' +
            '  if (action === ACTIONS.REMOVE)\n' +
            '    todos.remove(todos.find(t => t.id === payload.id)[0]);\n' +
            '});\n\n' +
            '// Pass the payload as the second argument to dispatch()\n' +
            'button("Add", {\n' +
            '  onclick: () => d.dispatch(ACTIONS.ADD, { title: input.value })\n' +
            '});\n' +
            'button("\u2715", {\n' +
            '  onclick: () => d.dispatch(ACTIONS.REMOVE, { id: todo.id })\n' +
            '});',
            DispatcherPayloadDemo(),
            "dispatch(action, payload) passes any value as the second argument. The subscriber receives it as (action, payload) \u2014 an object, string, number, whatever fits. Multiple extra args are also supported: dispatch(action, a, b) \u2192 handler(action, a, b)."
        )),
        ...[ComponentDocsNote()]
    );
}

function DispatcherFanOutDemo() {
    const ACTIONS = { REFRESH: "REFRESH", CLEAR: "CLEAR" };

    const users   = stateOf([]);
    const orders  = stateOf([]);
    const summary = stateOf("press Refresh");

    const d = new Dispatcher();

    d.subscribe("users", (action) => {
        if (action === ACTIONS.REFRESH) users.value  = [{ id: 1 }, { id: 2 }];
        if (action === ACTIONS.CLEAR)   users.value  = [];
    });

    d.subscribe("orders", (action) => {
        if (action === ACTIONS.REFRESH) orders.value = [{ id: 10 }];
        if (action === ACTIONS.CLEAR)   orders.value = [];
    });

    d.subscribe("summary", (action) => {
        d.waitFor(["users", "orders"]);
        if (action === ACTIONS.REFRESH)
            summary.value = `${users.value.length} user(s), ${orders.value.length} order(s)`;
        if (action === ACTIONS.CLEAR)
            summary.value = "cleared";
    });

    return div(CARD,
        span(EYEBROW, "Dispatcher — fan-out + waitFor()"),
        p(css`mt-4 text-sm text-zinc-300`, summary),
        div(css`mt-3 flex gap-2`,
            button("Refresh", { type: "button", onclick: () => d.dispatch(ACTIONS.REFRESH) }),
            button("Clear",   { type: "button", onclick: () => d.dispatch(ACTIONS.CLEAR) })
        )
    );
}

function DispatcherPayloadDemo() {
    const ACTIONS = { ADD: "ADD", REMOVE: "REMOVE" };
    const todos = listOf();
    const input = stateOf("");
    const log   = stateOf("Add a task above.");

    const d = new Dispatcher();
    d.subscribe("todos", (action, payload) => {
        if (action === ACTIONS.ADD && payload.title.trim()) {
            todos.push({ id: Date.now(), title: payload.title.trim() });
            input.value = "";
            log.value = `Added: "${payload.title.trim()}"  (${todos.size} total)`;
        }
        if (action === ACTIONS.REMOVE) {
            const item = todos.find(t => t.id === payload.id)[0];
            if (item) { todos.remove(item); log.value = `Removed: "${item.title}"`; }
        }
    });

    return div(CARD,
        span(EYEBROW, "dispatch() with payload"),
        div(css`mt-4 flex gap-2`,
            inputText({ bind: input, placeholder: "Task title…", "aria-label": "Task title" },
                css`flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
            button("Add", {
                type: "button",
                onclick: () => d.dispatch(ACTIONS.ADD, { title: input.value }),
            })
        ),
        div(css`mt-3 space-y-1`,
            loop(todos, todo => div(css`flex items-center justify-between text-sm text-zinc-300`,
                p(css`flex-1`, todo.title),
                button("✕", {
                    type: "button",
                    onclick: () => d.dispatch(ACTIONS.REMOVE, { id: todo.id }),
                })
            ))
        ),
        p(css`mt-3 text-xs text-zinc-500`, log)
    );
}

function ComponentDocsNote() {
    return div(css`mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5`,
        h2(css`text-base font-semibold text-white`, "Prototype helpers"),
        p(css`mt-2 text-sm leading-7 text-zinc-300`, "For convenience, Jetz adds .last() and .take(n) to arrays, .range(to) to numbers, and .last() to NodeLists. These helpers are optional; standard JavaScript methods work too.")
    );
}
