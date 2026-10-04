import { Component, computed, html, ifElse, listen, onCreate, onDestroy, onMount, onUpdate, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, inputText, p, span } from "../../lib/jetz-ui.js";
import { lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;
const BTN = css`mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950`;

export class DocsLifecycle extends Component {
    log = stateOf("Ready. Toggle the clock to see mount and destroy.");
    showClock = stateOf(true);

    render() {
        const name = stateOf("Ada");
        const greetingName = stateOf("Ada");
        const clockAction = computed(() => this.showClock.value ? "Remove clock" : "Restore clock");
        const clockPreview = () => Clock(this.log);
        function Greeting({ name }) {
            return p(css`mt-2 text-sm text-zinc-300`, "Hello, ", name);
        }
        const GreetingForUser = () => Greeting({ name: greetingName });

        return lesson("/docs/lifecycle", "Reactivity", "Bind inputs and manage lifecycles",
            "Bind an input to a State to keep what the user types and the page value in sync. A component's lifecycle is the sequence of events from setup to removal. Use hooks to prepare it, start work after it appears on the page, respond to updates, and clean up when it is removed. The examples below show both patterns.",
            lessonExample(
                'import { listen, stateOf } from "@daevsoft/jetz";\n' +
                'import { div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
                'const name = stateOf("Ada");\n\n' +
                'div(\n' +
                '  inputText({ bind: name, placeholder: "Your name" }),\n' +
                '  p("Hello, ", name),\n' +
                '  div(\n' +
                '    listen(parent => parent.addClass(`has-${name.value.length}-chars`)),\n' +
                '    p("listen() tags this box with the current name length.")\n' +
                '  )\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Two-way binding"),
                    inputText({ bind: name, placeholder: "Your name", "aria-label": "Your name" }, css`w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
                    p(css`text-sm text-zinc-200`, "Hello, ", name),
                    div(listen(parent => parent.addClass(`has-${name.value.length}-chars`)), p(css`text-xs text-zinc-500`, "listen() runs code for this element and adds a class based on the current name length."))
                ),
                "bind connects the input to the name State in both directions, so typing updates the greeting and State. listen() runs for its parent element and adds a class based on the current name length."
            ),
            div(css`mt-8`,
                h2(css`text-xl font-semibold text-white`, "Pass values to a function component"),
                p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`,
                    "To give a nested function component a value: (1) let the child accept the value, (2) store changing data in a State, (3) make a wrapper that passes the State to the child, and (4) pass the wrapper itself to the parent element. Jetz calls the wrapper, and the child updates when the State changes. Do not pass Greeting(name.value) when you want a separate child lifecycle; that calls the function immediately."
                ),
                lessonExample(
                    'import { stateOf } from "@daevsoft/jetz";\n' +
                    'import { div, inputText, p } from "@daevsoft/jetz/ui";\n\n' +
                    'function Greeting({ name }) {\n' +
                    '  return p("Hello, ", name);\n' +
                    '}\n\n' +
                    'const name = stateOf("Ada");\n' +
                    'const GreetingForUser = () => Greeting({ name });\n\n' +
                    'div(\n' +
                    '  inputText({ bind: name }),\n' +
                    '  GreetingForUser\n' +
                    ');',
                    div(CARD,
                        span(EYEBROW, "Function child with a value"),
                        inputText({
                            bind: greetingName,
                            placeholder: "Your name",
                            "aria-label": "Greeting name",
                        }, css`mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white`),
                        div(GreetingForUser)
                    ),
                    "Greeting() accepts the name value and returns a paragraph. GreetingForUser is a wrapper that passes the State into Greeting; passing the wrapper to div() lets Jetz invoke it as a child component. Type a name to see the greeting change."
                )
            ),
            div(css`mt-6`, lessonExample(
                'import { ifElse, onCreate, onDestroy, onMount, onUpdate, stateOf } from "@daevsoft/jetz";\n' +
                'import { button, div, p } from "@daevsoft/jetz/ui";\n\n' +
                'const log = stateOf("Ready.");\n' +
                'const showClock = stateOf(true);\n\n' +
                'function appendLog(log, message) {\n' +
                '  log.value = [...log.value.split("\\n"), message].slice(-4).join("\\n");\n' +
                '}\n\n' +
                'function Clock(log) {\n' +
                '  const time = stateOf(new Date().toLocaleTimeString());\n' +
                '  let timer = null;\n\n' +
                '  onCreate(() => queueMicrotask(() => appendLog(log, "Clock created.")));\n' +
                '  onMount(() => {\n' +
                '    queueMicrotask(() => appendLog(log, "Clock mounted; timer started."));\n' +
                '    timer = setInterval(() => {\n' +
                '      time.value = new Date().toLocaleTimeString();\n' +
                '    }, 1000);\n' +
                '  });\n' +
                '  onUpdate(() => {\n' +
                '    const tick = `Tick: ${time.value}.`;\n' +
                '    if (!log.value.endsWith(tick)) appendLog(log, tick);\n' +
                '  });\n' +
                '  onDestroy(() => {\n' +
                '    clearInterval(timer);\n' +
                '    queueMicrotask(() => {\n' +
                '      appendLog(log, "Clock destroyed; timer cleared.");\n' +
                '    });\n' +
                '  });\n\n' +
                '  return div(p("Live clock"), p(time));\n' +
                '}\n\n' +
                'const ClockPreview = () => Clock(log);\n' +
                'div(\n' +
                '  ifElse(\n' +
                '    () => showClock.value,\n' +
                '    () => div(ClockPreview),\n' +
                '    () => p("Clock removed.")\n' +
                '  ),\n' +
                '  button({ onclick: () => { showClock.value = !showClock.value; } }, "Toggle clock"),\n' +
                '  p(log)\n' +
                ');',
                div(CARD,
                    span(EYEBROW, "Lifecycle demo"),
                    div(css`mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-200`, ifElse(
                        () => this.showClock.value,
                        () => div(clockPreview),
                        () => p(css`text-xs text-zinc-500`, "Clock removed. Its interval was cleared.")
                    )),
                    button({ type: "button", onclick: () => { this.showClock.value = !this.showClock.value; } }, BTN, clockAction),
                    p(css`mt-4 text-xs leading-6 text-zinc-500`, this.log)
                ),
                "Clock registers a callback for each lifecycle stage: setup, appearance, updates, and removal. onMount starts the timer only after the clock appears; onDestroy clears it when the conditional removes the clock. Toggle the preview to see these hooks run."
            )),
            div(css`mt-8 grid gap-4 md:grid-cols-2`,
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Function hooks"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Pass a function reference to an element, such as div(ClockPreview), so Jetz invokes it with its own lifecycle. Do not call it first with ClockPreview(). Put imported lifecycle hooks inside the function Jetz invokes; function components do not have this.onMount() methods. Use a wrapper to pass values to a nested child, as the examples above do. Pass a State when the child should display changing data.")
                ),
                div(css`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`,
                    h2(css`text-lg font-semibold text-white`, "Class hooks"),
                    p(css`mt-2 text-sm leading-7 text-zinc-400`, "Extend Component and override onCreate(), onMount(), onUpdate(), and onDestroy(). onCreate() runs before render; onMount() runs after the element appears; onUpdate() runs while the component is active and state changes; onDestroy() runs when it is removed. This works for nested and routed class components, and methods can use this to access the instance's data.")
                )
            ),
            div(css`mt-4`, lessonExample(
                'import { html } from "@daevsoft/jetz";\n' +
                'import { div } from "@daevsoft/jetz/ui";\n\n' +
                'div(html("<strong>Rendered markup</strong>"));',
                div(CARD,
                    span(EYEBROW, "html()"),
                    div(css`mt-4 text-sm text-zinc-200`, html("<strong>Rendered markup</strong>"))
                ),
                "html() takes an HTML string and inserts it as markup rather than displaying the tags as text. Only use strings from a trusted source, because inserted markup can include active content."
            ))
        );
    }
}

function Clock(log) {
    const time = stateOf(new Date().toLocaleTimeString());
    let timer = null;

    onCreate(() => queueMicrotask(() => appendLog(log, "Clock created.")));
    onMount(() => {
        queueMicrotask(() => appendLog(log, "Clock mounted; timer started."));
        timer = setInterval(() => {
            time.value = new Date().toLocaleTimeString();
        }, 1000);
    });
    onUpdate(() => {
        const tick = `Tick: ${time.value}.`;
        if (!log.value.endsWith(tick)) appendLog(log, tick);
    });
    onDestroy(() => {
        clearInterval(timer);
        queueMicrotask(() => {
            appendLog(log, "Clock destroyed; timer cleared.");
        });
    });

    return div(p("Live clock"), p(time));
}

function appendLog(log, message) {
    log.value = [...log.value.split("\n"), message].slice(-4).join("\n");
}
