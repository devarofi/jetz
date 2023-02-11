
// import { addScript } from "../../lib/helper";
import { css } from "../../lib/helper";
import { listOf, loop, stateOf } from "../../lib/jetz";
import { b, button, div, h2, hr, inputText, li, ul } from "../../lib/ui";

// Dummy Todo Items
let todoItems = listOf('Dummy 1 todo', 'Dummy 2 todo', 'Dummy 3 todo');
let todoTemp = stateOf('write here');
let todoEnableState = stateOf('enabled')

function todoItem(todo) {
    return li(css`todo-item`, todo, 
        function () {
            let userState = stateOf('...')
            return div('Muhamad Deva ', userState, button('Ubah').on('click', () => { userState.value = 'Arofi' }));
        },
        button('Delete Item').on('click', () => {
            todoItems.remove(todo);
        }),
        button('Edit Item').on('click', () => {
            todoTemp.value = todo;
        }));
}

// ToDo component
export let todoComponent = div(css`todo-app`, 'Attribute is ', todoEnableState,
    // header,
    loop([1, 2, 3], no => [
        hr(),
        h2('Sample Looping ', no),
        ul(css`todo-list`,
            loop(todoItems, item => todoItem(item))
        )
    ]),
    b('Your input : ', todoTemp), hr(),
    inputText({ value: todoTemp, 'data-enable': todoEnableState }, {
        onkeyup: function () {
            todoTemp.value = this.value();
        }
    }),
    button('Add new Item', {
        onclick: function () {
            todoItems.push(todoTemp.value);
            todoTemp.value = '';
        }
    }),
    button('change attribute', {
        onclick: function () {
            todoEnableState.value = 'disabled'
        }
    })
);