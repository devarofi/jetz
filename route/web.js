// Route table — import every route component here.
import { route } from "../src/lib/jetz-router.js";
import { Landing } from "../src/components/landing/landing.js";
import { Home } from "../src/components/home/home-component.js";
import { ToDo } from "../src/components/todo/Todo.js";
import { counter } from "../src/components/counter/counter.js";
import { Calculator } from "../src/components/calculator/calculator.js";
import ToDoComponent from "../src/components/todo/todo-component.js";
import { RememberTodo } from "../src/components/todo/todo-remember.js";

export let routeWeb = [
    route('/', Home),
    route('landing', Landing),
    route('open-todo', ToDo),
    route('counter', counter),
    route('remember-todo', RememberTodo),
    route('calculator', Calculator)
];

