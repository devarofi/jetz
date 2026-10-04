import { listOf, loop, onCreate, onDestroy, onMount, stateOf } from "../../lib/jetz.js";
import { div, li, p, ul } from "../../lib/jetz-ui.js";

export function TryMe() {
    const log = listOf();
    const time = stateOf(new Date().toLocaleTimeString());
    let timerId = 0;

    onCreate(() => {
        log.push("Clock created.");
    });

    onMount(() => {
        log.push("Clock mounted; timer started.");
        timerId = setInterval(() => {
            time.value = new Date().toLocaleTimeString();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(timerId);
        log.push("Clock destroyed; timer cleared.");
    });

    // Use effect for side-effects that depend on time, not onUpdate
    // onUpdate is for component-level update logic, not for reacting to state changes

    return div(
        p("Live clock"),
        ul(loop(log, l => l, l => li(l))),  // Use ul/li properly
        p(time),
    );
}