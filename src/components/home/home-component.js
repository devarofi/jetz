import { link } from "../../lib/jetz-router.js";
import { a, alt, article, code, css, div, h1, h2, header, img, main, nav, p, pre, section, small, span, src, strong, width } from "../../lib/jetz-ui.js";
import logo from '../../../public/img/logo/small.png';
import '../../../public/css/style.css';

export function Home(){
    return main(
        { id: 'welcome-page' },
        header(css`welcome-header`,
            a({ class: 'welcome-brand', href: '/' },
                img(src(logo), alt`Jetz`, width`42`),
                span('jetz')
            ),
            nav(css`welcome-nav`,
                a({ href: 'https://github.com/devarofi/jetz', target: '_blank', rel: 'noreferrer' }, 'GitHub', span('↗'))
            )
        ),
        section(css`welcome-hero`,
            div(css`welcome-copy`,
                span(css`welcome-kicker`, span(css`welcome-kicker-dot`), 'A JavaScript UI framework'),
                h1('Build interfaces.', span(css`welcome-headline-accent`, 'Stay in JavaScript.')),
                p('Compose reactive web experiences with native JavaScript. No JSX, no compiler magic, just a small set of expressive building blocks.'),
                div(css`welcome-actions`,
                    a({ class: 'welcome-action welcome-action--primary', href: 'https://github.com/devarofi/jetz#quick-start', target: '_blank', rel: 'noreferrer' }, 'Get started', span('↗')),
                    a({ class: 'welcome-action welcome-action--text', href: 'https://github.com/devarofi/jetz', target: '_blank', rel: 'noreferrer' }, 'Explore the source', span('→'))
                ),
                div(css`welcome-meta`,
                    span('Fine-grained reactivity'),
                    span('·'),
                    span('Direct DOM updates'),
                    span('·'),
                    span('Zero JSX')
                )
            ),
            article(css`welcome-code-panel`,
                div(css`welcome-code-topbar`,
                    div(css`welcome-code-dots`, span(), span(), span()),
                    small('hello-jetz.js'),
                    span(css`welcome-code-label`, 'LIVE IDEA')
                ),
                pre(css`welcome-code`,
                    code(
`import { Jetz, stateOf } from "@daevsoft/jetz";
import { div, button } from "@daevsoft/jetz/ui";

const clicks = stateOf(0);

const App = div(
  button("Clicked ", clicks, " times", {
    onclick: () => clicks.value++
  })
);

Jetz.mount(App, document.body);`
                    )
                ),
                div(css`welcome-code-foot`, span('●'), 'Plain JavaScript. Reactive by design.')
            )
        ),
        section(css`welcome-capabilities`,
            div(css`welcome-section-heading`,
                span(css`welcome-overline`, 'THE BUILDING BLOCKS'),
                h2('Everything you need. Nothing in the way.')
            ),
            div(css`welcome-feature-list`,
                article(css`welcome-feature`, span(css`welcome-feature-number`, '01'), h2('Compose'), p('Build interfaces from familiar functions and small, reusable components.')),
                article(css`welcome-feature`, span(css`welcome-feature-number`, '02'), h2('React'), p('State changes update the exact DOM nodes that depend on them.')),
                article(css`welcome-feature`, span(css`welcome-feature-number`, '03'), h2('Ship'), p('Use standard JavaScript with no JSX transform or template compiler.'))
            )
        ),
        section(css`welcome-examples`,
            div(css`welcome-example-copy`, span(css`welcome-overline`, 'TAKE IT FOR A SPIN'), h2('A framework should feel good to build with.'), p('Open a working example and explore Jetz in motion.')),
            div(css`welcome-example-links`,
                link('open-todo', a({ href: '#open-todo', class: 'welcome-example-link' }, span('01'), strong('Task list'), span('Reactive state in a familiar workflow'), span('↗'))),
                link('calculator', a({ href: '#calculator', class: 'welcome-example-link' }, span('02'), strong('Calculator'), span('A complete interactive app'), span('↗')))
            )
        ),
        section(css`welcome-bottom`, p('Made for the web, with the web.'), a({ href: 'https://github.com/devarofi/jetz', target: '_blank', rel: 'noreferrer' }, 'Jetz on GitHub ↗'))
    )
}