import { link } from "../../lib/jetz-router.js";
import { html, onMount } from "../../lib/jetz.js";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
import "./docs.css";
import {
    a, article, aside, code, css, details, div, h1, header, href, li, main, nav,
    p, pre, span, summary, ul,
} from "../../lib/jetz-ui.js";

const DOC_PAGES = [
    { group: "Documentation", items: [{ path: "/docs", label: "Overview" }] },
    {
        group: "Getting started",
        items: [
            { path: "/docs/quick-start", label: "Quick start" },
            { path: "/docs/elements", label: "Elements & attributes" },
            { path: "/docs/composition", label: "UI composition" },
            { path: "/docs/components", label: "Components" },
        ],
    },
    {
        group: "Reactivity",
        items: [
            { path: "/docs/reactive-state", label: "State & persistence" },
            { path: "/docs/reactivity", label: "Computed & effects" },
            { path: "/docs/collections", label: "Lists & conditionals" },
            { path: "/docs/lifecycle", label: "Binding & lifecycle" },
            { path: "/docs/performance", label: "Large data sets" },
        ],
    },
    {
        group: "Application",
        items: [
            { path: "/docs/routing", label: "Routing & middleware" },
            { path: "/docs/integrations", label: "Sessions & utilities" },
        ],
    },
    {
        group: "Reference",
        items: [
            { path: "/docs/devtools", label: "DevTools & testing" },
            { path: "/docs/api-reference", label: "API reference" },
        ],
    },
    {
        group: "API tutorials",
        items: [
            { path: "/docs/api/state", label: "Reactive state" },
            { path: "/docs/api/collections", label: "Collections & branching" },
            { path: "/docs/api/components", label: "Components & lifecycle" },
            { path: "/docs/api/elements", label: "Elements & utilities" },
            { path: "/docs/api/application", label: "Routing & application" },
        ],
    },
];

function docsLink(path, label, activePath) {
    const active = path === activePath;
    const element = a({
        href: path,
        "aria-current": active ? "page" : null,
    },
        css`block rounded-lg border-l-2 px-3 py-2 text-sm transition ${active
            ? "border-emerald-400 bg-zinc-800 text-emerald-300"
            : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white"} whitespace-nowrap`,
        label
    );
    return link(path, element);
}

function sidebarGroup(title, items) {
    return details({
        // Expanded by default: every section is visible on first paint.
        open: true,
        class: "jetz-docs-nav-group mb-2",
    },
        summary(css`mb-1 cursor-pointer list-none rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400`,
            title
        ),
        ul(css`space-y-1 border-l border-zinc-800 ml-3 pl-2`,
            ...items.map(item => li(docsLink(item.path, item.label, activePath)))
        )
    );
}

export function codeBlock(source, language = "javascript", filename = "Example.js", badge = null, explanation = null) {
    const highlighted = hljs.getLanguage(language)
        ? hljs.highlight(source, { language }).value
        : hljs.highlightAuto(source).value;
    const panel = div(css`jetz-docs-code min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0d10]`,
        div(css`flex items-center justify-between border-b border-zinc-800 px-4 py-3`,
            span(css`text-xs font-semibold uppercase tracking-wider text-zinc-500`, filename),
            span(css`rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400`, badge ?? language.toUpperCase())
        ),
        pre(css`overflow-x-auto p-4 text-[13px] leading-6 text-zinc-300`,
            html(`<code class="hljs language-${language}">${highlighted}</code>`)
        ),
        explanation == null ? null : p(css`border-t border-zinc-800 px-4 py-3 text-sm leading-6 text-zinc-400`, explanation)
    );
    onMount(() => {
        if (typeof document === "undefined") return;
        const root = panel.getElement?.();
        root?.querySelectorAll("pre code.hljs").forEach(block => {
            try { hljs.highlightElement(block); } catch { /* already highlighted */ }
        });
    });
    return panel;
}

export function codePanel(source) {
    return codeBlock(source, "javascript", "Example.js", "JAVASCRIPT");
}

export function previewPanel(content) {
    return div(css`jetz-docs-preview min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-[#111114]`,
        div(css`flex items-center justify-between border-b border-zinc-800 px-4 py-3`,
            span(css`text-xs font-semibold uppercase tracking-wider text-zinc-500`, "Live result"),
            span(css`flex items-center gap-2 text-[10px] font-medium text-emerald-400`,
                span(css`h-1.5 w-1.5 rounded-full bg-emerald-400`),
                "INTERACTIVE"
            )
        ),
        div(css`flex min-h-56 items-center justify-center p-6`, content)
    );
}

export function lessonExample(source, result, explanation) {
    return div(css`grid min-w-0 gap-4 xl:grid-cols-2`,
        codeBlock(source, "javascript", "Example.js", "JAVASCRIPT", explanation),
        previewPanel(result)
    );
}

export function lesson(activePath, eyebrow, title, explanation, ...content) {
    return docsLayout(activePath,
        article(css`mx-auto max-w-6xl`,
            div(css`py-10 sm:py-12`,
                p(css`mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400`, eyebrow),
                // Lesson headings and examples are separate from the shared
                // navigation so each topic can live in its own module.
                ...lessonContent(title, explanation, content)
            )
        )
    );
}

function lessonContent(title, explanation, content) {
    return [
        div({ class: "mb-8" },
            h1(css`max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl`, title),
            p(css`mt-4 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base`, explanation)
        ),
        ...content,
    ];
}

export function docsLayout(activePath, content) {
    return div({ id: "jetz-docs" }, css`min-h-screen bg-[#09090b] text-zinc-200`,
        header(css`jetz-docs-topbar sticky top-0 z-30 h-16 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur`,
            div(css`flex h-full items-center justify-between px-5 sm:px-7`,
                link("/", a(href`/`, css`flex items-center gap-3 text-white`,
                    span(css`flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400 text-sm font-black text-zinc-950`, "J"),
                    span(css`text-base font-bold tracking-wide`, "JETZ"),
                    span(css`hidden rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-zinc-400 sm:inline`, "DOCS")
                )),
                div(css`flex items-center gap-3`,
                    span(css`hidden text-xs text-zinc-500 sm:inline`, "v1.1.2"),
                    a({
                        href: "https://github.com/devarofi/jetz",
                        target: "_blank",
                        rel: "noreferrer",
                    }, css`rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white`, "GitHub")
                )
            )
        ),
        div(css`mx-auto flex max-w-[1600px]`,
            aside(css`jetz-docs-sidebar sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-zinc-800 px-4 py-7 md:block lg:w-64`,
                ...DOC_PAGES.map(section => sidebarGroup(section.group, section.items, activePath))
            ),
            main(css`min-w-0 flex-1 px-5 pb-20 sm:px-8 lg:px-12`,
                nav(css`-mx-5 flex gap-2 overflow-x-auto border-b border-zinc-800 px-5 py-3 md:hidden`,
                    ...DOC_PAGES.flatMap(section => section.items.map(item =>
                        docsLink(item.path, item.label, activePath)
                    ))
                ),
                content
            )
        )
    );
}
