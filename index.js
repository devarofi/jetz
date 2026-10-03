import { App } from "./src/components/App.js";
import { Router } from "./src/lib/jetz-router.js";
import { Jetz } from "./src/lib/jetz.js";
import { JetzDevtools } from "./src/lib/jetz-devtools.js";
import { find } from "./src/lib/jetz-ui.js";
import { routeWeb } from "./route/web.js";
App.displayName = "App";
let router = new Router(routeWeb)

Jetz.use(router);
Jetz.use(new JetzDevtools());
Jetz.mount(App, find('#app'));