import { a, css, div, h1, p, span } from "../../lib/jetz-ui.js";
import { link } from "../../lib/jetz-router.js";
import { lesson, lessonExample } from "./docs-layout.js";

function topicLink(path, label, summary) {
    return link(path, a({ href: path },
        css`block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-emerald-400/60 hover:bg-zinc-900`,
        span(css`font-semibold text-white`, label),
        p(css`mt-2 text-sm leading-6 text-zinc-400`, summary)
    ));
}

export function DocsOverview() {
    return lesson("/docs", "Jetz documentation", "Build interactive pages with JavaScript.",
        "Jetz helps you build web pages from JavaScript functions. You create elements with helpers such as div() and p(), store changing values with stateOf(), and let Jetz update the page when those values change. You do not need JSX or a separate template language.",
        div(css`mb-8 flex flex-wrap gap-3`,
            link("/docs/quick-start", a({ href: "/docs/quick-start" }, css`rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300`, "Get started →")),
            a({
                href: "https://github.com/devarofi/jetz/blob/main/README.md",
                target: "_blank",
                rel: "noreferrer",
            }, css`rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800`, "Read the full guide")
        ),
        lessonExample(
            'import { Jetz, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, div, h1, p } from "@daevsoft/jetz/ui";\n\n' +
            'const count = stateOf(0);\n' +
            'const App = () => div(\n' +
            '  h1("Hello, Jetz"),\n' +
            '  p("Clicks: ", count),\n' +
            '  button("Increment", {\n' +
            '    onclick: () => count.value++\n' +
            '  })\n' +
            ');\n\n' +
            'Jetz.mount(App, "#app");',
            div(css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Compose · React · Ship"),
                h1(css`mt-3 text-2xl font-semibold text-white`, "Jetz"),
                p(css`mt-2 text-sm leading-6 text-zinc-400`, "Click the button to change a value and see the page update.")
            ),
            "stateOf(0) creates a value that can change. App builds a heading, the current count, and a button. Clicking the button increases count.value, and Jetz updates the displayed number. Jetz.mount() places the app inside the element with id app."
        ),
        div(css`mt-8 grid gap-3 sm:grid-cols-2`,
            topicLink("/docs/quick-start", "Quick start", "Install Jetz and mount your first reactive view."),
            topicLink("/docs/reactive-state", "Reactive state", "Keep values and the page in sync as users type or click."),
            topicLink("/docs/composition", "UI composition", "Build larger pages by combining small functions."),
            topicLink("/docs/routing", "Routing", "Show different pages for different URLs.")
        )
    );
}
