/**
 * Shared theme preference.
 *
 * One value, imported by every page that offers a theme switch, so the choice
 * follows the visitor: flip it on the home page and the playground is already
 * dark on the next load, and the other way round.
 *
 * `rememberOf()` gives the pages their remembered-state plumbing, but it scopes
 * its storage key to the pathname, so each route would otherwise keep a private
 * copy. The plain key below is the one both pages read and write, which is what
 * makes the preference app-wide while the remembered value keeps doing the
 * per-page bookkeeping.
 *
 * The module does its work at import time - before the first mount - so a
 * returning dark-theme visitor never sees a light flash while the bundle boots.
 */
import { rememberOf } from "./lib/jetz.js";

export const THEME_KEY = "theme";
export const THEME_DARK = "dark";
export const THEME_LIGHT = "light";

/** Not scoped to a route, so every page reads and writes the same entry. */
const SHARED_THEME_KEY = "jetz-theme";

/**
 * The pages are styled from tokens, so a theme switch is one class on <html>.
 * The data attribute mirrors the class for anything inspecting or scripting it.
 */
export const applyTheme = value => {
  const isDark = value === THEME_DARK;
  document.documentElement.classList.toggle("jetz-theme-dark", isDark);
  document.documentElement.setAttribute("data-theme", isDark ? THEME_DARK : THEME_LIGHT);
};

const readSharedTheme = () => {
  try {
    return localStorage.getItem(SHARED_THEME_KEY);
  } catch {
    // private mode, or storage disabled: the page still gets its theme, it just
    // does not travel to the next page
    return null;
  }
};

const persistTheme = value => {
  try {
    localStorage.setItem(SHARED_THEME_KEY, value);
  } catch {
    // see readSharedTheme: an unwritable store is not a reason to skip the switch
  }
  applyTheme(value);
};

export const storedTheme = rememberOf(THEME_KEY, THEME_LIGHT);

// A shared entry wins over this page's own copy: it is the only value every
// route can see, so it is the one the visitor last picked anywhere.
const sharedTheme = readSharedTheme();
if (sharedTheme === THEME_DARK || sharedTheme === THEME_LIGHT) {
  storedTheme.setState(sharedTheme);
}

applyTheme(storedTheme.getValue());
// later writes (a toggle) re-apply through the same subscription
storedTheme.subscribe(persistTheme);