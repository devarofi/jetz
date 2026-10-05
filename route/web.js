// Route table — import every route component here.
import { group, route } from "../src/lib/jetz-router.js";
import { title, link as headLink } from "../src/lib/jetz-ui.js";
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

function titled(component, pageTitle) {
    return {
        component,
        head: () => title(`${pageTitle} | Jetz`),
    };
}

function docsTitled(component, pageTitle) {
    return {
        component,
        head: () => [
            title(`${pageTitle} | Jetz`),
            headLink({ rel: "icon", type: "image/png", href: logoUrl }),
        ],
    };
}

export let routeWeb = [
    route('/', titled(Home, "Home")),
    route('playground', titled(Playground, "Playground")),
    group('/docs', {
        routes: [
            route('/', docsTitled(DocsOverview, "Documentation")),
            route('/quick-start', docsTitled(DocsQuickStart, "Quick start")),
            route('/elements', docsTitled(DocsElements, "Elements & attributes")),
            route('/composition', docsTitled(DocsComposition, "UI composition")),
            route('/reactive-state', docsTitled(DocsReactiveState, "State & persistence")),
            route('/reactivity', docsTitled(DocsReactivity, "Computed & effects")),
            route('/collections', docsTitled(DocsCollections, "Lists & conditionals")),
            route('/lifecycle', docsTitled(DocsLifecycle, "Binding & lifecycle")),
            route('/performance', docsTitled(DocsPerformance, "Large data sets")),
            route('/components', docsTitled(DocsComponents, "Components")),
            route('/routing', docsTitled(DocsRouting, "Routing & middleware")),
            route('/integrations', docsTitled(DocsIntegrations, "Sessions & utilities")),
            route('/devtools', docsTitled(DocsDevtools, "DevTools & testing")),
            route('/api-reference', docsTitled(DocsApiReference, "API reference")),
            route('/api/state', docsTitled(DocsApiState, "Reactive state API")),
            route('/api/collections', docsTitled(DocsApiCollections, "Collections & branching API")),
            route('/api/components', docsTitled(DocsApiComponents, "Components & lifecycle API")),
            route('/api/elements', docsTitled(DocsApiElements, "Elements & utilities API")),
            route('/api/application', docsTitled(DocsApiApplication, "Routing & application API")),
            route('/next-steps', docsTitled(DocsNextSteps, "Next steps")),
        ],
    }),
    route('my', titled(TryMe, "Try Jetz")),
    route('open-todo', titled(ToDo, "Tasks")),
    route('counter', titled(counter, "Counter")),
    route('remember-todo', titled(RememberTodo, "Saved tasks")),
    route('calculator', titled(Calculator, "Calculator"))
];
