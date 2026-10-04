import { Dispatcher, computed, createList, effect, html, range, stateOf } from "../../lib/jetz.js";
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
        ...[ComponentDocsNote()]
    );
}

function ComponentDocsNote() {
    return div(css`mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5`,
        h2(css`text-base font-semibold text-white`, "Prototype helpers"),
        p(css`mt-2 text-sm leading-7 text-zinc-300`, "For convenience, Jetz adds .last() and .take(n) to arrays, .range(to) to numbers, and .last() to NodeLists. These helpers are optional; standard JavaScript methods work too.")
    );
}
