import { Component, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

export class DocsQuickStart extends Component {
    render() {
        const count = stateOf(0);

        return lesson("/docs/quick-start", "Getting started", "Start with a tiny app",
            "Follow the example to create a value, show it on the page, and change it with a button. Jetz updates the displayed count for you.",
            div(css`mb-6 rounded-xl border border-zinc-800 bg-[#0d0d10] p-4`,
                p(css`mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500`, "Install"),
                p(css`font-mono text-sm text-zinc-200`, "npm install @daevsoft/jetz"),
                p(css`mt-2 font-mono text-sm text-zinc-500`, "# or pnpm add @daevsoft/jetz")
            ),
            lessonExample(
                'import { Jetz, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, div, h2, p } from "@daevsoft/jetz/ui";\n\n' +
                'const count = stateOf(0);\n\n' +
                'Jetz.mount(\n' +
                '  div(\n' +
                '    h2("A counter"),\n' +
                '    p("Clicks: ", count),\n' +
                '    button("Increment", {\n' +
                '      onclick: () => count.value++\n' +
                '    })\n' +
                '  ),\n' +
                '  "#app"\n' +
                ');',
                div(css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                    span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Reactive counter"),
                    h2(css`mt-3 text-xl font-semibold text-white`, "Clicks: ", count),
                    p(css`mt-1 text-sm text-zinc-400`, "The displayed number changes when its State value changes."),
                    button({
                        type: "button",
                        onclick: () => { count.value++; },
                    }, css`mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300`, "Increment")
                ),
                "stateOf(0) stores the starting count. The p() element displays that State, and the button's onclick function increases it when clicked. Jetz.mount() creates the page inside the #app element."
            )
        );
    }
}
