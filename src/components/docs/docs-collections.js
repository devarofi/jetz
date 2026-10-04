import { Component, createList, ifElse, listOf, loop, range, sequenceOf, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, li, p, span, ul } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const BTN = css`mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950`;

export class DocsCollections extends Component {
    render() {
        const tasks = listOf("Read the quick start", "Build a tiny app");
        const users = listOf(
            { id: 101, name: "Ada Lovelace" },
            { id: 102, name: "Grace Hopper" }
        );
        let nextId = 103;
        const online = stateOf(true);
        const numbers = range(1, 3);
        const cards = createList(3, i => `row-${i}`);
        const tags = sequenceOf("a", "b");
        tags.push("c");

        return lesson("/docs/collections", "Reactivity", "Render lists and branches",
            "Use listOf() for a list that can change. loop() creates one set of elements for each item and updates the page when the list changes. Give each item a key when it has a stable ID, so Jetz can recognize items after they move. Use ifElse() or the _if / _elseif / _else helpers to show content only when a condition is true.",
            lessonExample(
                'import { listOf, loop } from "@daevsoft/jetz";\n' +
                'import { button, li, ul } from "@daevsoft/jetz/ui";\n\n' +
                'const tasks = listOf("Read the quick start", "Build a tiny app");\n\n' +
                'ul(\n' +
                '  loop(tasks, task => li(task)),\n' +
                '  button("Add a task", {\n' +
                '    onclick: () => tasks.push(`New task ${tasks.size + 1}`)\n' +
                '  })\n' +
                '); // each push appends exactly one row',
                div(CARD,
                    span(EYEBROW, "Unkeyed list"),
                    div(css`mt-4`, ul(css`space-y-2 text-sm text-zinc-200`, loop(tasks, task => li(task)))),
                    button({ type: "button", onclick: () => tasks.push(`New task ${tasks.size + 1}`) }, BTN, "Add a task")
                ),
                "listOf() stores the tasks. loop() turns each task into a list item, and push() adds another task when the button is clicked. The new row appears without rebuilding the entire page."
            ),
            div(css`mt-6`, lessonExample(
                'import { listOf, loop } from "@daevsoft/jetz";\n' +
                'import { button, li, ul } from "@daevsoft/jetz/ui";\n\n' +
                'const users = listOf(\n' +
                '  { id: 101, name: "Ada Lovelace" },\n' +
                '  { id: 102, name: "Grace Hopper" }\n' +
                ');\n' +
                'let nextId = 103;\n\n' +
                'ul(\n' +
                '  loop(users, user => user.id, user => li(user.name)),\n' +
                '  button("Add a person", {\n' +
                '    onclick: () => users.push({ id: nextId, name: `New person ${nextId++}` })\n' +
                '  })\n' +
                '); // IDs help Jetz keep each person matched to their row',
                div(CARD,
                    span(EYEBROW, "Keep list items matched by ID"),
                    div(css`mt-4`, ul(css`space-y-2 text-sm text-zinc-200`, loop(users, user => user.id, user => li(user.name)))),
                    button({
                        type: "button",
                        onclick: () => { users.push({ id: nextId, name: `New person ${nextId}` }); nextId++; }
                    }, BTN, "Add a person")
                ),
                "Each person has a unique id. The key function user => user.id lets Jetz keep track of the same person if the list is reordered. Click the button to add a person with a new id."
            )),
            div(css`mt-6`, lessonExample(
                'import { ifElse, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const online = stateOf(true);\n\n' +
                'div(\n' +
                '  p("Status: ", ifElse(() => online.value, () => "Online", () => "Offline")),\n' +
                '  button("Toggle status", {\n' +
                '    onclick: () => { online.value = !online.value; }\n' +
                '  })\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Conditional branch"),
                    p(css`mt-4 text-sm text-white`, "Status: ", ifElse(() => online.value, () => "Online", () => "Offline")),
                    button({ type: "button", onclick: () => { online.value = !online.value; } }, BTN, "Toggle status")
                ),
                "ifElse() reads online.value and chooses the text to display. The button changes that State between true and false, so the displayed status switches between Online and Offline."
            )),
            div(css`mt-8 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Mutations stay surgical"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Methods such as push(), pop(), splice(), and removeAt() change the list and update its displayed rows. Use keyed lists when rows contain input fields or other content that should stay with the same item as the order changes.")
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Branch placement"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Put a condition helper inside the element whose content should change. Use _if / _elseif / _else for blocks of content. Use ifElse() when you want to choose a value or element inline.")
                )
            ),
            div(css`mt-4`, lessonExample(
                'import { createList, loop, range, sequenceOf } from "@daevsoft/jetz";\n' +
                'import { div, li, p, ul } from "@daevsoft/jetz/ui";\n\n' +
                'const numbers = range(1, 3); // [1, 2, 3]\n' +
                'const cards = createList(3, i => `row-${i}`); // ["row-0", "row-1", "row-2"]\n' +
                'const tags = sequenceOf("a", "b");\n' +
                'tags.push("c"); // unique-value list\n\n' +
                'div(\n' +
                '  p("range: ", numbers.join(", ")),\n' +
                '  p("createList: ", cards.join(", ")),\n' +
                '  ul(loop(tags, tag => li(tag)))\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Array helpers"),
                    p(css`mt-4 text-sm text-zinc-300`, "range: ", numbers.join(", ")),
                    p(css`mt-1 text-sm text-zinc-300`, "createList: ", cards.join(", ")),
                    div(css`mt-3`, ul(css`space-y-1 text-sm text-zinc-200`, loop(tags, tag => li(tag))))
                ),
                "range(1, 3) creates the numbers 1 through 3. createList() calls its function three times to make labels. sequenceOf() creates a list that ignores duplicate values; here it contains a, b, and c."
            ))
        );
    }
}
