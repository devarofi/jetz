import { css, div, h2, p, span } from "../../lib/jetz-ui.js";
import { codeBlock, lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;

function tutorialSection(title, summary, source, explanation) {
    return div(css`mt-8`,
        h2(css`text-xl font-semibold text-white`, title),
        p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`, summary),
        div(css`mt-4`, codeBlock(source, "javascript", "Example.js", "JAVASCRIPT", explanation))
    );
}

function routeRow(path, label) {
    return div(css`flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2`,
        span(css`font-mono text-sm text-white`, path),
        span(css`text-xs text-zinc-500`, label)
    );
}

export function DocsRouting() {
    return lesson("/docs/routing", "Application", "Build and optimize routed pages",
        "A router connects browser URLs to page components and lets users move between pages without reloading the whole app. Follow these steps to install a router, create links and route groups, read URL parameters, protect pages, and set page metadata for SEO.",
        lessonExample(
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, route, link as routeLink } from "@daevsoft/jetz/router";\n' +
            'import { a, main, nav, p } from "@daevsoft/jetz/ui";\n\n' +
            'function Home() { return p("Welcome home."); }\n' +
            'function About() { return p("About this app."); }\n\n' +
            'const router = new Router(\n' +
            '  route("/", Home),\n' +
            '  route("/about", About)\n' +
            ');\n' +
            'Jetz.use(router);\n\n' +
            'function App() {\n' +
            '  return main(\n' +
            '    nav(\n' +
            '      routeLink("/", a("Home")),\n' +
            '      routeLink("/about", a("About"))\n' +
            '    ),\n' +
            '    router.browser()\n' +
            '  );\n' +
            '}\n\n' +
            'Jetz.mount(App, "#app");',
            div(CARD,
                p(css`text-xs font-semibold uppercase tracking-wider text-emerald-400`, "Example route paths"),
                div(css`mt-4 space-y-3`,
                    routeRow("/", "Home page"),
                    routeRow("/about", "About page")
                ),
                p(css`mt-4 text-xs leading-5 text-zinc-500`, "routeLink attaches client-side navigation to a link element.")
            ),
            "Create one route() for each page, install the Router before mounting the app, and place router.browser() in the shared page shell. routeLink() connects links to client-side navigation so the browser does not need to reload the whole page."
        ),
        tutorialSection(
            "Step 1: Group routes and read URL parameters",
            "Use group() to add a shared path prefix to related routes. Put a colon before a path segment, such as :slug, to capture its value. Jetz passes decoded route parameters to the page component and the route's metadata callback.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, group, route } from "@daevsoft/jetz/router";\n' +
            'import { div, p } from "@daevsoft/jetz/ui";\n\n' +
            'const articles = {\n' +
            '  "getting-started": { title: "Getting started", description: "Build your first page." }\n' +
            '};\n' +
            'function Home() { return p("Welcome."); }\n' +
            'function ArticleIndex() { return p("All articles."); }\n' +
            'function ArticlePage({ slug }) {\n' +
            '  return div(p("Article: ", slug));\n' +
            '}\n\n' +
            'const router = new Router(\n' +
            '  route("/", Home),\n' +
            '  group("/articles", {\n' +
            '    routes: [\n' +
            '      route("/", ArticleIndex),\n' +
            '      route("/:slug", ArticlePage)\n' +
            '    ]\n' +
            '  })\n' +
            ');\n\n' +
            'Jetz.use(router);\n' +
            '// /articles/getting-started gives slug === "getting-started"',
            "The group prefix combines with child route paths: its index page is /articles, and the detail page is /articles/:slug. For /articles/getting-started, Jetz calls ArticlePage with the parameter object { slug: 'getting-started' }."
        ),
        tutorialSection(
            "Step 2: Add navigation links",
            "Use routeLink() to attach router navigation to an existing element. Use asLink() as an event modifier when the element is created directly. Use asBackLink for browser history; redirect() is for a full browser navigation, such as leaving your site.",
            'import {\n' +
            '  asBackLink, asLink, link as routeLink, redirect\n' +
            '} from "@daevsoft/jetz/router";\n' +
            'import { a, button, div } from "@daevsoft/jetz/ui";\n\n' +
            '// Assumes the router and /articles/:slug route are installed.\n' +
            'const articleLink = routeLink(\n' +
            '  "/articles/getting-started",\n' +
            '  a("Read the article")\n' +
            ');\n\n' +
            'const navigation = div(\n' +
            '  articleLink,\n' +
            '  button({\n' +
            '    onclick: asLink("/articles/getting-started")\n' +
            '  }, "Open article"),\n' +
            '  button({ onclick: asBackLink.onclick }, "Go back"),\n' +
            '  button({\n' +
            '    onclick: () => redirect("https://example.com")\n' +
            '  }, "Visit example.com")\n' +
            ');',
            "routeLink() returns the link element with client-side navigation attached. asLink() and asBackLink are Jetz event modifiers that belong in an element's attributes object. redirect() changes the browser location and loads the destination as a regular page."
        ),
        tutorialSection(
            "Step 3: Protect pages with middleware",
            "A middleware runs before a protected route opens. Return true to allow navigation, or call deny() to block it with a reason. A group can apply the same middleware to all of its child routes.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, group, route } from "@daevsoft/jetz/router";\n' +
            'import { Middleware } from "@daevsoft/jetz/middleware";\n\n' +
            'import { div } from "@daevsoft/jetz/ui";\n\n' +
            'function Home() { return div("Public home"); }\n' +
            'function AccountHome() { return div("Your account"); }\n' +
            'function AccountSettings() { return div("Account settings"); }\n' +
            'class RequireSignIn extends Middleware {\n' +
            '  next(_params, _continue) {\n' +
            '    if (!localStorage.getItem("token")) {\n' +
            '      return this.deny("Please sign in first");\n' +
            '    }\n' +
            '    return true;\n' +
            '  }\n' +
            '}\n\n' +
            'const router = new Router(\n' +
            '  route("/", Home),\n' +
            '  group("/account", {\n' +
            '    middlewares: RequireSignIn,\n' +
            '    routes: [\n' +
            '      route("/", AccountHome),\n' +
            '      route("/settings", AccountSettings)\n' +
            '    ]\n' +
            '  })\n' +
            ');\n' +
            'Jetz.use(router);',
            "RequireSignIn checks for a saved token before allowing a route. Middleware is useful for client-side navigation flow, but it is not a security boundary: the server must still authorize access to private data and operations."
        ),
        tutorialSection(
            "Step 4: Set SEO metadata for each route",
            "A route's head callback runs when the router activates that page. Return a title and useful metadata so the browser tab and the live document describe the current route. Use absolute canonical URLs that point to the preferred public URL for each page.",
            'import { Jetz } from "@daevsoft/jetz";\n' +
            'import { Router, route } from "@daevsoft/jetz/router";\n' +
            'import {\n' +
            '  link as headLink, meta, p, title\n' +
            '} from "@daevsoft/jetz/ui";\n\n' +
            'const siteUrl = "https://example.com";\n' +
            'const articles = {\n' +
            '  "getting-started": {\n' +
            '    title: "Getting started with Jetz",\n' +
            '    description: "Learn to build your first Jetz page."\n' +
            '  }\n' +
            '};\n' +
            'function Home() { return p("Welcome to Example."); }\n' +
            'function ArticlePage({ slug }) {\n' +
            '  const article = articles[slug];\n' +
            '  return p(article ? article.title : "Article not found");\n' +
            '}\n\n' +
            'const router = new Router(\n' +
            '  route("/", {\n' +
            '    component: Home,\n' +
            '    head: () => [\n' +
            '      title("Home | Example"),\n' +
            '      meta({ name: "description", content: "Welcome to Example." }),\n' +
            '      meta({ property: "og:title", content: "Home | Example" }),\n' +
            '      meta({ property: "og:description", content: "Welcome to Example." }),\n' +
            '      headLink({ rel: "canonical", href: `${siteUrl}/` })\n' +
            '    ]\n' +
            '  }),\n' +
            '  route("/articles/:slug", {\n' +
            '    component: ArticlePage,\n' +
            '    head: ({ slug }) => {\n' +
            '      const article = articles[slug];\n' +
            '      if (!article) return title("Article not found | Example");\n' +
            '      const url = `${siteUrl}/articles/${encodeURIComponent(slug)}`;\n' +
            '      return [\n' +
            '        title(`${article.title} | Example`),\n' +
            '        meta({ name: "description", content: article.description }),\n' +
            '        meta({ property: "og:title", content: article.title }),\n' +
            '        meta({ property: "og:description", content: article.description }),\n' +
            '        headLink({ rel: "canonical", href: url })\n' +
            '      ];\n' +
            '    }\n' +
            '  })\n' +
            ');\n' +
            'Jetz.use(router);',
            "The home and article routes each supply a title and description. Article metadata comes from the same article record as its page; encodeURIComponent() keeps the slug safe in the URL. The canonical link uses the preferred HTTPS address. Jetz replaces route-managed metadata when the user navigates to another page."
        ),
        tutorialSection(
            "SEO checklist: test and publish",
            "Client-side metadata improves the live page during navigation, but it is applied only after JavaScript runs. Some search crawlers and social preview bots read the initial HTML response without waiting for the app. For reliable previews and indexing, serve or prerender the correct HTML head for each public route.",
            '1. Give every public route a unique, accurate title and description.\n' +
            '2. Add a canonical URL for the preferred version of each page.\n' +
            '3. Add Open Graph metadata for links shared on social platforms.\n' +
            '4. Open each route and inspect document.title and document.head.\n' +
            '5. Test the initial HTML response, not only the page after JavaScript runs.\n' +
            '6. If crawlers need the metadata immediately, prerender each route or use a server that renders route-specific HTML.\n' +
            '7. Configure your host to serve the app entry for client-side routes; generate a sitemap separately if your site needs one.',
            "Treat this as a publishing checklist, not a built-in Jetz SEO generator. Jetz updates head elements during client-side routing, but it does not provide server-side rendering, prerendering, sitemap generation, or hosting rewrite rules automatically."
        )
    );
}
