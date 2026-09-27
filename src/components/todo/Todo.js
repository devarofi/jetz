import { link } from '../../lib/jetz-router.js';
import { computed, Jetz, listOf, loop, rememberOf, stateOf } from '../../lib/jetz.js';
import { a, article, button, css, div, footer, h1, h2, header, inputCheckbox, inputText, main, p, section, small, span, strong, style } from '../../lib/jetz-ui.js';
import '../../../public/css/style.css';
import '../../../public/css/todo.css';

let nextTaskId = 4;
let rememberedTasks;

function createTask(id, title, completed = false) {
    const task = stateOf({ id, title, completed });
    task.draft = stateOf(title);
    task.editing = stateOf(false);
    return task;
}

function saveTasks() {
    rememberedTasks.set(tasks.values.map(task => ({
        id: task.id.value,
        title: task.title.value,
        completed: task.completed.value
    })));
}

function TaskRow(task, refreshCounts) {
    const matches = computed(() => {
        const query = search.value.trim().toLowerCase();
        const titleMatches = task.title.value.toLowerCase().includes(query);
        const statusMatches = activeFilter.value === 'all'
            || (activeFilter.value === 'open' && !task.completed.value)
            || (activeFilter.value === 'done' && task.completed.value);
        return titleMatches && statusMatches;
    });

    const saveEdit = () => {
        const title = task.draft.value.trim();
        if (!title) return;
        task.title.value = title;
        task.editing.value = false;
        saveTasks();
        refreshCounts();
    };

    return article(
        css`todo-task`,
        style({ display: () => matches.value ? 'grid' : 'none' }),
        inputCheckbox({
            class: 'todo-task__check',
            bind: task.completed,
            'aria-label': 'Mark task complete',
            onchange() {
                saveTasks();
                refreshCounts();
            }
        }),
        div(css`todo-task__content`,
            strong(
                css(() => task.completed.value ? 'todo-task__title todo-task__title--done' : 'todo-task__title'),
                style({ display: () => task.editing.value ? 'none' : 'block' }),
                task.title
            ),
            inputText({
                class: 'todo-task__editor',
                'aria-label': 'Edit task title',
                bind: task.draft,
                style: { display: () => task.editing.value ? 'block' : 'none' },
                onkeydown(event) {
                    if (event.key === 'Enter') saveEdit();
                    if (event.key === 'Escape') task.editing.value = false;
                }
            }),
            small(css`todo-task__hint`, computed(() => task.completed.value ? 'Completed' : 'In progress'))
        ),
        div(css`todo-task__actions`,
            button('Edit', {
                class: 'todo-icon-button',
                style: { display: () => task.editing.value ? 'none' : 'inline-flex' },
                onclick() {
                    task.draft.value = task.title.value;
                    task.editing.value = true;
                }
            }),
            button('Save', {
                class: 'todo-icon-button todo-icon-button--save',
                style: { display: () => task.editing.value ? 'inline-flex' : 'none' },
                onclick: saveEdit
            }),
            button('Cancel', {
                class: 'todo-icon-button',
                style: { display: () => task.editing.value ? 'inline-flex' : 'none' },
                onclick() { task.editing.value = false; }
            }),
            button('Delete', {
                class: 'todo-icon-button todo-icon-button--delete',
                style: { display: () => task.editing.value ? 'none' : 'inline-flex' },
                onclick() {
                    tasks.remove(task);
                    saveTasks();
                    refreshCounts();
                }
            })
        )
    );
}

let tasks;
let search;
let activeFilter;
let openCount;
let totalCount;
let visibleCount;

function refreshTodoCounts() {
    const query = search.value.trim().toLowerCase();
    const visible = tasks.values.filter(task => {
        const titleMatches = task.title.value.toLowerCase().includes(query);
        const statusMatches = activeFilter.value === 'all'
            || (activeFilter.value === 'open' && !task.completed.value)
            || (activeFilter.value === 'done' && task.completed.value);
        return titleMatches && statusMatches;
    });
    totalCount.value = tasks.size;
    openCount.value = tasks.values.filter(task => !task.completed.value).length;
    visibleCount.value = visible.length;
}

function TodoList() {
    refreshTodoCounts();

    return section(css`todo-list-section`,
        header(css`todo-list-heading`,
            div(h2('Your tasks'), p('A clear list makes room for the next good thing.')),
            span(css`todo-count`, span(openCount), ' open')
        ),
        div(css`todo-toolbar`,
            inputText({
                class: 'todo-search',
                type: 'search',
                placeholder: 'Search tasks...',
                'aria-label': 'Search tasks',
                bind: search,
                oninput: refreshTodoCounts
            }),
            div(css`todo-filters`,
                ...[
                    ['all', 'All'],
                    ['open', 'Open'],
                    ['done', 'Done']
                ].map(([value, text]) => button(text, {
                    class: computed(() => activeFilter.value === value ? 'todo-filter todo-filter--active' : 'todo-filter'),
                    onclick() {
                        activeFilter.value = value;
                        refreshTodoCounts();
                    }
                }))
            )
        ),
        div(css`todo-task-list`, loop(tasks, task => task.id.value, task => TaskRow(task, refreshTodoCounts))),
        div(css`todo-empty`,
            style({ display: () => visibleCount.value === 0 ? 'block' : 'none' }),
            strong(computed(() => totalCount.value === 0 ? "You're all caught up." : 'No tasks found.')),
            p(computed(() => search.value ? 'Try a different search or clear the search field.' : 'Add a task above to get started.'))
        ),
        div(css`todo-list-footer`,
            span(span(visibleCount), ' of ', span(totalCount), ' tasks shown'),
            button('Clear completed', {
                class: 'todo-clear-button',
                onclick() {
                    tasks.set(tasks.values.filter(task => !task.completed.value));
                    saveTasks();
                    activeFilter.value = 'all';
                    refreshTodoCounts();
                }
            })
        )
    );
}

export function ToDo() {
    rememberedTasks = rememberOf('todo.tasks', [
        { id: 1, title: 'Explore the Jetz component API', completed: false },
        { id: 2, title: 'Build a reactive task list', completed: false },
        { id: 3, title: 'Celebrate a shipped feature', completed: true }
    ]);
    tasks = listOf(...rememberedTasks.values.map(task => createTask(task.id, task.title, task.completed)));
    nextTaskId = Math.max(0, ...tasks.values.map(task => task.id.value)) + 1;
    search = stateOf('');
    activeFilter = stateOf('all');
    openCount = stateOf(0);
    totalCount = stateOf(0);
    visibleCount = stateOf(0);

    const newTaskTitle = stateOf('');
    const addTask = () => {
        const title = newTaskTitle.value.trim();
        if (!title) return;
        tasks.push(createTask(nextTaskId++, title));
        saveTasks();
        newTaskTitle.value = '';
        refreshTodoCounts();
    };

    return main({ id: 'todo-page' },
        header(css`todo-topbar`,
            a({ class: 'todo-brand', href: '/' }, span(css`todo-brand-mark`, 'J'), 'jetz'),
            link('/', a({ class: 'todo-back-link', href: '#home' }, '← Home'))
        ),
        section(css`todo-main`,
            div(css`todo-page-intro`,
                span(css`todo-eyebrow`, 'YOUR WORKSPACE'),
                h1('Make space for what matters.'),
                p('Capture the next step. Keep moving at your own pace.')
            ),
            article(css`todo-create-panel`,
                div(css`todo-create-copy`, span(css`todo-create-mark`, '+'), div(strong('Add a task'), small('What would you like to get done?'))),
                div(css`todo-create-controls`,
                    inputText({
                        class: 'todo-create-input',
                        placeholder: 'e.g. Sketch the next feature',
                        'aria-label': 'New task title',
                        bind: newTaskTitle,
                        onkeydown(event) {
                            if (event.key === 'Enter') addTask();
                        }
                    }),
                    button('Add task', { class: 'todo-add-button', onclick: addTask })
                )
            ),
            TodoList
        ),
        footer(css`todo-footer`, span('Small steps. Real progress.'), strong('Jetz'))
    );
}