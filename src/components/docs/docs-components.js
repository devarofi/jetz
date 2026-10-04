import { stateOf } from "../../lib/jetz.js";
import { css, div, h2, inputText, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

export function DocsComponents() {
    const name = stateOf("Ada");
    function Greeting({ name }) {
        return p(css`mt-2 text-sm text-zinc-300`, "Hello, ", name);
    }
    const GreetingForUser = () => Greeting({ name });

    return lesson("/docs/components", "Core concepts", "Create reusable components",
        "A component is a reusable part of a page. It can be a function or a class that extends Component. Pass a function to an element without calling it, and Jetz will call it when rendering. To give a nested function values, use a small wrapper function.",
        lessonExample(
            'import { stateOf } from "@daevsoft/jetz";\n' +
            'import { div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
            'function Greeting({ name }) {\n' +
            '  return p("Hello, ", name);\n' +
            '}\n\n' +
            'const name = stateOf("Ada");\n' +
            'const GreetingForUser = () => Greeting({ name });\n\n' +
            'div(\n' +
            '  inputText({ bind: name }),\n' +
            '  GreetingForUser\n' +
            ');',
            div(css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Function child with a value"),
                inputText({
                    bind: name,
                    placeholder: "Your name",
                    "aria-label": "Your name",
                }, css`mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
                div(GreetingForUser)
            ),
            "Greeting() receives an object containing name and returns a greeting. The wrapper function passes the name State to Greeting; passing the wrapper itself lets Jetz invoke it as a child component. Type in the field to see the greeting update."
        ),
        lessonExample(
            'import { Component } from "@daevsoft/jetz";\n' +
            'import { div, h2, p } from "@daevsoft/jetz/ui";\n\n' +
            'class WelcomeCard extends Component {\n' +
            '  render() {\n' +
            '    return div(\n' +
            '      h2("Welcome to Jetz"),\n' +
            '      p("A reusable UI component.")\n' +
            '    );\n' +
            '  }\n' +
            '}',
            div(css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "WelcomeCard"),
                h2(css`mt-3 text-xl font-semibold text-white`, "Welcome to Jetz"),
                p(css`mt-1 text-sm text-zinc-400`, "A reusable UI component.")
            ),
            "WelcomeCard is a class component. Jetz calls render() to get the elements that make up the card. Use this style when you want component data and methods stored on a class instance."
        )
    );
}
