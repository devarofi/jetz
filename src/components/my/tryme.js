
import {
    rememberOf,
    computed,
    listOf,
    loop,
    stateOf
} from "../../lib/jetz.js";

import {
    div,
    h1,
    h2,
    p,
    span,
    button,
    inputText,
    inputDate,
    textarea,
    select,
    option,
    label,
    css,
    a
} from "../../lib/jetz-ui.js";

import "../../../public/css/kanban.css";

const TASK_STORAGE_KEY = "kanban-tasks-v2";
const SEARCH_KEY = "kanban-search-v2";
const PRIORITY_FILTER_KEY = "kanban-priority-v2";

const STATUSES = [
    { id: "todo", label: "To Do" },
    { id: "progress", label: "In Progress" },
    { id: "review", label: "Review" },
    { id: "done", label: "Done" },
];

const PRIORITIES = ["low", "medium", "high"];

const SEED_TASKS = [
    {
        id: 1,
        title: "Implement login API",
        description: "Support JWT authentication with refresh tokens.",
        assignee: "Muhamad",
        priority: "high",
        dueDate: "2026-10-20",
        status: "todo",
    },
    {
        id: 2,
        title: "Create landing page",
        description: "Marketing website with hero, pricing, and footer.",
        assignee: "Designer",
        priority: "medium",
        dueDate: "2026-10-25",
        status: "progress",
    },
    {
        id: 3,
        title: "Write unit tests",
        description: "Cover the task store and column filters.",
        assignee: "QA",
        priority: "low",
        dueDate: "2026-11-02",
        status: "review",
    },
];

// Module-level slots, assigned fresh on every KanbanPage() call — the same
// pattern Todo.js uses. Module-level rememberOf() calls would rehydrate once
// and then share stale instances across remounts.
let cards;
let search;
let priorityFilter;
let showEditor;
let editingId;
let form;
let formError;
let nextCardId;
// One derived ListState + one visible-count State per column, plus the stat
// strip slots — all refreshed together by refreshBoard().
let columnLists;
let columnCounts;
let stats;

// Persist plain snapshots of the cards, not the State wrappers.
function saveCards() {
    const snapshot = cards.values.map(card => ({
        id: card.id.value,
        title: card.title.value,
        description: card.description.value,
        assignee: card.assignee.value,
        priority: card.priority.value,
        dueDate: card.dueDate.value,
        status: card.status.value,
    }));
    const remembered = rememberOf(TASK_STORAGE_KEY, snapshot);
    remembered.set(snapshot);
}

// One reactive record per card: every field is a State so the board can read
// it directly and re-render only the card that changed.
function createCard(data) {
    return {
        id: stateOf(data.id),
        title: stateOf(data.title),
        description: stateOf(data.description ?? ""),
        assignee: stateOf(data.assignee ?? ""),
        priority: stateOf(data.priority ?? "medium"),
        dueDate: stateOf(data.dueDate ?? ""),
        status: stateOf(data.status ?? "todo"),
    };
}

function initials(name) {
    const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "–";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDue(iso) {
    if (!iso) return "No due date";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// "overdue" | "soon" (within 3 days) | "" — derived from the due string each
// render, so no timer state is needed.
function dueTone(iso) {
    if (!iso) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    const days = Math.round((date - today) / 86400000);
    if (days < 0) return "overdue";
    if (days <= 3) return "soon";
    return "";
}

function resetForm() {
    form.title.value = "";
    form.description.value = "";
    form.assignee.value = "";
    form.dueDate.value = "";
    form.priority.value = "medium";
    form.status.value = "todo";
}
function openEditor(card = null) {
    if (card) {
        editingId.value = card.id.value;
        form.title.value = card.title.value;
        form.description.value = card.description.value;
        form.assignee.value = card.assignee.value;
        form.dueDate.value = card.dueDate.value;
        form.priority.value = card.priority.value;
        form.status.value = card.status.value;
    } else {
        editingId.value = null;
        resetForm();
    }
    formError.value = "";
    showEditor.value = true;
}

function closeEditor() {
    showEditor.value = false;
    resetForm();
}

function saveEditor() {
    const title = form.title.value.trim();
    if (!title) {
        formError.value = "Give the task a title before saving.";
        return;
    }
    if (editingId.value != null) {
        cards.set(cards.values.map(card => {
            if (card.id.value !== editingId.value) return card;
            return createCard({
                id: card.id.value,
                title,
                description: form.description.value.trim(),
                assignee: form.assignee.value.trim(),
                priority: form.priority.value,
                dueDate: form.dueDate.value,
                status: form.status.value,
            });
        }));
    } else {
        cards.push(createCard({
            id: nextCardId++,
            title,
            description: form.description.value.trim(),
            assignee: form.assignee.value.trim() || "Unassigned",
            priority: form.priority.value,
            dueDate: form.dueDate.value,
            status: form.status.value,
        }));
    }
    saveCards();
    refreshBoard();
    closeEditor();
}

function deleteCard(id) {
    cards.set(cards.values.filter(card => card.id.value !== id));
    saveCards();
    refreshBoard();
}

// Status moves replace the record instead of mutating it in place —
// ListState reconciliation keys off item identity, so a fresh record is what
// makes the card jump columns.
function moveCard(id, status) {
    cards.set(cards.values.map(card => {
        if (card.id.value !== id || card.status.value === status) return card;
        return createCard({
            id: card.id.value,
            title: card.title.value,
            description: card.description.value,
            assignee: card.assignee.value,
            priority: card.priority.value,
            dueDate: card.dueDate.value,
            status,
        });
    }));
    saveCards();
    refreshBoard();
}

// A card is visible when it matches the search text and the priority filter.
function cardMatches(card) {
    const query = search.value.trim().toLowerCase();
    if (query) {
        const haystack = `${card.title.value} ${card.description.value} ${card.assignee.value}`.toLowerCase();
        if (!haystack.includes(query)) return false;
    }
    return priorityFilter.value === "all" || card.priority.value === priorityFilter.value;
}

// Rebuild the per-column lists, their visible counts, and the stat strip from
// the master card list. loop() only reacts to ListState.set() — a computed()
// cannot watch a list — so every mutation and every filter change funnels
// through here, the same explicit-refresh pattern Todo.js uses for its counts.
function refreshBoard() {
    for (const entry of STATUSES) {
        const visible = cards.values.filter(card =>
            card.status.value === entry.id && cardMatches(card)
        );
        columnLists[entry.id].set(visible);
        columnCounts[entry.id].value = visible.length;
    }
    const total = cards.values.length;
    const done = cards.values.filter(card => card.status.value === "done").length;
    const overdue = cards.values.filter(card =>
        card.status.value !== "done" && dueTone(card.dueDate.value) === "overdue"
    ).length;
    const high = cards.values.filter(card => card.priority.value === "high").length;
    stats.total.value = total;
    stats.active.value = total - done;
    stats.completed.value = done;
    stats.overdue.value = overdue;
    stats.high.value = high;
}

function TaskCard(card) {
    const statusIndex = STATUSES.findIndex(entry => entry.id === card.status.value);
    const tone = () => dueTone(card.dueDate.value);

    return div(
        css`kanban-card`,
        { "data-priority": () => card.priority.value, draggable: true },
        div(css`kanban-card__top`,
            span(css(() => `kanban-priority kanban-priority--${card.priority.value}`), card.priority),
            span(css(() => {
                const kind = tone();
                return kind ? `kanban-due kanban-due--${kind}` : "kanban-due";
            }), computed(() => formatDue(card.dueDate.value)))
        ),
        h2(css`kanban-card__title`, card.title),
        p(css`kanban-card__desc`, computed(() => card.description.value || "No description yet.")),
        div(css`kanban-card__meta`,
            span(css`kanban-avatar`, computed(() => initials(card.assignee.value))),
            span(css`kanban-assignee`, computed(() => card.assignee.value || "Unassigned"))
        ),
        div(css`kanban-card__actions`,
            button("‹", {
                class: "kanban-move",
                title: "Move back",
                disabled: () => statusIndex <= 0,
                onclick() { moveCard(card.id.value, STATUSES[statusIndex - 1].id); }
            }),
            button("›", {
                class: "kanban-move",
                title: "Move forward",
                disabled: () => statusIndex < 0 || statusIndex >= STATUSES.length - 1,
                onclick() { moveCard(card.id.value, STATUSES[statusIndex + 1].id); }
            }),
            span(css`kanban-icon`,
                button("✎", { title: "Edit task", onclick() { openEditor(card); } }),
                button("🗑", { class: "kanban-delete", title: "Delete task", onclick() { deleteCard(card.id.value); } })
            )
        )
    );
}

function Column(status) {
    const meta = STATUSES.find(entry => entry.id === status);

    return div(
        css`kanban-column`,
        { "data-status": status },
        div(css`kanban-column__head`,
            span(css`kanban-column__dot`),
            span(css`kanban-column__name`, meta.label),
            span(css`kanban-column__count`, columnCounts[status])
        ),
        div(css`kanban-column__cards`,
            loop(columnLists[status], card => card.id.value, card => TaskCard(card)),
            p(css`kanban-empty`,
                { style: { display: () => columnCounts[status].value === 0 ? "block" : "none" } },
                "No tasks here yet."
            )
        )
    );
}

function EditorModal() {
    return div(
        css`kanban-overlay`,
        { style: { display: () => showEditor.value ? "flex" : "none" } },
        div(css`kanban-modal`,
            h2(computed(() => editingId.value != null ? "Edit task" : "New task")),
            p(css`kanban-modal__sub`, "Fill in the details. Everything saves to this browser automatically."),
            p(css`kanban-error`,
                { style: { display: () => formError.value ? "block" : "none" } },
                formError
            ),
            label(css`kanban-field`,
                span("Title"),
                inputText({ placeholder: "e.g. Ship the onboarding flow", bind: form.title })
            ),
            label(css`kanban-field`,
                span("Description"),
                textarea({ placeholder: "What needs to happen?", bind: form.description })
            ),
            div(css`kanban-row`,
                label(css`kanban-field`,
                    span("Assignee"),
                    inputText({ placeholder: "e.g. Muhamad", bind: form.assignee })
                ),
                label(css`kanban-field`,
                    span("Due date"),
                    inputDate({ bind: form.dueDate })
                )
            ),
            div(css`kanban-row`,
                label(css`kanban-field`,
                    span("Priority"),
                    select({ bind: form.priority },
                        ...PRIORITIES.map(value => option({ value }, value[0].toUpperCase() + value.slice(1)))
                    )
                ),
                label(css`kanban-field`,
                    span("Column"),
                    select({ bind: form.status },
                        ...STATUSES.map(entry => option({ value: entry.id }, entry.label))
                    )
                )
            ),
            div(css`kanban-modal__actions`,
                button("Save task", { class: "kanban-save", onclick: saveEditor }),
                button("Cancel", { class: "kanban-cancel", onclick: closeEditor })
            )
        )
    );
}

function StatStrip() {
    const stat = (value, text) => div(css`kanban-stat`,
        div(css`kanban-stat__value`, value),
        div(css`kanban-stat__label`, text)
    );

    return div(css`kanban-stats`,
        stat(stats.total, "Total tasks"),
        stat(stats.active, "Active"),
        stat(stats.completed, "Completed"),
        stat(stats.overdue, "Overdue"),
        stat(stats.high, "High priority")
    );
}

export function KanbanPage() {
    // Fresh state on every visit — see the note on the module slots above.
    const stored = rememberOf(TASK_STORAGE_KEY, SEED_TASKS);
    cards = listOf(...stored.values.map(createCard));
    nextCardId = cards.values.reduce((max, card) => Math.max(max, card.id.value), 0) + 1;
    // rememberOf(key, "string") yields a RememberState: it syncs through
    // setState(), not set() — and the instance must live for the whole mount
    // so the constructor hydrates the stored value exactly once.
    const rememberedSearch = rememberOf(SEARCH_KEY, "");
    search = stateOf(rememberedSearch.value ?? "");
    search.subscribe(value => {
        rememberedSearch.setState(value);
        refreshBoard();
    });
    const rememberedPriority = rememberOf(PRIORITY_FILTER_KEY, "all");
    priorityFilter = stateOf(rememberedPriority.value ?? "all");
    priorityFilter.subscribe(value => {
        rememberedPriority.setState(value);
        refreshBoard();
    });
    showEditor = stateOf(false);
    editingId = stateOf(null);
    formError = stateOf("");
    form = {
        title: stateOf(""),
        description: stateOf(""),
        assignee: stateOf(""),
        dueDate: stateOf(""),
        priority: stateOf("medium"),
        status: stateOf("todo"),
    };

    // Derived render state: one ListState per column (what loop() reconciles),
    // one visible-count State per column header/empty hint, and the stat strip.
    columnLists = {};
    columnCounts = {};
    for (const entry of STATUSES) {
        columnLists[entry.id] = listOf();
        columnCounts[entry.id] = stateOf(0);
    }
    stats = {
        total: stateOf(0),
        active: stateOf(0),
        completed: stateOf(0),
        overdue: stateOf(0),
        high: stateOf(0),
    };
    // Populate before the tree renders so assignParent() builds the initial
    // card views from real values.
    refreshBoard();

    return div(
        div(grid),
        { id: "kanban-page" },
        div(css`kanban-shell`,
            div(css`kanban-topbar`,
                div(
                    span(css`kanban-eyebrow`, "Your workspace"),
                    h1(css`kanban-title`, "Project Kanban"),
                    p(css`kanban-subtitle`, "Plan it, move it, ship it. Search, filter by priority, and move cards through the workflow — everything persists in this browser.")
                ),
                button("+ New task", { class: "kanban-new", onclick() { openEditor(); } })
            ),
            StatStrip(),
            div(css`kanban-toolbar`,
                inputText({
                    class: "kanban-search",
                    type: "search",
                    placeholder: "Search title, description, or assignee…",
                    "aria-label": "Search tasks",
                    bind: search,
                }),
                div(css`kanban-filters`,
                    ...["all", ...PRIORITIES].map(value => button(
                        value === "all" ? "All priorities" : (value[0].toUpperCase() + value.slice(1)),
                        {
                            class: computed(() => priorityFilter.value === value ? "kanban-filter kanban-filter--active" : "kanban-filter"),
                            onclick() { priorityFilter.value = value; },
                        }
                    ))
                )
            ),
            div(css`kanban-board`,
                ...STATUSES.map(entry => Column(entry.id))
            ),
            div(css`kanban-footer`,
                span("Built with "),
                a({ href: "/" }, "Jetz"),
                span(" — tasks stay in your browser via localStorage.")
            )
        ),
        EditorModal()
    );
}
