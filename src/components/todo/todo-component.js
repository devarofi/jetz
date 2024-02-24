import { listOf, loop, stateOf } from "../../lib/jetz";
<<<<<<< HEAD
import { b, button, div, h2, hr, inputText, li, ul } from "../../lib/jetz-ui";
=======
import { b, button, div, h2, hr, inputText, li, ul, css } from "../../lib/jetz-ui";
>>>>>>> 3190bc74bb3bf63893911a7f4fefd4ff5c9d7758

// Dummy Todo Items
let todoItems = listOf('Dummy 1 todo', 'Dummy 2 todo', 'Dummy 3 todo');
let todoTemp = stateOf('write here');
let todoEnableState = stateOf('enabled')

function todoItem(todo) {
    return li( css`todo-item`, todo, 
        function () {
            let userState = stateOf('...')
            return div(
                'Muhamad Deva ', userState, 
                button('Ubah', {
                    onclick() { userState.value = 'Arofi' }
                })
            );
        },
        button('Delete Item', {
            onclick(){
                todoItems.remove(todo);
            }
        }),
        button('Edit Item', {
            onclick() {
                todoTemp.value = todo;
            }
        })
    );
}

// ToDo component
export let todoComponent = div( css`todo-app`, 'Attribute is ', todoEnableState,
    // header,
    loop([1, 2, 3], no => [
        hr(),
        h2('Sample Looping ', no),
        ul( css`todo-list`,
            loop(todoItems, item => todoItem(item))
        )
    ]),
    b('Your input : ', todoTemp), hr(),
    inputText({ value: todoTemp, 'data-enable': todoEnableState }, {
        onkeyup() {
            todoTemp.value = this.value();
        }
    }),
    button('Add new Item', {
        onclick() {
            todoItems.push(todoTemp.value);
            todoTemp.value = '';
        }
    }),
    button('change attribute', {
        onclick() {
            todoEnableState.value = 'disabled'
        }
    })
);