import { css, div, h2, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

export function DocsComposition() {
    return lesson("/docs/composition", "Getting started", "Build views from small functions",
        "Helpers such as div(), h1(), and p() create page elements. Put elements inside other elements to build a page, and move repeated layouts into functions so you can reuse them.",
        lessonExample(
            'import { div, h2, p } from "@daevsoft/jetz/ui";\n\n' +
            'function Greeting(name) {\n' +
            '  return div(\n' +
            '    h2("Welcome"),\n' +
            '    p("Hello, ", name, "!")\n' +
            '  );\n' +
            '}\n\n' +
            'Greeting("Jetz developer");',
            div(css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Greeting component"),
                h2(css`mt-3 text-xl font-semibold text-white`, "Welcome"),
                p(css`mt-1 text-sm text-zinc-400`, "Hello, Jetz developer!")
            ),
            "Greeting() accepts a name and returns a group of elements: a heading and a paragraph. Calling Greeting with a different name creates the same layout with different text."
        )
    );
}
