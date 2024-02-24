import { Component, listOf, loop, stateOf } from "../../lib/jetz";
import { button, div, h2, hr, inputText, li, span, ul } from "../../lib/jetz-ui";
<<<<<<< HEAD
=======

// Example with a component class
>>>>>>> 3190bc74bb3bf63893911a7f4fefd4ff5c9d7758

class ToDoV2 extends Component {
    constructor(){
        super();
        this.todoList = listOf({
            id: 1, 
            text: 'My Gym'
        }, {
            id: 2,
            text: 'My Checked'
        }).toState();
        this.todoTemp = stateOf('');
    }
    newTodo() {
        this.todoList.push(stateOf({
            id: (this.todoList[this.todoList.length - 1]?.id ?? 0) + 1,
            text: this.todoTemp.value
        }));
        this.todoTemp.value = '';
    }
    removeTodo(todo) {
        this.todoList.remove(todo);
    }
    checkTodo(e){
        e.target.classList.toggle('checked');
    }
    writeTodo(e){
        this.todoTemp.value = e.target.value
    }
    todoItem(todo){
        return li(todo.id ,'-',todo.text, {
            onclick: this.checkTodo
        },
        inputText({
            oninput(e) {
                todo.text.value = e.target.value;
            }
        }),
        button('Change Text', {
            onclick() {
                todo.text.value = 'Changed'
            }
        }),
            span({ class: 'close' }, '\u00D7', {
                onclick: () => this.removeTodo(todo)
            })
        );
    }
    render(){
        return [
            div({ id: 'myDIV', class: 'header' },
                h2('My To List : ', this.todoTemp),
                inputText({
                    id: 'myInput',
                    placeholder: 'Title...',
                    value: this.todoTemp,
                    oninput: this.writeTodo.bind(this)
                }),
                span('Add', css`addBtn`, { onclick: () => this.newTodo() }),
                span('Plus', { 
                    onclick: () => { 
                        this.todoList.map(todo => {
                            todo.text.value = '*' + todo.text
                            return todo;
                        })
                    }
                })
            ),
            ul({ id: 'myUL' },
                loop(this.todoList, this.todoItem.bind(this))
            ),
            hr(),
            ul({ id: 'myUL2' },
                loop(this.todoList, this.todoItem.bind(this))
            )
        ];
    }
}
export const todoV2 = new ToDoV2();