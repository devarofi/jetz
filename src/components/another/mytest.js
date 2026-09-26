import { Jetz, listOf, loop, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, inputText, li, p, ul, input, type, inputCheckbox } from "../../lib/jetz-ui.js";

const tasks = listOf(
  stateOf({ id: 201, done: true, title: "Sketch the onboarding flow" }),
  stateOf({ id: 202, done: false, title: "Review the component API" })
);
let nextId = 203;

export const MyTest = div(css`preview-card`,
    p(css`preview-eyebrow`, "EDITABLE KEYED ITEMS"),
    h2("A tiny project task list"),
    p("Edit each title in place, then add another task."),
    ul(css`preview-list task-list`, loop(
      tasks,
      task => task.id.value,
      task => li(css`task-row`,
        div(css`inline`,
        inputCheckbox({ bind: task.done }),
        p(css`task-number ${() => task.done.value ? 'completed' : ''}`, "TASK ", task.id, ' - ', task.title),
        ),
        inputText({
          bind: task.title,
          placeholder: "Task title"
        })
      )
    )),
    button("Add a task", {
      onclick: () => tasks.push(stateOf({
        id: nextId++,
        title: `New task ${nextId - 1}`
      }))
    })
  );