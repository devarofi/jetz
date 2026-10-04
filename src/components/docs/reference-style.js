import { stateOf, loop, _if } from "../../lib/jetz.js";
import {
    div, nav, header, a, span, h1, h2, h3, p, button,
    main, aside, ul, li, code, pre, css
} from "../../lib/jetz-ui.js";

// 1. Data Dummy untuk Navigasi Dokumentasi
const docMenu = [
    {
        category: "Getting Started",
        items: [
            { id: "intro", title: "Introduction" },
            { id: "quick-start", title: "Quick Start" },
            { id: "installation", title: "Installation" }
        ]
    },
    {
        category: "Core Concepts",
        items: [
            { id: "reactivity", title: "Reactivity (stateOf)" },
            { id: "components", title: "Components" },
            { id: "loop", title: "List Rendering (loop)" },
            { id: "lifecycle", title: "Lifecycle Hooks" }
        ]
    }
];

const tocMenu = [
    { id: "what-is-jetz", title: "What is Jetz?" },
    { id: "core-philosophy", title: "Core Philosophy" },
    { id: "example", title: "Quick Example" }
];

// State untuk halaman yang sedang aktif (reaktif)
const activePage = stateOf("intro");

// --- 2. Komponen Navbar Atas ---
function TopNavbar() {
    return header(
        css`sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 bg-white/95 supports-backdrop-blur:bg-white/60`,
        div(
            css`max-w-8xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between`,
            // Logo
            a({ href: "/", class: "flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900" },
                span(css`bg-blue-600 text-white px-2 py-1 rounded-md text-sm`, "Jetz"),
                "Docs"
            ),
            // Menu Kanan
            div(
                css`flex items-center gap-6 text-sm font-medium text-slate-700`,
                a(css`hover:text-blue-600 transition-colors`, { href: "#" }, "Guide"),
                a(css`hover:text-blue-600 transition-colors`, { href: "#" }, "API Reference"),
                div(css`h-5 w-px bg-slate-200`), // Separator
                a(css`hover:text-blue-600 transition-colors`, { href: "https://github.com/devarofi/jetz" }, "GitHub")
            )
        )
    );
}

// --- 3. Komponen Sidebar Kiri (Navigasi Kategori) ---
function LeftSidebar() {
    return aside(
        css`fixed inset-0 top-16 right-auto z-20 hidden lg:block w-[19.5rem] pb-10 px-8 overflow-y-auto border-r border-slate-200`,
        nav(
            css`pt-8`,
            ul(
                loop(docMenu, group => group.category, group => li(
                    css`mb-8`,
                    h3(css`font-semibold text-slate-900 mb-3 text-sm`, group.category),
                    ul(
                        css`space-y-2 border-l border-slate-200`,
                        loop(group.items, item => item.id, item => li(
                            a(
                                // Styling reaktif: Jika aktif, beri warna biru dan border tebal di kiri
                                css(() => `block pl-4 -ml-px border-l-2 text-sm transition-colors ${activePage.value === item.id
                                        ? "border-blue-600 text-blue-600 font-medium"
                                        : "border-transparent text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                    }`),
                                {
                                    href: `#${item.id}`,
                                    onclick: (e) => {
                                        e.preventDefault();
                                        activePage.value = item.id;
                                    }
                                },
                                item.title
                            )
                        ))
                    )
                ))
            )
        )
    );
}

// --- 4. Komponen Sidebar Kanan (Daftar Isi / TOC) ---
function RightSidebar() {
    return aside(
        css`hidden xl:block fixed inset-0 top-16 left-auto z-20 w-[19.5rem] pb-10 px-8 overflow-y-auto`,
        nav(
            css`pt-8`,
            h3(css`font-semibold text-slate-900 mb-3 text-sm`, "On this page"),
            ul(
                css`space-y-2.5 text-sm`,
                loop(tocMenu, item => item.id, item => li(
                    a(
                        css`text-slate-600 hover:text-slate-900 transition-colors block`,
                        { href: `#${item.id}` },
                        item.title
                    )
                ))
            )
        )
    );
}

// --- 5. Komponen Konten Utama ---
function MainContent() {
    return main(
        css`lg:pl-[19.5rem] xl:pr-[19.5rem] pt-10 pb-24 px-4 sm:px-6 md:px-8 w-full max-w-8xl mx-auto`,

        // Breadcrumb
        p(css`text-sm font-medium text-blue-600 mb-2`, "Getting Started"),

        // Judul Halaman
        h1(css`text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6`, "Introduction to Jetz"),

        // Paragraf
        p(css`text-lg text-slate-600 mb-8 leading-relaxed`,
            "Jetz is a Composable JavaScript Framework for building reactive web interfaces with declarative JavaScript—without JSX, build-time compilation flags, or complex template languages."
        ),

        h2(css`text-2xl font-semibold text-slate-900 mt-12 mb-4 border-b border-slate-200 pb-2`, { id: "core-philosophy" }, "Core Philosophy"),
        p(css`text-slate-600 mb-4 leading-relaxed`,
            "Web interfaces frequently force developers to pick between low-level imperative DOM APIs or heavyweight toolchains. Jetz offers a third way: declarative, composable JavaScript with reactive state management, without leaving standard JavaScript."
        ),

        ul(css`list-disc list-inside text-slate-600 space-y-2 mb-8 ml-4`,
            li(span(css`font-semibold text-slate-900`, "UI = JavaScript Composition:"), " Build DOM trees with simple function calls."),
            li(span(css`font-semibold text-slate-900`, "State = Reactive:"), " State values notify bound elements directly; no virtual-DOM diffing passes required."),
            li(span(css`font-semibold text-slate-900`, "Components = Composable:"), " Package UI into pure functions.")
        ),

        h2(css`text-2xl font-semibold text-slate-900 mt-12 mb-4 border-b border-slate-200 pb-2`, { id: "example" }, "Quick Example"),
        p(css`text-slate-600 mb-4`, "Here is what a simple interactive counter looks like in Jetz:"),

        // Block Kode (Mockup Syntax Highlighting)
        div(
            css`bg-slate-800 rounded-xl overflow-hidden mb-8 shadow-md`,
            div(css`flex items-center px-4 py-2 bg-slate-700/50 border-b border-slate-700`,
                span(css`text-xs text-slate-400 font-mono`, "app.js")
            ),
            pre(
                css`p-4 text-sm font-mono text-slate-50 overflow-x-auto leading-normal`,
                code(
                    `import { Jetz, stateOf } from "@daevsoft/jetz";
import { button, div, h1 } from "@daevsoft/jetz/ui";

const count = stateOf(0);

const App = () => div(
  h1("Interactive Counter"),
  button({ 
    onclick: () => count.value++ 
  }, "Clicked ", count, " times")
);

Jetz.mount(App, "#app");`
                )
            )
        ),

        // Navigasi Halaman Selanjutnya / Sebelumnya
        div(
            css`mt-16 pt-8 border-t border-slate-200 flex justify-between items-center`,
            div(), // Spacer kiri jika tidak ada "Previous"
            a(
                css`flex flex-col text-right hover:bg-slate-50 p-4 rounded-lg transition-colors`,
                { href: "#quick-start" },
                span(css`text-sm text-slate-500 mb-1`, "Next"),
                span(css`text-base font-semibold text-blue-600`, "Quick Start →")
            )
        )
    );
}

// --- 6. Layout Utama Aplikasi ---
export function DocumentationApp() {
    return div(
        css`min-h-screen bg-white text-slate-900 selection:bg-blue-200`,
        TopNavbar(),
        div(
            css`w-full max-w-8xl mx-auto flex justify-center`,
            LeftSidebar(),
            MainContent(),
            RightSidebar()
        )
    );
}