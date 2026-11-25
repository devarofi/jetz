/**
 * Timing rules — identical for every arm. See `timeOp` for what the three
 * phases mean and `sampleOp` for how they are aggregated.
 */

export const config = { samples: 6, warmup: 1 };

/**
 * Yield to the task queue without giving the renderer a chance to paint.
 *
 * A `setTimeout(0)` boundary lets the browser paint between the op and the
 * measurement, which folds 60 Hz frame quantisation into every number. A
 * MessageChannel task runs as soon as the current task ends, so a framework
 * that scheduled its render on the task queue (React uses a MessageChannel of
 * its own) has flushed, but no paint has been paid for yet.
 */
/**
 * Wait until the DOM stops changing, bounded so a framework that never settles
 * cannot hang the run.
 *
 * A fixed number of yields cannot work here. One is not enough for React, which
 * chunks a 10,000 row render across several MessageChannel tasks, and once the
 * count reaches three the browser has a frame boundary in the middle of every
 * measurement: measured on this page, three yields cost 740-1080 ms of layout
 * and paint on top of the framework's own work, while one quiet yield costs
 * 0.1 ms. So the flush ends on two consecutive task boundaries that produced no
 * mutation, whichever arm that takes.
 */
const queue = [];
const channel = new MessageChannel();
channel.port1.onmessage = () => queue.shift()?.();

function taskYield() {
    return new Promise(resolve => {
        queue.push(resolve);
        channel.port2.postMessage(0);
    });
}

/**
 * One task boundary, for pacing the run between arms.
 *
 * Deliberately not `requestAnimationFrame`: a hidden tab pauses frames, so an
 * rAF await there never resolves and the run parks on the first arm. A
 * MessageChannel task is not throttled, and it keeps no paint inside the
 * measurement either.
 */
export const yieldTask = taskYield;

export async function flush(root) {
    const target = root ?? document.body;
    const observer = new MutationObserver(() => {});
    observer.observe(target, { childList: true, subtree: true, attributes: true, characterData: true });
    let quiet = 0;
    try {
        for (let task = 0; task < 128 && quiet < 2; task++) {
            observer.takeRecords();
            await taskYield();
            quiet = observer.takeRecords().length === 0 ? quiet + 1 : 0;
        }
    } finally {
        observer.disconnect();
    }
}

/**
 * Four timestamps per operation:
 *   sync     the synchronous part of the call itself
 *   dom      up to the framework's LAST DOM mutation — the headline, and the
 *            number the published suite is after. A MutationObserver callback is
 *            delivered at the microtask checkpoint that closes the task doing
 *            the writes, so this lands inside the framework's own commit and
 *            never waits for a frame. For an arm that renders inline (raw DOM,
 *            Jetz) it sits just above `sync`; for one that schedules (React,
 *            Vue) it waits for the last chunk of that render.
 *   settled  plus the quiet-task flush, i.e. after the browser has also had a
 *            chance to lay the new table out
 *   total    plus one forced layout, so nothing can hide behind a fast return
 *
 * `dom` is the comparison number. The gap to `total` is the browser's table
 * algorithm, which is the same for every arm — that is why measuring "until the
 * page looks right" would compress the whole chart into a tie.
 */
export async function timeOp(op, measureEl) {
    const started = performance.now();
    let lastWrite = null;
    let mutations = 0;
    const probe = new MutationObserver(records => {
        mutations += records.length;
        lastWrite = performance.now();
    });
    probe.observe(measureEl, { childList: true, subtree: true, attributes: true, characterData: true });

    try {
        await op();
        const sync = performance.now() - started;
        await flush(measureEl);
        const settled = performance.now() - started;
        void measureEl.getBoundingClientRect();
        return {
            sync,
            dom: lastWrite === null ? settled : lastWrite - started,
            settled,
            total: performance.now() - started,
            mutations
        };
    } finally {
        probe.disconnect();
    }
}

/**
 * Runs `op` warm-up + samples times and reports the median of each phase.
 * `reset` restores the table to its starting state between samples and is never
 * timed, so every sample measures the same transition.
 */
export async function sampleOp(op, measureEl, reset = null) {
    const runs = [];
    const passes = config.samples + config.warmup;
    for (let i = 0; i < passes; i++) {
        if (reset) await reset();
        const sample = await timeOp(op, measureEl);
        if (i >= config.warmup) runs.push(sample);
    }
    return {
        dom: median(runs.map(r => r.dom)),
        sync: median(runs.map(r => r.sync)),
        settled: median(runs.map(r => r.settled)),
        total: median(runs.map(r => r.total)),
        fastest: Math.min(...runs.map(r => r.dom)),
        mutations: median(runs.map(r => r.mutations)),
        runs: runs.map(r => +r.dom.toFixed(2))
    };
}

export function median(values) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const m = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return +m.toFixed(2);
}

/**
 * Multiplicative average, used for the overall standing. An arithmetic mean
 * would let one operation with a large absolute time dominate the ranking and
 * let another with a tiny time vanish; ratios only make sense multiplied, since
 * "3x slower here, 3x faster there" is a wash — which is what a geometric mean
 * reports and what a mean of ratios would not.
 */
export function geometricMean(values) {
    const positive = values.filter(value => value > 0);
    if (positive.length !== values.length || values.length === 0) return 0;
    return Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length);
}

export function round(value) { return +value.toFixed(2); }

/** Chrome-only; other browsers report 0 and the memory column shows 'n/a'. */
export function heapMb() {
    const memory = performance.memory;
    return memory ? round(memory.usedJSHeapSize / 1048576) : 0;
}

export function domNodes(root) { return root ? root.querySelectorAll('*').length : 0; }
