// Route table — import every route component here.
import { group, route } from "../src/lib/jetz-router.js";
import { title, link as headLink, meta } from "../src/lib/jetz-ui.js";
import logoUrl from "../public/img/logo/small.png";
import { Landing } from "../src/components/landing/landing.js";
import { Home } from "../src/components/home/home-component.js";
import { ToDo } from "../src/components/todo/Todo.js";
import { counter } from "../src/components/counter/counter.js";
import { Calculator } from "../src/components/calculator/calculator.js";
import ToDoComponent from "../src/components/todo/todo-component.js";
import { RememberTodo } from "../src/components/todo/todo-remember.js";
import { Playground } from "../src/components/playground/playground.js";
import { DocsOverview } from "../src/components/docs/docs-overview.js";
import { DocsQuickStart } from "../src/components/docs/docs-quick-start.js";
import { DocsComposition } from "../src/components/docs/docs-composition.js";
import { DocsReactiveState } from "../src/components/docs/docs-reactive-state.js";
import { DocsComponents } from "../src/components/docs/docs-components.js";
import { DocsRouting } from "../src/components/docs/docs-routing.js";
import { DocsNextSteps } from "../src/components/docs/docs-next-steps.js";
import { DocsElements } from "../src/components/docs/docs-elements.js";
import { DocsReactivity } from "../src/components/docs/docs-reactivity.js";
import { DocsCollections } from "../src/components/docs/docs-collections.js";
import { DocsLifecycle } from "../src/components/docs/docs-lifecycle.js";
import { DocsPerformance } from "../src/components/docs/docs-performance.js";
import { DocsIntegrations } from "../src/components/docs/docs-integrations.js";
import { DocsDevtools } from "../src/components/docs/docs-devtools.js";
import { DocsApiReference } from "../src/components/docs/docs-api-reference.js";
import {
    DocsApiApplication, DocsApiCollections, DocsApiComponents, DocsApiElements, DocsApiState,
} from "../src/components/docs/docs-api-tutorials.js";
import { TryMe } from "../src/components/my/tryme.js";

const SITE_URL = 'https://devarofi.github.io/jetz';

function seoHead(pageTitle, description, routePath = "/") {
    const canonicalUrl = `${SITE_URL}${routePath === "/" ? "" : routePath}`;
    const fullTitle = `${pageTitle} | Jetz`;

    return [
        title(fullTitle),
        meta({ name: "description", content: description }),
        meta({ name: "robots", content: "index, follow" }),
        meta({ property: "og:title", content: fullTitle }),
        meta({ property: "og:description", content: description }),
        meta({ property: "og:type", content: "website" }),
        meta({ property: "og:url", content: canonicalUrl }),
        meta({ property: "og:site_name", content: "Jetz" }),
        meta({ name: "twitter:card", content: "summary_large_image" }),
        meta({ name: "twitter:title", content: fullTitle }),
        meta({ name: "twitter:description", content: description }),
        headLink({ rel: "canonical", href: canonicalUrl }),
    ];
}

function titled(component, pageTitle, description, routePath = "/") {
    return {
        component,
        head: () => seoHead(pageTitle, description, routePath),
    };
}

function docsTitled(component, pageTitle, description, routePath = "/") {
    return {
        component,
        head: () => [
            ...seoHead(pageTitle, description, routePath),
            headLink({ rel: "icon", type: "image/png", href: logoUrl }),
        ],
    };
}

export let routeWeb = [
    route('/', titled(Home, "Home", "Jetz is a lightweight reactive JavaScript framework for building modern, stateful user interfaces with expressive routing and component composition.", "/")),
    route('playground', titled(Playground, "Playground", "Experiment with Jetz in a live playground for reactive state, routing, and UI composition.", "/playground")),
    group('/docs', {
        routes: [
            route('/', docsTitled(DocsOverview, "Documentation", "Explore the Jetz documentation for routing, state, components, reactivity, middleware, and performance guidance.", "/docs")),
            route('/quick-start', docsTitled(DocsQuickStart, "Quick start", "Learn the fastest way to install Jetz and build your first reactive app with modern JavaScript patterns.", "/docs/quick-start")),
            route('/elements', docsTitled(DocsElements, "Elements & attributes", "Use Jetz elements, attributes, and layout primitives to build clean, responsive interfaces with minimal boilerplate.", "/docs/elements")),
            route('/composition', docsTitled(DocsComposition, "UI composition", "Compose reusable UI with Jetz components, layout helpers, and modular page structures.", "/docs/composition")),
            route('/reactive-state', docsTitled(DocsReactiveState, "State & persistence", "Manage reactive state, persistence, and local data flows in Jetz applications.", "/docs/reactive-state")),
            route('/reactivity', docsTitled(DocsReactivity, "Computed & effects", "Use computed values and effects in Jetz to drive reactive interfaces without complex state plumbing.", "/docs/reactivity")),
            route('/collections', docsTitled(DocsCollections, "Lists & conditionals", "Render lists, loops, and branches in Jetz with efficient reactive updates and composable patterns.", "/docs/collections")),
            route('/lifecycle', docsTitled(DocsLifecycle, "Binding & lifecycle", "Work with Jetz binding, component lifecycle hooks, and update timing for robust interactive pages.", "/docs/lifecycle")),
            route('/performance', docsTitled(DocsPerformance, "Large data sets", "Handle large data sets and performance-sensitive UI work with efficient Jetz patterns.", "/docs/performance")),
            route('/components', docsTitled(DocsComponents, "Components", "Create reusable Jetz components with state, lifecycle methods, and clean composition patterns.", "/docs/components")),
            route('/routing', docsTitled(DocsRouting, "Routing & middleware", "Route between pages, guard access with middleware, and manage SEO-friendly metadata in Jetz.", "/docs/routing")),
            route('/integrations', docsTitled(DocsIntegrations, "Sessions & utilities", "Integrate Jetz sessions and utilities for persistent state, navigation, and app tooling.", "/docs/integrations")),
            route('/devtools', docsTitled(DocsDevtools, "DevTools & testing", "Use Jetz DevTools and testing utilities to inspect state, debug routes, and validate app behavior.", "/docs/devtools")),
            route('/api-reference', docsTitled(DocsApiReference, "API reference", "Browse the Jetz API reference for public utilities, component helpers, and routing primitives.", "/docs/api-reference")),
            route('/api/state', docsTitled(DocsApiState, "Reactive state API", "Reference the reactive state API in Jetz for signals, computed values, and updates.", "/docs/api/state")),
            route('/api/collections', docsTitled(DocsApiCollections, "Collections & branching API", "Inspect the Jetz collections and branching API for loops, conditionals, and list-driven views.", "/docs/api/collections")),
            route('/api/components', docsTitled(DocsApiComponents, "Components & lifecycle API", "Review the Jetz component, lifecycle, and composition API for building reusable interfaces.", "/docs/api/components")),
            route('/api/elements', docsTitled(DocsApiElements, "Elements & utilities API", "Explore the Jetz element and utility API for attributes, styling, and DOM helpers.", "/docs/api/elements")),
            route('/api/application', docsTitled(DocsApiApplication, "Routing & application API", "Understand the Jetz routing and application API for mounting, routing, and navigation.", "/docs/api/application")),
            route('/next-steps', docsTitled(DocsNextSteps, "Next steps", "Continue learning Jetz with advanced patterns, integrations, and production-ready project guidance.", "/docs/next-steps")),
        ],
    }),
    route('my', titled(TryMe, "Try Jetz", "Try Jetz in a browser-based environment and explore a small, interactive app built with the framework.", "/my")),
    route('open-todo', titled(ToDo, "Tasks", "Manage tasks and work items with Jetz using a lightweight, reactive to-do interface.", "/open-todo")),
    route('counter', titled(counter, "Counter", "Use Jetz to build a tiny counter example with reactive state and direct UI updates.", "/counter")),
    route('remember-todo', titled(RememberTodo, "Saved tasks", "Keep track of saved tasks in Jetz with persistence-friendly state and local data handling.", "/remember-todo")),
    route('calculator', titled(Calculator, "Calculator", "Build a compact calculator UI with Jetz and reactive state updates for instant feedback.", "/calculator"))
];
