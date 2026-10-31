// Prism core plus the JavaScript grammar, shared with every other page through
// `src/prism.js`, which also switches off the automatic document sweep.
import { Prism } from "../prism.js";

import { Component, html, stateOf, computed, listOf } from "../lib/jetz.js";
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
        const liveLabel = stateOf("Ready");
        const liveOptions = listOf("alpha", "beta");
        const liveChoice = stateOf("alpha");
        const modalDrawerOverlays = div(
            Aetheria.Ae.Modal({
                open: modalOpen,
                title: "Glass Confirmation",
                onclose: () => { modalOpen.value = false; },
                children: p("This is a modal dialog rendered inside the Aetheria glassmorphic theme.")
            }),
            Aetheria.Ae.Drawer({
                open: drawerOpen,
                title: "Navigation Drawer",
                onclose: () => { drawerOpen.value = false; },
                children: div(
                    p("Drawer content pane with vector glass styling."),
                    Aetheria.Ae.Button({
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
                    "Reactive props",
                    "Every prop is a live binding: pass a stateOf, a computed, a getter function, or a listOf and the component repaints when it changes. Collection props (options, items, rows, columns, tabs, data, nodes, events) read a listOf as a tracked snapshot, so push, removeAt and set update the control in place. A component also works with plain literals, which are then just static. Only seeds stay one-shot: RichTextEditor initialContent, FormValidation values, and the field list FormValidation derives from its rules.",
                    `import { stateOf, listOf } from "../lib/jetz.js";
import { Ae } from "./aetheria-ui.js";

const label = stateOf("Ready");
const options = listOf("alpha", "beta");
const choice = stateOf("alpha");

Ae.Badge({ text: label, variant: "primary" });
Ae.Select({ value: choice, options });

// any of these repaints the components, no remount needed
label.value = "Saved";
options.push("gamma");
choice.value = "beta";

// derived props work the same way
const doubled = computed(() => options.value.map(name => name.toUpperCase()));
Ae.ListView({ items: doubled });`,
                    div(
                        { class: "aetheria-row" },
                        Aetheria.Ae.Badge({ text: liveLabel, variant: "primary" }),
                        Aetheria.Ae.Select({ value: liveChoice, options: liveOptions }),
                        Aetheria.Ae.Button({
                            variant: "secondary",
                            label: "Add option",
                            onclick: () => liveOptions.push(`option ${liveOptions.value.length + 1}`)
                        }),
                        Aetheria.Ae.Button({
                            variant: "border",
                            label: "Toggle label",
                            onclick: () => { liveLabel.value = liveLabel.value === "Ready" ? "Saved" : "Ready"; }
                        })
                    )
                ),
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
Ae.IconButton({ icon: "star", active: true });`,
                    div(
                        { class: "aetheria-row" },
                        Aetheria.Ae.Button({
                            variant: "primary",
                            label: btnState,
                            onclick: () => { btnState.value = "Clicked!"; }
                        }),
                        Aetheria.Ae.Button({ variant: "secondary", label: "Secondary" }),
                        Aetheria.Ae.Button({ variant: "border", label: "Bordered" }),
                        Aetheria.Ae.IconButton({ icon: "star", active: true }),
                        Aetheria.Ae.IconButton({ icon: "settings" })
                    )
                ),
                showcase(
                    "TextInput & TextArea",
                    "Glass input elements with glow outlines, placeholder styling, and reactive two-way binding.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.TextInput({ placeholder: "Enter text..." });
Ae.TextArea({ placeholder: "Write message...", rows: 2 });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.TextInput({ placeholder: "Enter your name..." }),
                        Aetheria.Ae.TextArea({ placeholder: "Write detailed feedback...", rows: 2 })
                    )
                ),
                showcase(
                    "Checkbox, Radio & Switch",
                    "Custom styled toggles and binary selection controls.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Checkbox({ label: "Glass Checkbox", checked: checkState });
Ae.Radio({ name: "demo", label: "Radio 1", checked: true });
Ae.Switch({ label: "Glass Switch", checked: switchState });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Checkbox({ label: "Enable Notifications", checked: checkState }),
                        div(
                            { class: "aetheria-row" },
                            Aetheria.Ae.Radio({ name: "rad1", label: "Option A", checked: true }),
                            Aetheria.Ae.Radio({ name: "rad1", label: "Option B" })
                        ),
                        Aetheria.Ae.Switch({ label: "Dark Aura Mode", checked: switchState })
                    )
                ),
                showcase(
                    "Select & MultiSelect",
                    "Custom glass select menu with styled descriptions, active/selected states, keyboard navigation, and a checkbox-based multiselect.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Select({
    options: ["Design", "Development", "Marketing"]
});
Ae.MultiSelect({
    options: ["Vue", "React", "Jetz", "Svelte"]
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Select({
                            placeholder: "Choose a team",
                            value: "engineering",
                            options: [
                                { label: "Design System", value: "design", description: "Tokens, components, and visual language" },
                                { label: "Engineering", value: "engineering", description: "Frontend and platform development" },
                                { label: "Product Strategy", value: "product", description: "Research, roadmap, and delivery" }
                            ]
                        }),
                        Aetheria.Ae.MultiSelect({
                            options: ["Jetz Core", "Aetheria UI", "Router", "DevTools"]
                        })
                    ),
                    true
                ),
                showcase(
                    "Slider & RangeSlider",
                    "Range controls for single-value intensity or dual range intervals.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Slider({ min: 0, max: 100, value: sliderVal });
Ae.RangeSlider({ min: 0, max: 100, low: 20, high: 80 });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Slider({ min: 0, max: 100, value: sliderVal }),
                        Aetheria.Ae.RangeSlider({ min: 0, max: 100, low: 25, high: 75 })
                    )
                ),
                showcase(
                    "Badge, Avatar & Card",
                    "Informational badges, user avatars, and glassmorphic card containers.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Badge({ text: "PRO", variant: "primary" });
Ae.Avatar({ name: "Alex Ross" });
Ae.Card({ title: "Glass Panel" });`,
                    div(
                        { class: "aetheria-col" },
                        div(
                            { class: "aetheria-row aetheria-row-tight" },
                            Aetheria.Ae.Avatar({ name: "Aetheria" }),
                            Aetheria.Ae.Badge({ text: "SYSTEM V1.0", variant: "primary" }),
                            Aetheria.Ae.Badge({ text: "ONLINE" })
                        ),
                        Aetheria.Ae.Card({
                            title: "Interactive Telemetry",
                            children: p({ class: "aetheria-text-sm" }, "Live glass surface with subtle borders and shadows.")
                        })
                    )
                ),
                showcase(
                    "Spinner & ProgressBar",
                    "Activity indicators and gradient-filled loading bars.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Spinner();
Ae.ProgressBar({ value: 68, max: 100 });`,
                    div(
                        { class: "aetheria-col" },
                        div({ class: "aetheria-row" }, Aetheria.Ae.Spinner(), span("Synchronizing state...")),
                        Aetheria.Ae.ProgressBar({ value: 72, max: 100 })
                    )
                ),
                showcase(
                    "Dropdown & Autocomplete",
                    "Action menus and filterable search inputs.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Dropdown({
    trigger: "Actions",
    items: ["Edit", "Duplicate", "Delete"]
});
Ae.Autocomplete({
    items: ["Apple", "Banana", "Cherry"],
    placeholder: "Search fruits..."
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Dropdown({
                            trigger: "Select Operation",
                            items: ["Deploy Container", "Restart Engine", "View Audit Log"]
                        }),
                        Aetheria.Ae.Autocomplete({
                            items: ["Jetz Framework", "Aetheria Glass", "TypeScript", "Vite", "Tailwind CSS"],
                            placeholder: "Type to autocomplete..."
                        })
                    )
                ),
                showcase(
                    "Context Menu",
                    "Right-click the preview area to open a positioned menu; select an action or click outside to dismiss it.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.ContextMenu({
    items: ["Open", "Rename", "Delete"],
    onselect: (item) => console.log("Selected:", item)
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.ContextMenu({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.Tabs({
    tabs: [
        { label: "Overview", content: "Overview text" },
        { label: "Metrics", content: "Metrics text" }
    ]
});
Ae.Accordion({
    items: [{ title: "FAQ 1", content: "Answer 1" }]
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Tabs({
                            tabs: [
                                { label: "General", content: p("Core configuration parameters.") },
                                { label: "Security", content: p("Two-factor authentication and keys.") }
                            ]
                        }),
                        Aetheria.Ae.Accordion({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.Button({ label: "Open Modal", onclick: () => { modalOpen.value = true; } });
Ae.Modal({ open: modalOpen, title: "Dialog Title" });
Ae.Drawer({ open: drawerOpen, title: "Drawer Menu" });`,
                    div(
                        { class: "aetheria-row" },
                        Aetheria.Ae.Button({
                            variant: "primary",
                            label: "Open Dialog",
                            onclick: () => { modalOpen.value = true; }
                        }),
                        Aetheria.Ae.Button({
                            variant: "secondary",
                            label: "Open Drawer",
                            onclick: () => { drawerOpen.value = true; }
                        })
                    )
                ),
                showcase(
                    "Tooltip & Popover",
                    "Contextual micro-help bubbles and rich click-triggered popovers.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Tooltip({ text: "Hover here", content: "Helper info" });
Ae.Popover({ trigger: "Details", content: "Rich content" });`,
                    div(
                        { class: "aetheria-row" },
                        Aetheria.Ae.Tooltip({
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
import { Ae } from "./aetheria-ui.js";

const selectedDate = stateOf("2025-04-15");
Ae.DatePicker({
    value: selectedDate,
    min: "2025-01-01",
    max: "2025-12-31",
    onchange: date => console.log(date)
});
Ae.Calendar({
    value: selectedDate,
    onchange: date => console.log(date)
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.DatePicker({
                            value: stateOf("2025-04-15"),
                            min: "2025-01-01",
                            max: "2025-12-31",
                            onchange: date => console.log("Selected date:", date)
                        }),
                        Aetheria.Ae.Calendar({
                            value: "2025-04-15"
                        })
                    )
                ),
                showcase(
                    "DateRangePicker",
                    "Two clicks pick the start and end of a span; the days between stay highlighted. The value is an ISO interval: \u0022YYYY-MM-DD/YYYY-MM-DD\u0022.",
                    `import { stateOf } from "../lib/jetz.js";
import { Ae } from "./aetheria-ui.js";

const reportRange = stateOf("2025-04-10/2025-04-18");
Ae.DateRangePicker({
    value: reportRange,
    min: "2025-01-01",
    max: "2025-12-31",
    onchange: (interval, span) => console.log(interval, span)
});`,
                    Aetheria.Ae.DateRangePicker({
                        value: stateOf("2025-04-10/2025-04-18"),
                        min: "2025-01-01",
                        max: "2025-12-31",
                        onchange: interval => console.log("Selected range:", interval)
                    })
                ),
                showcase(
                    "Form Validation",
                    "FormValidation owns the values, the rules and the submit gate; children(form) renders the fields you want. Rules read like Laravel: required, email, url, numeric, integer, min, max, len, regex, in, same, confirmed, accepted. A field stops at its first failing rule, and only required runs while the field is empty. Errors stay hidden until the field is touched or the form is submitted.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.FormValidation({
    rules: {
        email: "required|email",
        password: "required|min:8",
        terms: "accepted"
    },
    // Per-field text overrides and one-off checks on top of the string rules.
    messages: { email: { required: "We need your address" } },
    checks: { email: value => value.endsWith(".io") ? "" : "Use a .io address" },
    onsubmit: data => console.log(data),
    oninvalid: errors => console.log(errors),
    // Everything the handle returns is a State or computed: pass it on as-is,
    // never read .value while building the tree.
    children: form => div(
        form.field("email"),                                  // Ae.TextInput by default
        form.message("email"),
        form.field("password", Ae.TextInput, { type: "password" }),
        form.message("password"),
        form.field("terms", Ae.Checkbox, {
            checked: form.value("terms"),
            label: "Accept terms"
        }),
        form.message("terms"),
        button({ type: "submit", class: "aetheria-btn aetheria-btn-primary" }, "Sign up")
    )
});

// valid is a computed, so read it inside a callback: p(() => form.valid.value).
// form.values(), form.error(name), form.touch(name) and form.reset() round out
// the handle.

// With no children it renders a ready-made demo form.
Ae.FormValidation({ onsubmit: data => console.log(data) });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.FormValidation({
                            rules: {
                                email: "required|email",
                                password: "required|min:6"
                            },
                            messages: { email: { required: "We need your address" } },
                            onsubmit: data => console.log("signed up", data),
                            children: form => div(
                                { class: "aetheria-col" },
                                form.field("email", Aetheria.Ae.TextInput, { placeholder: "you@company.io" }),
                                form.message("email"),
                                form.field("password", Aetheria.Ae.TextInput, {
                                    type: "password",
                                    placeholder: "at least 6 characters"
                                }),
                                form.message("password"),
                                button(
                                    { type: "submit", class: "aetheria-btn aetheria-btn-primary" },
                                    "Sign up"
                                )
                            )
                        }),
                        Aetheria.Ae.FormValidation({
                            onsubmit: data => console.log("submitted", data)
                        })
                    )
                ),
                showcase(
                    "Pagination & Breadcrumb",
                    "Page navigation controls and hierarchical location trails.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Pagination({ totalPages: 5, currentPage: 1 });
Ae.Breadcrumb({ items: ["Home", "Products", "Aetheria"] });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Breadcrumb({ items: ["Workspace", "Analytics", "Live Stream"] }),
                        Aetheria.Ae.Pagination({ totalPages: 5, currentPage: 2 })
                    )
                ),
                showcase(
                    "DataGrid with Sorting & Filtering",
                    "Search and sort records, page locally or request remote pages, select rows, render custom cells, and expand detail content.",
                    `import { stateOf } from "../lib/jetz.js";
import { Ae } from "./aetheria-ui.js";
import { span, div } from "../lib/jetz-ui.js";

Ae.DataGrid({
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

Ae.DataGrid({
    columns: ["name", "role"],
    rows: [{ name: "Ada", role: "Engineer" }],
    pageable: true,
    serverSide: true,
    totalRows: 248,
    page: stateOf(1),
    pageSize: 20,
    onpagechange: (page, pageSize) => console.log("Fetch remote page:", page, pageSize)
});`,

                    Aetheria.Ae.DataGrid({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.TreeView({
    nodes: [{ label: "Root", children: [{ label: "Child" }] }]
});`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.TreeView({
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
                        Aetheria.Ae.TreeGrid({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.ListView({
    items: Array.from({ length: 50 }, (_, i) => \`Item #\${i + 1}\`),
    itemHeight: 40,
    visibleCount: 4
});`,
                    Aetheria.Ae.ListView({
                        items: Array.from({ length: 60 }, (_, i) => `Server Instance #${i + 1} [Active]`),
                        itemHeight: 40,
                        visibleCount: 4
                    })
                ),
                showcase(
                    "Command Toolbar",
                    "Pill toolbar with quick action triggers.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.CommandToolbar({
    commands: [
        { label: "Save", icon: "save" },
        { label: "Export", icon: "upload" }
    ]
});`,
                    Aetheria.Ae.CommandToolbar({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.FileManager({
    files: [
        { name: "Documents", type: "folder" },
        { name: "manifest.json", type: "file" }
    ]
});`,
                    Aetheria.Ae.FileManager({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.SortableList({
    items: ["High Priority Task", "Medium Priority Task", "Low Priority Task"]
});`,
                    Aetheria.Ae.SortableList({
                        items: ["1. Review Architecture", "2. Deploy Production Build", "3. Update Documentation"]
                    })
                ),
                showcase(
                    "Chart & Sparkline",
                    "Vector SVG trendlines and inline miniature sparklines.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Chart({ data: [10, 45, 30, 70, 50, 95] });
Ae.Sparkline({ data: [4, 8, 15, 12, 24] });`,
                    div(
                        { class: "aetheria-col" },
                        div({ class: "aetheria-row" }, span("Realtime Throughput:"), Aetheria.Ae.Sparkline({ data: [12, 28, 14, 45, 32, 60] })),
                        Aetheria.Ae.Chart({ data: [15, 38, 25, 65, 48, 88], width: 340, height: 120 })
                    )
                ),
                showcase(
                    "Scheduler & Gantt",
                    "Time-based event schedulers and project timeline Gantt bars.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.Scheduler({ events: [{ time: "10:00", title: "Standup" }] });
Ae.Gantt({ tasks: [{ name: "Design", start: 0, duration: 40 }] });`,
                    div(
                        { class: "aetheria-col" },
                        Aetheria.Ae.Scheduler({
                            events: [
                                { time: "09:00", title: "Morning Triage" },
                                { time: "11:00", title: "Architecture Sync" }
                            ]
                        }),
                        Aetheria.Ae.Gantt({
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
                    `import { Ae } from "./aetheria-ui.js";

Ae.Spreadsheet({ rows: 4, cols: 3 });`,
                    Aetheria.Ae.Spreadsheet({ rows: 4, cols: 4 })
                ),
                showcase(
                    "RichTextEditor",
                    "WYSIWYG formatting editor with bold, italic, and underline controls.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.RichTextEditor({ initialContent: "Welcome to Aetheria UI" });`,
                    Aetheria.Ae.RichTextEditor({ initialContent: "Aetheria UI written in Jetz." })
                ),
                showcase(
                    "PivotGrid",
                    "Sales are summarized by product category and region, with subtotals and a grand total.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.PivotGrid({
    data: ${JSON.stringify(pivotGridData, null, 8)}
});`,
                    Aetheria.Ae.PivotGrid({ data: pivotGridData })
                ),
                showcase(
                    "PDF Viewer & Export",
                    "Vector document preview container with instant print/export trigger.",
                    `import { Ae } from "./aetheria-ui.js";

Ae.PdfViewer({ title: "Annual_Summary.pdf" });`,
                    Aetheria.Ae.PdfViewer({ title: "Aetheria_Design_System.pdf" })
                )
                )
            ),
            modalDrawerOverlays
        );
    }

}