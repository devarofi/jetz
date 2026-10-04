// Route table — import every route component here.
import { group, route } from "../src/lib/jetz-router.js";
import { title } from "../src/lib/jetz-ui.js";
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

export let routeWeb = [
    route('/', titled(Home, "Home")),
    route('playground', titled(Playground, "Playground")),
    group('/docs', {
        routes: [
            route('/', titled(DocsOverview, "Documentation")),
            route('/quick-start', titled(DocsQuickStart, "Quick start")),
            route('/elements', titled(DocsElements, "Elements & attributes")),
            route('/composition', titled(DocsComposition, "UI composition")),
            route('/reactive-state', titled(DocsReactiveState, "State & persistence")),
            route('/reactivity', titled(DocsReactivity, "Computed & effects")),
            route('/collections', titled(DocsCollections, "Lists & conditionals")),
            route('/lifecycle', titled(DocsLifecycle, "Binding & lifecycle")),
            route('/performance', titled(DocsPerformance, "Large data sets")),
            route('/components', titled(DocsComponents, "Components")),
            route('/routing', titled(DocsRouting, "Routing & middleware")),
            route('/integrations', titled(DocsIntegrations, "Sessions & utilities")),
            route('/devtools', titled(DocsDevtools, "DevTools & testing")),
            route('/api-reference', titled(DocsApiReference, "API reference")),
            route('/api/state', titled(DocsApiState, "Reactive state API")),
            route('/api/collections', titled(DocsApiCollections, "Collections & branching API")),
            route('/api/components', titled(DocsApiComponents, "Components & lifecycle API")),
            route('/api/elements', titled(DocsApiElements, "Elements & utilities API")),
            route('/api/application', titled(DocsApiApplication, "Routing & application API")),
            route('/next-steps', titled(DocsNextSteps, "Next steps")),
        ],
    }),
    route('my', titled(TryMe, "Try Jetz")),
    route('open-todo', titled(ToDo, "Tasks")),
    route('counter', titled(counter, "Counter")),
    route('remember-todo', titled(RememberTodo, "Saved tasks")),
    route('calculator', titled(Calculator, "Calculator"))
];
