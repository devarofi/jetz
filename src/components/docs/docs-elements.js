import { Component, computed, stateOf } from "../../lib/jetz.js";
import {
    a, aria_, button, css, data_, div, h2, inputText, p, span, style,
} from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const BODY = css`mt-4 text-base text-white`;
const NOTE = css`mt-1 font-mono text-xs text-zinc-500`;

export class DocsElements extends Component {
    render() {
        // Each live preview below mirrors its sample line-for-line:
        // same helper, same attribute shape, same handler body.
        const online = stateOf(true);
        const counter = stateOf(0);
        const destination = stateOf("/tasks");
        const saving = stateOf(false);
        const title = stateOf("Quarterly report");
        const active = stateOf(true);
        const activeClass = computed(() => active.value ? "is-active" : "is-idle");
        const accent = stateOf("crimson");
        return lesson("/docs/elements", "Getting started", "Build elements and add behavior",
            "Create page elements by calling helpers such as div(), button(), and p(). Pass text or other elements as children. Add an object to set HTML attributes, and use event handlers or State values to make the page interactive. Try each example below.",
            lessonExample(
                'import { stateOf } from "@daevsoft/jetz";\n' +
                'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const online = stateOf(true);\n\n' +
                'div(\n' +
                '  { id: "status-card", role: "status" },\n' +
                '  p("Is online: ", online),\n' +
                '  button("Toggle", {\n' +
                '    onclick: () => online.value = !online.value\n' +
                '  })\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Content · attributes · changing values"),
                    div({ id: "status-card", role: "status" },
                        p(BODY, "Is online: ", online),
                        button("Toggle", {
                            type: "button",
                            onclick: () => online.value = !online.value,
                        })
                    )
                ),
                "stateOf(true) creates a value that can change. Passing online to p() displays its current value, and clicking Toggle flips it between true and false. The id and role are regular HTML attributes passed in an object."
            ),
            div(css`mt-6`, lessonExample(
                'import { stateOf } from "@daevsoft/jetz";\n' +
                'import { button, data_, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const counter = stateOf(0);\n' +
                'const destination = stateOf("/tasks");\n\n' +
                'div(\n' +
                '  { data_row_index: 2 },\n' +
                '  data_({ destination }),\n' +
                '  p("Counter: ", counter),\n' +
                '  p("data-destination: ", destination),\n' +
                '  button("Bump", {\n' +
                '    onclick: () => counter.value++\n' +
                '  })\n' +
                '); // data-row-index="2" data-destination="/tasks"',
                div(CARD,
                    span(EYEBROW, "Custom data attributes"),
                    div({ data_row_index: 2 },
                        data_({ destination }),
                        p(BODY, "Counter: ", counter),
                        p(NOTE, "data-destination: ", destination),
                        button("Bump", {
                            type: "button",
                            onclick: () => counter.value++,
                        })
                    )
                ),
                "data_() converts the destination State into a data-destination HTML attribute. The object with data_row_index creates data-row-index=\"2\". Clicking Bump increments the counter State and updates its displayed value."
            )),
            div(css`mt-6`, lessonExample(
                'import { stateOf } from "@daevsoft/jetz";\n' +
                'import { a, aria_, button, div, inputText } from "@daevsoft/jetz/ui";\n\n' +
                'const saving = stateOf(false);\n' +
                'const title = stateOf("Quarterly report");\n\n' +
                'div(\n' +
                '  button({ disabled: saving }, "Save"),\n' +
                '  a(\n' +
                '    aria_({ busy: saving }),\n' +
                '    { title: () => `Open ${title.value}` },\n' +
                '    "Status"\n' +
                '  ),\n' +
                '  inputText({ bind: title, "aria-label": "Title" }),\n' +
                '  button("Toggle save", {\n' +
                '    onclick: () => saving.value = !saving.value\n' +
                '  })\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Disabled and accessible attributes"),
                    div(css`mt-4 flex flex-wrap items-center gap-3`,
                        button({ disabled: saving }, "Save"),
                        a(
                            aria_({ busy: saving }),
                            { title: () => `Open ${title.value}` },
                            css`text-sm text-emerald-300 underline`,
                            "Status"
                        )
                    ),
                    inputText({ bind: title, "aria-label": "Title" }, css`mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
                    button("Toggle save", {
                        type: "button",
                        onclick: () => saving.value = !saving.value,
                    })
                ),
                "The Save button is disabled while saving is true. aria_() sets an accessible busy attribute, and the link title is calculated from title. inputText() keeps the title State in sync with what you type."
            )),
            div(css`mt-6`, lessonExample(
                'import { computed, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, css, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const active = stateOf(true);\n' +
                'const activeClass = computed(() => active.value ? "is-active" : "is-idle");\n\n' +
                'div(\n' +
                '  css("panel base"),\n' +
                '  css(() => active.value ? "is-active" : "is-idle"),\n' +
                '  p("Class follows state"),\n' +
                '  p(activeClass),\n' +
                '  button("Toggle", {\n' +
                '    onclick: () => active.value = !active.value\n' +
                '  })\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Classes that follow State"),
                    div(
                        css("panel base"),
                        css(() => active.value ? "is-active" : "is-idle"),
                        p(BODY, "Class follows state"),
                        p(NOTE, activeClass),
                        button("Toggle", {
                            type: "button",
                            onclick: () => active.value = !active.value,
                        })
                    )
                ),
                "activeClass is computed from the active State. The css() callback also reads active, so the element's class changes when you click Toggle. The paragraph displays the computed class name."
            )),
            div(css`mt-6`, lessonExample(
                'import { stateOf } from "@daevsoft/jetz";\n' +
                'import { button, div, p, style } from "@daevsoft/jetz/ui";\n\n' +
                'const accent = stateOf("crimson");\n\n' +
                'div(\n' +
                '  style({ color: () => accent.value }),\n' +
                '  p("This text follows the accent color."),\n' +
                '  button("Turn teal", {\n' +
                '    onclick: () => accent.value = "teal"\n' +
                '  })\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Styles that follow State"),
                    div(
                        style({ color: () => accent.value }),
                        p(css`mt-4 text-base font-semibold`, "This text follows the accent color."),
                        button("Turn teal", {
                            type: "button",
                            onclick: () => accent.value = "teal",
                        })
                    )
                ),
                "style() accepts a callback for a CSS property. It reads accent and applies that value as the text color. Clicking Turn teal changes the State, which updates the style."
            )),
            div(css`mt-6`, lessonExample(
                'import { css, div } from "@daevsoft/jetz/ui";\n\n' +
                '// className merges into class beside css()\n' +
                'div(\n' +
                '  { className: "card" },\n' +
                '  css`highlight`,\n' +
                '  "One class attribute, two sources."\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "className alias"),
                    div({ className: "card" },
                        css`highlight`,
                        css`mt-4 text-sm text-zinc-300`,
                        "One class attribute, two sources."
                    )
                ),
                "className sets the element's class attribute. css() adds another class, so both card and highlight appear together on the same element."
            )),
            div(css`mt-8 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Children and attributes"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`,
                        "You can pass text, numbers, nested elements, and attribute objects to an element helper. Add an onclick function to respond to clicks, or pass a State to show a value that can change. In Jetz, ", span(css`font-mono text-indigo-600`, "className"), " is another way to set the HTML ", span(css`font-mono text-indigo-600`, "class"), " attribute, and it works alongside css()."
                    )
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Data, ARIA, and boolean attributes"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`,
                        "Use ", span(css`font-mono text-indigo-600`, "data_row_index"), " or ", span(css`font-mono text-indigo-600`, "aria_label"), " to set HTML attributes such as data-row-index and aria-label. Boolean attributes such as disabled are present when their value is true and removed when it is false. An attribute callback updates when a State it reads changes."
                    )
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Reactive classes"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`,
                        "Use ", span(css`font-mono text-indigo-600`, "css`base ${() => ...}`"), " to keep a fixed class and add a class that changes, or ", span(css`font-mono text-indigo-600`, "css(() => ...)"), " when every class depends on State. Read a State's ", span(css`font-mono text-indigo-600`, ".value"), " inside the function so Jetz can update the class when it changes."
                    )
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Reactive styles"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`,
                        "Use the ", span(css`font-mono text-indigo-600`, "style"), " helper to set CSS properties using an object or CSS text. Give a property a function that reads State when you want that style to change with the value."
                    )
                )
            )
        );
    }
}
