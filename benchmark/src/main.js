import { SELECT_LABEL, SWAP_A, SWAP_B, UPDATE_LABEL, isSelectedAt, labelAt, makeRows, rowCount, tenthIndices, textAt } from './data.js';
import { config, domNodes, flush, geometricMean, heapMb, sampleOp, yieldTask } from './measure.js';
import * as rawDom from './arms/vanilla.js';
import * as jetz from './arms/jetz.js';
import * as react from './arms/react.js';
import * as vue from './arms/vue.js';

/**
 * The harness.
 *
 * Chrome is plain DOM on purpose: measuring Jetz with Jetz would fold the
 * framework's own render cost into every number, and the page would go silent
 * if it broke. Only the table inside .arena is rendered by the arm under test.
 */

const ARMS = [rawDom, jetz, react, vue];
const BASELINE = 'vanilla';

const SIZE_S = 1000;
const SIZE_L = 10000;
const SELECT_INDEX = 500;
const REMOVE_INDEX = 0;

const OPS = [
    { id: 'startup', label: 'Startup · mount + 1,000 rows', mount: true, verify: arm => rowCount(arm.tbody) === SIZE_S },
    { id: 'create1k', label: 'Create 1,000 rows', size: SIZE_S, verify: arm => rowCount(arm.tbody) === SIZE_S },
    { id: 'create10k', label: 'Create 10,000 rows', size: SIZE_L, verify: arm => rowCount(arm.tbody) === SIZE_L },
    { id: 'replace10k', label: 'Replace all 10,000 rows', size: SIZE_L, startsFull: true, fresh: true, verify: arm => rowCount(arm.tbody) === SIZE_L && labelAt(arm.tbody, 0) === '' },
    { id: 'partial10k', label: 'Update every 10th row · 10,000', size: SIZE_L, startsFull: true, verify: arm => labelAt(arm.tbody, 10) === UPDATE_LABEL && labelAt(arm.tbody, 11) === '' },
    { id: 'select10k', label: 'Select one row · 10,000', size: SIZE_L, startsFull: true, verify: arm => isSelectedAt(arm.tbody, SELECT_INDEX) && labelAt(arm.tbody, SELECT_INDEX) === SELECT_LABEL },
    { id: 'swap10k', label: `Swap rows ${SWAP_A + 1} and ${SWAP_B + 1} · 10,000`, size: SIZE_L, startsFull: true },
    { id: 'remove10k', label: 'Remove one row · 10,000', size: SIZE_L, startsFull: true, verify: arm => rowCount(arm.tbody) === SIZE_L - 1 },
    { id: 'clear10k', label: 'Clear 10,000 rows', size: SIZE_L, startsFull: true, verify: arm => rowCount(arm.tbody) === 0 }
];

/** Arms mutate the specs they are handed, so each run gets its own copies. */
const clone = specs => specs.map(spec => ({ ...spec }));

/* -------------------------------- chrome -------------------------------- */

function el(tag, className, ...children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const child of children.flat()) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
}

const app = document.getElementById('app');
// `?autorun=1&samples=6` starts the suite on load, which is how
// `run-headless.mjs` drives it without a human at the button.
const params = new URLSearchParams(location.search);
if (params.get('samples')) config.samples = Math.max(1, Number(params.get('samples')) || 1);
const statusLine = el('div', 'status', 'Idle — nothing measured yet.');
const arenaHost = el('div');
const rankHost = el('div');
const resultsHost = el('div');
const memoryHost = el('div');
const runAllBtn = el('button', 'primary', 'Run all');
const csvBtn = el('button', null, 'Export CSV');
const samplesSelect = el('select', null,
    ...[1, 3, 6, 12].map(n => {
        const option = el('option', null, `${n} sample${n > 1 ? 's' : ''}`);
        option.value = String(n);
        if (n === config.samples) option.selected = true;
        return option;
    })
);

app.append(
    el('h1', null, 'Framework Benchmark · Jetz vs React vs Vue vs raw DOM'),
    el('p', 'lede',
        'The js-framework-benchmark operation set, run in one page on one machine against the same seeded data. ',
        'Every arm renders byte-identical markup under one stylesheet, so the only variable is how a framework turns state into DOM. ',
        'Raw DOM is the reference: 1.00x means "as fast as hand-written DOM".'),
    el('div', 'card',
        el('div', 'row',
            runAllBtn,
            el('span', 'spacer'),
            el('label', null, 'Samples per op ', samplesSelect),
            csvBtn
        ),
        statusLine,
        el('div', 'note', 'Reported number: median of the samples, one warm-up discarded. The headline stops at the framework’s last DOM mutation, observed at the microtask that closes the task doing the writes, so a deferred render cannot hide behind a fast return and no frame boundary is paid for. The second table settles the queue and forces one layout. The table under test sits off-screen: layout runs, paint does not, because identical paint would otherwise swamp the differences. Raw DOM is the hand-optimised arm — targeted attribute writes and real node moves, not a rebuild — so 1.00x is a demanding baseline.')
    ),
    el('div', 'card',
        el('h2', null, 'Ranking'),
        rankHost,
        el('div', 'note', 'Scored on the framework-work column, over only the operations every arm passed. Raw DOM sets the ceiling and is not ranked: its speed index is 100, and a framework scores 100 ÷ its average slowdown, so a higher index means faster and 100 would mean it matched hand-written DOM on every operation. Because it is a geometric mean, one catastrophic operation cannot be hidden by one spectacular one.')
    ),
    el('div', 'card',
        el('h2', null, 'Results'),
        resultsHost,
        el('div', 'note', 'Green marks the fastest arm for that operation. Hover a cell for the synchronous-js time and the raw samples. Verification is not optional: an arm that skipped work would otherwise look free.')
    ),
    el('div', 'card',
        el('h2', null, 'Memory and DOM footprint'),
        memoryHost,
        el('div', 'note', 'Heap is Chrome-only (performance.memory). Nodes after clear should fall back to the empty-table size — anything left over is retained state.')
    ),
    arenaHost
);

function status(text, kind = '') {
    statusLine.className = `status ${kind}`;
    statusLine.textContent = text;
}

/* ------------------------------- the runner ------------------------------ */

const results = { meta: ARMS.map(mod => mod.meta), config: { ...config }, ranAt: null, ops: {} };

async function runOp(mod, op) {
    const container = el('div', 'arena');
    arenaHost.replaceChildren(container);

    const base = clone(makeRows(op.size ?? SIZE_S));
    const swap = { textA: null, textB: null };
    let arm = null;

    const unmount = () => {
        arm?.destroy?.();
        arm = null;
        container.replaceChildren();
    };

    // Restores the pre-operation state before every sample; never timed.
    const reset = async () => {
        if (op.mount) { unmount(); return; }
        if (op.startsFull) arm.render(clone(op.fresh ? makeRows(op.size) : base));
        else arm.clear();
        await flush(container);
        // After the flush, not before: React and Vue have not touched the DOM
        // yet when render() returns, so reading earlier hands the swap verifier
        // the text from the previous sample instead of this one's starting row.
        if (op.id === 'swap10k') {
            swap.textA = textAt(arm.tbody, SWAP_A);
            swap.textB = textAt(arm.tbody, SWAP_B);
        }
    };

    const run = () => {
        if (op.mount) {
            arm = mod.create(container);
            arm.render(clone(base));
            return;
        }
        switch (op.id) {
            case 'create1k':
            case 'create10k':
            case 'replace10k': arm.render(clone(base)); break;
            case 'partial10k': arm.updateTenth(tenthIndices(base.length), UPDATE_LABEL); break;
            case 'select10k': arm.select(SELECT_INDEX, SELECT_LABEL); break;
            case 'swap10k': arm.swap(SWAP_A, SWAP_B); break;
            case 'remove10k': arm.remove(REMOVE_INDEX); break;
            case 'clear10k': arm.clear(); break;
        }
    };

    if (!op.mount) arm = mod.create(container);
    const sample = await sampleOp(run, container, reset);

    // The last sample left the table in its post-operation state: check it did
    // the work it claims to have done, before tearing it down.
    const passed = op.verify
        ? op.verify(arm, swap)
        : textAt(arm.tbody, SWAP_A) === swap.textB && textAt(arm.tbody, SWAP_B) === swap.textA;

    const memory = { nodes: domNodes(arm.tbody), heapMb: heapMb() };
    if (op.id === 'clear10k') {
        await new Promise(resolve => setTimeout(resolve, 50));
        memory.nodesLeft = domNodes(container);
    }

    unmount();
    return { ...sample, passed, ...memory };
}

async function runAll() {
    runAllBtn.disabled = true;
    csvBtn.disabled = true;
    results.ranAt = new Date().toISOString();
    results.config = { ...config };
    results.ops = {};

    for (const op of OPS) {
        results.ops[op.id] = { label: op.label };
        for (const mod of ARMS) {
            status(`${op.label} · ${mod.meta.label} — ${config.samples + config.warmup} runs`, 'busy');
            // One task boundary so the status line commits between arms. Not a
            // frame: with the tab hidden, rAF pauses and the run never resumes.
            await yieldTask();
            results.ops[op.id][mod.meta.id] = await runOp(mod, op);
            renderResults();
        }
        status(`${op.label} · done`);
    }

    arenaHost.replaceChildren();
    status(`Finished at ${new Date().toLocaleTimeString()} — median of ${config.samples} samples per op.`);
    runAllBtn.disabled = false;
    csvBtn.disabled = false;
    window.__JETZ_BENCH__ = results;
}

/* ------------------------------- reporting ------------------------------ */

function armTable(pick, caption) {
    const head = el('tr', null,
        el('th', null, 'Operation'),
        ...ARMS.map(mod => el('th', null, mod.meta.label))
    );

    const body = OPS.filter(op => results.ops[op.id]).map(op => {
        const row = results.ops[op.id];
        const baseline = row[BASELINE] ? pick(row[BASELINE]) : 0;
        const passed = Object.values(row).filter(r => r && r.passed).map(pick);
        const fastest = passed.length ? Math.min(...passed) : 0;
        return el('tr', null,
            el('td', null, op.label),
            ...ARMS.map(mod => {
                const r = row[mod.meta.id];
                if (!r) return el('td', 'num', '—');
                const value = pick(r);
                const parts = [el('span', null, `${value.toFixed(2)} ms`)];
                if (mod.meta.id !== BASELINE && baseline) parts.push(el('span', 'ratio', `${(value / baseline).toFixed(2)}x`));
                if (!r.passed) parts.push(el('span', 'fail-chip', ' ✗ verify'));
                const cell = el('td', `num${r.passed && value === fastest ? ' best' : ''}`, ...parts);
                cell.title = `${mod.meta.detail}\nsync ${r.sync.toFixed(2)} · last DOM write ${r.dom.toFixed(2)} · settled ${r.settled.toFixed(2)} · with layout ${r.total.toFixed(2)}\nDOM mutations ${r.mutations}\nsamples ${r.runs.join(', ')}`;
                return cell;
            })
        );
    });

    return el('table', 'results',
        el('caption', null, caption),
        el('thead', null, head),
        el('tbody', null, ...body)
    );
}

/**
 * Overall standing, Krausest-style: the per-operation ratios are combined with a
 * geometric mean, so an arm that is 800x slower on one operation cannot be
 * rescued by being fastest on another.
 *
 * The denominator is the fastest ARM for that operation, raw DOM included, which
 * makes the score an absolute ceiling rather than a comparison between the
 * frameworks: 1.00x means "hand-written DOM on every operation". The raw-DOM arm
 * is never ranked, because it is a reference implementation and not a framework
 * anyone installs.
 */
function standings() {
    const complete = OPS.filter(op => {
        const row = results.ops[op.id];
        return row && ARMS.every(mod => row[mod.meta.id]?.passed);
    });
    const dropped = OPS.filter(op => !complete.includes(op));
    const ranked = ARMS.filter(mod => mod.meta.id !== BASELINE);
    const baseline = ARMS.find(mod => mod.meta.id === BASELINE)?.meta.label ?? BASELINE;

    const list = ranked
        .map(mod => {
            const ratios = [];
            let wins = 0;
            for (const op of complete) {
                const row = results.ops[op.id];
                const times = ARMS.map(other => Math.max(row[other.meta.id].dom, 0.01));
                const mine = Math.max(row[mod.meta.id].dom, 0.01);
                ratios.push(mine / Math.min(...times));
                // "Fastest on" is counted among the ranked frameworks only: raw
                // DOM wins every operation here, so a win column against all
                // arms would read 0 / 9 for every framework and say nothing.
                if (mine <= Math.min(...ranked.map(other => Math.max(row[other.meta.id].dom, 0.01)))) wins++;
            }
            return {
                id: mod.meta.id,
                label: mod.meta.label,
                detail: mod.meta.detail,
                score: geometricMean(ratios),
                // Speed index: raw DOM (the ceiling) scores 100, a framework scores
                // 100 ÷ its average slowdown, so a HIGHER number means FASTER.
                speed: 100 / geometricMean(ratios),
                wins,
                ops: complete.length
            };
        })
        .sort((a, b) => a.score - b.score);

    // `vs <reference>` is deliberately NOT a second column: the hand-written arm
    // is the fastest arm on every operation of this suite, so a ratio against it
    // and a ratio against the fastest arm are the same number. The gap to the
    // leader is what a standing is actually for, and it stays meaningful if a
    // framework ever overtakes raw DOM on one operation.
    const leader = list[0]?.score ?? 1;
    for (const entry of list) entry.gap = entry.score / leader;

    return { list, reference: baseline, ops: complete.length, total: OPS.length, dropped };
}

function renderLeaderboard() {
    const { list, reference, ops, total, dropped } = standings();
    if (!ops) {
        rankHost.replaceChildren(el('div', 'note', `Nothing scored yet — an operation enters the ranking only once every arm has passed its verification.`));
        return;
    }

    const best = list[0].speed;
    const head = el('tr', null,
        el('th', null, 'Rank'),
        el('th', null, 'Framework'),
        el('th', 'num', 'Speed index · raw DOM = 100'),
        el('th', 'num', 'Gap to leader'),
        el('th', 'num', 'Fastest framework op')
    );

    const rows = list.map((entry, index) => {
        const bar = el('span', 'bar');
        bar.style.width = `${Math.max(4, (entry.speed / best) * 100)}%`;
        const tr = el('tr', null,
            el('td', null, el('span', `rank-badge rank-${index + 1}`, String(index + 1))),
            el('td', null, el('strong', index === 0 ? 'leader' : null, entry.label), el('div', 'sub', entry.detail)),
            el('td', 'num', el('span', null, entry.speed.toFixed(1)), bar),
            el('td', 'num', index === 0 ? '—' : `${entry.gap.toFixed(2)}× behind`),
            el('td', 'num', `${entry.wins} / ${entry.ops}`)
        );
        tr.title = `${entry.label}: geometric mean over ${entry.ops} scored operations.\n` +
            `Speed index ${entry.speed.toFixed(1)} of 100 — 100 would match ${reference} on every one.\n` +
            (index === 0 ? 'Ranked first on this run.' : `${reference} is ${entry.gap.toFixed(2)}× faster than it overall.`);
        return tr;
    });

    const skipped = dropped.length
        ? el('div', 'note', `Excluded from the ranking until every arm passes: ${dropped.map(op => op.label).join(', ')}.`)
        : null;

    rankHost.replaceChildren(
        el('table', 'results standings',
            el('caption', null, `Overall standing · ${ops} of ${total} operations scored`),
            el('thead', null, head),
            el('tbody', null, ...rows)
        ),
        // never pass null straight in: replaceChildren renders it as the text "null"
        ...[skipped].filter(Boolean)
    );
}

function renderResults() {
    renderLeaderboard();
    resultsHost.replaceChildren(
        armTable(r => r.dom, 'Framework work: operation → last DOM mutation'),
        el('div', 'note', 'The state change plus the framework turning it into DOM, ending at its final mutation. Browser layout is excluded — it is the same table algorithm whichever arm built the rows.'),
        armTable(r => r.total, 'Same runs, after the flush plus one forced layout — read across, not down')
    );

    const memoryRows = ['create10k', 'clear10k'].flatMap(id =>
        ARMS.map(mod => {
            const r = results.ops[id]?.[mod.meta.id];
            if (!r) return null;
            return el('tr', null,
                el('td', null, `${results.ops[id].label} · ${mod.meta.label}`),
                el('td', 'num', r.nodes.toLocaleString('en-US')),
                el('td', 'num', r.heapMb ? `${r.heapMb} MB` : 'n/a'),
                el('td', 'num', r.nodesLeft !== undefined ? r.nodesLeft.toLocaleString('en-US') : '—')
            );
        }).filter(Boolean)
    );

    memoryHost.replaceChildren(el('table', 'results',
        el('thead', null, el('tr', null,
            el('th', null, 'Measurement'),
            el('th', null, 'DOM nodes'),
            el('th', null, 'JS heap'),
            el('th', null, 'Nodes left after clear')
        )),
        el('tbody', null, ...memoryRows)
    ));
}

function toCsv() {
    const ids = ARMS.map(mod => mod.meta.id);
    const header = ['operation',
        ...ids.map(id => `${id}_dom_last_write_ms`),
        ...ids.map(id => `${id}_with_layout_ms`),
        ...ids.map(id => `${id}_x_vanilla`),
        ...ids.map(id => `${id}_passed`)];
    const lines = [header];
    for (const op of OPS) {
        const row = results.ops[op.id];
        if (!row) continue;
        const baseline = row[BASELINE]?.dom || 0;
        lines.push([
            op.label,
            ...ids.map(id => row[id]?.dom ?? ''),
            ...ids.map(id => row[id]?.total ?? ''),
            ...ids.map(id => row[id] ? (baseline ? (row[id].dom / baseline).toFixed(2) : '1') : ''),
            ...ids.map(id => row[id] ? (row[id].passed ? 'yes' : 'NO') : '')
        ]);
    }
    const csv = lines.map(cells => cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = el('a', null, '');
    link.href = url;
    link.download = 'jetz-framework-benchmark.csv';
    link.click();
    URL.revokeObjectURL(url);
}

runAllBtn.onclick = () => { runAll().catch(error => status(`Failed: ${error.message}`, 'fail')); };
csvBtn.onclick = toCsv;
samplesSelect.onchange = () => {
    config.samples = Number(samplesSelect.value);
    status(`Samples per op set to ${config.samples} — press Run all to re-measure every arm at that sample count.`);
};

renderResults();
status(`Arms: ${ARMS.map(mod => mod.meta.label).join(' · ')} — press Run all.`);
if (params.get('autorun')) runAllBtn.click();
