// One Prism for the whole app: core plus the JavaScript grammar, with the
// automatic document sweep switched off.
//
// Prism highlights every `code[class*="language-"]` on DOMContentLoaded unless
// `manual` is set. That pass rebuilds each block from its textContent, which
// flattens the line-numbered snippets this app renders at render time and drops
// their `.jetz-code-line` wrappers. `manual` is read when the queued sweep runs,
// so setting it here — before the page mounts — is enough to skip it.
import Prism from "prismjs/components/prism-core.js";
// The grammar files publish themselves on the global `Prism` object the core
// module creates, so the core has to stay the first import of this trio.
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";

Prism.manual = true;

export { Prism };
