import { Jetz } from "./src/jetz.js";
import { button, css, div, i, inputNumber, inputText, li, span, ul } from "./src/ui.js";

let myStyle = css`
*{
    font-family: 'arial';
    padding:0;
    margin:0;
}
.todo-app{
    padding: 8px;
}
.header{
    font-size:1.3em;
    font-weight: bold;
    padding-bottom: 8px;
}
.todo-input{
    display:flex;
    margin-bottom: 12px;
}
.todo-input input{
    width:100%;
    padding:10px;
    border:0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.btn-add{
    color:white;
    background:purple;
    border:0;
    padding:4px;
    width:40px;
    margin-left: 8px;
}
.btn-add:hover{
    opacity: 0.6;
}
.todo-item {
    display: block;
    border: 1px solid rgba(0,0,0,0.3);
    border-radius: 4px;
    margin-bottom: 4px;
    padding: 8px;
}
.btn-delete{
    float: right;
    color:rgba(0,0,0,0.6);
    border-radius:4px;
    border:0;
    padding: 4px;
}
`;

function todoItem(todo){
    const item = li({ class: 'todo-item' }, todo,
        button('Delete', { 
            class: 'btn-delete',
            onclick: () => {
                item.remove();
            }
        })
    );
    return item;
}

// Dummy Todo Items
let dummyTodo = [
    'Dummy 1 todo', 'Dummy 2 todo', 'Dummy 3 todo'
].map(todo => todoItem(todo));

// Header component
let header = div({ class:'header' }, 'Todo App');

// Edit Text component
let todoField = inputText({ placeholder: 'Add your new todo' });

// ToDo Input Component
let todoInput = div({ class: 'todo-input' },
    todoField,
    button({ class:'btn-add',
            onclick: () => {
                const todo = todoField.value();
                todoList.append(
                    todoItem(todo)
                );
                todoField.value('');
            }
        },
        i({ class:'fa-solid fa-arrow-right fa-fw' })
    )
)

// ToDo List component
let todoList = ul({ class:'todo-list' }, ...dummyTodo );

// ToDo component
let todoComponent = div({class: 'todo-app'},
    header,
    todoInput,
    todoList
);

Jetz.style(myStyle);
Jetz.mount(todoComponent, document.body);