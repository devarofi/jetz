/**
 * Reconciler probe — measures `ListState`/`loop()` directly, not a framework arm.
 *
 * The benchmark page compares frameworks; this page measures one framework's list
 * algorithm. Per scenario it reports the median/p95 time to the last DOM
 * mutation, the number of MutationObserver records, the number of nodes the
 * operation attached or detached (moving a node is 1 removed + 1 added, which is
 * exactly what a minimal-move reconciler is supposed to cut), whether DOM order
 * and node identity survived, how many `onDestroy` callbacks ran, and whether a
 * removed row's effect is still alive.
 *
 *   node build.mjs --probe            # emits dist/reorder.html + dist/reorder.js
 *   node run-headless.mjs --path=reorder.html --flag=__JETZ_REORDER__
 */
import { batch, computed, effect, Jetz, listOf, loop, onDestroy, rawOf, rowOf, touchRow } from '../../packages/jetz/src/jetz.js';
import { a, div, span } from '../../packages/jetz/src/jetz-ui.js';
import { flush, heapMb, median, timeOp } from './measure.js';

const N = 10000;
const ROUNDS = 5;
// Anchors picked so their keys survive every scenario that claims retention:
// index 0 and 8000 keep an even original position, 4000 straddles the swap range.
const ANCHOR_INDEXES = [0, 4000, 8000];
const out = document.getElementById('out');
const log = text => out.append(document.createTextNode(text + '\n'));

const counters = { destroy: 0, effectRuns: 0, rowBuilds: 0, nestedBuilds: 0 };

/** Ids never repeat across rounds, so a recycled node can always be told apart. */
let nextId = 1;
const makeItems = (count = N) => {
    const list = new Array(count);
    for (let i = 0; i < count; i++) {
        const id = nextId++;
        list[i] = rowOf({ id, label: '', text: `row ${id}` });
    }
    return list;
};

/**
 * One row = the item's own view plus a nested function component and an effect,
 * so dropping a row has to release a child component scope, the item scope and a
 * live subscription. A row that is only *moved* must keep all three.
 */
function build(container) {
    const items = listOf();
    const Nested = item => {
        onDestroy(() => counters.destroy++);
        return span(computed(() => item.text));
    };
    const Row = item => {
        effect(() => {
            counters.effectRuns++;
            item.label;
        });
        return div({ class: 'row', 'data-id': item.id }, a(computed(() => item.label)), () => Nested(item));
    };
    Jetz.mount(div({ class: 'bench' }, loop(items, item => item.id, Row)), container);
    return { items, body: container.querySelector('div.bench') };
}

const container = document.createElement('div');
container.style.cssText = 'position:fixed;top:0;left:-99999px;width:900px;';
document.body.append(container);
const { items, body } = build(container);

const idOrder = () => Array.from(body.children, node => node.dataset.id).join(',');
const wantOrder = list => list.map(item => String(rawOf(item).id)).join(',');

/** timeOp plus a count of nodes the operation attached or detached. */
async function timed(act, root) {
    let nodeOps = 0;
    const counter = new MutationObserver(records => {
        for (const record of records) nodeOps += record.removedNodes.length + record.addedNodes.length;
    });
    counter.observe(root, { childList: true, subtree: true });
    const sample = await timeOp(act, root);
    counter.disconnect();
    return { ...sample, nodeOps };
}

/**
 * Lets every deferred reaction drain: a state bump, the lifecycle sweep that
 * `triggerByState()` runs, then two quiet frames so late microtasks land.
 */
async function settle(root) {
    Jetz.triggerByState();
    await flush(root);
    await flush(root);
}

/**
 * Each scenario: `setup` brings the table to its starting state and returns the
 * payload for the timed `act` (never null). `retained` marks scenarios whose
 * keys survive, so node identity can be checked for them.
 *
 * `expect(before, payload)` receives the DOM id order captured before the
 * operation and returns the id order it must have afterwards.
 *
 * `items.set(a)` keeps `a` as its own array, so every scenario seeds the list
 * with a COPY and reorders a separate one — otherwise the setup would mutate
 * the live list in place and the timed act would have nothing to do.
 */
const seed = values => {
    items.set(values.slice());
    return values;
};

const scenarios = [
    {
        name: 'create 10k (empty → 10k)',
        retained: false,
        setup: () => {
            items.set([]);
            return makeItems();
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: 0
    },
    {
        name: 'replace 10k (all keys new)',
        retained: false,
        setup: () => {
            items.set(makeItems());
            return makeItems();
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: N
    },
    {
        name: 'clear 10k',
        retained: false,
        setup: () => {
            items.set(makeItems());
            return null;
        },
        act: () => items.clear(),
        expect: () => '',
        wantDestroy: N
    },
    {
        name: 'move last → first',
        retained: true,
        setup: () => {
            const values = makeItems();
            const next = values.slice();
            next.unshift(next.pop());
            seed(values);
            return next;
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: 0
    },
    {
        name: 'swap row 2 ↔ row 999',
        retained: true,
        setup: () => {
            const values = makeItems();
            const next = values.slice();
            const spare = next[1];
            next[1] = next[998];
            next[998] = spare;
            seed(values);
            return next;
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: 0
    },
    {
        name: 'reverse 10k',
        retained: true,
        setup: () => {
            const values = makeItems();
            seed(values);
            return values.slice().reverse();
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: 0
    },
    {
        name: 'keep keys, drop 5k, add 5k new',
        retained: true,
        setup: () => {
            const values = makeItems();
            seed(values);
            const keep = values.filter((_, index) => index % 2 === 0);
            return [...makeItems(N / 2), ...keep];
        },
        act: list => items.set(list),
        expect: (_before, list) => wantOrder(list),
        wantDestroy: N / 2
    },
    {
        name: 'update 1k labels (every 10th row, batched)',
        retained: true,
        setup: () => seed(makeItems()),
        act: list => batch(() => {
            for (let i = 0; i < list.length; i += 10) {
                rawOf(list[i]).label = 'updated';
                touchRow(list[i]);
            }
        }),
        expect: before => before,
        wantDestroy: 0
    },
    {
        name: 'select one row',
        retained: true,
        setup: () => seed(makeItems()),
        act: list => list[500].set({ label: 'selected' }),
        expect: before => before,
        wantDestroy: 0
    },
    {
        name: 'removeAt middle (5000)',
        retained: true,
        setup: () => seed(makeItems()),
        act: () => items.removeAt(5000),
        expect: before => before.split(',').filter((_, index) => index !== 5000).join(','),
        wantDestroy: 1
    },
    {
        name: 'insertAt middle (5000)',
        retained: true,
        setup: () => {
            seed(makeItems());
            return makeItems(1)[0];
        },
        act: item => items.insertAt(5000, item),
        expect: (before, item) => {
            const ids = before.split(',');
            ids.splice(5000, 0, String(rawOf(item).id));
            return ids.join(',');
        },
        wantDestroy: 0
    }
];

const results = [];
const columns = ['scenario', 'median ms', 'p95 ms', 'records', 'node ops', 'order', 'identity', 'leak runs', 'destroy', 'want'];
const pad = (text, width = 13) => String(text).padEnd(width);

// esbuild emits this bundle as an IIFE, which cannot use top-level await.
async function run() {
log(`reconciler probe · ${N} rows · ${ROUNDS} rounds, 1 warm-up discarded\n`);
log(columns.map(c => pad(c)).join(''));

for (const scenario of scenarios) {
    const runs = [];
    let orderOk = true;
    let identityOk = true;
    let leaked = false;
    let leakRuns = 0;

    for (let round = 0; round < ROUNDS + 1; round++) {
        const payload = scenario.setup();
        // Settle before measuring: a setup that seeds the list queues the
        // previous rows into the lifecycle sweep, and those destroys belong to
        // the setup, not to the operation being timed.
        await settle(container);

        // nodes captured by object identity before the operation; the ids are
        // chosen so they survive every scenario that claims to retain keys
        const anchors = ANCHOR_INDEXES.map(index => body.children[index]);
        const anchorIds = anchors.map(node => node?.dataset.id);
        const orderBefore = idOrder();

        const destroyBefore = counters.destroy;
        const sample = await timed(() => scenario.act(payload), container);
        // `onDestroy` for a detached component runs in the lifecycle sweep, which
        // the next state trigger drains. Settle outside the timed window so the
        // destroy count measures "exactly once per removed component" rather
        // than "how many callbacks happened to be reachable synchronously".
        await settle(container);

        orderOk = orderOk && idOrder() === scenario.expect(orderBefore, payload);
        if (scenario.retained) {
            identityOk = identityOk && anchors.every((node, index) => node && node.isConnected &&
                node.dataset.id === anchorIds[index] &&
                body.querySelector(`[data-id="${anchorIds[index]}"]`) === node);
        }
        if (round > 0) runs.push({ ...sample, destroy: counters.destroy - destroyBefore, heap: heapMb() });
    }

    // A removed row must not keep a live effect: drop row 0, write to its data,
    // and check that nothing re-ran. Settle first, then take the baseline after
    // the removal, so the reconciler rebuilding a neighbour (or a deferred
    // re-render from the removal itself) is not mistaken for a leak.
    const victim = items.values[0];
    items.removeAt(0);
    await settle(container);
    if (victim) {
        const runsBefore = counters.effectRuns;
        victim.set({ label: 'after-removal' });
        await settle(container);
        leakRuns = counters.effectRuns - runsBefore;
        if (leakRuns > 0) leaked = true;
    }
    items.set([]);

    const times = runs.map(run => run.dom).sort((a, b) => a - b);
    const p95 = times[Math.min(times.length - 1, Math.ceil(times.length * 0.95) - 1)];
    const row = {
        scenario: scenario.name,
        medianMs: median(times),
        p95Ms: +p95.toFixed(2),
        records: median(runs.map(run => run.mutations)),
        nodeOps: median(runs.map(run => run.nodeOps)),
        orderOk,
        identityOk,
        leakRuns,
        destroy: median(runs.map(run => run.destroy)),
        wantDestroy: scenario.wantDestroy
    };
    results.push(row);
    log([pad(row.scenario), pad(row.medianMs), pad(row.p95Ms), pad(row.records), pad(row.nodeOps),
        pad(row.orderOk ? 'ok' : 'BAD'), pad(row.identityOk ? 'ok' : 'BAD'), pad(row.leakRuns),
        pad(`${row.destroy}/${row.wantDestroy}`), pad('')].join(''));
}

window.__JETZ_REORDER__ = { ranAt: new Date().toISOString(), n: N, rounds: ROUNDS, rows: results };
log('\ndone');
}

run().catch(error => {
    window.__JETZ_REORDER__ = null;
    log(`\nprobe failed: ${error.stack ?? error.message}`);
    document.querySelector('.status')?.remove();
    document.body.append(Object.assign(document.createElement('div'), { className: 'status', textContent: `Failed: ${error.message}` }));
});
