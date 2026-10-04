import { css, div, h2, p } from "../../lib/jetz-ui.js";
import { codeBlock, lesson } from "./docs-layout.js";

function tutorial(title, summary, source, explanation) {
    return div(css`mt-8`,
        h2(css`text-xl font-semibold text-white`, title),
        p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`, summary),
        div(css`mt-4`, codeBlock(source, "javascript", "Example.js", "JAVASCRIPT", explanation))
    );
}

export function DocsApiState() {
    return lesson("/docs/api/state", "API tutorial", "Reactive state",
        "Learn how to store changing values, derive new values, save data across reloads, and update groups of records efficiently. Each example focuses on when to choose a particular kind of State.",
        tutorial(
            "1. Create and remember values",
            "Use stateOf() for values that only need to live while the current page is open. Use rememberOf() when a value should be saved in localStorage and restored after a reload. Give remembered values a stable key so the same value is found each time.",
            'import { rememberOf, stateOf } from "@daevsoft/jetz";\n\n' +
            'const count = stateOf(0);\n' +
            'count.value++;\n\n' +
            'const theme = rememberOf("settings.theme", "light");\n' +
            'theme.value = "dark"; // saved to localStorage\n' +
            'console.log(theme.value);',
            "Read and change a State through .value. rememberOf() has the same reactive behavior, and its key identifies the saved value in localStorage. The one-argument form is available when you do not need to choose a key."
        ),
        tutorial(
            "2. Use shallow State for records",
            "stateOf() makes nested values reactive too. For a large record or table row, shallowStateOf() (also available as rowOf()) tracks the record as one unit. Change fields with set(), or call touchRow() after directly changing a field. rawOf() reads the plain record without tracking it.",
            'import { rawOf, rowOf, shallowStateOf, touchRow } from "@daevsoft/jetz";\n\n' +
            'const person = rowOf({ id: 1, name: "Ada", score: 10 });\n' +
            'const settings = shallowStateOf({ compact: false });\n\n' +
            'person.set({ score: 11 }); // update and notify\n' +
            'person.name = "Ada Lovelace";\n' +
            'touchRow(person); // notify after direct mutation\n' +
            'const plainPerson = rawOf(person); // untracked read\n' +
            'settings.set({ compact: true });',
            "rowOf() is a convenient alias for shallowStateOf(). set() applies a patch and notifies Jetz. If you assign a field directly, call touchRow() to notify the page. Use rawOf() when examining a row in code that should not subscribe to its changes."
        ),
        tutorial(
            "3. Derive values and run side effects",
            "computed() calculates a value from other State values. effect() runs code outside the page rendering whenever a State it reads changes. Keep effects for tasks such as saving data or updating the browser title, and call the returned function when the effect is no longer needed.",
            'import { computed, effect, stateOf } from "@daevsoft/jetz";\n\n' +
            'const first = stateOf("Ada");\n' +
            'const last = stateOf("Lovelace");\n' +
            'const fullName = computed(() => `${first.value} ${last.value}`);\n\n' +
            'const stop = effect(() => {\n' +
            '  document.title = `Welcome, ${fullName.value}`;\n' +
            '});\n\n' +
            'first.value = "Augusta"; // fullName and title update\n' +
            'stop(); // stop listening when it is no longer needed',
            "computed() tracks the States read in its callback and keeps the result current. effect() also tracks reads, but is for work outside the UI. Disposing the effect prevents future runs."
        ),
        tutorial(
            "4. Group updates with batch()",
            "Use batch() when one user action changes several State values. The values change immediately, while subscribers and the page update together after the callback finishes.",
            'import { batch, stateOf } from "@daevsoft/jetz";\n\n' +
            'const givenName = stateOf("Ada");\n' +
            'const familyName = stateOf("Lovelace");\n\n' +
            'batch(() => {\n' +
            '  givenName.value = "Grace";\n' +
            '  familyName.value = "Hopper";\n' +
            '});',
            "Both values are assigned in the batch callback. Jetz then flushes dependent calculations, effects, and displayed content together instead of after each assignment."
        )
    );
}

export function DocsApiCollections() {
    return lesson("/docs/api/collections", "API tutorial", "Collections and branching",
        "Choose a reactive list when its items can change, render it with loop(), and use a conditional helper to show the right content. The array helpers in this guide are useful for preparing ordinary JavaScript arrays.",
        tutorial(
            "1. Create and render a changing list",
            "listOf() creates a reactive list. Add, remove, or replace entries with its list methods, then use loop() to create an element for each item. When items have stable IDs, pass a key function so Jetz can match each item with the correct element.",
            'import { listOf, loop } from "@daevsoft/jetz";\n' +
            'import { button, li, ul } from "@daevsoft/jetz/ui";\n\n' +
            'const tasks = listOf(\n' +
            '  { id: 1, title: "Read the guide" },\n' +
            '  { id: 2, title: "Build an example" }\n' +
            ');\n\n' +
            'ul(loop(tasks, task => task.id, task => li(task.title)));\n' +
            'button("Add task", {\n' +
            '  onclick: () => tasks.push({ id: 3, title: "Try Jetz" })\n' +
            '});',
            "loop() receives the list, a key function, and a render function. The key is the task ID. Calling push() adds an item and updates the rendered list."
        ),
        tutorial(
            "2. Use unique sequences and conditions",
            "sequenceOf() is a list that keeps string and number values unique. ifElse() chooses between two values or pieces of UI. For several content blocks, put _if(), _elseif(), and _else inside the elements they control.",
            'import { _else, _elseif, _if, ifElse, sequenceOf, stateOf } from "@daevsoft/jetz";\n' +
            'import { div, p } from "@daevsoft/jetz/ui";\n\n' +
            'const tags = sequenceOf("news", "design");\n' +
            'tags.push("news"); // duplicate is ignored\n' +
            'const status = stateOf("loading");\n\n' +
            'div(\n' +
            '  p("Message: ", ifElse(\n' +
            '    () => status.value === "loading",\n' +
            '    () => "Please wait",\n' +
            '    () => "Ready"\n' +
            '  )),\n' +
            '  div(_if(() => status.value === "loading"), p("Loading…")),\n' +
            '  div(_elseif(() => status.value === "error"), p("Try again")),\n' +
            '  div(_else, p("Finished"))\n' +
            ');',
            "sequenceOf() ignores duplicate primitive values. ifElse() returns one of two branches inline. The _if/_elseif/_else helpers select one block of content; change status.value to see another branch."
        ),
        tutorial(
            "3. Build and flatten arrays",
            "createList() calls a function once for each index and returns a normal array. range() creates the numbers from its first argument through its second argument, including both ends. flatMap() flattens nested arrays by one level.",
            'import { createList, flatMap, range } from "@daevsoft/jetz";\n\n' +
            'const pageNumbers = range(1, 4); // [1, 2, 3, 4]\n' +
            'const labels = createList(3, index => `Page ${index + 1}`);\n' +
            'const allTags = flatMap([\n' +
            '  ["javascript", "ui"],\n' +
            '  ["reactivity"]\n' +
            ']);\n\n' +
            'console.log(pageNumbers, labels, allTags);',
            "These helpers return ordinary arrays, not reactive lists. Use listOf() instead when the collection itself needs to update a rendered loop."
        )
    );
}

export function DocsApiComponents() {
    return lesson("/docs/api/components", "API tutorial", "Components and lifecycle",
        "A component is a reusable part of a page. Jetz creates its lifecycle when it renders the component, so pass a component to an element or mount it through Jetz instead of calling it as a regular function.",
        tutorial(
            "1. Create a class component",
            "Extend Component and return elements from render(). Override onCreate(), onMount(), onUpdate(), or onDestroy() when the component needs to respond to its lifecycle.",
            'import { Component, Jetz, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
            'class Counter extends Component {\n' +
            '  count = stateOf(0);\n\n' +
            '  onMount() {\n' +
            '    console.log("Counter is on the page");\n' +
            '  }\n\n' +
            '  onDestroy() {\n' +
            '    console.log("Counter was removed");\n' +
            '  }\n\n' +
            '  render() {\n' +
            '    return div(\n' +
            '      p("Count: ", this.count),\n' +
            '      button("Add", { onclick: () => this.count.value++ })\n' +
            '    );\n' +
            '  }\n' +
            '}\n\n' +
            'Jetz.mount(Counter, "#app");',
            "Jetz constructs and renders Counter as a component. onMount() runs after its element is attached; onDestroy() is where you release resources such as timers. State changes trigger an update while the component is active."
        ),
        tutorial(
            "2. Use lifecycle hooks in function components",
            "Function components use onCreate(), onMount(), onUpdate(), and onDestroy() hooks. Call hooks while the function is being invoked by Jetz as a component, such as when it is passed to div().",
            'import { onCreate, onDestroy, onMount, onUpdate, stateOf } from "@daevsoft/jetz";\n' +
            'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
            'function Clock() {\n' +
            '  const time = stateOf(new Date().toLocaleTimeString());\n' +
            '  let timer;\n' +
            '  onCreate(() => console.log("Clock created"));\n' +
            '  onMount(() => {\n' +
            '    timer = setInterval(() => {\n' +
            '      time.value = new Date().toLocaleTimeString();\n' +
            '    }, 1000);\n' +
            '  });\n' +
            '  onUpdate(() => console.log("Clock updated"));\n' +
            '  onDestroy(() => clearInterval(timer));\n' +
            '  return div(p(time), button("Refresh", {\n' +
            '    onclick: () => time.value = new Date().toLocaleTimeString()\n' +
            '  }));\n' +
            '}\n\n' +
            'div(Clock); // Jetz invokes Clock as a component',
            "Passing Clock to div() lets Jetz invoke it and register its hooks. A direct call such as Clock() is an ordinary JavaScript call and does not create a Jetz component lifecycle."
        ),
        tutorial(
            "3. Mount, unmount, install plugins, and add styles",
            "Jetz.mount() renders an app into an element or selector. Jetz.unmount() removes it and runs cleanup hooks. Jetz.use() installs a plugin such as a Router. Jetz.style() adds CSS rules to the document.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, route } from "@daevsoft/jetz/router";\n' +
            'import { div } from "@daevsoft/jetz/ui";\n\n' +
            'const router = new Router(route("/", Home));\n' +
            'Jetz.use(router);\n' +
            'Jetz.style(".notice { color: teal; }");\n' +
            'Jetz.mount(div(Home), "#app");\n\n' +
            '// When this app is no longer needed:\n' +
            'Jetz.unmount("#app");',
            "Install plugins before mounting the app that uses them. Mount into an existing page element, then unmount the same container when the app is removed so component cleanup hooks can run."
        )
    );
}

export function DocsApiElements() {
    return lesson("/docs/api/elements", "API tutorial", "Elements, binding, and utilities",
        "Element helpers create the page. Attribute helpers add classes and styles, State binding keeps form values in sync, and DOM utilities help when a task needs to interact with the browser.",
        tutorial(
            "1. Create elements and add classes or styles",
            "Most pages use element helpers such as div() and button(). createElement() is available when the tag name is dynamic or there is no matching helper. css() creates classes, and style() sets inline styles from an object or CSS text.",
            'import { createElement, stateOf } from "@daevsoft/jetz";\n' +
            'import { css, div, style } from "@daevsoft/jetz/ui";\n\n' +
            'const tagName = "section";\n' +
            'const accent = stateOf("teal");\n\n' +
            'const custom = createElement(tagName, { id: "summary" }, "Summary");\n' +
            'div(\n' +
            '  css`rounded border p-4`,\n' +
            '  style({ color: () => accent.value }),\n' +
            '  custom\n' +
            ');',
            "createElement() accepts a tag name, followed by the usual element arguments. css() adds classes. style() accepts a style object, and a function value can read State so the style responds to changes."
        ),
        tutorial(
            "2. Bind inputs and insert trusted HTML",
            "Use the bind attribute with a State to keep an input and the State in sync. html() parses a string as markup instead of showing it as text. Only pass trusted HTML to html().",
            'import { html, stateOf } from "@daevsoft/jetz";\n' +
            'import { div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
            'const name = stateOf("Ada");\n\n' +
            'div(\n' +
            '  inputText({ bind: name, placeholder: "Your name" }),\n' +
            '  p("Hello, ", name),\n' +
            '  div(html("<strong>Welcome</strong>"))\n' +
            ');',
            "bind connects the input to the State, so typing changes name.value and updates the greeting. html() inserts the strong element. Never use untrusted user input as HTML."
        ),
        tutorial(
            "3. Find elements, load scripts, and schedule work",
            "find() returns the first page element matching a CSS selector; findAll() returns all matches. addScript() loads a script file. lazy() waits until a State is first read to run its initializer, while defer() schedules work after the browser can paint pending updates.",
            'import { defer, lazy, stateOf, addScript } from "@daevsoft/jetz";\n' +
            'import { find, findAll } from "@daevsoft/jetz/ui";\n\n' +
            'const expensiveResult = lazy(() => buildSearchIndex());\n' +
            'const isLoading = stateOf(false);\n\n' +
            'const firstButton = find("button");\n' +
            'const allInputs = findAll("input");\n' +
            'addScript("/vendor/chart.js", {\n' +
            '  async: true,\n' +
            '  onload: () => console.log("Chart library loaded")\n' +
            '});\n' +
            'defer(() => expensiveResult.value, { loadingState: isLoading });',
            "lazy() does not build the index until expensiveResult.value is read for the first time. defer() gives the browser a chance to display its loading state before running the task. find() and findAll() query the current document; addScript() inserts a script element."
        ),
        tutorial(
            "4. Run code after an element is created",
            "listen() registers a callback that receives the element's parent after Jetz creates it. Use this when setup needs the actual element, and prefer ordinary attributes or event handlers when they can do the job.",
            'import { listen } from "@daevsoft/jetz";\n' +
            'import { div, p } from "@daevsoft/jetz/ui";\n\n' +
            'div(\n' +
            '  listen(parent => {\n' +
            '    parent.addClass("has-content");\n' +
            '  }),\n' +
            '  p("This parent receives the class after creation.")\n' +
            ');',
            "The callback receives the Jetz element wrapper, so addClass() applies the class to its underlying page element after creation."
        )
    );
}

export function DocsApiApplication() {
    return lesson("/docs/api/application", "API tutorial", "Routing, sessions, and middleware",
        "Connect URLs to components, protect routes, keep temporary data for the browser session, and communicate actions between parts of an app. These tools are usually installed or created once near the app entry point.",
        tutorial(
            "1. Define routes and navigate between them",
            "route() connects a path to a component. group() adds a shared prefix to related paths. Install a Router with Jetz.use(). Use link() or asLink() for in-app navigation, asBackLink for browser history, and redirect() when you need a full browser navigation.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, asBackLink, asLink, group, link, redirect, route } from "@daevsoft/jetz/router";\n' +
            'import { a, button } from "@daevsoft/jetz/ui";\n\n' +
            'const router = new Router(\n' +
            '  route("/", Home),\n' +
            '  group("/help", { routes: [route("/faq", FAQ)] })\n' +
            ');\n' +
            'Jetz.use(router);\n\n' +
            'const faqLink = link("/help/faq", a("Read the FAQ"));\n' +
            'button("Open FAQ", asLink("/help/faq"));\n' +
            'button("Back", asBackLink);\n' +
            'button("Visit another site", {\n' +
            '  onclick: () => redirect("https://example.com")\n' +
            '});',
            "The group creates the /help/faq path. link() attaches router navigation to an element, and asLink() provides a click handler you can pass as an attribute. asBackLink goes back in history; redirect() performs a full browser redirect."
        ),
        tutorial(
            "2. Check navigation with middleware",
            "A middleware can allow or deny a route before it opens. Extend Middleware and return true to allow navigation; call deny() to block it and store a readable reason. middleware() attaches a middleware to one or more route definitions.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, group, route } from "@daevsoft/jetz/router";\n' +
            'import { Middleware, middleware } from "@daevsoft/jetz/middleware";\n\n' +
            'class RequireUser extends Middleware {\n' +
            '  next(_data, _continue) {\n' +
            '    if (!localStorage.getItem("token")) {\n' +
            '      return this.deny("Sign in first");\n' +
            '    }\n' +
            '    return true;\n' +
            '  }\n' +
            '}\n\n' +
            'const protectedRoutes = middleware(\n' +
            '  RequireUser,\n' +
            '  route("/account", Account)\n' +
            ');\n' +
            'const router = new Router(\n' +
            '  route("/", Home),\n' +
            '  group("/admin", {\n' +
            '    middlewares: [RequireUser],\n' +
            '    routes: [route("/reports", Reports)]\n' +
            '  }),\n' +
            '  ...protectedRoutes\n' +
            ');\n' +
            'Jetz.use(router);',
            "The middleware class checks navigation data and denies access when it has no user. middleware() returns the route with the check attached. A group-level middleware is inherited by its child routes."
        ),
        tutorial(
            "3. Save browser-session data",
            "JetzSession stores values in sessionStorage, which lasts for the current browser tab session. sessionOf() creates a standalone session-backed object whose properties save automatically when assigned.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { JetzSession, sessionOf } from "@daevsoft/jetz/session";\n\n' +
            'const session = new JetzSession({ draft: "" });\n' +
            'session.set("draft", "First version");\n' +
            'const savedDraft = session.get("draft", "");\n' +
            'session.has("draft"); // true\n\n' +
            'const preferences = sessionOf({ density: "comfortable" });\n' +
            'preferences.density = "compact"; // saved automatically\n\n' +
            'Jetz.use(session); // available as Jetz.$session\n' +
            '// session.destroy() clears this session data',
            "Use get() with a default to read a value, set() to save it, and has() to check whether it exists. sessionOf() saves property assignments automatically. Install a JetzSession with Jetz.use() when the app should share it through Jetz.$session."
        ),
        tutorial(
            "4. Send actions and test the app",
            "Dispatcher sends a named action to the callback passed to its constructor and to any subscribed handlers. JetzDevtools and JTest are development tools: install DevTools to inspect a running app, and use JTest to mount and query a component in a test.",
            'import { Dispatcher } from "@daevsoft/jetz";\n' +
            'import { JetzDevtools } from "@daevsoft/jetz/devtools";\n' +
            'import { JTest } from "@daevsoft/jetz/test";\n\n' +
            'import { button, div } from "@daevsoft/jetz/ui";\n\n' +
            'const actions = new Dispatcher((type, payload) => {\n' +
            '  if (type === "task/add") console.log(payload.title);\n' +
            '});\n' +
            'const unsubscribe = actions.subscribe((type) => {\n' +
            '  console.log("Action received:", type);\n' +
            '});\n' +
            'actions.dispatch("task/add", { title: "Write docs" });\n' +
            'unsubscribe(); // remove this subscriber\n\n' +
            'Jetz.use(new JetzDevtools());\n' +
            'const testPage = JTest.new(div(button("Save")));\n' +
            'testPage.find("button").click();',
            "dispatch() notifies registered handlers, and subscribe() returns a function for removing that handler. DevTools is installed as a plugin. JTest.new() creates a test page that can find and interact with elements; see the DevTools & testing guide for a complete test."
        )
    );
}
