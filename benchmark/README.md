# Framework benchmark

A self-contained js-framework-benchmark harness: **raw DOM · Jetz · React 19 · Vue 3**, all four
arms in one page, on one machine, against the same seeded data.

This folder is deliberately **outside** the pnpm workspace and has its own `package.json` and
`node_modules`, so React and Vue never appear in the framework package's dependencies. Nothing here
is imported by `src/` or `packages/`; the only inbound link is `arms/jetz.js`, which imports the
framework source directly.

```
benchmark/
├── build.mjs          esbuild bundle + static server (port 8091)
├── run-headless.mjs   drive the page from a headless Chromium and print the table
├── src/
│   ├── index.html     page shell and the one stylesheet every arm shares
│   ├── main.js        the harness: chrome, runner, results tables, CSV export
│   ├── data.js        Krausest data pools, seeded row generator, DOM read-back helpers
│   ├── measure.js     task-yield flush, three-phase timing, median aggregation
│   └── arms/          vanilla.js · jetz.js · react.js · vue.js
└── dist/              built output (gitignored)
```

## Run it

```bash
cd benchmark
npm install          # react, react-dom, vue, esbuild — local to this folder only
npm run dev          # http://localhost:8091/index.html
```

`npm run dev` watches `src/` and rebuilds the bundle; `src/index.html` is copied on change too.
`npm run build` produces the minified `dist/` for a static host. Framework code is always bundled
with `process.env.NODE_ENV = "production"` — dev builds of React and Vue add warnings, prop checks
and double-invoked renders that would make the numbers meaningless.

Pick a sample count and press **Run all**. One op at a time can be re-run by reloading; hover a
result cell for the synchronous-js time and the raw sample list. **Export CSV** dumps every phase
plus the pass/fail column.

### Headless: `npm run bench`

`run-headless.mjs` launches a headless Chromium (Chrome, or Edge if Chrome is absent), opens the page
with `?autorun=1&samples=N`, waits for the run to publish `window.__JETZ_BENCH__`, prints the table
and writes `dist/results.json`. It needs `npm run dev` serving the page; it does not build.

```bash
cd benchmark
npm run dev &                 # serve on 8091
npm run bench                 # --samples=6 --browser="C:\path\chrome.exe" --out=…
```

Absolute numbers move with the environment — a headless run never paints, so every arm gets faster
and the ratios shift (typically all three frameworks look worse against raw DOM than in a window).
Rank order and the shape of the fine-grained ops are stable across both. Quote one environment at a
time, and note which it was.

## What is measured

Nine operations from the published suite, at 1,000 and 10,000 rows:

| op | what the arm does |
| --- | --- |
| startup | mount the table, then render 1,000 rows |
| create 1k / 10k | build a full row set from cold |
| replace 10k | swap in a whole new row set (new keys, so nothing recycles) |
| partial update 10k | write the label of every 10th row |
| select 10k | mark one row selected and clear the previous one |
| swap 10k | exchange rows 2 and 999 |
| remove 10k | drop row 1 |
| clear 10k | empty the table |

Four timestamps per run, identical rules for every arm:

- **`sync`** — what the call itself does before returning. Meaningful only for the arms that render
  inline (raw DOM, Jetz); React and Vue schedule, so their `sync` is close to zero.
- **`dom`** — *the headline* — up to the framework's **last DOM mutation**.
- **`settled`** — plus the quiet-task flush, i.e. after the browser has also had a chance to lay the
  new table out.
- **`total`** — plus one forced layout.

### Why the headline is a mutation timestamp

`dom` is stamped by a `MutationObserver` on the measurement container. Mutation callbacks are
delivered at the microtask checkpoint that closes the task doing the writes, so the stamp lands
inside the framework's own commit: it never waits for a frame, and a framework that defers its
render still cannot hide behind a fast return. For an inline arm `dom` sits just above `sync`; for
React it waits for the last chunk of its scheduled render.

The version before this ended the run after a fixed number of task yields, and measured on this page
that let the browser take a frame boundary inside every operation: three yields cost **740–1080 ms**
of layout and paint on top of the framework's work, while one quiet yield costs **0.1 ms**. The
headline came out ~2,100 ms for hand-written DOM building 10,000 rows — a browser number, not a
framework number, and `dom` and `total` were identical. `setTimeout(0)` is never used; its boundary
always admits a paint.

`measure.js` still flushes until **two consecutive task boundaries produce no DOM mutation** (bounded
at 128 tasks) to reach `settled` — enough for React, which chunks a 10,000-row render across several
MessageChannel tasks, and early for the arms that finish synchronously.

### Reading the second table

`total` is reported for completeness and is **noisy by construction**: for a one-row operation it is
mostly "when did the next frame happen to land", not framework work. Read it across an operation to
see that the arms converge once layout is included, not down a row as a ranking. The published
suite's own magnitudes are the `dom` column.

### Two other things that would otherwise bury the comparison

- **The table is positioned off-screen** (`.arena`, `left: -99999px`). Layout still runs; paint does
  not. All four arms emit byte-identical markup — every arm reports exactly 230,000 DOM nodes at
  10,000 rows — so paint is a constant that only compresses the ratios.
- **`table-layout: fixed`.** With the default `auto` algorithm, 10,000 rows cost ~1.3 s of layout
  here, roughly three times the cost of building the DOM, again identical for every arm.

### Verification is not optional

An arm could "win" any operation by simply not doing the work. After every measured run the harness
reads the rendered DOM back (`data.js` exports `rowCount`, `labelAt`, `isSelectedAt`, `textAt`) and
fails the operation if the expected change is not there: row counts, label text, the `danger` class
on the selected row, and for swap the actual `col-md-hidden` text observed moving between indices 1
and 998. A failing cell is marked and excluded from the "fastest" highlight. `Export CSV` carries
the `_passed` column.

### The swap is the op that proves the point

The arm writes `swap` as one `set()` with the two entries exchanged, not as two `replaceAt()` calls.
`replaceAt` commits a full reconciliation, and between the two calls the list briefly holds row 999
twice while row 2 disappears; the reconciler therefore *deletes* one row view and *rebuilds* it at the
end. That is not a swap — it is a remove-plus-insert that happens to produce the same document, and
the verifier cannot see the difference because the DOM ends up identical. `set()` does the operation
that was asked for: it moves the rows.

The cost of `set()` used to be the reconciler's forward walk. Moving row 999 up to position 2 leaves
the displaced row sitting in the middle of the span, and a forward-only walk re-anchors every node
between them before that row finally leaves at index 998 — hence ~2,000 moves, where Raw DOM needs
only four operations (a comment anchor plus two `insertBefore` calls).

That is now the reconciler's job, not the arm's. `loop()` picks a minimal move set with a
longest-increasing-subsequence pass: it keeps the longest run of rows already in the right relative
order and re-anchors only the rest, so the swap costs **4 node operations instead of 1,994** —
measured on the probe, and visible on this page as swap dropping from ~27 ms to ~9 ms. The forward
walk is retained only as the fallback for cases LIS cannot trust (duplicate keys, or a reused view
whose node is not in this parent). See [The reconciler probe](#the-reconciler-probe-reorderhtml).

A variant that was measured and rejected: exchanging the two rows' *contents* with `row.set(patch)`
instead of their order costs 0.2 ms and 2 mutations, but the text cell is a plain child written once,
so the table would keep the old text and the verifier fails it.

## The arms

Each file exports `meta` and `create(container) → { tbody, render, updateTenth, select, swap,
remove, clear, destroy }`. All four render the same markup under the same stylesheet; the only
variable is how state becomes DOM.

| arm | idiom |
| --- | --- |
| `vanilla.js` | hand-optimised reference: `createElement`, `replaceChildren(fragment)` for a full render, `textContent` for a label write, a comment-anchor `insertBefore` triple for a real node move, `tr.remove()` for delete. Not a rebuild — `1.00x` here is a demanding baseline. |
| `jetz.js` | `listOf()` + keyed `loop(rows, row => row.id, …)` over `rowOf` records (one version signal per row, not one State per property). Only the label anchor and the row class are bound, so a select repaints two rows and a partial update repaints 1,000 anchors — never the table. Bulk label writes go through `rawOf(row)` + `touchRow(row)` inside one `batch()`, so each row refreshes exactly once. Swap exchanges the two entries in one `set()` commit and lets the keyed reconciler do the move. |
| `react.js` | `createRoot` + `useSyncExternalStore` over one state array, keyed `map`, **no memo** — the published shape. Every mutation replaces the array, so all row vnodes are re-created and the diff decides the DOM work. |
| `vue.js` | `createApp` + `shallowRef` list of `reactive()` rows, one render function with keyed children. A label write mutates the row and re-runs the whole render; structural ops reassign `list.value`. |

## Ranking

Above the result tables, the harness ranks the three frameworks on one number — a **speed index
where raw DOM = 100 and higher is faster**. It is built from the same Krausest ratio: for each
operation, the arm's `dom` time divided by the **fastest arm's** `dom` time, then the **geometric
mean** of those ratios; the index is `100 ÷ that mean`.

- **Higher is better.** Raw DOM scores 100 (it is the denominator on every operation), so a framework
  at, say, 29 is "29 hundredths of hand-written-DOM speed on average". 100 would mean it matched
  hand-written DOM on every operation. Raw DOM is never ranked — it is the reference, not a framework
  anyone installs.
- Geometric rather than arithmetic because ratios only combine multiplicatively: "8× slower here, 8×
  faster there" is a wash, and an arithmetic mean would report it as a loss while letting one slow
  operation with a large absolute time bury nine fast ones.
- **Gap to leader** re-bases the same ratio onto the top framework and prints it as "× behind", so it
  reads as a deficit (bigger = further back) rather than a score. There is deliberately no separate
  "vs raw DOM" column: on this suite the hand-written arm is the fastest arm on *every* operation, so
  the two columns would print identical figures.
- An operation enters the ranking only once **every arm passed its verification** for it. An arm that
  skipped work is not allowed to score.
- **Fastest framework op** counts the operations on which that framework beat the *other two
  frameworks*. It deliberately excludes raw DOM from the comparison: the hand-written arm wins every
  operation on this suite, so a win count against all four arms reads 0 for every framework.

## Reading the results honestly

- **`dom` is the number to compare**, `total` is there to show how much of the cost is the browser's
  table algorithm rather than the framework's.
- **Raw DOM is a fine-grained hand-written arm**, so on `select` and `remove` the ratios against it
  are enormous (hundreds of x) and that is the honest picture: a virtual-DOM framework must re-run
  a render pass over 10,000 rows to change one row, and hand-written DOM does not. Compare the
  frameworks to each other for the shape of that cost, and to raw DOM for the ceiling.
- **Heap is Chrome-only** (`performance.memory`) and includes the harness's own retained row data,
  so read it as an ordering, not an absolute. It is also the column where a reactive-record
  framework pays for its bookkeeping: Jetz and Vue hold per-row reactive state, raw DOM and React
  hold plain objects. The headless runner launches Chromium with `--js-flags=--expose-gc` and the
  page forces a GC round before sampling, so the number is **live heap** — after `clear`, anything
  above the empty-table baseline is genuinely retained state. A plain `npm run dev` browser has no
  `window.gc()`, and the raw `usedJSHeapSize` there also counts uncollected garbage: the `clear`
  row then measures allocation pressure, not retention.
- **One machine, one browser profile.** Close nothing else, run at 6 samples or more before
  quoting a number, and re-run after any change to the arms — a single sample has visible frame
  noise on the 10,000-row ops.

## The reconciler probe: `reorder.html`

The four-arm page answers "how does Jetz rank against the others". `reorder.html` answers a
different question — "what does the keyed reconciler actually do to the DOM" — and measures **one
framework only**: `ListState` + `loop()`. Nothing loads over the network, and the table sits
off-screen (`.arena`), so layout runs but paint does not. That makes a DOM-mutation *count* and a
*duration* describe the reconciler rather than the renderer.

This is the authoritative A/B for any change to reconciliation: it is deterministic down to the
mutation records, so a regression in move count shows up even when wall-clock noise hides it.

Per scenario it reports: median ms, p95 ms, **records** (MutationObserver batches), **node ops**
(nodes added + removed), order-correct, identity-preserved, leak runs, and destroy count vs wanted.
Scenarios: create / replace / clear 10k, move last→first, swap 2↔999, reverse 10k,
keep-5k / drop-5k / add-5k, update 1k labels, select, removeAt, insertAt.

`records` and `node ops` are deliberately separate. A bulk detach keeps its per-node work (node ops
unchanged) but collapses the *batches* — clear went **10,000 records → 1** and replace **10,001 → 1**
once disposal was separated from DOM removal. A lower record count is not by itself "faster"; it is
read alongside the median ms, which is why the probe prints both.

```bash
cd benchmark
node build.mjs --probe --serve --port=8092          # build only the probe, then serve dist
# browser:  http://localhost:8092/reorder.html      (press Run, or open with ?autorun=1)

node run-headless.mjs --page=reorder.html --flag=__JETZ_REORDER__ \
                     --url=http://127.0.0.1:8092/ --out=dist/reorder.json
```

`--probe` skips building the four-arm page; `--flag=__JETZ_REORDER__` makes the runner wait on this
page's result global instead of the comparison one. The saved before/after pair
(`dist/reorder-before.json`, `dist/reorder-after.json`) was measured with HEAD's reconciler restored
via `git show HEAD:packages/jetz/src/jetz.js`, then the optimized file, under the same probe build.

## Adding an arm

Create `src/arms/<name>.js` exporting `meta = { id, label, detail }` and `create(container)`
returning the operation object above, then add it to `ARMS` in `src/main.js`. `BASELINE` picks which
id the ratios divide by. Keep the emitted markup identical — the point of the harness is that the
browser sees the same document from every arm.
