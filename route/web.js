const { Home } = require("../src/components/home/home-component");
const { ToDo } = require("../src/components/todo/Todo");
const { route } = require("../src/lib/jetz-router");

export let routeWeb = [
    route('/', Home),
    route('open-todo', ToDo)
]