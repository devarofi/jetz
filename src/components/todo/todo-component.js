
import { addScript } from "../../lib/helper";
import { button, div, i, inputText, li, span, ul } from "../../lib/ui";

let _editField = todo => inputText({ value: todo });

const _btnEdit = () => button({
    id: 'btn-edit',
    class: 'btn-action',
    style: {
        background: 'none'
    }
},
    i({ class: 'fa-solid fa-pencil' })
);

const _btnSave = () => button({
    id: 'btn-save',
    class: 'btn-action'
}, 'Save').hide();

const _btnDelete = () => button(
    {
        class: 'btn-action',
        style: {
            color: 'red',
            opacity: 0.7
        },
    },
    i({ class: 'fa-solid fa-trash' })
);

function todoItem(todo) {
    let todoContent = span(todo);
    let editField = _editField(todo).hide();
    let btnSave = _btnSave();
    let btnEdit = _btnEdit();
    let btnDelete = _btnDelete();

    const item = li({ class: 'todo-item' }, todoContent,
        editField,

        div({ style: { display: 'block' } },
            btnDelete.on('click', () => {
                item.remove();
            }),
            btnSave.on('click', function () {
                editField.hide();
                todoContent.show();
                todoContent.text(editField.value());
                btnEdit.show();
                this.hide();
            }),
            btnEdit.on('click', function () {
                editField.show();
                todoContent.hide();
                btnSave.show();
                this.hide();
            })
        )
    );
    return item;
}

// Dummy Todo Items
let dummyTodo = [
    'Dummy 1 todo', 'Dummy 2 todo', 'Dummy 3 todo'
].map(todo => todoItem(todo));

// Header component
let header = div({ class: 'header' }, 'Todo App');

// Edit Text component
let todoField = inputText({ placeholder: 'Add your new todo' });

// ToDo Input Component
let todoInput = div({ class: 'todo-input' },
    todoField,
    button({
            class: 'btn-add',
            onclick: () => {
                const todo = todoField.value();
                todoList.append(
                    todoItem(todo)
                );
                todoField.value('');
            }
        },
        i({ class: 'fa-solid fa-arrow-right fa-fw' })
    )
)

// ToDo List component
let todoList = ul({ class: 'todo-list' }, ...dummyTodo);

// ToDo component
export let todoComponent = div({ class: 'todo-app' },
    header,
    todoInput,
    todoList
);