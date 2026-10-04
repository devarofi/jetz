<div align="center">
  <img src="./public/img/logo/small.png" alt="Jetz Logo" width="140" />
  <h1>Jetz</h1>
  <p><strong>Composable JavaScript Framework for building reactive web interfaces with declarative JavaScript.</strong></p>

  <p>
    <a href="https://github.com/devarofi/jetz/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-ISC-blue.svg" alt="License: ISC" /></a>
    <a href="https://github.com/devarofi/jetz"><img src="https://img.shields.io/badge/version-1.1.2-emerald.svg" alt="Version 1.1.2" /></a>
    <a href="https://github.com/devarofi/jetz/actions"><img src="https://img.shields.io/badge/tests-passing-brightgreen.svg" alt="Tests" /></a>
    <a href="https://rspack.dev"><img src="https://img.shields.io/badge/bundled_with-Rspack-orange.svg" alt="Rspack" /></a>
  </p>

  <p>
    <a href="#quick-start">Quick Start</a> •
    <a href="#why-jetz">Why Jetz?</a> •
    <a href="#jetz-in-60-seconds">60 Seconds</a> •
    <a href="#core-concepts">Core Concepts</a> •
    <a href="#application-features">App Features</a> •
    <a href="#real-world-example">Calculator Example</a> •
    <a href="#api-quick-reference">API Reference</a>
  </p>
</div>

---

Build modern, reactive web interfaces using clean JavaScript composition — **without JSX, build-time compilation flags, or complex template languages**.

Inspired by the composable, declarative paradigm of Jetpack Compose, Jetz brings that elegance directly to web developers using native JavaScript functions and direct, lightweight DOM updates.

```javascript
import { Jetz, stateOf } from "@daevsoft/jetz";
import { button, div, p } from "@daevsoft/jetz/ui";

const count = stateOf(0);

const App = () => div(
  p("Count: ", count),
  button({ onclick() { count.value++; } }, "Increment")
);

Jetz.mount(App, "#app");
```

```bash
pnpm add @daevsoft/jetz
# or
npm install @daevsoft/jetz
```

---

## Table of Contents

- [Why Jetz?](#why-jetz)
- [Jetz in 60 Seconds](#jetz-in-60-seconds)
- [Feature Overview](#feature-overview)
- [Thinking in Jetz](#thinking-in-jetz)
- [Jetz vs Traditional DOM](#jetz-vs-traditional-dom)
- [Why No JSX or Templates?](#why-no-jsx-or-templates)
- [When Should I Use Jetz?](#when-should-i-use-jetz)
- [Quick Start](#quick-start)
  - [Installation](#1-installation)
  - [Minimal Setup with Rspack](#2-minimal-setup-tutorial-with-rspack)
- [Learning Path](#learning-path)
- [Core Concepts](#core-concepts)
  - [1. Elements & UI Composition](#1-elements--ui-composition)
  - [2. Components (Functions & Classes)](#2-components-functions--classes)
  - [3. Reactive State (`stateOf`, `rememberOf`)](#3-reactive-state-stateof-rememberof)
  - [4. Computed State (`computed`)](#4-computed-state-computed)
  - [5. Side-Effects (`effect`)](#5-side-effects-effect)
  - [6. Reactive Collections (`listOf`, `sequenceOf`)](#6-reactive-collections-listof-sequenceof)
  - [7. Keyed List Reconciliation (`loop`)](#7-keyed-list-reconciliation-loop)
  - [8. Conditional Rendering (`_if`, `_elseif`, `_else`, `ifElse`)](#8-conditional-rendering-_if-_elseif-_else-ifelse)
  - [9. Component Lifecycle](#9-component-lifecycle)
  - [10. Two-Way Data Binding (`bind`)](#10-two-way-data-binding-bind)
  - [11. Reactive Listeners (`listen`)](#11-reactive-listeners-listen)
  - [12. DOM Utilities & Helper Methods](#12-dom-utilities--helper-methods)
- [Scaling Large Data Sets](#scaling-large-data-sets)
  - [Shallow Row State (`shallowStateOf`, `rowOf`)](#shallow-row-state-shallowstateof-rowof)
  - [Untracked Pipeline Reads (`rawOf`)](#untracked-pipeline-reads-rawof)
  - [Automatic Cleanup Lifecycle](#automatic-cleanup-lifecycle)
  - [Manual Cleanup (`disposeBindings`)](#manual-cleanup-disposebindings)
- [From Small UI to Complete Application](#from-small-ui-to-complete-application)
- [Application Features](#application-features)
  - [Router & Link Navigation](#router--link-navigation)
  - [Route Middlewares](#route-middlewares)
  - [Session Storage (`JetzSession`, `sessionOf`)](#session-storage-jetzsession-sessionof)
  - [Dispatcher Pattern](#dispatcher-pattern)
  - [Script & Raw HTML Injection](#script--raw-html-injection)
  - [Prototype Extensions & Array Helpers](#prototype-extensions--array-helpers)
- [Real-World Example: Calculator](#real-world-example-calculator)
- [Architecture Overview](#architecture-overview)
- [API Quick Reference](#api-quick-reference)
- [Testing](#testing)
- [Development & Build](#development--build)
- [Publishing](#publishing)
- [License & Community](#license--community)

---

## Why Jetz?

Web interfaces frequently force developers to pick between two extremes:
1. **Low-level Imperative DOM APIs:** Manual `createElement`, verbose event listeners, and brittle DOM state synchronization.
2. **Heavyweight Toolchains:** Mandatory JSX compilers, virtual DOM diffing overhead, and specialized templating syntax.

**Jetz offers a third way:** declarative, composable JavaScript with reactive state management, without leaving standard JavaScript.

```text
Traditional DOM Code:
create element → configure element → query element → append element → manually mutate element

Jetz Paradigm:
describe UI → compose components → declare reactive state → DOM updates automatically
```

### Core Philosophy

* **UI = JavaScript Composition:** Build DOM trees with simple, readable function calls (`div`, `button`, `p`).
* **State = Reactive:** State values notify bound elements directly; no virtual-DOM diffing passes required.
* **Components = Composable:** Package UI into pure functions or reusable classes with full lifecycle hooks.
* **DOM = Direct and Lightweight:** Clean abstraction over native elements that preserves direct element access when needed.

---

## Jetz in 60 Seconds

The entire Jetz mental model comes down to four basic steps:

```javascript
import { Jetz, stateOf } from "@daevsoft/jetz";
import { button, div, h1 } from "@daevsoft/jetz/ui";

// 1. Create reactive state
const count = stateOf(0);

// 2. Compose your UI tree
const App = () => div(
  h1("Interactive Counter"),

  // 3. React to state: pass state directly or update it on event
  button({ onclick() {
    count.value++; // automatically triggers fine-grained DOM update
  } }, "Clicked ", count, " times")
);

// 4. Mount to your HTML document
Jetz.mount(App, "#app");
```

No build step required to parse custom syntax. That is valid, executable JavaScript out of the box.

---

## Feature Overview

| Feature | Built-in API | What It Solves |
|---|---|---|
| **Declarative UI** | `div`, `span`, `button`, `inputText`, ... | Compose HTML elements cleanly with nested function calls. |
| **Components** | Functions or `extends Component` | Reusable UI units with input parameters and private state. |
| **Reactive State** | `stateOf(value)` | Fine-grained single-value state with subscribers and watchers. |
| **Remembered State** | `rememberOf(key, value)` | State synchronized with `localStorage` across page reloads. |
| **Derived State** | `computed(fn)` | Auto-tracked computed values with zero manual dependency arrays. |
| **Side-Effects** | `effect(fn)` | Auto-tracking effects with instant execution and disposal cleanup. |
| **Reactive Lists** | `listOf()`, `sequenceOf()` | Observable arrays with chainable methods (`push`, `remove`, `sort`). |
| **Keyed Reconciliation** | `loop(list, keyFn, renderFn)` | O(1) DOM element recycling and minimal mutations on array changes. |
| **Shallow Row State** | `shallowStateOf()`, `rowOf()` | Row-level reactivity for tables: one signal per record instead of one per cell. |
| **Auto Cleanup Lifecycle** | `loop()` + `disposeBindings()` | Drops subscriptions, computed values and listeners when a row leaves the DOM. |
| **Conditional UI** | `_if`, `_elseif`, `_else`, `ifElse` | Declarative, reactive conditional rendering without wrapper divs. |
| **Component Lifecycle** | `onCreate`, `onMount`, `onUpdate`, `onDestroy` | Deterministic setup and teardown for function and class components. |
| **Two-Way Binding** | `{ bind: state }` | Instant two-way synchronization between input elements and state. |
| **Dynamic Routing** | `Router`, `route`, `link`, `asLink` | Client-side SPA routing with browser history and parameters. |
| **Route Guards** | `Middleware`, `middleware` | Async/sync navigation guards with reason-based denials. |
| **Session State** | `JetzSession`, `sessionOf` | Reactive key-value store automatically backed by `sessionStorage`. |
| **Dispatcher** | `Dispatcher` | Flux-like action dispatching for clean architecture. |
| **DOM Utilities** | `find`, `findAll`, `.attr()`, `.addClass()`, ... | Fluent helper methods on every element before and after mounting. |

---

## Thinking in Jetz

Adopting Jetz is a smooth shift from manual DOM plumbing to declarative composition:

```text
HTML markup                      ───►   JavaScript composition functions
Manual createElement / append    ───►   Nested function hierarchies
Manual DOM innerText updates     ───►   Reactive stateOf and computed values
Spaghetti event listeners        ───►   Inline declarative handler objects
Full list re-renders             ───►   Keyed loop reconciliation
Complex external build configs   ───►   Standard ES Modules and standard JS
```

---

## Jetz vs Traditional DOM

### Traditional Imperative DOM

```javascript
// Verbose, error-prone, manual synchronization
const container = document.createElement("div");
container.className = "card";

const counterText = document.createElement("p");
let count = 0;
counterText.textContent = `Count: ${count}`;

const btn = document.createElement("button");
btn.textContent = "Increment";
btn.addEventListener("click", () => {
  count++;
  counterText.textContent = `Count: ${count}`; // Manual sync required
});

container.appendChild(counterText);
container.appendChild(btn);
document.body.appendChild(container);
```

### With Jetz

```javascript
// Declarative, reactive, clean composition
import { Jetz, stateOf } from "jetz";
import { div, p, button, css } from "jetz/ui";

const count = stateOf(0);

const Card = div(css`card`,
  p("Count: ", count),
  button("Increment", {
    onclick: () => count.value++
  })
);

Jetz.mount(Card, document.body);
```

The difference: In Jetz, the relationship between state and UI is declared once. When state changes, only the exact bound text node or attribute updates.

---

## Why No JSX or Templates?

Many modern frameworks rely on JSX or custom template compilers (`.vue`, `.svelte`, `.html`). Jetz intentionally uses standard JavaScript functions:

* **Zero Build Overhead for Syntax:** You can run Jetz in modern browsers, prototyping tools, or standard ESM setups without requiring Babel, SWC, or TypeScript JSX transforms just to render an element.
* **Full Power of JavaScript:** Functions are just functions. Variables, loops, closures, conditionals, arrays, and standard language features work directly without templateDSL constraints.
* **Transparent DOM Mapping:** `div(...)` creates a `JetzElement` that wraps and produces real DOM elements directly. There are no hidden virtual DOM reconciliation layers getting between you and the browser.
* **Composable by Nature:** Passing elements, components, or UI fragments as parameters, returning them from helpers, or composing them dynamically is as natural as writing regular JavaScript functions.

---

## When Should I Use Jetz?

### Great Fit For:
* **Interactive Web Apps & SPAs:** Full routing, state, session, and lifecycle built into a lightweight package.
* **Dashboards & Internal Tools:** Rapid prototyping and clean UI creation without heavy build tooling.
* **Component-Driven Frontends:** Teams and developers who prefer the clarity of functional composition over JSX.
* **Performance-Sensitive Micro-UIs:** Situations where virtual-DOM runtime overhead and large bundle sizes are unwanted.

### When to Consider Alternatives:
* Projects where the engineering team is strictly mandated to use JSX/TSX syntax.
* Content-heavy static sites with zero interactivity (where plain static HTML/SSG is sufficient).

---

## Quick Start

### 1. Installation

Install Jetz and the Rspack bundler tools:

```bash
# Using pnpm
pnpm add @daevsoft/jetz
pnpm add -D @rspack/core @rspack/cli

# Using npm
npm install @daevsoft/jetz
npm install -D @rspack/core @rspack/cli
```

---

### 2. Minimal Setup Tutorial with Rspack

Here is a minimal, complete single-page application setup with Rspack and Jetz routing:

#### Directory Structure

```text
my-jetz-app/
├── index.html
├── index.js
├── rspack.config.js
├── package.json
└── src/
    ├── app.js
    └── home.js
```

#### A. Bundler Configuration (`rspack.config.js`)

```javascript
import { rspack } from "@rspack/core";

export default {
  entry: "./index.js",
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./index.html",
    }),
  ],
  devServer: {
    hot: false,
  },
};
```

#### B. HTML Entry (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jetz App</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

#### C. App Shell Component (`src/app.js`)

```javascript
import { Jetz } from "@daevsoft/jetz";
import { main } from "@daevsoft/jetz/ui";

export const App = () => {
    return main(
        Jetz.$route.browser()
    );
};
```

#### D. Home Page View (`src/home.js`)

```javascript
import { css, div } from "@daevsoft/jetz/ui";

export const Home = () => {
    return div(css`text-gray-500`, "Hello World");
};
```

#### E. Main Entry Point (`index.js`)

```javascript
import { Jetz } from "@daevsoft/jetz";
import { route, Router } from "@daevsoft/jetz/router";
import { Home } from "./src/home.js";
import { App } from "./src/app.js";

const router = new Router([
    route('/', Home)
]);

Jetz.use(router);

Jetz.mount(App, '#app');
```

#### F. Run the Development Server

Add this script to your `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build"
  }
}
```

Then start the server:

```bash
npm run dev
# or
npx rspack serve
```

---

## Learning Path

Follow this structured guide to master Jetz step by step:

1. [Elements & UI Composition](#1-elements--ui-composition) — Learn how HTML tags map to functions
2. [Components](#2-components-functions--classes) — Functional and class-based components
3. [Reactive State](#3-reactive-state-stateof-rememberof) — State management with `stateOf` and `rememberOf`
4. [Computed State](#4-computed-state-computed) — Auto-tracked derived values with `computed`
5. [Side-Effects](#5-side-effects-effect) — Reactive watchers with `effect`
6. [Reactive Collections](#6-reactive-collections-listof-sequenceof) — Arrays with `listOf` and `sequenceOf`
7. [Keyed List Reconciliation](#7-keyed-list-reconciliation-loop) — Fast list rendering with `loop`
8. [Conditional Rendering](#8-conditional-rendering-_if-_elseif-_else-ifelse) — Declarative branch switching
9. [Component Lifecycle](#9-component-lifecycle) — `onCreate`, `onMount`, `onUpdate`, `onDestroy`
10. [Two-Way Binding](#10-two-way-data-binding-bind) — Synchronizing form inputs
11. [Reactive Listeners](#11-reactive-listeners-listen) — Dynamic styling & DOM reactions with `listen`
12. [DOM Utilities](#12-dom-utilities--helper-methods) — Fluent element manipulation helpers
13. [Scaling Large Data Sets](#scaling-large-data-sets) — Shallow rows and automatic cleanup for big tables
14. [Router & Middleware](#router--link-navigation) — Multi-page SPA navigation
15. [Session Storage](#session-storage-jetzsession-sessionof) — Tab-persistent state

---

## Core Concepts

### 1. Elements & UI Composition

Every HTML5 element is exported as a composable JavaScript function from `jetz/ui`:

```javascript
import { div, h1, p, span, button, a, img, css } from "jetz/ui";

const Banner = div(
  h1("Fast, Declarative UI"),
  p("Composable JavaScript functions represent elements:"),
  span("No templates. No JSX."),
  button("Get Started", {
    onclick: () => alert("Welcome!")
  })
);
```

#### Syntax Flexibility

Element functions accept arguments in any natural order:
* **Strings & Numbers:** Rendered as child text nodes.
* **Child Elements:** Appended directly into the parent.
* **Objects:** Configured as attributes, properties, or event handlers.
* **CSS Helpers:** Tagged template ``css`class-name` ``, a reactive function `css(() => …)`, style objects, or a css block via ``style`…` ``.
* **Reactive States:** Automatically bind their text content.

```javascript
div(
  css`card active`,              // classes
  { id: "hero", role: "banner" }, // attributes
  h2("Title"),                   // child element
  "Text content"                 // text node
)
```

#### Reactive Tag Templates

Every element factory doubles as a tagged template. Interpolated **functions** are evaluated as reactive text and re-render whenever a state they read changes:

```javascript
const stateOnline = stateOf(true);

div`Is Online : ${() => stateOnline.value ? "Yes" : "No"}`;
span`Hello ${username}!`; // states can be interpolated directly
```

Components and static values keep working as children, so ``div`Status: ${Badge}``` renders the badge element.

> ⚠️ The same code written as a plain string — a normal `div(...)` call with an untagged template literal — cannot work: JavaScript flattens the interpolated function to its source text and the closure is gone before jetz sees it. With `Jetz.devtools = true`, jetz warns when a text child looks like a stringified function and points at the tagged form. The `text` tag behaves the same way:

```javascript
div(text`Count : ${() => count.value}`);
```

The bundled stress page (`public/stress.html`) renders one tagged string per row — the **Ticker** column — and reports a dedicated *Reactive string* metric: a single shared write re-rendering every row's string under load.

---

### 2. Components (Functions & Classes)

You can define components in three ways: as variables, functions, or classes extending `Component`.

#### A. Function Components (Recommended)

Function components are simple JavaScript functions that return an element tree:

```javascript
import { div, h3, p, css } from "jetz/ui";

export function UserCard(name, role) {
  return div(css`user-card`,
    h3(name),
    p(role)
  );
}

// Usage in parent:
const Page = div(
  UserCard("Alice", "Frontend Engineer"),
  UserCard("Bob", "Product Designer")
);
```

Calling a function like `UserCard(...)` is an ordinary JavaScript call. It works well for simple element-building functions, but does not give that call its own lifecycle. To let Jetz invoke a child component, pass a function reference, such as `div(UserCard)`. That form takes no arguments, so use a small wrapper when the child needs values:

```javascript
import { stateOf } from "jetz";
import { div, inputText, p } from "jetz/ui";

function Greeting({ name }) {
  return p("Hello, ", name);
}

const name = stateOf("Ada");
const GreetingForUser = () => Greeting({ name });

const Page = div(
  inputText({ bind: name }),
  GreetingForUser
);
```

Jetz invokes `GreetingForUser` as the child component. The wrapper passes `name` into `Greeting`; because `name` is a State, the greeting updates when the input changes. Put lifecycle hooks in the function Jetz invokes (here, `GreetingForUser`), or use the function reference directly when it needs no parameters. Do not write `div(Greeting(name.value))` if you need a child lifecycle: that calls `Greeting` immediately, outside Jetz's component invocation. Routed function components are different: the router passes route parameters to the function directly.

#### B. Class Components

For complex stateful components or object-oriented architectures, extend `Component`:

```javascript
import { Component, stateOf } from "jetz";
import { div, button } from "jetz/ui";

export class CounterComponent extends Component {
  count = stateOf(0);

  increment() {
    this.count.value++;
  }

  render() {
    return div(
      button("Clicked: ", this.count, {
        onclick: () => this.increment() // use arrow function to preserve `this`
      })
    );
  }
}

// Instantiate with `new` or `.new()`:
const App = div(
  new CounterComponent(),
  CounterComponent.new()
);
```

---

### 3. Reactive State (`stateOf`, `rememberOf`)

State in Jetz is created using `stateOf(initialValue)`.

```javascript
import { stateOf } from "jetz";
import { div, button } from "jetz/ui";

const counter = stateOf(0);

// Reading & writing state
console.log(counter.value); // 0
counter.value = 10;         // updates value & triggers UI re-renders
counter.setState(20);       // same as counter.value = 20

// Manual subscriptions (if needed)
const unsubscribe = counter.subscribe((newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});
```

#### Updating State Values

Assign to `.value` to update a reactive value; use `setState()` when you prefer an explicit setter. Both forms notify subscribers and update bound UI:

```javascript
const count = stateOf(0);
count.value += 1;
count.setState(10);

const profile = stateOf({ name: "Ada" });
profile.name.value = "Grace"; // object properties are reactive states too
```

#### Batching State Updates

Use `batch(fn)` when one user action updates multiple related states. `stateOf()` holds the source values, `computed()` derives a value from them, and `effect()` reacts to that derived value. Without `batch()`, the effect below sees an intermediate name; with `batch()`, it runs once with the completed name.

```javascript
import { batch, computed, effect, stateOf } from "jetz";

const firstName = stateOf("Ada");
const lastName = stateOf("Lovelace");
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

effect(() => {
  console.log(`Profile name: ${fullName.value}`);
});

// Without batch(), these writes would emit "Augusta Lovelace" then "Augusta King".
batch(() => {
  firstName.value = "Augusta";
  lastName.value = "King";
});

// The effect emits only "Augusta King" for the batched update.
```

Values are readable immediately inside the callback. Computed values, effects, subscribers, and bound DOM update when the outermost batch finishes. Keep the callback synchronous.

Use `stateOf` for temporary UI or application state. Use a `ListState` for collections that need reactive add, remove, or replace operations.

#### Persisting State with `rememberOf`

`rememberOf(key, initialValue)` works like `stateOf`, but synchronizes supported updates to `localStorage` and restores them on refresh. The key should remain stable between visits; remembered values are scoped to the current page path.

```javascript
import { rememberOf } from "jetz";

const theme = rememberOf("theme", "light");
theme.value = "dark"; // automatically saved to localStorage

// Arrays can also be remembered:
const recentSearches = rememberOf("searches", []);
recentSearches.push("JavaScript"); // persisted
```

For remembered arrays, `push()`, `set()`, and `clear()` save automatically. Other list mutations still update the reactive UI, but do not currently write to storage. To persist a removal or other transformed result, replace the list with `set()`:

```javascript
recentSearches.set(recentSearches.values.filter(item => item !== "JavaScript"));
```

Store JSON-serializable data in remembered arrays. If list items need reactive fields, save plain data and recreate the reactive item states when loading.

---

### 4. Computed State (`computed`)

`computed(fn)` creates derived state that **automatically tracks its dependencies**.

When any state accessed inside the computation function changes, the computed value re-evaluates automatically and updates all bound DOM elements:

```javascript
import { stateOf, computed } from "jetz";
import { div, span, inputText } from "jetz/ui";

const firstName = stateOf("Ada");
const lastName = stateOf("Lovelace");

// Automatically tracks `firstName` and `lastName`
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

const UserProfile = div(
  span("Full Name: ", fullName), // Updates whenever firstName or lastName changes
  inputText({ bind: firstName, placeholder: "First name" }),
  inputText({ bind: lastName, placeholder: "Last name" })
);
```

#### Chaining Computed States

Computed states are fully reactive states and can depend on other computed states:

```javascript
const price = stateOf(100);
const qty = stateOf(2);

const subtotal = computed(() => price.value * qty.value);
const tax = computed(() => subtotal.value * 0.1);
const grandTotal = computed(() => subtotal.value + tax.value);
```

#### Reactive Classes

Use a callback interpolation when part of a class depends on state. `css` evaluates that callback as a computed value and updates the element's class attribute when the state changes:

```javascript
import { listOf, loop, stateOf } from "jetz";
import { css, li, ul } from "jetz/ui";

const tasks = listOf(
  stateOf({ id: 201, done: true, title: "Sketch the onboarding flow" }),
  stateOf({ id: 202, done: false, title: "Review the component API" })
);

const TaskList = ul(loop(tasks, task => li(
  css`task-number ${() => task.done.value ? "completed" : ""}`,
  task.title
)));
```

The callback must read `task.done.value`; JavaScript treats `task.done` itself as a truthy State object. A plain ternary interpolation such as `${task.done ? "completed" : ""}` is evaluated before `css` receives it and is not reactive. Static classes remain ordinary tagged templates, for example `css`task-number completed``.

You can also create the conditional class with `computed()` and interpolate that State directly:

```javascript
import { computed } from "jetz";

const ComputedTaskList = ul(loop(tasks, task => li(
  css`task-number ${computed(() => task.done.value ? "completed" : "")}`,
  "TASK ", task.id, " - ", task.title
)));
```

Create the computed value inside the `loop()` renderer when it depends on that row's `task`. Each row gets a computation that closes over its own task, and `css` updates that row's class whenever `task.done` changes.

#### Reactive Styles

The `style` helper accepts the same three forms as `css`: an object of properties, a **tagged template** holding a css declaration block, or a callback/`State` producing either.

```javascript
import { stateOf } from "jetz";
import { div, style } from "jetz/ui";

// 1. object form
div(style({ color: "crimson", "max-width": "400px" }))

// 2. tagged template - a css block, straight in the markup
div(
  style`
    max-width: 400px;
    margin: 30px auto;
    padding: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: sans-serif;
  `,
  "Card content"
)
```

Interpolations inside the template stay **reactive**, exactly like `css`…`` and `div`…``:

```javascript
const accent = stateOf("#334155");

const Panel = div(
  style`
    color: ${() => accent.value};
    padding: 20px;
  `,
  "Panel"
);

accent.value = "#dc2626";   // only the color declaration updates
```

A `State` (or callback) holding the whole block works too:

```javascript
const theme = stateOf("background: #fff; color: #111;");
div(style(theme));
```

The declaration block is parsed into individual properties, so each one keeps its own binding - a reactive interpolation re-renders just that property rather than rewriting the whole `style` attribute. Blank entries and malformed declarations are skipped, and `null`/`false` interpolations contribute nothing.

#### Reactive Attributes

Attribute helpers keep `State` values instead of converting them to strings early. You can also pass a callback to an attribute or style property; its `.value` reads are tracked and the DOM updates when they change:

```javascript
import { stateOf } from "jetz";
import { a, aria_, data_, button, href, style } from "jetz/ui";

const destination = stateOf("/tasks");
const saving = stateOf(false);
const color = stateOf("crimson");

const Link = a(href(destination), "Tasks");
const SaveButton = button({ disabled: saving }, "Save");
const Status = a(
  aria_({ busy: saving }),
  data_({ destination }),
  { title: () => `Open ${destination.value}` },
  "Status"
);
const Swatch = a(style({ color: () => color.value }), "Preview");
```

HTML boolean attributes such as `disabled` are added for `true` and removed for `false`. `aria-*` and `data-*` values remain strings, so a false state becomes `"false"` rather than removing the attribute.

---

### 5. Side-Effects (`effect`)

`effect(fn)` runs an imperative side-effect function that automatically discovers its dependencies by intercepting `.value` reads.

It re-executes whenever any accessed state changes, and returns a `dispose` function:

```javascript
import { stateOf, effect } from "jetz";

const counter = stateOf(0);

// Executes immediately, then re-runs on every counter change:
const dispose = effect(() => {
  document.title = `Count: ${counter.value}`;
});

// Dynamic conditional tracking:
const loggingEnabled = stateOf(true);
const status = stateOf("idle");

effect(() => {
  if (loggingEnabled.value) {
    console.log("Current status:", status.value); // tracks status only when loggingEnabled is true
  }
});

// Clean up when no longer needed:
dispose();
```

> An `effect()` created **inside** a `loop()` item is cleaned up for you: the
> reconciler calls its `dispose()` when that row leaves the DOM. See
> [Automatic Cleanup Lifecycle](#automatic-cleanup-lifecycle).

---

### 6. Reactive Collections (`listOf`, `sequenceOf`)

For dynamic arrays, Jetz provides reactive collections via `listOf()` and `sequenceOf()`. Use their mutation methods when the collection itself changes; they update rendered lists created with `loop()`:

```javascript
import { listOf, loop } from "jetz";
import { ul, li } from "jetz/ui";

const todos = listOf("Learn Jetz", "Build an App");
const TodoList = ul(loop(todos, todo => li(todo)));

todos.push("Test the app");
todos.remove("Build an App");
todos.set(["Ship the feature"]);
```

Use `push()` to append, `insertAt()` to insert at a known position, `remove()` / `removeAt()` to delete, and `set()` to replace the full collection (for example, after filtering or loading new data). Use `sequenceOf()` when creating a list whose duplicate primitive values must remain distinct, or call `asUnique()` on an existing list.

Call `asRemember(key)` when an existing `ListState` should be restored from and saved to `localStorage`. Prefer an explicit, stable key so the list does not depend on creation order. Use `rememberOf(key, initialValue)` when you want to create a remembered value directly; use `asRemember()` when you already have a list to mark as remembered:

```javascript
const selectedTags = listOf("news", "news").asUnique();
const recentSearches = listOf().asRemember("recent-searches");
recentSearches.push("Jetz"); // saved to localStorage
```

#### Complete `ListState` API

| Method / Property | Description |
|---|---|
| `list.push(...items)` | Append one or more items and update rendered lists |
| `list.set(newArray)` | Replace all items; chainable |
| `list.replaceAt(index, item)` | Replace one item; chainable |
| `list.updateAt(index, updater)` | Replace one item using its current value; chainable |
| `list.map(fn)` | Return a new array of mapped values without changing the list |
| `list.transform(fn)` | Replace each item with the callback result and update rendered views |
| `list.insertAt(index, ...items)` | Insert items at an index |
| `list.remove(item)` | Remove the first matching item |
| `list.removeAt(index)` | Remove the item at an index |
| `list.sort((a, b) => ...)` | Sort items in place; chainable |
| `list.filter(predicate)` | Return a plain array without changing the list |
| `list.clear()` | Empty the collection |
| `list.asUnique()` | Make duplicate string/number values distinct entries; chainable |
| `list.asRemember(key?)` | Restore and persist the list using an optional stable key; chainable |
| `list.size` | Returns item count |
| `list.values` | Direct reference to underlying array |
| `list.first()` / `list.last()` | Convenience accessors for boundary items |

`ListState.map()` follows the standard array behavior and returns a new array. Use `transform()` when you want to replace list items and update rendered views. Avoid editing `list.values` directly when you need the rendered list and array slots to stay synchronized. Remembered lists persist changes made through their mutation methods and reactive child states; direct edits to the `values` array bypass that synchronization. `asRemember()` stores JSON-serialized values, so prefer plain serializable records over reactive `State` instances.

---

### 7. Keyed List Reconciliation (`loop`)

When rendering large collections, full list re-rendering can be costly. Jetz provides **keyed reconciliation** through the 3-argument form of `loop()`:

```javascript
import { listOf, loop } from "jetz";
import { ul, li, button, div } from "jetz/ui";

const users = listOf(
  { id: 101, name: "Alice" },
  { id: 102, name: "Bob" }
);

const UserList = ul(
  loop(
    users,
    user => user.id,         // Key selector: unique identifier
    user => li(user.name)    // Render function
  )
);
```

#### Why Keys Matter

```text
Without Keys (classic loop):
1000 items ──(1 item modified)──► Re-render all 1000 DOM elements

With Keys:
1000 items ──(1 item modified)──► Re-render ONLY the 1 modified DOM element
```

The classic 2-argument form `loop(list, renderFn)` remains available for backward compatibility.

Beyond diffing, `loop()` also owns the **lifecycle** of each item: every
`effect()`, `computed()`, subscription and listener created while that item
renders is released when the reconciler drops the view. For very large data sets
(pair `loop()` with [shallow row state](#shallow-row-state-shallowstateof-rowof))
see [Scaling Large Data Sets](#scaling-large-data-sets).

---

### 8. Conditional Rendering (`_if`, `_elseif`, `_else`, `ifElse`)

Jetz supports declarative conditional rendering without creating unnecessary wrapper elements.

#### A. Multi-Branch Conditionals (`_if`, `_elseif`, `_else`)

```javascript
import { stateOf, _if, _elseif, _else } from "jetz";
import { div, button } from "jetz/ui";

const tab = stateOf("home");

const Content = div(
  div(_if(() => tab.value === "home"), "Welcome to the Homepage"),
  div(_elseif(() => tab.value === "profile"), "Your Profile Details"),
  div(_else, "Page Not Found"),

  button("Switch", {
    onclick: () => tab.setState(tab.value === "home" ? "profile" : "home")
  })
);
```

#### B. Inline Two-Branch Conditionals (`ifElse`)

`ifElse(conditionFn, trueBranch, falseBranch)` evaluates inline and swaps content seamlessly in place:

```javascript
import { stateOf, ifElse } from "jetz";
import { div, span, button } from "jetz/ui";

const isLoggedIn = stateOf(false);

const Nav = div(
  ifElse(
    () => isLoggedIn.value,
    () => span("Welcome back!"),
    () => button("Log In", { onclick: () => isLoggedIn.setState(true) })
  )
);
```

---

### 9. Component Lifecycle

Every Jetz component — whether function-based or class-based — supports four lifecycle stages:

Each component instance that Jetz invokes has its own lifecycle context, including nested and routed components. For a nested function component, pass its function reference to an element (for example, `div(LiveClock)`) and use the imported lifecycle hooks inside it. If it needs values, pass them through a wrapper function as shown in the Components section. A route such as `route("/clock", LiveClock)` can pass route parameters directly to the function. Class components keep using their `onCreate()`, `onMount()`, `onUpdate()`, and `onDestroy()` methods. Lifecycle methods are not called on function components; use the hook functions instead.

```text
onCreate   ──►   onMount   ──►   onUpdate   ──►   onDestroy
(before DOM)     (in DOM)        (state delta)    (removed)
```

| Lifecycle Hook | Timing & Purpose |
|---|---|
| `onCreate` | Executes once before rendering occurs. Ideal for initializing local variables and preparing state. |
| `onMount` | Executes once immediately after the element is attached to the document. Safe to touch DOM, start timers, or fetch data. |
| `onUpdate` | Executes whenever a bound state changes while the component is active in the DOM. |
| `onDestroy` | Executes when the element is removed from DOM (e.g. route change, conditional removal, list delete, `unmount`). Ideal for clearing timers and subscriptions. |

#### Lifecycle in Function Components

```javascript
import { onCreate, onMount, onUpdate, onDestroy, stateOf } from "jetz";
import { div } from "jetz/ui";

export function LiveClock() {
  const time = stateOf(new Date().toLocaleTimeString());
  let intervalId;

  onCreate(() => console.log("Clock initializing..."));

  onMount(() => {
    intervalId = setInterval(() => {
      time.setState(new Date().toLocaleTimeString());
    }, 1000);
  });

  onUpdate(() => console.log("Clock updated to:", time.value));

  onDestroy(() => {
    clearInterval(intervalId);
    console.log("Clock cleaned up.");
  });

  return div("Current Time: ", time);
}
```

#### Lifecycle in Class Components

```javascript
import { Component, stateOf } from "jetz";
import { div } from "jetz/ui";

export class LiveClockClass extends Component {
  time = stateOf("");
  intervalId = null;

  onMount() {
    this.intervalId = setInterval(() => {
      this.time.value = new Date().toLocaleTimeString();
    }, 1000);
  }

  onDestroy() {
    clearInterval(this.intervalId);
  }

  render() {
    return div("Time: ", this.time);
  }
}
```

---

### 10. Two-Way Data Binding (`bind`)

Bind any `stateOf` instance directly to an input element using the `bind` property:

```javascript
import { stateOf } from "jetz";
import { div, inputText, p } from "jetz/ui";

const query = stateOf("");

const SearchBox = div(
  inputText({
    bind: query, // Two-way binding: updates query.value on user input
    placeholder: "Search documentation..."
  }),
  p("Searching for: ", query)
);
```

Whenever the user types, `query.value` updates immediately. Conversely, setting `query.value = "something"` updates the input field's display value automatically.

#### When a binding fails

A `bind` target has to be a reactive state. When it is not - most often because a
list item is missing the field its template binds - Jetz throws a
`JetzBindingError` naming the element, what it received, and the item and
template that have to be fixed, instead of an internal `Cannot read properties of
undefined (reading 'value')`:

```text
Jetz: `bind` on <input type="checkbox"> expected a state but received undefined.

A `bind` target has to come from stateOf(), computed() or rememberOf().

`undefined` usually means the state object is missing that field, e.g.
    stateOf({ id, title })                // then `bind: task.done` reads undefined
    stateOf({ id, done: false, title })   // give every bound field a value

While rendering the list item at index 0 (key 201).
The item template binds:
    task => li(input(type`checkbox`, { bind: task.done }))
```

The error stays a `TypeError`, so existing `try/catch` blocks keep working while
the message tells you which line of *your* code to change.

Outside a `loop()` there is no item template to quote, so set `Jetz.devtools = true`
to also include the stack frame that built the element. It is off by default
because it captures a stack per element, which is measurable on large lists.

---

### 11. Reactive Listeners (`listen`)

`listen(callback)` registers an inline reactive effect tied directly to an element. It renders no DOM element of its own, executing once on mount and subsequently on every state change:

```javascript
import { stateOf, listen } from "jetz";
import { div, button } from "jetz/ui";

const count = stateOf(0);

const Box = div(
  "Current count: ", count,
  // Automatically updates the parent div's CSS class as state changes:
  listen(parent => {
    parent.replaceClass(/count-\d+/, `count-${count.value}`);
  }),
  button("+1", { onclick: () => count.value++ })
);
```

---

### 12. DOM Utilities & Helper Methods

Every `JetzElement` wraps an `HTMLElement` and provides a fluent chainable API that works both before and after mounting:

```javascript
import { div, find, findAll } from "jetz/ui";

const box = div("Hello World", { "data-role": "card" });

// Attributes & Data
box.attr("data-role");             // Read attribute
box.addAttr("title", "Greetings"); // Set attribute
box.removeAttr("title");          // Remove attribute
box.data("role");                  // Read data-* property

// Styling & Classes
box.setStyle({ color: "blue" });   // Apply inline styles
box.getStyle("color");             // Read style property
box.addClass("active");            // Add class
box.removeClass("active");         // Remove class
box.toggleClass("active");         // Toggle class
box.replaceClass("active", "idle");// Replace class

// DOM Tree & State
box.text("Updated Text");          // Replace text content
box.disable(); box.enable();       // Toggle disabled state
box.focus(); box.blur();           // Focus controls
box.empty();                       // Remove all children
box.remove();                      // Remove element from DOM

// Global Finders
const header = find("#main-header");      // Returns HTMLElement
const items = findAll(".list-item");      // Returns Array<HTMLElement>
```

## Scaling Large Data Sets

A grid holding tens of thousands of rows puts two separate pressures on the
reactive engine: **how much memory each record costs**, and **who releases a row
once it leaves the screen**. Jetz addresses both.

### Shallow Row State (`shallowStateOf`, `rowOf`)

`stateOf(object)` walks the object and turns **every property** into its own
reactive `State`. For a 12-column row that is 12 `State` instances before you
even add `computed()` columns, and you pay for all 50 000 rows — including the
49 500 that are off-screen.

`rowOf(object)` (alias: `shallowStateOf()`) keeps the record as a plain object
and gives it **one** version signal:

```javascript
import { computed, listOf, loop, rowOf } from "jetz";
import { table, tbody, tr, td, button } from "jetz/ui";

// One signal per row, not one per cell
const employees = listOf(
  rowOf({ id: 1, name: "Alice", dept: "Engineering", score: 92 }),
  rowOf({ id: 2, name: "Bob", dept: "Design", score: 78 })
);

const grid = table(
  tbody(loop(employees, emp => emp.id, emp => tr(
    td(emp.name),                          // immutable column: read once, free
    td({ class: () => emp.dept }),         // reactive: re-read on every bump
    td(computed(() => emp.score)),         // reactive: recomputes on every bump
    td(button("+1", {
      onclick: () => { emp.score = emp.score + 1; } // one write, one row refresh
    }))
  )))
);
```

**Result:** clicking **+1** sets `emp.score = 93`, which bumps that row's single
version signal. Only that one `<tr>` re-renders; the sibling row and the rest of
the grid are untouched, and no property-per-`State` object was ever allocated.

#### Which Forms Re-read the Row

A row bump only refreshes the bindings that *tracked* the row, so it matters how
you read it:

| Form | Re-reads on row bump? | Use for |
|---|---|---|
| `td(emp.score)` | no | columns that never change |
| `td(() => emp.score)` | **no** — a bare function child is called once | function components |
| `td(computed(() => emp.score))` | yes | mutable text cells |
| `td({ "data-x": () => emp.score })` | yes | reactive attributes |
| `td(css\`cell ${() => emp.dept}\`)` | yes | reactive classes |
| `td({ style: { width: () => emp.score + "px" } })` | yes | reactive styles |

> This is the one rule to remember: a **bare value or bare function child is
> evaluated once**. Wrap mutable cell text in `computed()` — or move it into an
> attribute, `class` or `style` — and the row bump reaches it. Immutable columns
> should stay plain, which is exactly where shallow rows save the most.

| Layout | Reactive objects per row (4 cells) | Heap for 50 000 rows |
|---|---|---|
| `stateOf({ ... })` + `computed()` columns | 4 `State` + 4 `computed` per row | baseline |
| `rowOf({ ... })` | **1 version `State`** per row | **~7x lower** |

Each shallow row carries four helpers:

| Member | Description |
|---|---|
| `row.touch()` | Bump the row version (row-level refresh) |
| `row.set({ patch })` | Merge a patch and bump once |
| `row.peek(key)` | Read a property **untracked**, like `rawOf()` |
| `row.toObject()` | Plain, non-reactive copy of the record |

> `rowOf()` falls back to plain `stateOf()` for primitives, arrays and
> `JetzElement`s, so you can map it over mixed data without branching.

### Untracked Pipeline Reads (`rawOf`)

A tracked read inside a `computed()` or an `effect()` **subscribes** it. That is
what you want while rendering a cell, and exactly what you do not want in a
filter/sort pass that walks all 50 000 rows — one read per row would pin the
pipeline to the whole dataset.

`rawOf(row)` returns the underlying plain object, bypassing the row version
signal, so the read stays untracked:

```javascript
import { computed, listOf, loop, rawOf, rowOf, stateOf } from "jetz";
import { table, tbody, tr, td } from "jetz/ui";

const all = listOf(...fetchEmployees().map(rowOf));   // the full dataset
const page = stateOf(1);
const query = stateOf("");

// rawOf() keeps these reads untracked: the pipeline is re-run from scratch on
// every keystroke, but the reactive graph never gains a dependency per row.
function visibleRows() {
  return all
    .filter(emp => rawOf(emp).name.toLowerCase().includes(query.value.toLowerCase()))
    .sort((a, b) => rawOf(a).score - rawOf(b).score);
}

// `computed()` is happy with a primitive - the count of matches:
const matchCount = computed(() => visibleRows().length);

// For the rows themselves, drive the rendered list instead:
const employees = listOf(...visibleRows());
query.subscribe(() => employees.set(visibleRows()));

const grid = table(tbody(loop(employees, emp => emp.id, emp => tr(
  td(emp.name),                            // immutable column
  td(computed(() => emp.score))             // mutable column
))));
```

**Result:** typing in the filter box re-runs `visibleRows()` over all 50 000
rows, yet the reactive graph still holds only two subscriptions (`query` and the
rendered page) instead of one per row per column. `rawOf()` is a no-op on values
that are not shallow rows, so it is safe to call on mixed data.

> `computed()` should return a primitive. `stateOf()` walks an array/object
> argument and would rewrite the values handed to it, so derive a count (or any
> scalar) with `computed()` and push the list itself through `list.set()`.

For a bulk edit, write the plain data first and bump once per row:

```javascript
import { batch, rawOf, touchRow } from "jetz";

batch(() => {
  for (const emp of employees.values) {
    const data = rawOf(emp);   // untracked write target
    data.score += 1;
  }
  for (const emp of employees.values) {
    touchRow(emp);             // one refresh per row, coalesced by batch()
  }
});
```

### Automatic Cleanup Lifecycle

A rendered view is not just DOM: it also owns `effect()` runs, `computed()`
dependency subscriptions, state subscriptions, style containers and event
listeners. If a row is removed while those stay subscribed, the state keeps the
whole detached `<tr>` subtree reachable — the classic "the grid scrolls for ten
minutes and the heap keeps climbing" leak.

Jetz gives every `loop()` item its own **disposal scope**. Everything created
while that item renders registers its teardown there:

```javascript
import { computed, effect, listOf, loop, rowOf } from "jetz";
import { table, tbody, tr, td } from "jetz/ui";

const employees = listOf(...fetchEmployees().map(rowOf));

const grid = table(tbody(loop(employees, emp => emp.id, emp => {
  // created inside the item scope - disposed automatically with the row
  effect(() => { trackRowInAnalytics(emp.name); });

  return tr(
    td({ class: () => emp.dept }),
    td(computed(() => emp.score))
  );
})));

// pagination / filter change -> rows are dropped
employees.set(nextPage);
```

**Result:** `employees.set(nextPage)` releases, for every removed row:

| Released | How |
|---|---|
| `effect()` runs | the effect's own `dispose()` is called |
| `computed()` values | unsubscribed from all their dependencies |
| state subscriptions | attribute, `class`, `bind`, style and text bindings |
| event listeners | `removeEventListener` for every `on*` handler |
| state containers | text/element nodes and `StyleState` containers detached |

The scope is opened by `loop()` itself, so no extra code is needed for keyed
removal, item swap under the same key, a full classic refresh, or `removeAt()`.
Nothing changes for state created outside a `loop()` — it is never registered in
a scope and keeps living exactly as before.

The same teardown runs wherever a subtree is genuinely dropped: `empty()`,
`ifElse()` branch swaps, and `Jetz.unmount(container)`.

Measured on the bundled stress test (80 page swaps x 500 rows = 40 000 rows
rendered, jsdom + `--expose-gc`):

| | Before cleanup | With cleanup lifecycle |
|---|---|---|
| Heap growth over the run | 302.68 MB | **15.10 MB** |
| Row states still pinning a DOM node | 40 500 | **500** |

> Teardown is deliberately **not** wired into `element.remove()`: `_if` / `_else`
> remove a node only to re-insert the same node later, so releasing bindings
> there would break them. The reconciler knows which views are really gone.

### Manual Cleanup (`disposeBindings`)

The same routine is public, for the cases the reconciler cannot see — a dialog
you close yourself, a widget you re-create, a subtree you move elsewhere:

```javascript
import { Jetz, div, span } from "jetz";
import { button } from "jetz/ui";

const panel = div(span("Live region"), button("Close", {
  onclick: () => {
    panel.disposeBindings(); // subscriptions, computed, listeners, containers
    panel.remove();          // then detach the node
  }
}));

// Or let unmount do both for a whole container:
Jetz.unmount("#app");
```

**Result:** after `disposeBindings()` the state no longer writes into the
detached nodes, and a later `setState()` cannot resurrect them:

```javascript
const label = stateOf("before");
const box   = div(span(label));
Jetz.mount(box, "#app");

box.o.querySelector("span").textContent;   // "before"

box.disposeBindings();
label.setState("after");
box.o.querySelector("span").textContent;   // still "before" - no live binding left
```

`disposeBindings()` is idempotent, so calling it twice is safe.

---

---

## From Small UI to Complete Application

Jetz is not just a DOM builder — it scales cleanly from a simple inline element to a full Single Page Application (SPA):

```text
1. Element
   └─ div("Hello World")
2. Component
   └─ function Header(title) { return header(h1(title)); }
3. Reactive State & Computed
   └─ const count = stateOf(0); const double = computed(() => count.value * 2);
4. Reactive Collections
   └─ const items = listOf(); items.push(...)
5. Lifecycle & Effects
   └─ onMount(() => ...); effect(() => ...);
6. Routing & Middleware
   └─ new Router(route('/', Home), middleware(AuthGuard, route('/admin', Admin)))
7. Session Storage
   └─ const session = new JetzSession(); Jetz.use(session);
8. Production Application
   └─ Jetz.mount(App, document.body);
```

---

## Application Features

### Router & Link Navigation

Jetz includes an integrated client-side SPA router:

```javascript
import { Jetz } from "jetz";
import { Router, route, link, asLink, asBackLink, redirect } from "jetz/router";
import { div, nav, main } from "jetz/ui";

// Define view components
const HomeView = () => div("Welcome Home");
const AboutView = () => div("About Us");

// Configure router
const appRouter = new Router(
  route("/", HomeView),
  route("/about", AboutView)
);

// Install router into Jetz
Jetz.use(appRouter);

// Compose App Shell
function AppShell() {
  return main(
    nav(
      link("/", div("Home")),
      link("/about", div("About"))
    ),
    // Mount router viewport:
    Jetz.$route.browser()
  );
}

Jetz.mount(AppShell(), document.body);
```

#### Route SEO Metadata

Attach a `head` callback to a route to update the document title and metadata whenever that route is activated. Return one head element or an array of elements; Jetz removes the previously managed route elements while preserving unrelated tags already in `<head>`.

```javascript
import { Router, route } from "jetz/router";
import { title, meta } from "jetz/ui";

const appRouter = new Router(
  route("/", HomeView),
  route("/about", {
    component: AboutView,
    head: () => [
      title("About Jetz"),
      meta({
        name: "description",
        content: "Learn about the Jetz framework."
      })
    ]
  })
);
```

This keeps metadata current during client-side navigation. For search and social crawlers that need metadata in the initial HTML response, use server-side rendering or prerendering as well; client-side updates alone cannot add tags to the response already delivered by the server.

#### Dynamic Route Parameters

Use `:name` for a dynamic path segment. Captured values are URL-decoded and passed to the route component, middleware, and `head` callback. Exact static paths take precedence over dynamic matches.

```javascript
const router = new Router(
  route("/order/:orderId/message", {
    component: ({ orderId }) => div(`Messages for order ${orderId}`),
    head: ({ orderId }) => title(`Messages for order ${orderId}`)
  })
);

router.to("/order/A%2012/message"); // orderId is "A 12"
```

#### Nested Route Groups

Use `group()` to share a path prefix and middleware across nested routes. `route()` defines individual endpoints:

```javascript
import { Jetz } from "jetz";
import { Router, group, route } from "jetz/router";

const routes = [
  route("/", Home),
  group("/admin", {
    middlewares: AuthGuard,
    routes: [
      route("/", Dashboard),
      group("/users", {
        middlewares: [AdminGuard, RoleGuard],
        routes: [
          route("/", UserList),
          route("/:id", UserDetail)
        ]
      })
    ]
  })
];

const router = new Router(routes);
Jetz.use(router);
```

The nested paths resolve to `/admin`, `/admin/users`, and `/admin/users/:id`. Parent middleware runs first, so the user detail route runs `AuthGuard`, `AdminGuard`, then `RoleGuard`.

#### Hash Routing

Hash routing (`#/product`) works without any opt-in: a route-shaped fragment always wins over the pathname, so apps on static hosts without server rewrites stay navigable. Register routes as usual and navigate with a `#` target:

```javascript
const router = new Router(
  route("/", HomeView),
  route("/product", ProductView)
);

router.to("#/product"); // URL becomes /#/product, pathname stays /
```

Loading or typing `index.html#/product` (or `#/product/42` for dynamic segments) boots straight into that route, hash back/forward works through the same `hashchange` listener, and `router.to()` output keeps whichever addressing the navigation used. Plain in-page anchors (`#section`) are never treated as routes — they fall through to the pathname route.

#### Link Helpers

* `asLink("/path", params)`: Event modifier to navigate to a route on click.
* `asBackLink`: Triggers `history.back()` on click.
* `redirect("https://example.com")`: Programmatic full-page navigation.

---

### Route Middlewares

Protect routes with custom middlewares extending `Middleware`:

```javascript
import { Router, route } from "jetz/router";
import { Middleware, middleware } from "jetz/middleware";

class AuthGuard extends Middleware {
  next(params, _continue) {
    const isAuthenticated = Boolean(localStorage.getItem("token"));
    if (!isAuthenticated) {
      return this.deny("User is not authenticated");
    }
    return true; // Allow navigation
  }
}

class AdminGuard extends Middleware {
  next(params, _continue) {
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    if (user?.role !== "admin") {
      return this.deny("Administrator access is required");
    }
    return true;
  }
}

const router = new Router(
  route("/", HomeView),
  // Every guard must return true for navigation to proceed.
  middleware([AuthGuard, AdminGuard],
    route("/admin", AdminView)
  ),
  // Multiple routes can share one middleware too.
  middleware(AuthGuard,
    route("/dashboard", DashboardView),
    route("/settings", SettingsView)
  )
);
```

Middleware arrays run in order. Navigation stops at the first guard that denies it, so `/admin` requires both authentication and the administrator role.

---

### Session Storage (`JetzSession`, `sessionOf`)

Manage persistent browser session state backed by `sessionStorage`:

```javascript
import { Jetz } from "jetz";
import { JetzSession, sessionOf } from "jetz/session";

// 1. Create a managed session
const session = new JetzSession({ user: null, theme: "dark" });
Jetz.use(session); // Exposes Jetz.$session

// Direct property mutations persist automatically:
session.theme = "light";

// Explicit key-value methods:
session.set("user", { id: 1, name: "Alice" });
session.get("user");      // { id: 1, name: "Alice" }
session.has("user");      // true
session.destroy();        // Clear storage and reset defaults

// 2. Standalone reactive session proxy
const localSession = sessionOf({ activeFilter: "all" });
localSession.activeFilter = "completed"; // persisted
```

---

### Dispatcher Pattern

For applications requiring an explicit unidirectional data flow, Jetz includes `Dispatcher`:

```javascript
import { stateOf, Dispatcher } from "jetz";
import { main, nav, ul, li } from "jetz/ui";

const currentPage = stateOf("home");

const dispatcher = new Dispatcher(action => {
  switch (action) {
    case "NAV_HOME":
      currentPage.setState("home");
      break;
    case "NAV_ABOUT":
      currentPage.setState("about");
      break;
  }
});

const App = main(
  nav(
    ul(
      li("Home", { onclick: () => dispatcher.dispatch("NAV_HOME") }),
      li("About", { onclick: () => dispatcher.dispatch("NAV_ABOUT") })
    )
  ),
  currentPage
);
```

---

### Script & Raw HTML Injection

```javascript
import { addScript, html } from "jetz";
import { div } from "jetz/ui";

// Dynamically load an external script with callback
addScript("https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js", {
  async: true,
  onload: () => console.log("Confetti library loaded!")
});

// Render raw HTML safely wrapped in a Raw element
const RawBox = div(html("<strong>Formatted HTML snippet</strong>"));
```

---

### Prototype Extensions & Array Helpers

Jetz provides convenient lightweight utility extensions:

```javascript
import { range, flatMap, createList } from "jetz";

range(1, 4);                     // [1, 2, 3, 4]
flatMap([1, [2, [3]], 4]);       // [1, 2, 3, 4]
createList(3, i => `Item ${i}`); // ['Item 0', 'Item 1', 'Item 2']

// Extended prototypes:
[10, 20, 30].last();             // 30
[10, 20, 30].take(2);            // [10, 20]
(3).range(6);                    // [3, 4, 5, 6]
document.querySelectorAll("li").last(); // Last matched DOM node
```

---

## Real-World Example: Calculator

Here is how real Jetz applications compose state, collections, UI elements, and styling together.

*(Adapted from the built-in [Calculator Demo](file:///c:/Labs/ai/codedev/src/components/calculator/calculator.js))*:

```javascript
import { Jetz, stateOf, listOf, loop } from "jetz";
import { div, h1, button, span, css } from "jetz/ui";

// 1. Reactive State & History Collection
const display = stateOf("0");
const history = listOf();
let currentInput = "0";

function inputDigit(digit) {
  currentInput = currentInput === "0" ? digit : currentInput + digit;
  display.value = currentInput;
}

function clearAll() {
  currentInput = "0";
  display.value = "0";
}

function evaluateResult() {
  const result = String(eval(currentInput) || 0); // Simplified for illustration
  history.push({ expr: currentInput, result });
  currentInput = result;
  display.value = result;
}

// 2. Composable UI Tree
export function CalculatorApp() {
  return div(
    css`max-width: 380px; margin: 40px auto; padding: 20px; font-family: sans-serif;`,
    h1("Jetz Calculator"),

    // Screen display: bound to `display` state
    div(
      css`background: #1e293b; color: #fff; font-size: 32px; padding: 16px; text-align: right; border-radius: 8px;`,
      display
    ),

    // Keypad Grid
    div(
      css`display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px;`,
      button("7", { onclick: () => inputDigit("7") }),
      button("8", { onclick: () => inputDigit("8") }),
      button("9", { onclick: () => inputDigit("9") }),
      button("C", { onclick: clearAll }),

      button("4", { onclick: () => inputDigit("4") }),
      button("5", { onclick: () => inputDigit("5") }),
      button("6", { onclick: () => inputDigit("6") }),
      button("=", { onclick: evaluateResult })
    ),

    // History Panel: reactive loop
    div(
      css`margin-top: 20px; border-top: 1px solid #ccc; padding-top: 12px;`,
      span("History:"),
      loop(history, item => item.expr, item => (
        div(span(`${item.expr} = `), span(item.result))
      ))
    )
  );
}

Jetz.mount(CalculatorApp(), document.body);
```

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       Jetz Application                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Components  │       │   Reactive   │       │  App Layer   │
│  & Elements  │       │    Engine    │       │              │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ • div, p, ...│       │ • stateOf    │       │ • Router     │
│ • Component  │       │ • computed   │       │ • Middleware │
│ • Lifecycle  │       │ • effect     │       │ • Session    │
│ • Binding    │       │ • listOf     │       │ • Dispatcher │
│ • JetzElement│       │ • loop       │       │ • Plugins    │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │    Direct DOM Render    │
                 │ (No Virtual DOM Diffing)│
                 └─────────────────────────┘
```

---

## API Quick Reference

### State & Reactivity
* [`stateOf(initialValue)`](#3-reactive-state-stateof-rememberof): Create reactive single value.
* [`rememberOf(key, initialValue)`](#3-reactive-state-stateof-rememberof): Reactive value persisted in `localStorage`.
* [`computed(fn)`](#4-computed-state-computed): Auto-tracked derived state.
* [`effect(fn)`](#5-side-effects-effect): Auto-tracked imperative effect (returns `dispose`).
* [`listen(callback)`](#11-reactive-listeners-listen): Reactive inline listener attached to element.
* [`shallowStateOf(object)`](#shallow-row-state-shallowstateof-rowof): Row-level record with one shared version signal.
* [`rowOf(object)`](#shallow-row-state-shallowstateof-rowof): Alias of `shallowStateOf()` tuned for table records.
* [`rawOf(row)`](#untracked-pipeline-reads-rawof): Untracked read of a shallow row's plain data.
* [`touchRow(row)`](#untracked-pipeline-reads-rawof): Manually bump a shallow row's version.

### Collections & Reconciliation
* [`listOf(...items)`](#6-reactive-collections-listof-sequenceof): Reactive array with helper mutation methods.
* [`sequenceOf(...items)`](#6-reactive-collections-listof-sequenceof): Reactive unique sequence array.
* [`loop(list, keyFn, renderFn)`](#7-keyed-list-reconciliation-loop): Key-reconciled list rendering; each item gets an automatic disposal scope.
* [`element.disposeBindings()`](#manual-cleanup-disposebindings): Release every reactive binding of an element and its subtree.

### Conditional Rendering
* [`_if(conditionFn)`](#8-conditional-rendering-_if-_elseif-_else-ifelse): Conditional branch render.
* [`_elseif(conditionFn)`](#8-conditional-rendering-_if-_elseif-_else-ifelse): Alternate conditional branch.
* [`_else`](#8-conditional-rendering-_if-_elseif-_else-ifelse): Default branch.
* [`ifElse(cond, trueFn, falseFn)`](#8-conditional-rendering-_if-_elseif-_else-ifelse): Inline two-way conditional.

### Component & Lifecycle
* [`Component`](#2-components-functions--classes): Base class for OOP-style components.
* [`onCreate(fn)`](#9-component-lifecycle): Runs before initial render.
* [`onMount(fn)`](#9-component-lifecycle): Runs after DOM attachment.
* [`onUpdate(fn)`](#9-component-lifecycle): Runs on subsequent state changes.
* [`onDestroy(fn)`](#9-component-lifecycle): Runs on DOM removal.

### Routing & Session
* [`Router`, `route`](#router--link-navigation): Dynamic SPA client routing.
* [`link`, `asLink`, `asBackLink`](#router--link-navigation): Route navigation helpers.
* [`Middleware`, `middleware`](#route-middlewares): Navigation guards.
* [`JetzSession`, `sessionOf`](#session-storage-jetzsession-sessionof): Reactive session store.

### Application & Utilities
* [`Jetz.mount(App, container)`](#quick-start): Mount application to DOM.
* [`Jetz.unmount(container)`](#12-dom-utilities--helper-methods): Cleanly teardown mounted elements.
* [`Jetz.style(cssString)`](#quick-start): Inject dynamic `<style>` rules.
* [`Jetz.use(plugin)`](#router--link-navigation): Install plugin (e.g. Router, Session).
* [`find(selector)`, `findAll(selector)`](#12-dom-utilities--helper-methods): DOM query helpers.

---

## Testing

Jetz is backed by three test suites covering all features, reactivity, and browser environments:

```bash
# 1. Fast unit suite (Vitest + jsdom)
pnpm test:unit

# 2. Browser smoke suite (Puppeteer / real Chrome & Edge)
pnpm test:smoke

# 3. Built pages assertion suite (Rspack bundle verification)
pnpm test:pages

# Run all suites together:
pnpm test
```

---

## Development & Build

This repository is organized as a workspace with fast builds powered by [Rspack](https://rspack.dev):

```bash
# Install dependencies
pnpm install

# Watch mode for active development
pnpm watch

# Start local development server
pnpm start

# Create optimized production build
pnpm build
```

---

## Publishing

The shippable npm package is located under `packages/jetz`:

```bash
cd packages/jetz

# Validate exports and generate TypeScript stubs
npm run check-exports

# Publish package
npm publish --access public
```

---

## License & Community

Jetz is open-source software licensed under the [ISC License](file:///c:/Labs/ai/codedev/LICENSE).

* **Repository:** [https://github.com/devarofi/jetz](https://github.com/devarofi/jetz)
* **Author:** [@daevsoft](https://github.com/devarofi)
* **Issues & Feedback:** [GitHub Issues](https://github.com/devarofi/jetz/issues)

If you find Jetz helpful, please give the repository a ⭐ on GitHub!
