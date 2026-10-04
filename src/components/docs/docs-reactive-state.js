import { Component, computed, stateOf } from "../../lib/jetz.js";
import { css, div, inputText, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

export class DocsReactiveState extends Component {
    render() {
        const firstName = stateOf("Ada");
        const lastName = stateOf("Lovelace");
        const fullName = computed(() => `${firstName.value} ${lastName.value}`);

        return lesson("/docs/reactive-state", "Core concepts", "State stays in sync",
            "Use stateOf(value) to create a value that can change. Read or set its .value property. When you show that State in an element, Jetz updates the page after the value changes. Use computed() when you need a value calculated from other State values.",
            lessonExample(
                'import { computed, stateOf } from "@daevsoft/jetz";\n' +
                'import { div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
                'const firstName = stateOf("Ada");\n' +
                'const lastName = stateOf("Lovelace");\n' +
                'const fullName = computed(() =>\n' +
                '  `${firstName.value} ${lastName.value}`\n' +
                ');\n\n' +
                'div(\n' +
                '  inputText({ bind: firstName }),\n' +
                '  inputText({ bind: lastName }),\n' +
                '  p("Hello, ", fullName)\n' +
                ');',
                div(css`w-full max-w-sm space-y-4 rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                    span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Computed value"),
                    div(css`grid grid-cols-2 gap-3`,
                        inputText({
                            bind: firstName,
                            "aria-label": "First name",
                            placeholder: "First name",
                        }, css`min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400`),
                        inputText({
                            bind: lastName,
                            "aria-label": "Last name",
                            placeholder: "Last name",
                        }, css`min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400`)
                    ),
                    p(css`text-base font-medium text-white`, "Hello, ", fullName)
                ),
                "firstName and lastName are State values connected to the two inputs. computed() combines their current values into fullName. Because the paragraph displays fullName, editing either input recalculates and updates the greeting."
            )
        );
    }
}
