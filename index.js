import { App } from "./src/components/App";
import { Router } from "./src/lib/jetz-router";
import { Jetz } from "./src/lib/jetz";
import { find } from "./src/lib/jetz-ui";
import { routeWeb } from "./route/web";
let router = new Router(routeWeb)

Jetz.use(router);

Jetz.mount(App, find('#app'));