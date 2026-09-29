import { stateOf } from "../../lib/jetz.js";
import { button, css, data_, div, p } from "../../lib/jetz-ui.js"

const counter = stateOf(0);

export const MyPlay = () => {
    return div(
        p(css`counter-${counter}`,
            data_({
                counter: counter,
            }),
            `Counter:`, counter
        ),
        
        p(css`counter-${counter}`,
            {
                data_counter: counter,
            },
            `Counter:`, counter
        ),
        button('Increment', {
            onclick: () => counter.value++,
        })
    );
}