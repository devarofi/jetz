import { Component, batch, computed, effect, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, inputText, p, span } from "../../lib/jetz-ui.js";
import { codeBlock, lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm space-y-4 rounded-xl border border-zinc-700 bg-[#09090b] p-5`;

function tutorialSection(title, summary, source, explanation) {
    return div(css`mt-8`,
        h2(css`text-xl font-semibold text-white`, title),
        p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`, summary),
        div(css`mt-4`, codeBlock(source, "javascript", "Example.js", "JAVASCRIPT", explanation))
    );
}

export class DocsReactivity extends Component {
    render() {
        const price = stateOf(25);
        const quantity = stateOf(2);
        const total = computed(() => price.value * quantity.value);
        const log = stateOf("Change price or quantity to re-run the effect.");
        const renders = stateOf(0);
        const bulkA = stateOf(1);
        const bulkB = stateOf(2);

        effect(() => {
            const next = `Total is $${total.value} (${quantity.value} x $${price.value}).`;
            if (log.peek() !== next) log.value = next;
        });
        effect(() => {
            bulkA.value;
            bulkB.value;
            renders.value = renders.peek() + 1;
        });

        return lesson("/docs/reactivity", "Reactivity", "Derive values and run effects",
            "Reactive code responds to State values that it reads. Use computed() when you need a value derived from other values, and effect() when you need to synchronize with something outside the UI. Follow these examples to understand dependency tracking, cleanup, safe reads, and grouped updates.",
            lessonExample(
                'import { computed, effect, stateOf } from "@daevsoft/jetz";\n' +
                'import { inputText, p } from "@daevsoft/jetz/ui";\n\n' +
                'const price = stateOf(25);\n' +
                'const quantity = stateOf(2);\n' +
                'const total = computed(() => price.value * quantity.value);\n\n' +
                'effect(() => {\n' +
                '  console.log(`Total: $${total.value}`);\n' +
                '});\n\n' +
                'price.value = 30; // total updates and the effect runs again',
                div(css`w-full max-w-sm space-y-4 rounded-xl border border-zinc-700 bg-[#09090b] p-5`,
                    span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Computed + effect"),
                    div(css`grid grid-cols-2 gap-3`,
                        inputText({ bind: price, type: "number", "aria-label": "Price" }, css`min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
                        inputText({ bind: quantity, type: "number", "aria-label": "Quantity" }, css`min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`)
                    ),
                    p(css`text-base font-semibold text-white`, "Total: $", total),
                    p(css`text-sm text-zinc-400`, log)
                ),
                "price and quantity are source States. computed() multiplies them to produce total. The effect reads total, so it runs once at setup and again when either input changes. Try changing both inputs."
            ),
            tutorialSection(
                "Step 1: Calculate values with computed()",
                "Use computed() for a value that can be calculated from other State values. The calculation runs once when created and again when a value it read changes. You can build on another computed value to keep related calculations clear.",
                'import { computed, stateOf } from "@daevsoft/jetz";\n\n' +
                'const price = stateOf(40);\n' +
                'const quantity = stateOf(3);\n' +
                'const subtotal = computed(() => price.value * quantity.value);\n' +
                'const tax = computed(() => subtotal.value * 0.1);\n' +
                'const total = computed(() => subtotal.value + tax.value);\n\n' +
                'console.log(total.value); // 132\n' +
                'quantity.value = 2;\n' +
                'console.log(total.value); // 88',
                "Each computed callback reads its inputs with .value. Jetz tracks those reads and refreshes dependent calculations when an input changes. Use computed values to describe data; use effect() for actions such as writing to storage or changing the document title."
            ),
            tutorialSection(
                "Step 2: Run side effects and clean them up",
                "effect() is for synchronizing Jetz with an external system, such as browser storage, a document title, or a logging service. It runs immediately, tracks State values read inside it, and returns a function that stops future runs.",
                'import { effect, stateOf } from "@daevsoft/jetz";\n\n' +
                'const count = stateOf(0);\n' +
                'const stop = effect(() => {\n' +
                '  document.title = `Count: ${count.value}`;\n' +
                '  localStorage.setItem("saved-count", String(count.value));\n' +
                '});\n\n' +
                'count.value++;\n' +
                'stop(); // later changes no longer run this effect',
                "The effect reads count.value, so count becomes its dependency. When this work is tied to a component or reactive branch, Jetz can dispose of it when that scope is removed. Call the returned stop function when managing an effect manually."
            ),
            tutorialSection(
                "Step 3: Understand tracked and untracked reads",
                "Reading state.value inside computed() or effect() subscribes that calculation to the State. Use state.peek() when you only need the current value and do not want it to become a dependency. This is useful when an effect checks its output before writing.",
                'import { effect, stateOf } from "@daevsoft/jetz";\n\n' +
                'const source = stateOf(1);\n' +
                'const message = stateOf("");\n\n' +
                'effect(() => {\n' +
                '  const next = `Current value: ${source.value}`;\n' +
                '  if (message.peek() !== next) {\n' +
                '    message.value = next;\n' +
                '  }\n' +
                '});',
                "This effect subscribes to source because it reads source.value. message.peek() checks the current message without subscribing to message, so writing the new message does not make the effect depend on its own output."
            ),
            div(css`mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5`,
                h2(css`text-base font-semibold text-amber-200`, "Avoid effects that trigger themselves"),
                p(css`mt-2 text-sm leading-7 text-zinc-300`,
                    "An effect that reads a State and then writes to that same State usually schedules itself again. Prefer computed() when a value is derived from another value. If an effect must compare its output before writing, read that output with peek()."
                )
            ),
            tutorialSection(
                "Step 4: Group related writes with batch()",
                "batch() groups multiple State and list changes from one action. The values are assigned immediately, but Jetz waits until the callback completes before notifying dependent calculations and updating the page. This avoids intermediate UI states and redundant work.",
                'import { batch, computed, effect, stateOf } from "@daevsoft/jetz";\n\n' +
                'const firstName = stateOf("Ada");\n' +
                'const lastName = stateOf("Lovelace");\n' +
                'const fullName = computed(() =>\n' +
                '  `${firstName.value} ${lastName.value}`\n' +
                ');\n' +
                'const stop = effect(() => {\n' +
                '  console.log(fullName.value);\n' +
                '});\n\n' +
                'batch(() => {\n' +
                '  firstName.value = "Grace";\n' +
                '  lastName.value = "Hopper";\n' +
                '}); // effect sees "Grace Hopper" once\n\n' +
                'stop();',
                "Without batch(), an observer could see a new first name with the old last name before the second assignment. With batch(), dependent work runs after both names have changed. batch() does not make slow synchronous JavaScript run in the background."
            ),
            tutorialSection(
                "Step 5: Try the batched update",
                "Use the button to change two values at once. The effect observes both States and increments its run counter once for the batch.",
                'import { batch, effect, stateOf } from "@daevsoft/jetz";\n\n' +
                'const left = stateOf(1);\n' +
                'const right = stateOf(2);\n' +
                'const runs = stateOf(0);\n\n' +
                'effect(() => {\n' +
                '  left.value;\n' +
                '  right.value;\n' +
                '  runs.value = runs.peek() + 1;\n' +
                '});\n\n' +
                'function updateBoth() {\n' +
                '  batch(() => {\n' +
                '    left.value++;\n' +
                '    right.value++;\n' +
                '  });\n' +
                '}',
                div(CARD,
                    span(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "batch()"),
                    p(css`text-sm text-zinc-300`, "left: ", bulkA, " · right: ", bulkB),
                    p(css`text-sm text-zinc-400`, "effect runs: ", renders),
                    button({
                        type: "button",
                        onclick: () => {
                            batch(() => {
                                bulkA.value++;
                                bulkB.value++;
                            });
                        },
                    }, css`rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950`, "Update both")
                ),
                "The effect reads left and right, but uses runs.peek() when incrementing its counter so it does not subscribe to its own output. Click Update both to change both States in a single batch."
            )
        );
    }
}
