import { computed, Jetz, listOf, loop, stateOf } from "@daevsoft/jetz";
import { button, css, div, h2, inputText, li, p, ul, input, type, inputCheckbox } from "@daevsoft/jetz/ui";

const initialTasks = [
    { id: 201, done: true, title: "Sketch the onboarding flow" },
    { id: 202, done: false, title: "Review the component API" }
];
const tasks = listOf(...initialTasks).toState().asRemember('tasks');

let nextId = Math.max(202, ...tasks.values.map(task => task.id.value)) + 1;

export const RememberTodo = div(css`preview-card`,
    p(css`preview-eyebrow`, "EDITABLE KEYED ITEMS"),
    h2("A tiny project task list"),
    p("Edit each title in place, then add another task."),
    ul(css`preview-list task-list`, loop(
        tasks,
        task => task.id,
        task => li(css`task-row`,
            div(css`inline`,
                inputCheckbox({ bind: task.done }),
                computed(() => task.done.value ? 'task was done' : 'no yet done'),
                p(css`task-number ${() => task.done.value ? 'completed' : ''}`, "TASK ", task.id, ' - ', task.title),
            ),
            inputText({
                bind: task.title,
                placeholder: "Task title"
            })
        )
    )),
    button("Add a task", {
        onclick: () => {
            console.log('Adding a new task');
            tasks.push({
                id: nextId++,
                done: false,
                title: `New task ${nextId - 1}`
            });
        }
    })
);