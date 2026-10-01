import { onDestroy, onMount } from "../../lib/jetz.js";
import { a, button, css, div, footer, header, h1, iframe, img, label, option, p, section, select, span } from "../../lib/jetz-ui.js";
import logoUrl from "../../../public/img/logo/small.png";
// The preview runs these files directly, so it executes this working tree instead
// of a published version. They are copied verbatim by the `?url` rule in
// rspack.config.js - not imported as modules here, because the sandboxed frame is
// the one that has to load them.
import jetzCoreUrl from "../../../packages/jetz/src/jetz.js?url";
import jetzUiUrl from "../../../packages/jetz/src/jetz-ui.js?url";
// Prism core plus the JavaScript grammar. The grammar files publish themselves on
// the global `Prism` object the core module creates, so the core has to stay first.
import Prism from "prismjs/components/prism-core.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";
import "./playground.css";
import { asBackLink, link } from "../../lib/jetz-router.js";

const examples = {
  counter: {
    label: "Reactive counter",
    concept: "stateOf · direct DOM updates",
    source: `import { Jetz, stateOf } from "@daevsoft/jetz";
import { button, css, div, h2, p } from "@daevsoft/jetz/ui";

const count = stateOf(0);

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "REACTIVE STATE"),
    h2("A counter, no re-render loop"),
    p(css\`preview-count\`, "Clicks: ", count),
    button("Increment", {
      onclick: () => count.value++
    })
  ),
  "#app"
);`,
  },
  computed: {
    label: "Computed values",
    concept: "computed · two-way binding",
    source: `import { Jetz, computed, stateOf } from "@daevsoft/jetz";
import { css, div, h2, inputText, p } from "@daevsoft/jetz/ui";

const firstName = stateOf("Ada");
const lastName = stateOf("Lovelace");
const fullName = computed(() =>
  \`\${firstName.value} \${lastName.value}\`
);

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "DERIVED STATE"),
    h2("Update either field"),
    inputText({ bind: firstName, placeholder: "First name" }),
    inputText({ bind: lastName, placeholder: "Last name" }),
    p(css\`preview-result\`, "Hello, ", fullName)
  ),
  "#app"
);`,
  },
  lists: {
    label: "Reactive collections",
    concept: "listOf · collection mutations",
    source: `import { Jetz, listOf, loop } from "@daevsoft/jetz";
import { button, css, div, h2, li, p, ul } from "@daevsoft/jetz/ui";

const tasks = listOf("Read the quick start", "Build a tiny app");

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "REACTIVE COLLECTION"),
    h2("A list that stays in sync"),
    ul(css\`preview-list\`, loop(tasks, task => li(task))),
    button("Add a task", {
      onclick: () => tasks.push(\`New task \${tasks.size + 1}\`)
    })
  ),
  "#app"
);`,
  },
  keyed: {
    label: "Keyed list rendering",
    concept: "listOf · loop · stable item identity",
    source: `import { Jetz, listOf, loop } from "@daevsoft/jetz";
import { button, css, div, h2, li, p, ul } from "@daevsoft/jetz/ui";

const users = listOf(
  { id: 101, name: "Ada Lovelace" },
  { id: 102, name: "Grace Hopper" }
);
let nextId = 103;

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "KEYED RECONCILIATION"),
    h2("Stable identity, focused updates"),
    ul(css\`preview-list\`, loop(
      users,
      user => user.id,
      user => li(user.name)
    )),
    button("Add a person", {
      onclick: () => users.push({
        id: nextId++, 
        name: \`New person \${nextId - 1}\`
     })
    })
  ),
  "#app"
);`,
  },
  editableTasks: {
    label: "Editable keyed tasks",
    concept: "listOf · stateOf items · loop · bind",
    source: `import { Jetz, listOf, loop, stateOf } from "@daevsoft/jetz";
import { button, css, div, h2, input, inputText, li, p, type, ul } from "@daevsoft/jetz/ui";

const tasks = listOf(
  stateOf({ id: 201, done: true, title: "Sketch the onboarding flow" }),
  stateOf({ id: 202, done: false, title: "Review the component API" })
);
let nextId = 203;

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "EDITABLE KEYED ITEMS"),
    h2("A tiny project task list"),
    p("Edit each title in place, then add another task."),
    ul(css\`preview-list task-list\`, loop(
      tasks,
      task => task.id.value,
      task => li(css\`task-row\`,
        div(
          input(type\`checkbox\`, { bind: task.done }),
          p(css\`task-number \$\{() => task.done.value ? "completed" : ""\}\`, "TASK ", task.id, " - ", task.title)
        ),
        inputText({
          bind: task.title,
          placeholder: "Task title"
        })
      )
    )),
    button("Add a task", {
      onclick: () => tasks.push(stateOf({
        id: nextId++,
        done: false,
        title: \`New task \${nextId - 1}\`
      }))
    })
  ),
  "#app"
);`,
  },
  conditional: {
    label: "Conditional UI",
    concept: "stateOf · _if / _else",
    source: `import { Jetz, _else, _if, stateOf } from "@daevsoft/jetz";
import { button, css, div, h2, p } from "@daevsoft/jetz/ui";

const isOnline = stateOf(false);

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "CONDITIONAL RENDERING"),
    h2("Render the active branch"),
    div(_if(() => isOnline.value),
      p(css\`preview-status online\`, "You are online")
    ),
    div(_else,
      p(css\`preview-status offline\`, "You are offline")
    ),
    button("Toggle status", {
      onclick: () => isOnline.value = !isOnline.value
    })
  ),
  "#app"
);`,
  },
  remembered: {
    label: "Persistent state",
    concept: "rememberOf · localStorage",
    source: `import { Jetz, rememberOf } from "@daevsoft/jetz";
import { css, div, h2, inputText, p } from "@daevsoft/jetz/ui";

const name = rememberOf("jetz-playground-name", "Developer");

Jetz.mount(
  div(css\`preview-card\`,
    p(css\`preview-eyebrow\`, "PERSISTED STATE"),
    h2("Your value survives refresh"),
    inputText({ bind: name, placeholder: "Your name" }),
    p(css\`preview-result\`, "Welcome back, ", name)
  ),
  "#app"
);`,
  },
};

// The examples import the two public entry points of the package. Both resolve to
// the library this build produced, so the preview runs the current sources rather
// than a released copy from a CDN. The URLs are absolute because the frame
// resolves its import map against the parent document, which can sit on a deeper
// route, and because a relative URL would be read relative to that route.
//
// The frame is sandboxed, so it has an opaque origin and fetching ./lib/* is a
// cross-origin request: whatever serves this build has to send
// `Access-Control-Allow-Origin` for those files (see the devServer headers in
// rspack.config.js and the /lib/(.*) headers in vercel.json). Without it the pane
// reports a failed dynamic import instead of a preview.
const absoluteUrl = url => new URL(url, document.baseURI).href;
const importMap = JSON.stringify({
  imports: {
    "@daevsoft/jetz": absoluteUrl(jetzCoreUrl),
    "@daevsoft/jetz/ui": absoluteUrl(jetzUiUrl),
  },
});

function createPreviewDocument(source) {
  const safeSource = JSON.stringify(source).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #16344d; background: #f3f7fa; font: 14px/1.55 system-ui, sans-serif; }
    .preview-card { max-width: 520px; margin: 24px auto; padding: 26px; background: white; border: 1px solid #d7e3eb; border-radius: 7px; box-shadow: 0 14px 36px #16344d12; }
    .preview-eyebrow { margin: 0 0 12px; color: #218bc4; font: 10px ui-monospace, monospace; letter-spacing: .08em; }
    h2 { margin: 0 0 18px; font-size: 21px; line-height: 1.25; }
    .preview-count { margin: 0 0 17px; color: #1d628e; font-size: 30px; font-weight: 700; }
    .preview-result { margin: 16px 0 0; color: #1d628e; font-weight: 700; }
    input { display: block; width: 100%; margin: 9px 0; padding: 10px 11px; border: 1px solid #c6d6e0; border-radius: 4px; font: inherit; }
    button { padding: 10px 14px; border: 0; border-radius: 4px; background: #228bc3; color: white; font: 600 13px system-ui, sans-serif; cursor: pointer; }
    button:hover { background: #176b9a; }
    .preview-list { display: grid; gap: 9px; margin: 0 0 18px; padding-left: 20px; color: #526d80; }
    /* the editable keyed sample names these classes, so give them a definition
       instead of letting the generic input rule stretch the checkbox to full width */
    .task-row input[type="checkbox"] { display: inline-block; width: auto; margin: 0 8px 0 0; padding: 0; border: 0; vertical-align: middle; }
    .task-number { display: inline; margin: 0; color: #526d80; }
    .task-number.completed { color: #9aa9b4; text-decoration: line-through; }
    .preview-status { margin: 0 0 17px; padding: 12px; border-radius: 4px; }
    .online { color: #135f76; background: #e0f4fa; }
    .offline { color: #526d80; background: #edf2f5; }
    #preview-error { color: #9c2f42; font: 12px/1.5 ui-monospace, monospace; white-space: pre-wrap; }
  </style>
  <script type="importmap">${importMap}</script>
</head>
<body>
  <div id="app"></div>
  <p id="preview-error">Loading Jetz preview…</p>
  <script>
    // The frame is sandboxed, so the parent cannot look inside it. Reporting back
    // over postMessage is what lets the pane show a real state instead of an empty
    // rectangle when the module is unreachable or never starts.
    const report = (state, detail = "") => parent.postMessage({ source: "jetz-preview", state, detail }, "*");
    const showError = message => {
      // the ready handler below removes #preview-error, so a failure raised after
      // the module started has to put the element back, or the framework's
      // message would only exist in the parent's one-line status text
      let output = document.getElementById("preview-error");
      if (!output) {
        output = document.createElement("p");
        output.id = "preview-error";
        document.body.append(output);
      }
      output.textContent = message;
      return message;
    };
    addEventListener("error", event => {
      report("error", showError(event.message || "Preview error"));
    });
    addEventListener("unhandledrejection", event => {
      report("error", showError(event.reason?.message || String(event.reason)));
    });
  </script>
  <script type="module">
    const source = ${safeSource};
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    import(url).then(() => {
      document.getElementById("preview-error")?.remove();
      report("ready");
    }).catch(error => {
      const output = document.getElementById("preview-error");
      if (output) output.textContent = error.message;
      report("error", error.message);
    });
  </script>
</body>
</html>`;
}

export const Playground = () => {
  let editor;
  let isActive = true;
  let selectedExample = "counter";
  let watchdog;

  // The frame and its labels belong to this render, so they are held as element
  // handles instead of ids. During a route swap two playground trees can be in the
  // document at once, and getElementById resolves to whichever comes first in
  // document order - which would write the preview into the outgoing tree and
  // leave the visible frame empty.
  const frame = iframe({
    id: "playground-preview",
    title: "Jetz code preview",
    sandbox: "allow-scripts",
    class: "preview-frame",
  });
  const statusLabel = span({ id: "playground-status" }, "Ready");
  const conceptLabel = span({ id: "playground-concept" }, examples.counter.concept);
  const stage = div(css`preview-stage`, { "data-state": "loading" },
    frame,
    div(css`preview-loading`, span(), "Starting the preview…"),
  );

  const setStatus = text => {
    const label = statusLabel.getElement();
    if (label) label.textContent = text;
  };
  const setStageState = state => stage.getElement()?.setAttribute("data-state", state);

  // A frame that never reports back is exactly what a blank pane looks like from
  // the outside, so reload it once before saying the preview did not start.
  const armWatchdog = (source, attempt) => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      if (!isActive) return;
      if (attempt === 1) {
        setStatus("Retrying preview…");
        const node = frame.getElement();
        if (node) node.srcdoc = createPreviewDocument(source);
        armWatchdog(source, 2);
        return;
      }
      setStatus("Preview did not start — press Run to retry");
    }, 6000);
  };

  const preview = source => {
    clearTimeout(watchdog);
    setStageState("loading");
    setStatus("Starting the preview…");
    const node = frame.getElement();
    if (node) node.srcdoc = createPreviewDocument(source);
    armWatchdog(source, 1);
  };

  const onPreviewMessage = event => {
    const data = event.data;
    if (!data || data.source !== "jetz-preview") return;
    // ignore reports from another playground instance's frame
    if (event.source !== frame.getElement()?.contentWindow) return;
    clearTimeout(watchdog);
    if (data.state === "ready") {
      setStageState("ready");
      setStatus("Running in an isolated preview");
      return;
    }
    // step aside so the frame's own error text stays readable
    setStageState("error");
    setStatus(`Preview error: ${String(data.detail).slice(0, 90)}`);
  };

  const setExample = key => {
    selectedExample = key;
    const example = examples[key];
    if (editor) editor.setValue(example.source);
    preview(example.source);
    const label = conceptLabel.getElement();
    if (label) label.textContent = example.concept;
  };

  const MonacoRuntime = () => {
    const host = div({ id: "playground-editor", class: "monaco-host" }, "Loading editor…");

    onMount(() => {
      if (!isActive) return;
      // the sandboxed frame reports readiness by postMessage; the listener lives
      // here because the preview pane has no lifecycle of its own
      window.addEventListener("message", onPreviewMessage);
      const container = host.getElement();
      if (!container) return;

      container.replaceChildren();

      // A textarea cannot colour its own glyphs, so highlighting uses the usual
      // overlay pair: a <pre> that Prism paints, sitting under a textarea whose
      // text is transparent. The caret stays real because the textarea still
      // holds the value. Both share one metric set (see .playground-code-surface
      // in playground.css) so the caret lands exactly on the painted glyphs.
      const surface = document.createElement("div");
      surface.className = "playground-code-surface";

      const highlightLayer = document.createElement("pre");
      highlightLayer.className = "playground-highlight";
      highlightLayer.setAttribute("aria-hidden", "true");

      const textarea = document.createElement("textarea");
      textarea.className = "playground-textarea";
      textarea.setAttribute("spellcheck", "false");
      textarea.setAttribute("autocapitalize", "off");
      textarea.setAttribute("autocomplete", "off");
      textarea.setAttribute("aria-label", "Jetz code playground editor");
      textarea.value = examples[selectedExample].source;

      const INDENT = "  ";
      let paintQueued = false;

      // Painting is rAF-batched: a fast typist fires many input events per
      // frame and re-highlighting is the expensive part.
      const paint = () => {
        if (paintQueued) return;
        paintQueued = true;
        requestAnimationFrame(() => {
          paintQueued = false;
          // the trailing space keeps the final line measurable when the source
          // ends in a newline, otherwise the overlay is one line short and the
          // last glyphs sit one row above where the caret is
          highlightLayer.innerHTML =
            Prism.highlight(textarea.value, Prism.languages.javascript, "javascript") + " ";
          highlightLayer.scrollTop = textarea.scrollTop;
          highlightLayer.scrollLeft = textarea.scrollLeft;
        });
      };

      const replaceRange = (from, to, text, caret) => {
        textarea.setRangeText(text, from, to, "end");
        if (typeof caret === "number") {
          textarea.selectionStart = caret;
          textarea.selectionEnd = caret;
        }
        paint();
      };

      // the run of lines the selection touches, so Tab works on a whole block
      const blockRange = () => {
        const value = textarea.value;
        const from = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
        let to = value.indexOf("\n", textarea.selectionEnd);
        if (to === -1) to = value.length;
        return { from, to, block: value.slice(from, to) };
      };

      const shiftBlock = outdent => {
        const { from, to, block } = blockRange();
        let head = 0;
        const lines = block.split("\n").map((line, index) => {
          if (outdent) {
            const match = line.match(/^[ \t]{1,2}/);
            if (!match) return line;
            if (index === 0) head = -match[0].length;
            return line.slice(match[0].length);
          }
          if (index === 0) head = INDENT.length;
          return INDENT + line;
        });
        replaceRange(from, to, lines.join("\n"), textarea.selectionStart + head);
      };

      editor = {
        setValue(value) {
          textarea.value = value;
          paint();
        },
        getValue() {
          return textarea.value;
        },
        layout() { },
        dispose() {
          surface.remove();
        }
      };

      textarea.addEventListener("input", () => {
        paint();
        preview(editor.getValue());
      });

      // the overlay does not scroll on its own; it follows the textarea
      textarea.addEventListener("scroll", () => {
        highlightLayer.scrollTop = textarea.scrollTop;
        highlightLayer.scrollLeft = textarea.scrollLeft;
      });

      textarea.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          preview(editor.getValue());
          return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const head = value.slice(lineStart, start);

        // Tab inserts a level, or shifts every touched line once a range is active
        if (event.key === "Tab") {
          event.preventDefault();
          if (start !== end || event.shiftKey) shiftBlock(event.shiftKey);
          else replaceRange(start, end, INDENT, start + INDENT.length);
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const indent = head.match(/^[ \t]*/)[0];
          // Indent on unclosed brackets rather than a trailing brace, because the
          // Jetz DSL nests with parens and commas: `div(css`x`, a, b)`. Counting
          // openers against closers covers both that shape and plain JS blocks.
          const openers = (head.match(/[{([]/g) || []).length;
          const closers = (head.match(/[})\]]/g) || []).length;
          const opensBlock = openers > closers;

          // Enter between a bracket pair opens a fresh line and pushes the closing
          // bracket down, so it does not dangle at the end of the new line
          if (opensBlock && /^[ \t]*[}\])]/.test(value.slice(end))) {
            const inner = "\n" + indent + INDENT;
            const outer = "\n" + indent;
            replaceRange(start, end, inner + outer, start + inner.length);
            return;
          }
          const insert = "\n" + indent + (opensBlock ? INDENT : "");
          replaceRange(start, end, insert, start + insert.length);
          return;
        }

        // A closing bracket typed on an otherwise blank line steps back out one
        // level, which is what makes the Enter rule above reversible by hand.
        if (event.key === "}" || event.key === ")" || event.key === "]") {
          const blank = head.match(/^([ \t]*)$/);
          if (blank && blank[1].length >= INDENT.length) {
            event.preventDefault();
            const trimmed = blank[1].slice(0, blank[1].length - INDENT.length);
            // preventDefault suppresses the native insertion, so the bracket has
            // to be written back as part of the replacement
            replaceRange(lineStart, start, trimmed + event.key, lineStart + trimmed.length + 1);
          }
        }
      });

      surface.append(highlightLayer, textarea);
      container.appendChild(surface);
      // setExample renders the selected example in the preview as well
      setExample(selectedExample);
    });

    onDestroy(() => {
      isActive = false;
      clearTimeout(watchdog);
      window.removeEventListener("message", onPreviewMessage);
      editor?.dispose();
    });

    return host;
  };

  return div(css`playground-shell`,
    header(css`playground-header`,
      a(css`playground-brand`, { href: "/", "aria-label": "Back to Jetz home" },
        img({ src: logoUrl, alt: "Jetz", class: "playground-logo" }),
        span("Playground"),
      ),
      div(css`playground-controls`,
        label({ for: "playground-example" }, "EXAMPLE"),
        select({
          id: "playground-example",
          "aria-label": "Choose a Jetz example",
          value: selectedExample,
          onchange: event => setExample(event.target.value),
        },
          ...Object.entries(examples).map(([key, example]) => option({ value: key }, example.label)),
        ),
      ),
      button(css`run-button`, { onclick: () => preview(editor?.getValue() ?? examples[selectedExample].source) },
        span(css`run-icon`, "▶"), "Run preview",
      ),
      link('/', a(css`home-link`, { href: '#' }, "Back to home")),
    ),
    div(css`playground-intro`,
      h1("Learn by changing the code."),
      p("Pick a core concept, edit the example, then press Run or Ctrl / ⌘ + Enter to see the result."),
    ),
    div(css`playground-workbench`,
      section(css`editor-pane`, { "aria-label": "Code editor" },
        div(css`pane-toolbar`,
          div(css`file-tab`, span(css`file-type`, "JS"), span("main.js")),
          conceptLabel,
        ),
        // pass the component itself: Jetz invokes it inside the render pass,
        // where onMount/onDestroy can register against a lifecycle context
        MonacoRuntime,
        div(css`editor-footer`,
          span(css`editor-status-dot`),
          span("JavaScript · Jetz 1.0"),
          span("Ctrl / ⌘ + Enter to run"),
        ),
      ),
      section(css`preview-pane`, { "aria-label": "Live preview" },
        div(css`pane-toolbar preview-toolbar`,
          div(css`preview-heading`, span(css`preview-dot`), span("LIVE PREVIEW")),
          statusLabel,
        ),
        stage,
        div(css`preview-note`, span("↗"), "Preview runs this build in a sandboxed frame"),
      ),
    ),
    footer(css`playground-footer`,
      span("Explore more in the README"),
      a({ href: "https://github.com/devarofi/jetz#core-concepts" }, "Core concepts ↗"),
      a({ href: "https://github.com/devarofi/jetz#application-features" }, "Application features ↗"),
    ),
  );
};