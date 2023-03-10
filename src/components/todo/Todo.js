import { Jetz, listOf, loop, stateOf } from '../../lib/jetz';
import { button, div, inputText, li, placeholder, ul } from '../../lib/jetz-ui';

let todoList = listOf();

function TodoLists(){
    return ul(
        loop(todoList, todo => {
            return li(todo.text, button('Delete', {
                onclick(){
                    todoList.remove(todo);
                }
            }))
        })
    )
}

export function ToDo(){
    let newTodo = stateOf('');
    return div(
        inputText(placeholder`Input New Todo`, {
            bind:newTodo
        }),
        button('Add', {
            onclick(){
                todoList.push({
                    id: Math.random(),
                    text: newTodo.value
                });
                newTodo.value = '';
            }
        }),
        TodoLists,
        button('Back', {
            onclick(){
                Jetz.$route.back()
            }
        })
    )
}
