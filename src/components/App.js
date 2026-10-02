import { button, css, footer, main, span } from  "../lib/jetz-ui.js";
import { Jetz, ifElse } from "../lib/jetz.js";
import { storedTheme, THEME_DARK, THEME_LIGHT } from "../theme.js";

// The bare demo pages - counter, play and the remembered todo - carry no chrome
// of their own, so the shell footer doubles as where their theme switch lives.
// The pages that style their own tree hide this footer, and each of those has a
// switch of its own instead.
export const App = function(){
    return main(
        Jetz.$route.browser(),
        footer(
            span('Author @daevsoft'),
            button(css`jetz-theme-toggle`, {
                "aria-label": () => storedTheme.value === THEME_DARK ? "Switch to the light theme" : "Switch to the dark theme",
                title: () => storedTheme.value === THEME_DARK ? "Light theme" : "Dark theme",
                onclick() {
                    // an event handler is not a tracked context, so the cheap
                    // untracked read is the right one here
                    storedTheme.setState(storedTheme.getValue() === THEME_DARK ? THEME_LIGHT : THEME_DARK);
                }
            },
                // one branch renders at a time, so ifElse() swaps the glyph
                ifElse(
                    () => storedTheme.getValue() === THEME_DARK,
                    () => span("☀"),
                    () => span("☾")
                )
            )
        )
    )
}
