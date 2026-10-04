import { a, css, div, p, span } from "../../lib/jetz-ui.js";
import { lesson } from "./docs-layout.js";

export function DocsNextSteps() {
    return lesson("/docs/next-steps", "Keep learning", "Explore the complete API",
        "You have seen the main parts of a Jetz app. Use the full guide when you need more detail about lists, component lifecycle, routing, saved data, testing, or building your app.",
        div(css`grid gap-3 sm:grid-cols-2`,
            a({
                href: "https://github.com/devarofi/jetz/blob/main/README.md",
                target: "_blank",
                rel: "noreferrer",
            }, css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-emerald-400/60`,
                span(css`font-semibold text-white`, "Full README"),
                p(css`mt-2 text-sm leading-6 text-zinc-400`, "Find longer explanations, step-by-step examples, and details for each feature.")
            ),
            a({
                href: "https://github.com/devarofi/jetz",
                target: "_blank",
                rel: "noreferrer",
            }, css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-emerald-400/60`,
                span(css`font-semibold text-white`, "GitHub repository"),
                p(css`mt-2 text-sm leading-6 text-zinc-400`, "Explore the code, working examples, tests, and changes between releases.")
            )
        )
    );
}
