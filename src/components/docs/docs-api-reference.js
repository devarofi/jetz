import { link } from "../../lib/jetz-router.js";
import { div, h2, p, span, css, a, ul, li } from "../../lib/jetz-ui.js";
import { codeBlock, lesson } from "./docs-layout.js";

const SECTIONS = [
    {
        title: "Reactive state",
        path: "/docs/api/state",
        items: [
            ["stateOf(value)", "Creates a value that updates the page when it changes. Read and write it with .value."],
            ["shallowStateOf(value)", "Tracks changes to the whole value, not each field inside it."],
            ["rememberOf(key, value)", "Creates a State value saved in localStorage between page reloads."],
            ["rowOf(row) / rawOf(row)", "Read row data without tracking changes to every field."],
            ["touchRow(row)", "Tell Jetz to update the display for a shallow row."],
            ["computed(fn)", "Keeps a calculated value up to date when the State it reads changes."],
            ["effect(fn)", "Runs code now and again when a State it reads changes; returns a stop function."],
            ["batch(fn)", "Group several changes so Jetz can apply them together."],
            ["listen(fn)", "Run a function for an element after Jetz creates its page element."],
        ],
    },
    {
        title: "Collections & branching",
        path: "/docs/api/collections",
        items: [
            ["listOf(...items)", "Creates a list that updates the page when items are added or removed."],
            ["sequenceOf(...items)", "Unique-value list variant."],
            ["loop(list, render)", "Shows one set of elements for each item in a list."],
            ["loop(list, keyFn, render)", "Shows list items using a stable key, such as each item's ID."],
            ["ifElse(cond, a, b?)", "Shows one result when a condition is true and another when it is false."],
            ["_if / _elseif / _else", "Show or hide blocks of content based on conditions."],
            ["createList(n, fn)", "Creates a regular array by calling a function for each item."],
            ["range(a, b) / flatMap(arr)", "Array construction and flattening helpers."],
        ],
    },
    {
        title: "Components & lifecycle",
        path: "/docs/api/components",
        items: [
            ["Component", "Base class for components that return their elements from render()."],
            ["onCreate / onMount", "Function hooks for setup and for work that starts after the component appears on the page."],
            ["onUpdate / onDestroy", "Function hooks for responding to changes and cleaning up when the component is removed."],
            ["Jetz.mount(app, el)", "Render your app inside a page element or selector."],
            ["Jetz.unmount(el)", "Remove an app and run its cleanup hooks."],
            ["Jetz.use(plugin)", "Add a router or another Jetz plugin to your app."],
            ["Jetz.style(css)", "Add a CSS stylesheet to the page."],
        ],
    },
    {
        title: "Elements, binding & utilities",
        path: "/docs/api/elements",
        items: [
            ["createElement(tag, ...)", "Create an element directly. Most apps can use helpers such as div() instead."],
            ["css`...` / css(fn)", "Static and reactive class composition."],
            ["style(obj | `...`)", "Object, template, or reactive inline styles."],
            ["bind: state", "Keep an input and a State value in sync as the user types."],
            ["html(content)", "Insert an HTML string as page elements. Only use HTML you trust."],
            ["addScript(src, opts)", "Add a script file to the page."],
            ["find / findAll", "Find the first matching element or all matching elements in the page."],
            ["defer(fn, { loadingState })", "Wait until after the next browser draw before running work; optionally show a loading State."],
            ["lazy(fn)", "Wait to calculate a value until the first time you read it."],
        ],
    },
    {
        title: "Routing, session & middleware",
        path: "/docs/api/application",
        items: [
            ["Router", "Match the browser URL to a page component and change pages without reloading."],
            ["route(path, comp)", "Show a component when the URL matches this path."],
            ["group(prefix, { routes })", "Put related routes under a shared path prefix."],
            ["link(path, element)", "Make an element navigate to another route when clicked."],
            ["asLink / asBackLink / redirect", "Event modifiers and hard navigation helpers."],
            ["Middleware / middleware()", "Check a navigation request before allowing a route to open."],
            ["JetzSession / sessionOf", "Save and load values using the browser's sessionStorage."],
            ["Dispatcher", "Send named actions to functions that have subscribed to them."],
            ["JetzDevtools / JTest", "Inspect a running app or test a component."],
        ],
    },
];

export function DocsApiReference() {
    return lesson("/docs/api-reference", "Reference", "API reference",
        "Use this page to look up a Jetz function by name. The short descriptions explain what each function is for; open the linked guide to see examples and usage details.",
        ...SECTIONS.map(section =>
            div(css`mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40`,
                div(css`border-b border-zinc-800 px-5 py-4`,
                    h2(css`text-base font-semibold text-white`,
                        link(section.path, a({ href: section.path }, css`text-white hover:text-emerald-300`, section.title)),
                        a({ href: section.path }, css`ml-3 text-xs font-medium text-emerald-300`, "Open tutorial →")
                    )
                ),
                ul(css`divide-y divide-zinc-800`,
                    ...section.items.map(([name, summary]) => li(css`flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-4`,
                        span(css`shrink-0 font-mono text-[13px] text-emerald-300`, name),
                        span(css`text-sm leading-6 text-zinc-400`, summary)
                    ))
                )
            )
        ),
        div(css`mt-2`, codeBlock(
            'import { Jetz, computed, listOf, stateOf } from "@daevsoft/jetz";\n' +
            'import { div } from "@daevsoft/jetz/ui";\n' +
            'import { Router, group, route } from "@daevsoft/jetz/router";\n' +
            'import { JetzSession } from "@daevsoft/jetz/session";\n' +
            'import { JTest } from "@daevsoft/jetz/test";',
            "javascript", "Imports.js", "JAVASCRIPT",
            "Import each tool from the package entry that provides it: core values and helpers from the main package, element helpers from /ui, routes from /router, and session, test, or DevTools tools from their own entry points."
        )),
        div(css`mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
            p(css`text-sm leading-7 text-zinc-400`, "For exact argument types and every available option, see the TypeScript declaration files under packages/jetz/src/*.d.ts or the full guide at "),
            a({ href: "https://github.com/devarofi/jetz/blob/main/README.md", target: "_blank", rel: "noreferrer" }, css`font-mono text-sm text-emerald-300 underline`, "README.md")
        )
    );
}
