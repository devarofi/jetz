import { Component, stateOf } from "../../lib/jetz.js";
import { JTest } from "../../lib/jetz-test.js";
import { button, css, div, h2, p, span } from "../../lib/jetz-ui.js";
import { codeBlock, lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const BTN = css`mt-3 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950`;

export class DocsDevtools extends Component {
    render() {
        const clicks = stateOf(0);
        const asserted = stateOf("Run the sample to let JTest click Bump.");
        // The same view factory the snippet uses; each call returns a fresh tree.
        const view = () => div(
            p("Clicks: ", clicks),
            button("Bump", {
                type: "button",
                onclick: () => { clicks.value++; },
            })
        );
        const runJTestSample = () => {
            const page = JTest.new(view());
            page.find("button").click();
            asserted.value = `JTest read: "${page.find("p").text()}"`;
        };

        return lesson("/docs/devtools", "Reference", "Inspect, test, and ship",
            "Use Jetz DevTools to inspect the elements and component lifecycle on a page. Add ?jetz-devtools to the page URL to open the inspector when the plugin is installed. Use JTest to try a component by itself. The commands at the bottom show how to install dependencies, start the app locally, and run tests.",
            lessonExample(
                'import { Jetz } from "@daevsoft/jetz";\n' +
                'import { JetzDevtools } from "@daevsoft/jetz/devtools";\n\n' +
                'Jetz.use(new JetzDevtools());\n' +
                '// open /docs?jetz-devtools to inspect the tree',
                div(CARD,
                    span(EYEBROW, "Inspector hook"),
                    p(css`mt-3 text-sm text-zinc-300`, "When DevTools is installed, its panel can show which components are on the page, when their lifecycle hooks run, and errors they report. You only add this tool when you install the DevTools plugin.")
                ),
                "Import the DevTools plugin and install it with Jetz.use(). Then add ?jetz-devtools to a page URL to open the inspector and examine the rendered component tree."
            ),
            div(css`mt-6`, lessonExample(
                'import { stateOf } from "@daevsoft/jetz";\n' +
                'import { JTest } from "@daevsoft/jetz/test";\n' +
                'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const clicks = stateOf(0);\n' +
                'const view = () => div(\n' +
                '  p("Clicks: ", clicks),\n' +
                '  button("Bump", {\n' +
                '    type: "button",\n' +
                '    onclick: () => clicks.value++\n' +
                '  })\n' +
                ');\n\n' +
                'const page = JTest.new(view());\n' +
                'page.find("button").click();\n' +
                'page.find("p").text(); // "Clicks: 1"',
                div(CARD,
                    span(EYEBROW, "JTest harness"),
                    view(),
                    button("Run JTest sample", {
                        type: "button",
                        onclick: runJTestSample,
                    }, BTN),
                    p(css`mt-3 text-xs text-zinc-500`, asserted)
                ),
                "view() builds a small counter. JTest.new() mounts it in a test page; the next lines find and click its button, then read the paragraph text to check that the count changed."
            )),
            div(css`mt-8 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Three test suites"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "pnpm test:unit runs the fast automated tests. pnpm test:smoke checks the app in a browser. pnpm test:pages checks built pages. Run pnpm test to run the full test set.")
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Rspack workflow"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "pnpm start runs the app locally. pnpm watch rebuilds it when files change. pnpm build creates the files you can deploy from the dist folder.")
                )
            ),
            div(css`mt-4`, codeBlock(
                '# install dependencies, then start the local app\n' +
                'pnpm install\n' +
                'pnpm start\n' +
                '# run the automated tests\n' +
                'pnpm test',
                "bash", "Terminal.sh", "BASH",
                "Run pnpm install once to install dependencies. Use pnpm start while developing, then run pnpm test to check the project before shipping."
            ))
        );
    }
}
