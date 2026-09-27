import { link } from '../../lib/jetz-router.js';
import { Component, computed, listOf, loop, stateOf } from '../../lib/jetz.js';
import { a, article, button, css, div, footer, h1, h2, header, inputCheckbox, inputText, main, p, section, small, span, strong, style } from '../../lib/jetz-ui.js';
import '../../../public/css/style.css';
import '../../../public/css/todo.css';

class ToDoComponent extends Component {
    constructor() {
        super();
        this.tasks = listOf(
            this.createTask(1, 'Explore the Jetz component API'),
            this.createTask(2, 'Build a reactive task list'),
            this.createTask(3, 'Celebrate a shipped feature', true)
        );
        this.nextTaskId = this.tasks.length + 1;
        this.search = stateOf('');
        this.activeFilter = stateOf('all');
        this.openCount = stateOf(0);
        this.totalCount = stateOf(0);
        this.visibleCount = stateOf(0);
        this.newTaskTitle = stateOf('');
    }

    createTask(id, title, completed = false) {
        const task = stateOf({ id, title, completed });
        task.draft = stateOf(title);
        task.editing = stateOf(false);
        return task;
    }

    matchesTask(task) {
        const query = this.search.value.trim().toLowerCase();
        const titleMatches = task.title.value.toLowerCase().includes(query);
        const statusMatches = this.activeFilter.value === 'all'
            || (this.activeFilter.value === 'open' && !task.completed.value)
            || (this.activeFilter.value === 'done' && task.completed.value);
        return titleMatches && statusMatches;
    }

    refreshCounts() {
        const visible = this.tasks.values.filter(task => this.matchesTask(task));
        this.totalCount.value = this.tasks.size;
        this.openCount.value = this.tasks.values.filter(task => !task.completed.value).length;
        this.visibleCount.value = visible.length;
    }

    addTask() {
        const title = this.newTaskTitle.value.trim();
        if (!title) return;
        this.tasks.push(this.createTask(this.nextTaskId++, title));
        this.newTaskTitle.value = '';
        this.refreshCounts();
    }

    saveEdit(task) {
        const title = task.draft.value.trim();
        if (!title) return;
        task.title.value = title;
        task.editing.value = false;
        this.refreshCounts();
    }

    taskRow(task) {
        const matches = computed(() => this.matchesTask(task));

        return article(
            css`todo-task`,
            style({ display: () => matches.value ? 'grid' : 'none' }),
            inputCheckbox({
                class: 'todo-task__check',
                bind: task.completed,
                'aria-label': 'Mark task complete',
                onchange: () => this.refreshCounts()
            }),
            div(css`todo-task__content`,
                strong(
                    css(() => task.completed.value ? 'todo-task__title todo-task__title--done' : 'todo-task__title'),
                    style({ display: () => task.editing.value ? 'none' : 'block' }),
                    task.id + ' - ' + task.title
                ),
                inputText({
                    class: 'todo-task__editor',
                    'aria-label': 'Edit task title',
                    bind: task.draft,
                    style: { display: () => task.editing.value ? 'block' : 'none' },
                    onkeydown: event => {
                        if (event.key === 'Enter') this.saveEdit(task);
                        if (event.key === 'Escape') task.editing.value = false;
                    }
                }),
                small(css`todo-task__hint`, computed(() => task.completed.value ? 'Completed' : 'In progress'))
            ),
            div(css`todo-task__actions`,
                button('Edit', {
                    class: 'todo-icon-button',
                    style: { display: () => task.editing.value ? 'none' : 'inline-flex' },
                    onclick: () => {
                        task.draft.value = task.title.value;
                        task.editing.value = true;
                    }
                }),
                button('Save', {
                    class: 'todo-icon-button todo-icon-button--save',
                    style: { display: () => task.editing.value ? 'inline-flex' : 'none' },
                    onclick: () => this.saveEdit(task)
                }),
                button('Cancel', {
                    class: 'todo-icon-button',
                    style: { display: () => task.editing.value ? 'inline-flex' : 'none' },
                    onclick: () => { task.editing.value = false; }
                }),
                button('Delete', {
                    class: 'todo-icon-button todo-icon-button--delete',
                    style: { display: () => task.editing.value ? 'none' : 'inline-flex' },
                    onclick: () => {
                        this.tasks.remove(task);
                        this.refreshCounts();
                    }
                })
            )
        );
    }

    render() {
        this.refreshCounts();

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
                            bind: this.newTaskTitle,
                            onkeydown: event => {
                                if (event.key === 'Enter') this.addTask();
                            }
                        }),
                        button('Add task', { class: 'todo-add-button', onclick: () => this.addTask() })
                    )
                ),
                section(css`todo-list-section`,
                    header(css`todo-list-heading`,
                        div(h2('Your tasks'), p('A clear list makes room for the next good thing.')),
                        span(css`todo-count`, span(this.openCount), ' open')
                    ),
                    div(css`todo-toolbar`,
                        inputText({
                            class: 'todo-search',
                            type: 'search',
                            placeholder: 'Search tasks...',
                            'aria-label': 'Search tasks',
                            bind: this.search,
                            oninput: () => this.refreshCounts()
                        }),
                        div(css`todo-filters`,
                            ...[
                                ['all', 'All'],
                                ['open', 'Open'],
                                ['done', 'Done']
                            ].map(([value, text]) => button(text, {
                                class: computed(() => this.activeFilter.value === value ? 'todo-filter todo-filter--active' : 'todo-filter'),
                                onclick: () => {
                                    this.activeFilter.value = value;
                                    this.refreshCounts();
                                }
                            }))
                        )
                    ),
                    div(css`todo-task-list`, loop(this.tasks, task => task.id.value, task => this.taskRow(task))),
                    div(css`todo-empty`,
                        style({ display: () => this.visibleCount.value === 0 ? 'block' : 'none' }),
                        strong(computed(() => this.totalCount.value === 0 ? "You're all caught up." : 'No tasks found.')),
                        p(computed(() => this.search.value ? 'Try a different search or clear the search field.' : 'Add a task above to get started.'))
                    ),
                    div(css`todo-list-footer`,
                        span(span(this.visibleCount), ' of ', span(this.totalCount), ' tasks shown'),
                        button('Clear completed', {
                            class: 'todo-clear-button',
                            onclick: () => {
                                this.tasks.set(this.tasks.values.filter(task => !task.completed.value));
                                this.activeFilter.value = 'all';
                                this.refreshCounts();
                            }
                        })
                    )
                )
            ),
            footer(css`todo-footer`, span('Small steps. Real progress.'), strong('Jetz'))
        );
    }
}

export default ToDoComponent;