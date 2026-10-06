import { link } from "../../lib/jetz-router.js";
import { details, div, h2, p, span, summary, css, a, ul, li } from "../../lib/jetz-ui.js";
import { codeBlock, lesson } from "./docs-layout.js";

const SECTIONS = [
    {
        title: "Reactive state",
        path: "/docs/api/state",
        items: [
            ["stateOf(value)", "Creates a value that updates the page when it changes. Read and write it with .value.",
                'import { stateOf } from "@daevsoft/jetz";\n\nconst count = stateOf(0);\ncount.value++;\nconsole.log(count.value); // 1'],
            ["shallowStateOf(value)", "Tracks changes to the whole value, not each field inside it.",
                'import { shallowStateOf } from "@daevsoft/jetz";\n\nconst settings = shallowStateOf({ compact: false });\nsettings.set({ compact: true }); // replace and notify'],
            ["rememberOf(key, value)", "Creates a State value saved in localStorage between page reloads.",
                'import { rememberOf } from "@daevsoft/jetz";\n\nconst theme = rememberOf("settings.theme", "light");\ntheme.value = "dark"; // restored after reload'],
            ["rowOf(row) / rawOf(row)", "Read row data without tracking changes to every field.",
                'import { rawOf, rowOf } from "@daevsoft/jetz";\n\nconst person = rowOf({ id: 1, name: "Ada" });\nconst plain = rawOf(person); // untracked plain read'],
            ["touchRow(row)", "Tell Jetz to update the display for a shallow row.",
                'import { rowOf, touchRow } from "@daevsoft/jetz";\n\nconst person = rowOf({ id: 1, score: 10 });\nperson.score = 11; // direct field change\ntouchRow(person); // notify the page'],
            ["computed(fn)", "Keeps a calculated value up to date when the State it reads changes.",
                'import { computed, stateOf } from "@daevsoft/jetz";\n\nconst price = stateOf(4);\nconst total = computed(() => price.value * 2);\nprice.value = 5; // total.value is now 10'],
            ["effect(fn)", "Runs code now and again when a State it reads changes; returns a stop function.",
                'import { effect, stateOf } from "@daevsoft/jetz";\n\nconst name = stateOf("Ada");\nconst stop = effect(() => {\n  console.log(`Hello, ${name.value}`);\n});\nname.value = "Grace"; // logs again\nstop();'],
            ["batch(fn)", "Group several changes so Jetz can apply them together.",
                'import { batch, stateOf } from "@daevsoft/jetz";\n\nconst first = stateOf("Ada");\nconst last = stateOf("Lovelace");\nbatch(() => {\n  first.value = "Grace";\n  last.value = "Hopper";\n}); // page updates once'],
            ["listen(fn)", "Run a function for an element after Jetz creates its page element.",
                'import { listen } from "@daevsoft/jetz";\nimport { div, p } from "@daevsoft/jetz/ui";\n\ndiv(\n  listen(parent => parent.addClass("has-content")),\n  p("Class applied after creation.")\n);'],
        ],
    },
    {
        title: "Collections & branching",
        path: "/docs/api/collections",
        items: [
            ["listOf(...items)", "Creates a list that updates the page when items are added or removed.",
                'import { listOf } from "@daevsoft/jetz";\n\nconst tasks = listOf("Read the guide");\ntasks.push("Build an example"); // page shows both'],
            ["sequenceOf(...items)", "Unique-value list variant.",
                'import { sequenceOf } from "@daevsoft/jetz";\n\nconst tags = sequenceOf("news", "design");\ntags.push("news"); // duplicate is ignored'],
            ["loop(list, render)", "Shows one set of elements for each item in a list.",
                'import { listOf, loop } from "@daevsoft/jetz";\nimport { li, ul } from "@daevsoft/jetz/ui";\n\nconst tasks = listOf("Read", "Build");\nul(loop(tasks, title => li(title)));'],
            ["loop(list, keyFn, render)", "Shows list items using a stable key, such as each item's ID.",
                'import { listOf, loop } from "@daevsoft/jetz";\nimport { li, ul } from "@daevsoft/jetz/ui";\n\nconst tasks = listOf({ id: 1, title: "Read" });\nul(loop(tasks, task => task.id, task => li(task.title)));'],
            ["ifElse(cond, a, b?)", "Shows one result when a condition is true and another when it is false.",
                'import { ifElse, stateOf } from "@daevsoft/jetz";\nimport { p } from "@daevsoft/jetz/ui";\n\nconst ready = stateOf(false);\np("Status: ", ifElse(\n  () => ready.value,\n  () => "Ready",\n  () => "Please wait"\n));'],
            ["_if / _elseif / _else", "Show or hide blocks of content based on conditions.",
                'import { _else, _elseif, _if, stateOf } from "@daevsoft/jetz";\nimport { div, p } from "@daevsoft/jetz/ui";\n\nconst status = stateOf("loading");\ndiv(\n  div(_if(() => status.value === "loading"), p("Loading...")),\n  div(_elseif(() => status.value === "error"), p("Try again")),\n  div(_else, p("Finished"))\n);'],
            ["createList(n, fn)", "Creates a regular array by calling a function for each item.",
                'import { createList } from "@daevsoft/jetz";\n\nconst labels = createList(3, index => `Page ${index + 1}`);\n// ["Page 1", "Page 2", "Page 3"]'],
            ["range(a, b) / flatMap(arr)", "Array construction and flattening helpers.",
                'import { flatMap, range } from "@daevsoft/jetz";\n\nconst pages = range(1, 3); // [1, 2, 3]\nflatMap([["ui"], ["reactivity"]]); // ["ui", "reactivity"]'],
        ],
    },
    {
        title: "Components & lifecycle",
        path: "/docs/api/components",
        items: [
            ["Component", "Base class for components that return their elements from render().",
                'import { Component, stateOf } from "@daevsoft/jetz";\nimport { button, div, p } from "@daevsoft/jetz/ui";\n\nclass Counter extends Component {\n  count = stateOf(0);\n\n  render() {\n    return div(\n      p("Count: ", this.count),\n      button("Add", { onclick: () => this.count.value++ })\n    );\n  }\n}'],
            ["onCreate / onMount", "Function hooks for setup and for work that starts after the component appears on the page.",
                'import { onCreate, onDestroy, onMount } from "@daevsoft/jetz";\n\nfunction Clock() {\n  onCreate(() => console.log("Clock created"));\n  onMount(() => console.log("Clock is on the page"));\n  onDestroy(() => console.log("Clock removed"));\n}'],
            ["onUpdate / onDestroy", "Function hooks for responding to changes and cleaning up when the component is removed.",
                'import { onDestroy, onUpdate } from "@daevsoft/jetz";\n\nfunction Clock() {\n  let timer;\n  onUpdate(() => console.log("Clock updated"));\n  onDestroy(() => clearInterval(timer));\n}'],
            ["Jetz.mount(app, el)", "Render your app inside a page element or selector.",
                'import { Jetz } from "@daevsoft/jetz";\nimport { div } from "@daevsoft/jetz/ui";\n\nJetz.mount(div(Home), "#app");'],
            ["Jetz.unmount(el)", "Remove an app and run its cleanup hooks.",
                'import { Jetz } from "@daevsoft/jetz";\n\n// When this app is no longer needed:\nJetz.unmount("#app");'],
            ["Jetz.use(plugin)", "Add a router or another Jetz plugin to your app.",
                'import { Jetz } from "@daevsoft/jetz";\nimport { Router, route } from "@daevsoft/jetz/router";\n\nconst router = new Router(route("/", Home));\nJetz.use(router);'],
            ["Jetz.style(css)", "Add a CSS stylesheet to the page.",
                'import { Jetz } from "@daevsoft/jetz";\n\nJetz.style(".notice { color: teal; }");'],
        ],
    },
    {
        title: "Elements, binding & utilities",
        path: "/docs/api/elements",
        items: [
            ["createElement(tag, ...)", "Create an element directly. Most apps can use helpers such as div() instead.",
                'import { createElement } from "@daevsoft/jetz";\n\nconst custom = createElement("section", { id: "summary" }, "Summary");'],
            ["css`...` / css(fn)", "Static and reactive class composition.",
                'import { css } from "@daevsoft/jetz/ui";\n\ndiv(\n  css`rounded border p-4`,\n  css(() => `theme-${mode.value}`)\n);'],
            ["style(obj | `...`)", "Object, template, or reactive inline styles.",
                'import { stateOf } from "@daevsoft/jetz";\nimport { div, style } from "@daevsoft/jetz/ui";\n\nconst accent = stateOf("teal");\ndiv(style({ color: () => accent.value }));'],
            ["bind: state", "Keep an input and a State value in sync as the user types.",
                'import { stateOf } from "@daevsoft/jetz";\nimport { div, inputText, p } from "@daevsoft/jetz/ui";\n\nconst name = stateOf("Ada");\ndiv(\n  inputText({ bind: name, placeholder: "Your name" }),\n  p("Hello, ", name)\n);'],
            ["html(content)", "Insert an HTML string as page elements. Only use HTML you trust.",
                'import { html } from "@daevsoft/jetz";\nimport { div } from "@daevsoft/jetz/ui";\n\ndiv(html("<strong>Welcome</strong>")); // trusted markup only'],
            ["addScript(src, opts)", "Add a script file to the page.",
                'import { addScript } from "@daevsoft/jetz";\n\naddScript("/vendor/chart.js", {\n  async: true,\n  onload: () => console.log("Chart library loaded")\n});'],
            ["find / findAll", "Find the first matching element or all matching elements in the page.",
                'import { find, findAll } from "@daevsoft/jetz/ui";\n\nconst firstButton = find("button");\nconst allInputs = findAll("input");'],
            ["defer(fn, { loadingState })", "Wait until after the next browser draw before running work; optionally show a loading State.",
                'import { defer, stateOf } from "@daevsoft/jetz";\n\nconst isLoading = stateOf(false);\ndefer(() => buildSearchIndex(), { loadingState: isLoading });'],
            ["lazy(fn)", "Wait to calculate a value until the first time you read it.",
                'import { lazy } from "@daevsoft/jetz";\n\nconst expensiveResult = lazy(() => buildSearchIndex());\nexpensiveResult.value; // initializer runs here, once'],
        ],
    },
    {
        title: "Routing, session & middleware",
        path: "/docs/api/application",
        items: [
            ["Router", "Match the browser URL to a page component and change pages without reloading.",
                'import { Jetz } from "@daevsoft/jetz";\nimport { Router, route } from "@daevsoft/jetz/router";\n\nconst router = new Router(route("/", Home));\nJetz.use(router);'],
            ["route(path, comp)", "Show a component when the URL matches this path.",
                'import { route } from "@daevsoft/jetz/router";\n\nconst homeRoute = route("/", Home);\nconst faqRoute = route("/help/faq", FAQ);'],
            ["group(prefix, { routes })", "Put related routes under a shared path prefix.",
                'import { group, route } from "@daevsoft/jetz/router";\n\ngroup("/help", { routes: [route("/faq", FAQ)] });\n// creates the /help/faq path'],
            ["link(path, element)", "Make an element navigate to another route when clicked.",
                'import { link } from "@daevsoft/jetz/router";\nimport { a } from "@daevsoft/jetz/ui";\n\nconst faqLink = link("/help/faq", a("Read the FAQ"));'],
            ["asLink / asBackLink / redirect", "Event modifiers and hard navigation helpers.",
                'import { asBackLink, asLink, redirect } from "@daevsoft/jetz/router";\nimport { button } from "@daevsoft/jetz/ui";\n\nbutton("Open FAQ", asLink("/help/faq"));\nbutton("Back", asBackLink);\nbutton("Visit another site", {\n  onclick: () => redirect("https://example.com")\n});'],
            ["Middleware / middleware()", "Check a navigation request before allowing a route to open.",
                'import { Middleware, middleware } from "@daevsoft/jetz/middleware";\nimport { route } from "@daevsoft/jetz/router";\n\nclass RequireUser extends Middleware {\n  next(_data, _continue) {\n    return localStorage.getItem("token")\n      ? true\n      : this.deny("Sign in first");\n  }\n}\nmiddleware(RequireUser, route("/account", Account));'],
            ["JetzSession / sessionOf", "Save and load values using the browser's sessionStorage.",
                'import { JetzSession, sessionOf } from "@daevsoft/jetz/session";\n\nconst session = new JetzSession({ draft: "" });\nsession.set("draft", "First version");\nconst prefs = sessionOf({ density: "comfortable" });\nprefs.density = "compact"; // saved automatically'],
            ["Dispatcher", "Send named actions to functions that have subscribed to them.",
                'import { Dispatcher } from "@daevsoft/jetz";\n\nconst actions = new Dispatcher((type, payload) => {\n  console.log("Action received:", type, payload);\n});\nconst stop = actions.subscribe(type => console.log(type));\nactions.dispatch("task/add", { title: "Write docs" });\nstop();'],
            ["JetzDevtools / JTest", "Inspect a running app or test a component.",
                'import { Jetz } from "@daevsoft/jetz";\nimport { JetzDevtools } from "@daevsoft/jetz/devtools";\nimport { JTest } from "@daevsoft/jetz/test";\nimport { button, div } from "@daevsoft/jetz/ui";\n\nJetz.use(new JetzDevtools());\nconst testPage = JTest.new(div(button("Save")));'],
        ],
    },
];

export function DocsApiReference() {
    return lesson("/docs/api-reference", "Reference", "API reference",
        "Use this page to look up a Jetz function by name. The short descriptions explain what each function is for; open the linked guide to see examples and usage details.",
        ...SECTIONS.map(section =>
            div(css`mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900`,
                div(css`border-b border-zinc-800 px-5 py-4`,
                    h2(css`text-base font-semibold text-white`,
                        link(section.path, a({ href: section.path }, css`hover`, section.title)),
                        a({ href: section.path }, css`ml-3 text-xs font-medium text-emerald-400`, "Open tutorial →")
                    )
                ),
                ul(css`jetz-docs-ref-list`,
                    ...section.items.map(([name, itemSummary, example]) => li(css`border-b border-zinc-800 px-5 py-3 last:border-b-0`,
                        details({ class: "jetz-docs-ref-item", open: false },
                            summary(css`flex cursor-pointer list-none flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4`,
                                span(css`shrink-0 font-mono text-[13px] text-emerald-300`, name),
                                span(css`text-sm leading-6 text-zinc-400`, itemSummary),
                                span({ class: "jetz-docs-ref-toggle" }, css`ml-auto hidden shrink-0 font-mono text-[11px] uppercase tracking-wider text-zinc-500 sm:inline`, "Example")
                            ),
                            div(css`mt-3`, codeBlock(example, "javascript", "Example.js", "JAVASCRIPT", itemSummary))
                        )
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
        div(css`mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5`,
            p(css`text-sm leading-7 text-zinc-400`, "For exact argument types and every available option, see the TypeScript declaration files under packages/jetz/src/*.d.ts or the full guide at "),
            a({ href: "https://github.com/devarofi/jetz/blob/main/README.md", target: "_blank", rel: "noreferrer" }, css`font-mono text-sm text-emerald-300 underline`, "README.md")
        )
    );
}
