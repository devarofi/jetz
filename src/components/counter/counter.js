import { rememberOf, stateOf } from "../../lib/jetz";
import { button, div, id, inputText, main, p, text } from "../../lib/jetz-ui";

let count = rememberOf(0);
let count2 = rememberOf(0);
let myName = rememberOf({
    firstname: "",
    lastname: "laster"
});

export let counter = main(
    div( id`text-counter`, text`Count : ${count} and ${count2}`),
    button('Click ', myName.lastname, {
        onclick(){
            count.value++;
            count2.value += 2;
        }
    }),
    p(myName.firstname),
    inputText({
        bind: myName.firstname
    })
);