import Prism from "prismjs/components/prism-core.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";

import { Component, html, stateOf, computed } from "../lib/jetz.js";
import {
    a, button, code, div, h1, h2, h3, header, hr, main, p, pre, section, span
} from "../lib/jetz-ui.js";

import * as Aetheria from "./aetheria-ui.js";

export class AetheriaDocs extends Component {
    render() {
        Aetheria.injectAetheriaStyles();

        const highlight = (source) => html(
            Prism.highlight(source.trim(), Prism.languages.javascript, "javascript")
        );

        const activeSection = stateOf("all");
        const pivotGridData = [
            { category: "Hardware", region: "North America", sales: 18400 },
            { category: "Hardware", region: "Europe", sales: 12600 },
            { category: "Hardware", region: "Asia Pacific", sales: 15300 },
            { category: "Hardware", region: "South America", sales: 7200 },
            { category: "Software", region: "North America", sales: 24600 },
            { category: "Software", region: "Europe", sales: 19800 },
            { category: "Software", region: "Asia Pacific", sales: 22100 },
            { category: "Software", region: "South America", sales: 9400 },
            { category: "Services", region: "North America", sales: 13700 },
            { category: "Services", region: "Europe", sales: 11200 },
            { category: "Services", region: "Asia Pacific", sales: 8700 },
            { category: "Services", region: "South America", sales: 6100 }
        ];

        const users = [
            { id: 1, name: "Ada Lovelace", role: "Lead Engineer", city: "London" },
            { id: 2, name: "Alan Turing", role: "Architect", city: "Manchester" },
            { id: 3, name: "Grace Hopper", role: "Director", city: "New York" },
            { id: 4, name: "Claude Shannon", role: "Scientist", city: "Boston" },
            { id: 5, name: "Katherine Johnson", role: "Data Analyst", city: "Hampton" },
            { id: 6, name: "Tim Berners-Lee", role: "Web Architect", city: "London" },
            { id: 7, name: "Margaret Hamilton", role: "Software Director", city: "Cambridge" },
            { id: 8, name: "Dennis Ritchie", role: "Systems Engineer", city: "Murray Hill" },
            { id: 9, name: "Barbara Liskov", role: "Principal Engineer", city: "Boston" },
            { id: 10, name: "Donald Knuth", role: "Professor", city: "Stanford" },
            { id: 11, name: "Linus Torvalds", role: "Kernel Developer", city: "Portland" },
            { id: 12, name: "Bjarne Stroustrup", role: "Software Architect", city: "College Station" },
            { id: 13, name: "James Gosling", role: "Platform Engineer", city: "Calgary" },
            { id: 14, name: "Brendan Eich", role: "Technical Director", city: "San Francisco" },
            { id: 15, name: "Guido van Rossum", role: "Senior Engineer", city: "Belmont" },
            { id: 16, name: "Anders Hejlsberg", role: "Language Designer", city: "Seattle" },
            { id: 17, name: "John Carmack", role: "Research Engineer", city: "Dallas" },
            { id: 18, name: "Sophie Wilson", role: "Hardware Architect", city: "Cambridge" },
            { id: 19, name: "Radia Perlman", role: "Network Engineer", city: "Redwood City" },
            { id: 20, name: "Ken Thompson", role: "Distinguished Engineer", city: "Berkeley" },
            { id: 21, name: "Margaret Mitchell", role: "AI Researcher", city: "Atlanta" },
            { id: 22, name: "Fei-Fei Li", role: "AI Director", city: "Stanford" },
            { id: 23, name: "Geoffrey Hinton", role: "Research Scientist", city: "Toronto" },
            { id: 24, name: "Yann LeCun", role: "Chief AI Scientist", city: "New York" },
            { id: 25, name: "Andrew Ng", role: "Founder", city: "Palo Alto" },
            { id: 26, name: "Jensen Huang", role: "CEO", city: "Santa Clara" },
            { id: 27, name: "Lisa Su", role: "CEO", city: "Austin" },
            { id: 28, name: "Satya Nadella", role: "CEO", city: "Redmond" },
            { id: 29, name: "Susan Wojcicki", role: "Executive", city: "Menlo Park" },
            { id: 30, name: "Sheryl Sandberg", role: "Operations Director", city: "Palo Alto" },
            { id: 31, name: "Paul Graham", role: "Investor", city: "Mountain View" },
            { id: 32, name: "Patrick Collison", role: "CEO", city: "San Francisco" },
            { id: 33, name: "Drew Houston", role: "Founder", city: "San Francisco" },
            { id: 34, name: "Melanie Perkins", role: "CEO", city: "Sydney" },
            { id: 35, name: "Tobias Lütke", role: "Founder", city: "Ottawa" },
            { id: 36, name: "Stewart Butterfield", role: "Product Director", city: "Vancouver" },
            { id: 37, name: "Whitney Wolfe Herd", role: "Founder", city: "Austin" },
            { id: 38, name: "Brian Chesky", role: "CEO", city: "San Francisco" },
            { id: 39, name: "Evan Spiegel", role: "Product Executive", city: "Los Angeles" },
            { id: 40, name: "Kevin Systrom", role: "Entrepreneur", city: "San Francisco" },
            { id: 41, name: "Nadia Rahman", role: "Frontend Developer", city: "Jakarta" },
            { id: 42, name: "Budi Santoso", role: "Backend Developer", city: "Bandung" },
            { id: 43, name: "Siti Nurhaliza", role: "Product Manager", city: "Surabaya" },
            { id: 44, name: "Rizky Pratama", role: "UI/UX Designer", city: "Yogyakarta" },
            { id: 45, name: "Dewi Anggraini", role: "QA Engineer", city: "Semarang" },
            { id: 46, name: "Fajar Ramadhan", role: "DevOps Engineer", city: "Bekasi" },
            { id: 47, name: "Putri Maharani", role: "Data Scientist", city: "Tangerang" },
            { id: 48, name: "Arif Wibowo", role: "Security Engineer", city: "Depok" },
            { id: 49, name: "Intan Permata", role: "Business Analyst", city: "Malang" },
            { id: 50, name: "Dimas Saputra", role: "Mobile Developer", city: "Denpasar" },
            { id: 51, name: "Kevin Wijaya", role: "Fullstack Developer", city: "Jakarta" },
            { id: 52, name: "Amelia Putri", role: "Engineering Manager", city: "Bandung" },
            { id: 53, name: "Yoga Prasetyo", role: "Database Administrator", city: "Surabaya" },
            { id: 54, name: "Maya Kusuma", role: "Cloud Architect", city: "Yogyakarta" },
            { id: 55, name: "Rendra Firmansyah", role: "System Analyst", city: "Semarang" },
            { id: 56, name: "Clara Wijaya", role: "UX Researcher", city: "Jakarta" },
            { id: 57, name: "Hendra Gunawan", role: "Technical Writer", city: "Bogor" },
            { id: 58, name: "Laras Puspita", role: "Scrum Master", city: "Makassar" },
            { id: 59, name: "Aditya Nugroho", role: "Software Tester", city: "Palembang" },
            { id: 60, name: "Vina Oktaviani", role: "Product Designer", city: "Medan" },
            { id: 61, name: "Oscar Martinez", role: "Cloud Engineer", city: "Madrid" },
            { id: 62, name: "Emily Carter", role: "Product Designer", city: "New York" },
            { id: 63, name: "Noah Williams", role: "Data Engineer", city: "Chicago" },
            { id: 64, name: "Olivia Brown", role: "UX Designer", city: "Melbourne" },
            { id: 65, name: "Liam Wilson", role: "Software Engineer", city: "Dublin" },
            { id: 66, name: "Emma Taylor", role: "Engineering Lead", city: "Amsterdam" },
            { id: 67, name: "Lucas Anderson", role: "Cloud Architect", city: "Berlin" },
            { id: 68, name: "Isabella Thomas", role: "Product Owner", city: "Paris" },
            { id: 69, name: "Ethan Moore", role: "Security Analyst", city: "Singapore" },
            { id: 70, name: "Mia Jackson", role: "QA Lead", city: "Tokyo" },
            { id: 71, name: "Alexander White", role: "Platform Engineer", city: "Zurich" },
            { id: 72, name: "Charlotte Harris", role: "Research Scientist", city: "Copenhagen" },
            { id: 73, name: "Benjamin Martin", role: "Backend Developer", city: "Lisbon" },
            { id: 74, name: "Amelia Thompson", role: "Frontend Developer", city: "Stockholm" },
            { id: 75, name: "Henry Garcia", role: "DevOps Engineer", city: "Toronto" },
            { id: 76, name: "Harper Clark", role: "Technical Lead", city: "Sydney" },
            { id: 77, name: "Daniel Lewis", role: "Mobile Developer", city: "Seoul" },
            { id: 78, name: "Evelyn Robinson", role: "Data Analyst", city: "Hong Kong" },
            { id: 79, name: "Matthew Walker", role: "Systems Engineer", city: "Helsinki" },
            { id: 80, name: "Abigail Young", role: "Product Manager", city: "Dubai" }
        ];
        const showcase = (titleText, desc, codeStr, previewComponent, allowPreviewOverflow = false) => div(
            {
                class: `aetheria-glass aetheria-docs-section${allowPreviewOverflow ? " aetheria-showcase-overflow-visible" : ""}`
            },
            div(
                { class: "aetheria-docs-section-head" },
                h3({ class: "aetheria-docs-section-title" }, titleText),
                p({ class: "aetheria-docs-section-desc" }, desc)
            ),
            div(
                { class: "aetheria-docs-split" },
                div(
                    { class: "aetheria-docs-code" },
                    div({ class: "aetheria-docs-eyebrow" }, "Code Example"),
                    pre(
                        code({ class: "language-javascript" }, highlight(codeStr))
                    )
                ),
                div(
                    {
                        class: `aetheria-glass aetheria-docs-preview${allowPreviewOverflow ? " aetheria-showcase-preview" : ""}`
                    },
                    div({ class: "aetheria-docs-eyebrow" }, "Live Preview"),
                    div({ class: "aetheria-docs-preview-body" }, previewComponent)
                )
            )
        );

        const btnState = stateOf("Click Me");
        const switchState = stateOf(true);
        const checkState = stateOf(true);
        const radioState = stateOf("Option 1");
        const sliderVal = stateOf(60);
        const modalOpen = stateOf(false);
        const drawerOpen = stateOf(false);
        const contextAction = stateOf("No action selected");
        const themeMode = stateOf("dark");
        const modalDrawerOverlays = div(
            new Aetheria.Modal().render({
                open: modalOpen,
                title: "Glass Confirmation",
                onclose: () => { modalOpen.value = false; },
                children: p("This is a modal dialog rendered inside the Aetheria glassmorphic theme.")
            }),
            new Aetheria.Drawer().render({
                open: drawerOpen,
                title: "Navigation Drawer",
                onclose: () => { drawerOpen.value = false; },
                children: div(
                    p("Drawer content pane with vector glass styling."),
                    new Aetheria.Button().render({
                        variant: "muted",
                        label: "Close Drawer",
                        onclick: () => { drawerOpen.value = false; }
                    })
                )
            })
        );

        return div(
            { class: "aetheria-root aetheria-docs" },
            div(
                { class: "aetheria-docs-inner" },
                header(
                    { class: "aetheria-docs-head" },
                    div(
                        { class: "aetheria-stack" },
                        h1({ class: "aetheria-docs-title" }, "Aetheria UI Documentation"),
                        p(
                            { class: "aetheria-docs-subtitle" },
                            "Complete component catalog written natively in Jetz with reactive states and Prism live previews."
                        )
                    ),
                    div(
                        { class: "aetheria-docs-nav" },
                        computed(() => new Aetheria.IconButton().render({
                            icon: themeMode.value === "dark" ? "sun" : "moon",
                            title: themeMode.value === "dark" ? "Switch to light theme" : "Switch to dark theme",
                            active: themeMode.value === "dark",
                            onclick: () => {
                                themeMode.value = themeMode.value === "dark" ? "light" : "dark";
                                Aetheria.setAetheriaTheme(themeMode.value);
                            }
                        }))
                    )
                ),
                main({ class: "aetheria-col" },
                showcase(
                    "Button & IconButton",
                    "Interactive buttons with glassmorphic styles, ripple sheen, and icon circle actions.",
                    `import { Ae } from "./aetheria-ui.js";

const btnState = stateOf("Click Me");

Ae.Button({
    variant: "primary",
    label: btnState,
    onclick: () => { btnState.value = "Clicked!"; }
});
new IconButton().render({ icon: "star", active: true });`,
                    div(
                        { class: "aetheria-row" },
                        Aetheria.Ae.Button({
                            variant: "primary",
                            label: btnState,
                            onclick: () => { btnState.value = "Clicked!"; }
                        }),
                        Aetheria.Ae.Button({ variant: "secondary", label: "Secondary" }),
                        Aetheria.Ae.Button({ variant: "border", label: "Bordered" }),
                        new Aetheria.IconButton().render({ icon: "star", active: true }),
                        new Aetheria.IconButton().render({ icon: "settings" })
                    )
                ),
                showcase(
                    "TextInput & TextArea",
                    "Glass input elements with glow outlines, placeholder styling, and reactive two-way binding.",
                    `import { TextInput, TextArea } from "./aetheria-ui.js";

new TextInput().render({ placeholder: "Enter text..." });
new TextArea().render({ placeholder: "Write message...", rows: 2 });`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.TextInput().render({ placeholder: "Enter your name..." }),
                        new Aetheria.TextArea().render({ placeholder: "Write detailed feedback...", rows: 2 })
                    )
                ),
                showcase(
                    "Checkbox, Radio & Switch",
                    "Custom styled toggles and binary selection controls.",
                    `import { Checkbox, Radio, Switch } from "./aetheria-ui.js";

new Checkbox().render({ label: "Glass Checkbox", checked: checkState });
new Radio().render({ name: "demo", label: "Radio 1", checked: true });
new Switch().render({ label: "Glass Switch", checked: switchState });`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Checkbox().render({ label: "Enable Notifications", checked: checkState }),
                        div(
                            { class: "aetheria-row" },
                            new Aetheria.Radio().render({ name: "rad1", label: "Option A", checked: true }),
                            new Aetheria.Radio().render({ name: "rad1", label: "Option B" })
                        ),
                        new Aetheria.Switch().render({ label: "Dark Aura Mode", checked: switchState })
                    )
                ),
                showcase(
                    "Select & MultiSelect",
                    "Custom glass select menu with styled descriptions, active/selected states, keyboard navigation, and a checkbox-based multiselect.",
                    `import { Select, MultiSelect } from "./aetheria-ui.js";

new Select().render({
    options: ["Design", "Development", "Marketing"]
});
new MultiSelect().render({
    options: ["Vue", "React", "Jetz", "Svelte"]
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Select().render({
                            placeholder: "Choose a team",
                            value: "engineering",
                            options: [
                                { label: "Design System", value: "design", description: "Tokens, components, and visual language" },
                                { label: "Engineering", value: "engineering", description: "Frontend and platform development" },
                                { label: "Product Strategy", value: "product", description: "Research, roadmap, and delivery" }
                            ]
                        }),
                        new Aetheria.MultiSelect().render({
                            options: ["Jetz Core", "Aetheria UI", "Router", "DevTools"]
                        })
                    ),
                    true
                ),
                showcase(
                    "Slider & RangeSlider",
                    "Range controls for single-value intensity or dual range intervals.",
                    `import { Slider, RangeSlider } from "./aetheria-ui.js";

new Slider().render({ min: 0, max: 100, value: sliderVal });
new RangeSlider().render({ min: 0, max: 100, low: 20, high: 80 });`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Slider().render({ min: 0, max: 100, value: sliderVal }),
                        new Aetheria.RangeSlider().render({ min: 0, max: 100, low: 25, high: 75 })
                    )
                ),
                showcase(
                    "Badge, Avatar & Card",
                    "Informational badges, user avatars, and glassmorphic card containers.",
                    `import { Badge, Avatar, Card } from "./aetheria-ui.js";

new Badge().render({ text: "PRO", variant: "primary" });
new Avatar().render({ name: "Alex Ross" });
new Card().render({ title: "Glass Panel" });`,
                    div(
                        { class: "aetheria-col" },
                        div(
                            { class: "aetheria-row aetheria-row-tight" },
                            new Aetheria.Avatar({ name: "Aetheria" }),
                            new Aetheria.Badge().render({ text: "SYSTEM V1.0", variant: "primary" }),
                            new Aetheria.Badge().render({ text: "ONLINE" })
                        ),
                        new Aetheria.Card().render({
                            title: "Interactive Telemetry",
                            children: p({ class: "aetheria-text-sm" }, "Live glass surface with subtle borders and shadows.")
                        })
                    )
                ),
                showcase(
                    "Spinner & ProgressBar",
                    "Activity indicators and gradient-filled loading bars.",
                    `import { Spinner, ProgressBar } from "./aetheria-ui.js";

new Spinner().render();
new ProgressBar().render({ value: 68, max: 100 });`,
                    div(
                        { class: "aetheria-col" },
                        div({ class: "aetheria-row" }, new Aetheria.Spinner().render(), span("Synchronizing state...")),
                        new Aetheria.ProgressBar().render({ value: 72, max: 100 })
                    )
                ),
                showcase(
                    "Dropdown & Autocomplete",
                    "Action menus and filterable search inputs.",
                    `import { Dropdown, Autocomplete } from "./aetheria-ui.js";

new Dropdown().render({
    trigger: "Actions",
    items: ["Edit", "Duplicate", "Delete"]
});
new Autocomplete().render({
    items: ["Apple", "Banana", "Cherry"],
    placeholder: "Search fruits..."
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Dropdown().render({
                            trigger: "Select Operation",
                            items: ["Deploy Container", "Restart Engine", "View Audit Log"]
                        }),
                        new Aetheria.Autocomplete().render({
                            items: ["Jetz Framework", "Aetheria Glass", "TypeScript", "Vite", "Tailwind CSS"],
                            placeholder: "Type to autocomplete..."
                        })
                    )
                ),
                showcase(
                    "Context Menu",
                    "Right-click the preview area to open a positioned menu; select an action or click outside to dismiss it.",
                    `import { ContextMenu } from "./aetheria-ui.js";

new ContextMenu().render({
    items: ["Open", "Rename", "Delete"],
    onselect: (item) => console.log("Selected:", item)
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.ContextMenu().render({
                            items: ["Open", "Rename", "Delete"],
                            onselect: item => { contextAction.value = `Selected: ${item}`; },
                            children: div(
                                {
                                    class: "aetheria-row aetheria-row-center aetheria-text-center aetheria-text-muted aetheria-demo-target"
                                },
                                "Right-click in this area"
                            )
                        }),
                        span(
                            { class: "aetheria-text-xs aetheria-text-muted" },
                            computed(() => contextAction.value)
                        )
                    )
                ),
                showcase(
                    "Tabs & Accordion",
                    "Content grouping and collapsible disclosure panels.",
                    `import { Tabs, Accordion } from "./aetheria-ui.js";

new Tabs().render({
    tabs: [
        { label: "Overview", content: "Overview text" },
        { label: "Metrics", content: "Metrics text" }
    ]
});
new Accordion().render({
    items: [{ title: "FAQ 1", content: "Answer 1" }]
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Tabs().render({
                            tabs: [
                                { label: "General", content: p("Core configuration parameters.") },
                                { label: "Security", content: p("Two-factor authentication and keys.") }
                            ]
                        }),
                        new Aetheria.Accordion().render({
                            items: [
                                { title: "What is Jetz?", content: "A composable, reactive JavaScript framework." },
                                { title: "Does it need build steps?", content: "No custom syntax or JSX compilation needed." }
                            ]
                        })
                    )
                ),
                showcase(
                    "Modal & Drawer",
                    "Floating modal dialogs and slide-out side drawers.",
                    `import { Modal, Drawer, Button } from "./aetheria-ui.js";

new Button().render({ label: "Open Modal", onclick: () => { modalOpen.value = true; } });
new Modal().render({ open: modalOpen, title: "Dialog Title" });
new Drawer().render({ open: drawerOpen, title: "Drawer Menu" });`,
                    div(
                        { class: "aetheria-row" },
                        new Aetheria.Button().render({
                            variant: "primary",
                            label: "Open Dialog",
                            onclick: () => { modalOpen.value = true; }
                        }),
                        new Aetheria.Button().render({
                            variant: "secondary",
                            label: "Open Drawer",
                            onclick: () => { drawerOpen.value = true; }
                        })
                    )
                ),
                showcase(
                    "Tooltip & Popover",
                    "Contextual micro-help bubbles and rich click-triggered popovers.",
                    `import { Ae, Tooltip } from "./aetheria-ui.js";

new Tooltip().render({ text: "Hover here", content: "Helper info" });
Ae.Popover({ trigger: "Details", content: "Rich content" });`,
                    div(
                        { class: "aetheria-row" },
                        new Aetheria.Tooltip().render({
                            text: "Hover over this tooltip",
                            content: "Aetheria glass tooltip active!"
                        }),
                        Aetheria.Ae.Popover({
                            trigger: "Click for details",
                            content: div(
                                h3({ class: "aetheria-panel-title" }, "Popover Heading"),
                                p({ class: "aetheria-text-sm" }, "Detailed breakdown of status and metrics.")
                            )
                        })
                    )
                ),
                showcase(
                    "DatePicker & Calendar",
                    "Open a compact custom date dialog with draft, cancel, and apply controls. Click the month or year at the top of the calendar to jump between dates, months, and years.",
                    `import { stateOf } from "../lib/jetz.js";
import { DatePicker, Calendar } from "./aetheria-ui.js";

const selectedDate = stateOf("2025-04-15");
new DatePicker().render({
    value: selectedDate,
    min: "2025-01-01",
    max: "2025-12-31",
    onchange: date => console.log(date)
});
new Calendar().render({
    value: selectedDate,
    onchange: date => console.log(date)
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.DatePicker().render({
                            value: stateOf("2025-04-15"),
                            min: "2025-01-01",
                            max: "2025-12-31",
                            onchange: date => console.log("Selected date:", date)
                        }),
                        new Aetheria.Calendar().render({
                            value: "2025-04-15"
                        })
                    )
                ),
                showcase(
                    "DateRangePicker",
                    "Two clicks pick the start and end of a span; the days between stay highlighted. The value is an ISO interval: \u0022YYYY-MM-DD/YYYY-MM-DD\u0022.",
                    `import { stateOf } from "../lib/jetz.js";
import { DateRangePicker } from "./aetheria-ui.js";

const reportRange = stateOf("2025-04-10/2025-04-18");
new DateRangePicker().render({
    value: reportRange,
    min: "2025-01-01",
    max: "2025-12-31",
    onchange: (interval, span) => console.log(interval, span)
});`,
                    new Aetheria.DateRangePicker().render({
                        value: stateOf("2025-04-10/2025-04-18"),
                        min: "2025-01-01",
                        max: "2025-12-31",
                        onchange: interval => console.log("Selected range:", interval)
                    })
                ),
                showcase(
                    "Form Validation",
                    "Reactive form with inline validation feedback and submit prevention.",
                    `import { FormValidation } from "./aetheria-ui.js";

new FormValidation().render({
    onsubmit: (data) => console.log(data)
});`,
                    new Aetheria.FormValidation().render()
                ),
                showcase(
                    "Pagination & Breadcrumb",
                    "Page navigation controls and hierarchical location trails.",
                    `import { Pagination, Breadcrumb } from "./aetheria-ui.js";

new Pagination().render({ totalPages: 5, currentPage: 1 });
new Breadcrumb().render({ items: ["Home", "Products", "Aetheria"] });`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Breadcrumb().render({ items: ["Workspace", "Analytics", "Live Stream"] }),
                        new Aetheria.Pagination().render({ totalPages: 5, currentPage: 2 })
                    )
                ),
                showcase(
                    "DataGrid with Sorting & Filtering",
                    "Search and sort records, page locally or request remote pages, select rows, render custom cells, and expand detail content.",
                    `import { stateOf } from "../lib/jetz.js";
import { DataGrid } from "./aetheria-ui.js";
import { span, div } from "../lib/jetz-ui.js";

new DataGrid().render({
    columns: [
        { key: "name", label: "User Name", render: value => span(value) },
        { key: "role", label: "Title" },
        { key: "city", label: "Location", sortable: false }
    ],
    rows: [
        { id: 1, name: "Ada Lovelace", role: "Lead Engineer", city: "London" },
        { id: 2, name: "Alan Turing", role: "Architect", city: "Manchester" }
    ],
    pageable: true,
    pageSize: 10,
    selectable: true,
    expandable: true,
    renderDetails: row => div(\`\${row.name} profile details\`),
    onpagechange: (page, pageSize) => console.log(page, pageSize),
    onselectionchange: rows => console.log(rows)
});

new DataGrid().render({
    columns: ["name", "role"],
    rows: [{ name: "Ada", role: "Engineer" }],
    pageable: true,
    serverSide: true,
    totalRows: 248,
    page: stateOf(1),
    pageSize: 20,
    onpagechange: (page, pageSize) => console.log("Fetch remote page:", page, pageSize)
});`,

                    new Aetheria.DataGrid().render({
                        columns: [
                            { key: "id", label: "ID" },
                            { key: "name", label: "User Name" },
                            { key: "role", label: "Title" },
                            { key: "city", label: "Location" }
                        ],
                        rows: users,
                        pageable: true,
                        pageSize: 10,
                        selectable: true,
                        expandable: true,
                        renderDetails: row => div(
                            { class: "aetheria-text-muted" },
                            `${row.name} — ${row.role} based in ${row.city}. Employee ID: ${row.id}.`
                        ),
                        onpagechange: (page, pageSize) =>
                            console.log("Grid page:", page, pageSize),
                        onselectionchange: selected =>
                            console.log("Selected rows:", selected)
                    }),
                ),
                showcase(
                    "TreeView & TreeGrid",
                    "Hierarchical tree view and multi-column tree tables with expanding nodes.",
                    `import { TreeView, TreeGrid } from "./aetheria-ui.js";

new TreeView().render({
    nodes: [{ label: "Root", children: [{ label: "Child" }] }]
});`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.TreeView().render({
                            nodes: [
                                {
                                    label: "Source Directory",
                                    children: [
                                        { label: "aetheria-ui.js" },
                                        { label: "aetheria-docs.js" }
                                    ]
                                },
                                {
                                    label: "Packages",
                                    children: [{ label: "jetz.js" }]
                                }
                            ]
                        }),
                        new Aetheria.TreeGrid().render({
                            columns: ["File / Directory", "Kind", "Size"],
                            data: [
                                {
                                    name: "src",
                                    type: "Folder",
                                    size: "1.2 MB",
                                    children: [
                                        { name: "theme.js", type: "JavaScript", size: "2.4 KB" }
                                    ]
                                }
                            ]
                        })
                    )
                ),
                showcase(
                    "ListView with Virtual Scrolling",
                    "High-performance list container rendering only visible viewport items.",
                    `import { ListView } from "./aetheria-ui.js";

new ListView().render({
    items: Array.from({ length: 50 }, (_, i) => \`Item #\${i + 1}\`),
    itemHeight: 40,
    visibleCount: 4
});`,
                    new Aetheria.ListView().render({
                        items: Array.from({ length: 60 }, (_, i) => `Server Instance #${i + 1} [Active]`),
                        itemHeight: 40,
                        visibleCount: 4
                    })
                ),
                showcase(
                    "Command Toolbar",
                    "Pill toolbar with quick action triggers.",
                    `import { CommandToolbar } from "./aetheria-ui.js";

new CommandToolbar().render({
    commands: [
        { label: "Save", icon: "save" },
        { label: "Export", icon: "upload" }
    ]
});`,
                    new Aetheria.CommandToolbar().render({
                        commands: [
                            { label: "Commit", icon: "check" },
                            { label: "Branch", icon: "gitBranch" },
                            { label: "Push", icon: "arrowUp" }
                        ]
                    })
                ),
                showcase(
                    "FileManager",
                    "Grid browser for exploring documents and folders.",
                    `import { FileManager } from "./aetheria-ui.js";

new FileManager().render({
    files: [
        { name: "Documents", type: "folder" },
        { name: "manifest.json", type: "file" }
    ]
});`,
                    new Aetheria.FileManager().render({
                        files: [
                            { name: "Assets", type: "folder" },
                            { name: "Styles", type: "folder" },
                            { name: "index.html", type: "file" },
                            { name: "jetz.svg", type: "file" }
                        ]
                    })
                ),
                showcase(
                    "Drag-and-Drop Sortable",
                    "Interactive reorderable item list with drag-and-drop feedback.",
                    `import { SortableList } from "./aetheria-ui.js";

new SortableList().render({
    items: ["High Priority Task", "Medium Priority Task", "Low Priority Task"]
});`,
                    new Aetheria.SortableList().render({
                        items: ["1. Review Architecture", "2. Deploy Production Build", "3. Update Documentation"]
                    })
                ),
                showcase(
                    "Chart & Sparkline",
                    "Vector SVG trendlines and inline miniature sparklines.",
                    `import { Chart, Sparkline } from "./aetheria-ui.js";

new Chart().render({ data: [10, 45, 30, 70, 50, 95] });
new Sparkline().render({ data: [4, 8, 15, 12, 24] });`,
                    div(
                        { class: "aetheria-col" },
                        div({ class: "aetheria-row" }, span("Realtime Throughput:"), new Aetheria.Sparkline().render({ data: [12, 28, 14, 45, 32, 60] })),
                        new Aetheria.Chart().render({ data: [15, 38, 25, 65, 48, 88], width: 340, height: 120 })
                    )
                ),
                showcase(
                    "Scheduler & Gantt",
                    "Time-based event schedulers and project timeline Gantt bars.",
                    `import { Scheduler, Gantt } from "./aetheria-ui.js";

new Scheduler().render({ events: [{ time: "10:00", title: "Standup" }] });
new Gantt().render({ tasks: [{ name: "Design", start: 0, duration: 40 }] });`,
                    div(
                        { class: "aetheria-col" },
                        new Aetheria.Scheduler().render({
                            events: [
                                { time: "09:00", title: "Morning Triage" },
                                { time: "11:00", title: "Architecture Sync" }
                            ]
                        }),
                        new Aetheria.Gantt().render({
                            tasks: [
                                { name: "Planning", start: 0, duration: 30 },
                                { name: "Implementation", start: 25, duration: 55 },
                                { name: "Verification", start: 70, duration: 30 }
                            ]
                        })
                    )
                ),
                showcase(
                    "Spreadsheet",
                    "Interactive matrix spreadsheet with formula/cell inputs.",
                    `import { Spreadsheet } from "./aetheria-ui.js";

new Spreadsheet().render({ rows: 4, cols: 3 });`,
                    new Aetheria.Spreadsheet().render({ rows: 4, cols: 4 })
                ),
                showcase(
                    "RichTextEditor",
                    "WYSIWYG formatting editor with bold, italic, and underline controls.",
                    `import { RichTextEditor } from "./aetheria-ui.js";

new RichTextEditor().render({ initialContent: "Welcome to Aetheria UI" });`,
                    new Aetheria.RichTextEditor().render({ initialContent: "Aetheria UI written in Jetz." })
                ),
                showcase(
                    "PivotGrid",
                    "Sales are summarized by product category and region, with subtotals and a grand total.",
                    `import { PivotGrid } from "./aetheria-ui.js";

new PivotGrid().render({
    data: ${JSON.stringify(pivotGridData, null, 8)}
});`,
                    new Aetheria.PivotGrid().render({ data: pivotGridData })
                ),
                showcase(
                    "PDF Viewer & Export",
                    "Vector document preview container with instant print/export trigger.",
                    `import { PdfViewer } from "./aetheria-ui.js";

new PdfViewer().render({ title: "Annual_Summary.pdf" });`,
                    new Aetheria.PdfViewer().render({ title: "Aetheria_Design_System.pdf" })
                )
                )
            ),
            modalDrawerOverlays
        );
    }

}