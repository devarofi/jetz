// ---------------------------------------------------------------------------
// Heap & GC stress suite for the Jetz runtime.
//
// Why a standalone runner instead of a vitest file: the suite needs a real
// `global.gc()`, which only exists when the process starts with --expose-gc.
// `vitest.config.mjs` runs `test/**/*.test.js` in jsdom workers that are not
// started with that flag, and the flag cannot be injected portably from an npm
// script on Windows. This mirrors the repo's other out-of-band runners
// (`test/smoke/run.mjs`, `test/pages.mjs`): it boots its own jsdom, prints
// `PASS ::` / `FAIL ::` lines and exits non-zero on failure. The regular unit
// tests stay runnable without forced GC.
//
//   pnpm test:memory            # node --expose-gc test/memory/run.mjs
//   node test/memory/run.mjs    # still useful: every behavioural check runs,
//                               # the heap sections degrade to explicit SKIPs
//
// Knobs (defaults are tuned for roughly a one-minute run on a laptop):
//   JETZ_MEM_SCALE             multiplies every workload size        (1)
//   JETZ_MEM_CYCLES            heap cycles, first 2 are warm-up      (8)
//   JETZ_MEM_LONG_CYCLES       long-running reactivity iterations    (30)
//   JETZ_MEM_HEAP_GROWTH_MIB   sustained-growth budget               (8)
//   JETZ_MEM_GC_TIMEOUT_MS     bounded WeakRef wait                  (1500)
//
// How to read this: sections B and E are the leak detector — they assert the
// runtime's documented teardown contracts with counters that cannot be raced.
// Sections C and E's heap column only corroborate them, and section D is
// best-effort evidence: ECMAScript gives garbage collection no timing
// guarantee, so "the finalizer has not run yet" is reported as inconclusive,
// never as a failure.
// ---------------------------------------------------------------------------

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const startedAt = Date.now();
const MiB = 1024 * 1024;

const number = (name, fallback) => {
	const raw = process.env[name];
	if (raw == null || raw === '') return fallback;
	const value = Number(raw);
	if (!Number.isFinite(value) || value <= 0) {
		console.error(`${name} must be a positive number, got ${JSON.stringify(raw)}`);
		process.exit(2);
	}
	return value;
};

const SCALE = number('JETZ_MEM_SCALE', 1);
const CYCLES = Math.round(number('JETZ_MEM_CYCLES', 8));
const LONG_CYCLES = Math.round(number('JETZ_MEM_LONG_CYCLES', 30));
const GROWTH_LIMIT_MIB = number('JETZ_MEM_HEAP_GROWTH_MIB', 8);
const GC_TIMEOUT_MS = number('JETZ_MEM_GC_TIMEOUT_MS', 1500);
const WARM_UP_CYCLES = 2;
// A step bigger than this counts as an increase; below it is measurement wobble.
const GROWTH_STEP_MIB = 0.5;
const size = base => Math.max(1, Math.round(base * SCALE));

// --- jsdom bootstrap -------------------------------------------------------
// The runtime is browser code: it touches `document`, `Text`, `NodeList` …
// inside functions only (verified: nothing at module scope), so the globals
// have to exist before the import. Every window property the host does not
// already provide is copied over; anything Node owns (setTimeout, console,
// process, the read-only `navigator`) is left alone, because jsdom's own
// wrappers behave identically to the host's there.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true
});
for (const key of Object.getOwnPropertyNames(dom.window)) {
	if (key in globalThis) continue;
	try {
		const value = dom.window[key];
		if (value === undefined) continue;
		globalThis[key] = value;
	} catch { /* a window accessor that refuses to be read outside the page */ }
}

const {
	stateOf, rowOf, computed, effect, batch, listOf, loop, Jetz,
	onCreate, onMount, onDestroy
} = await import('../../packages/jetz/src/jetz.js');
const { div, p, span, button, css, style } = await import('../../packages/jetz/src/jetz-ui.js');

let jsdomVersion = 'unknown';
try {
	const require = createRequire(import.meta.url);
	jsdomVersion = JSON.parse(readFileSync(require.resolve('jsdom/package.json'), 'utf8')).version;
} catch { /* report header only */ }

// --- harness ---------------------------------------------------------------
const lines = [];
let failures = 0;
const section = title => lines.push(`\n# ${title}`);
const fmt = value => typeof value === 'number'
	? (Number.isInteger(value) ? String(value) : value.toFixed(3))
	: String(value);
function check(name, actual, expected) {
	const pass = Object.is(actual, expected);
	if (!pass) failures++;
	lines.push(`${pass ? 'PASS' : 'FAIL'} :: ${name} | actual: ${fmt(actual)} | expected: ${fmt(expected)}`);
}
function assertTrue(name, condition, detail = '') {
	if (!condition) failures++;
	lines.push(`${condition ? 'PASS' : 'FAIL'} :: ${name}${detail ? ` | ${detail}` : ''}`);
}
/** Best-effort observation: reported, and never counted as a failure. */
const observe = (name, ok, detail) => lines.push(`${ok ? 'INFO' : 'WARN'} :: ${name} | ${detail}`);
const skip = (name, reason) => lines.push(`SKIP :: ${name} | ${reason}`);
const metric = (name, value) => lines.push(`   - ${name}: ${value}`);
const row = text => lines.push(`     ${text}`);

// A lifecycle hook registered outside a component render is dropped with a
// warning, which would silently zero out a teardown counter this suite asserts
// on. Captured here so such a mistake fails the run instead of passing it —
// the same guard `test/smoke/run.mjs` applies.
const droppedHooks = [];
const warn = console.warn.bind(console);
console.warn = (...args) => {
	const text = String(args[0] ?? '');
	if (text.includes('called outside of a component render')) droppedHooks.push(text);
	else warn(...args);
};

// --- GC and heap helpers ---------------------------------------------------
const hasGC = typeof globalThis.gc === 'function';
/**
 * Two collections: the first finishes the incremental marking, the second does
 * the full pass that frees the graph. That is an attempt, not a proof — which is
 * why no assertion below relies on a single measurement.
 */
function collect() {
	if (!hasGC) return false;
	globalThis.gc();
	globalThis.gc();
	return true;
}
const heapMiB = () => process.memoryUsage().heapUsed / MiB;
/**
 * Jetz drains `onDestroy` for detached components on the next state trigger, so
 * a destruction count is only stable after a sweep plus two microtasks — the
 * same settle() the reconciliation tests use.
 */
async function settle() {
	Jetz.triggerByState();
	await Promise.resolve();
	await Promise.resolve();
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

/** Containers mounted by the running scenario, so nothing survives into the next. */
let containers = [];
function mount(element) {
	const target = document.createElement('div');
	document.body.append(target);
	Jetz.mount(element, target);
	containers.push(target);
	return target;
}
/** Fires onDestroy + releases bindings for the mounted subtree, then detaches it. */
function unmount(target) {
	Jetz.unmount(target);
	target.remove();
	containers = containers.filter(candidate => candidate !== target);
}
function unmountAll() {
	containers.slice().forEach(unmount);
	containers = [];
}

/**
 * Sustained-growth rule. Heap on a shared machine is never flat, so one high
 * sample means nothing: growth must be both above the budget AND a majority
 * trend across the stabilized cycles. The evidence is returned either way so a
 * failure stays actionable.
 */
function growthVerdict(residuals, limitMiB) {
	const stabilized = residuals.slice(WARM_UP_CYCLES);
	if (stabilized.length < 3) return { verdict: 'inconclusive', steps: stabilized.length };
	const first = stabilized[0];
	const last = stabilized[stabilized.length - 1];
	let increases = 0;
	for (let i = 1; i < stabilized.length; i++) {
		if (stabilized[i] > stabilized[i - 1] + GROWTH_STEP_MIB) increases++;
	}
	const steps = stabilized.length - 1;
	const growth = last - first;
	const sustained = increases >= Math.ceil(steps / 2);
	return {
		verdict: growth > limitMiB && sustained ? 'sustained growth' : 'stable',
		growth, first, last, increases, steps,
		spread: Math.max(...stabilized) - Math.min(...stabilized)
	};
}

// ===========================================================================
// A. Reactive stress — throughput and disposal at 1k / 10k / 50k.
//    The large steps stay DOM-free on purpose: a jsdom node costs far more
//    than the reactive record bound to it, so 50k states measures Jetz while
//    50k rows would measure jsdom.
// ===========================================================================
section('A. reactive stress');
metric('runtime', `node ${process.version}, ${process.platform}/${process.arch}, v8 ${process.versions.v8}`);
metric('framework', `Jetz ${Jetz.version}, jsdom ${jsdomVersion}`);
metric('forced GC (--expose-gc)', hasGC ? 'available' : 'NOT available — heap sections become SKIPs');
metric('unit', 'MiB (1048576 bytes) of process.memoryUsage().heapUsed');
metric('workload', `scale=${SCALE}, heap cycles=${CYCLES} (${WARM_UP_CYCLES} warm-up), long cycles=${LONG_CYCLES}`);
metric('growth budget', `${GROWTH_LIMIT_MIB} MiB sustained, step ${GROWTH_STEP_MIB} MiB, WeakRef wait ${GC_TIMEOUT_MS} ms`);

for (const count of [size(1000), size(10000), size(50000)]) {
	let runs = 0;
	const states = [];
	const disposers = [];
	for (let i = 0; i < count; i++) {
		const state = stateOf(i);
		states.push(state);
		disposers.push(effect(() => { runs++; state.value; }));
	}
	check(`A ${count} effects each ran once on creation`, runs, count);

	states[0].setState(1);
	states[count - 1].setState(2);
	check(`A ${count}: exactly 2 effects re-ran (targeted, not global)`, runs, count + 2);

	disposers.forEach(dispose => dispose());
	const frozen = runs;
	for (let i = 0; i < count; i++) states[i].setState(99);
	check(`A ${count}: disposed effects never re-ran`, runs, frozen);
	disposers.forEach(dispose => dispose());
	states[0].setState(-1);
	check(`A ${count}: disposing twice is harmless`, runs, frozen);

	states.length = 0;
	disposers.length = 0;
	collect();
	metric(`A ${count} state+effect graph`, `${runs} total runs, heap ${heapMiB().toFixed(1)} MiB after drop+gc`);
}

{
	// Two shapes of derived state. Fan-out (thousands of computeds over one
	// source) is the stress case. A *chain* is only exercised shallowly: a
	// recompute writes `derivedState.value = result`, which synchronously drives
	// the next link, so propagation depth costs stack depth (a 1000-link chain
	// overflows on this runtime, a 200-link chain does not). The exact boundary
	// depends on the host stack size, so it is reported, never asserted.
	const count = size(5000);
	const head = stateOf(1);
	const derived = Array.from({ length: count }, (_, i) => computed(() => head.value + i));
	check(`A ${count}-way computed fan-out resolves`, derived[count - 1].value, count);
	head.setState(2);
	check(`A fan-out recomputes every link on a source change`, derived[0].value, 2);
	check(`A fan-out keeps the last value`, derived[count - 1].value, count + 1);

	const depth = 200;
	let cursor = head;
	for (let i = 0; i < depth; i++) {
		// `prev` per iteration: a chain that closes over the moving `cursor`
		// binding would make every link re-read the LAST one on recompute and
		// recurse into itself.
		const prev = cursor;
		cursor = computed(() => prev.value + 1);
	}
	check(`A ${depth}-deep computed chain resolves`, cursor.value, depth + 2);
	head.setState(3);
	check(`A ${depth}-deep computed chain propagates a head change`, cursor.value, depth + 3);
	metric('A computeds', `${count} fan-out + a ${depth}-link chain, heap ${heapMiB().toFixed(1)} MiB`);
}

{
	const a = stateOf(0), b = stateOf(0), c = stateOf(0);
	let runs = 0;
	effect(() => { runs++; a.value + b.value + c.value; });
	check('A batch: effect ran once on creation', runs, 1);
	batch(() => { a.value = 1; b.value = 1; c.value = 1; });
	check('A batch: three writes collapse into one re-run', runs, 2);
	a.value = 2; b.value = 2;
	check('A unbatched: two writes are two re-runs', runs, 4);
}

{
	// A `loop()` render function is not a component: lifecycle hooks registered
	// in it attach to whatever component render is active (none at all when the
	// tree is mounted from a plain element, where the hook is dropped with a
	// console.warn). Per-row lifecycle therefore lives in a nested component,
	// which is also the idiom the rest of the suite uses.
	const rows = size(2000);
	let builds = 0, destroys = 0;
	const Widget = (item) => {
		builds++;
		onDestroy(() => destroys++);
		return span(computed(() => item.label.value));
	};
	const items = Array.from({ length: rows }, (_, i) => stateOf({ id: i, label: `row ${i}` }));
	const list = listOf(...items);
	const target = mount(div(loop(list, item => item.id, item =>
		div({ 'data-id': item.id }, () => Widget(item))
	)));
	await settle();
	check(`A keyed churn: ${rows} rows rendered`, target.querySelectorAll('[data-id]').length, rows);
	check(`A keyed churn: ${rows} row widgets built`, builds, rows);
	for (let cycle = 0; cycle < 3; cycle++) {
		list.set([...items].reverse());
		await settle();
	}
	list.clear();
	await settle();
	check('A keyed churn: every rebuilt row was destroyed exactly once', destroys, builds);
	check('A keyed churn: no row node left in the DOM', target.querySelectorAll('[data-id]').length, 0);
	unmount(target);
}

// ===========================================================================
// B. Cleanup and retained references — the deterministic core of the suite.
// ===========================================================================
section('B. cleanup and retained references');

{
	const state = stateOf(0);
	let runs = 0;
	const dispose = effect(() => { runs++; state.value; });
	state.value = 1;
	check('B1 effect reacts before disposal', runs, 2);
	dispose();
	state.value = 2;
	state.value = 3;
	check('B1 effect is silent after disposal', runs, 2);
}

{
	const state = stateOf('a');
	let hits = 0;
	const handler = () => hits++;
	state.subscribe(handler);      // State.subscribe returns nothing by design
	state.value = 'b';
	check('B2 subscriber fired on change', hits, 1);
	state.unsubscribe(handler);
	state.value = 'c';
	check('B2 no subscriber traffic after unsubscribe', hits, 1);
}

{
	// `computed()` registers its teardown only inside a loop() view, so a row's
	// derived states must stop recomputing the moment the row leaves the list.
	const items = [stateOf({ id: 1, n: 0 }), stateOf({ id: 2, n: 0 })];
	let rowComputes = 0;
	const list = listOf(...items);
	const target = mount(div(loop(list, item => item.id, item => {
		return div({ 'data-id': item.id }, span(computed(() => { rowComputes++; return item.n.value; })));
	})));
	await settle();
	list.removeAt(0);
	await settle();
	const afterRemoval = rowComputes;
	items[0].n.setState(7);
	await settle();
	check('B3 computed of a removed row released its dependency subscription', rowComputes, afterRemoval);
	check('B3 removed row left the DOM', target.querySelectorAll('[data-id]').length, 1);
	list.set([items[1], ...Array.from({ length: 3 }, (_, i) => stateOf({ id: 10 + i, n: i }))]);
	await settle();
	assertTrue('B3 rebuilt list renders fresh rows', target.querySelectorAll('[data-id]').length === 4,
		`${target.querySelectorAll('[data-id]').length} rows`);
	unmount(target);
}

{
	// `State.container` is public and is exactly the DOM-binding registry the
	// runtime adds to on bind and prunes on release, so it is a direct
	// observer-retention probe with no test-only instrumentation.
	const text = stateOf('hello');
	const colour = stateOf('red');
	const baseline = text.container.length + colour.container.length;
	const target = mount(div(p(text), span(css`x`, style`color: ${colour}`, 'x')));
	await settle();
	const bound = text.container.length + colour.container.length;
	assertTrue('B4 bindings registered containers while mounted', bound > baseline,
		`baseline ${baseline} -> bound ${bound}`);
	unmount(target);
	check('B4 containers released after unmount', text.container.length + colour.container.length, baseline);
	text.setState('second');
	colour.setState('blue');
	check('B4 detached subtree keeps no text container', text.container.length, baseline);
	check('B4 detached subtree keeps no style container', colour.container.length, baseline);
}

{
	const rows = size(300);
	const items = Array.from({ length: rows }, (_, i) => stateOf({ id: i, label: `l${i}` }));
	const list = listOf(...items);
	let runs = 0;
	const target = mount(div(loop(list, item => item.id, item => {
		effect(() => { runs++; item.label.value; });
		return div({ 'data-id': item.id }, span(computed(() => item.label.value)));
	})));
	check('B5 all rows built', target.querySelectorAll('[data-id]').length, rows);
	list.clear();
	await settle();
	const afterClear = runs;
	for (const item of items) item.label.setState('changed after clear');
	await settle();
	check('B5 effects of cleared rows hold no subscription any more', runs, afterClear);
	check('B5 cleared list renders nothing', document.querySelectorAll('[data-id]').length, 0);
	unmount(target);
}

{
	const counts = { outer: 0, nested: 0, outerDestroys: 0, nestedDestroys: 0, effectRuns: 0 };
	const items = Array.from({ length: 6 }, (_, i) => stateOf({ id: i, label: `row ${i}` }));
	const list = listOf(...items);
	const Nested = (item) => {
		counts.nested++;
		onDestroy(() => counts.nestedDestroys++);
		return span(computed(() => item.label.value));
	};
	const Row = (item) => {
		counts.outer++;
		effect(() => { counts.effectRuns++; item.label.value; });
		return div({ 'data-id': item.id }, span(computed(() => item.label.value)), () => Nested(item));
	};
	const target = mount(div(loop(list, item => item.id, Row)));
	await settle();
	const nodes = Array.from(target.querySelectorAll('[data-id]'));
	check('B6 six rows mounted', nodes.length, 6);
	check('B6 six nested components built', counts.nested, 6);

	list.removeAt(2);
	await settle();
	check('B6 removed row node is disconnected', nodes[2].isConnected, false);
	check('B6 only that row left the DOM', target.querySelectorAll('[data-id]').length, 5);
	check('B6 nested onDestroy fired exactly once', counts.nestedDestroys, 1);
	const frozen = counts.effectRuns;
	items[2].label.setState('mutated after removal');
	await settle();
	check('B6 removed row effect is dead', counts.effectRuns, frozen);
	check('B6 survivors kept their original nodes',
		Array.from(target.querySelectorAll('[data-id]')).filter(node => nodes.includes(node)).length, 5);
	unmount(target);
	check('B6 unmount destroys the remaining rows once each', counts.nestedDestroys, 6);
}

{
	// A view destroyed twice must not report twice: `runDestroy()` is guarded by
	// its `destroyed` flag and `ReactiveScope.dispose()` by `disposed`.
	const items = Array.from({ length: 3 }, (_, i) => stateOf({ id: i, label: `s${i}` }));
	const list = listOf(...items);
	let teardowns = 0;
	const Widget = (item) => {
		onDestroy(() => teardowns++);
		return span(computed(() => item.label.value));
	};
	const target = mount(div(loop(list, item => item.id, item => {
		effect(() => { item.label.value; });
		return div({ 'data-id': item.id }, () => Widget(item));
	})));
	await settle();
	list.clear();
	await settle();
	const afterClear = teardowns;
	check('B7 first batch destroyed once each', afterClear, 3);
	list.set(Array.from({ length: 3 }, (_, i) => stateOf({ id: 100 + i, label: `t${i}` })));
	await settle();
	list.clear();
	await settle();
	unmount(target);
	await settle();
	check('B7 teardown ran once per view across both batches and the unmount', teardowns, 6);
}

{
	const counts = { creates: 0, mounts: 0, destroys: 0, effectRuns: 0 };
	const Leaf = (value) => {
		counts.creates++;
		onCreate(() => counts.creates++);
		onMount(() => counts.mounts++);
		onDestroy(() => counts.destroys++);
		effect(() => { counts.effectRuns++; value.value; });
		return span(value);
	};
	// `div(() => Tree())`: mount() invokes a root function plainly, without a
	// lifecycle context, so the tree is entered through a component child.
	const Tree = () => div(p('tree'), ...Array.from({ length: 4 }, (_, i) => () => Leaf(stateOf(i))));
	const rounds = 20;
	for (let round = 0; round < rounds; round++) {
		const target = mount(div(() => Tree()));
		await settle();
		unmount(target);
	}
	check(`B8 ${rounds} mount/unmount rounds: onCreate + build count`, counts.creates, rounds * 4 * 2);
	check(`B8 ${rounds} mount/unmount rounds: onMount count`, counts.mounts, rounds * 4);
	check('B8 onDestroy count matches onMount', counts.destroys, counts.mounts);
	check('B8 no effect survives its tree', counts.effectRuns, rounds * 4);
	check('B8 the strong static remount registry is empty again', Jetz.remountByAttr.length, 0);
	check('B8 no container left in the document', document.body.children.length, 0);
}

{
	// Jetz.observeDevtools() is the runtime's public diagnostic hook; it is a
	// no-op when nobody subscribes, so using it here costs production nothing.
	// An element can be created without ever going through `disposeBindings`
	// (a text-only child, a branch that was never mounted), so the absolute
	// create/dispose gap is not a leak signal. What IS one: the gap changing
	// size between identical rounds. So the same tree is built and released
	// three times and the per-round deltas must be byte-identical.
	const rounds = 3;
	const rows = size(120);
	const perRound = [];
	for (let round = 0; round < rounds; round++) {
		let created = 0, disposed = 0, destroyEvents = 0, onDestroyCalls = 0;
		const listener = (event) => {
			if (event.type === 'create') created++;
			else if (event.type === 'dispose') disposed++;
			else if (event.type === 'lifecycle' && event.stage === 'destroy') destroyEvents++;
		};
		const unsubscribe = Jetz.observeDevtools(listener);
		const items = Array.from({ length: rows }, (_, i) => stateOf({ id: i, label: `d${i}` }));
		const list = listOf(...items);
		const Widget = (item) => {
			onDestroy(() => onDestroyCalls++);
			return span(computed(() => item.label.value));
		};
		const target = mount(div(p('observed'), loop(list, item => item.id, item =>
			div({ 'data-id': item.id }, span(item.label), () => Widget(item))
		)));
		await settle();
		list.clear();
		await settle();
		unmount(target);
		await settle();
		unsubscribe();
		perRound.push({ created, disposed, destroyEvents, onDestroyCalls });
	}

	const [first] = perRound;
	check(`B9 devtools observer saw element creation`, first.created > 0, true);
	check('B9 one onDestroy per row widget', first.onDestroyCalls, rows);
	check('B9 one lifecycle destroy event per row widget', first.destroyEvents, rows);
	for (let round = 1; round < rounds; round++) {
		check(`B9 round ${round + 1}: identical create event count`, perRound[round].created, first.created);
		check(`B9 round ${round + 1}: identical dispose event count`, perRound[round].disposed, first.disposed);
	}
	metric('B9 element accounting', `${first.created} creates, ${first.disposed} releases, ${first.created - first.disposed} elements created without a dispose event`);
	assertTrue('B9 the create/dispose gap does not grow between rounds',
		perRound.every(sample => sample.created - sample.disposed === first.created - first.disposed), true);

	let seen = 0;
	const stop = Jetz.observeDevtools(() => seen++);
	const stray = mount(div(p('stray')));
	unmount(stray);
	check('B9 a fresh observer sees a later tree', seen > 0, true);
	const beforeUnsubscribe = seen;
	stop();
	const second = mount(div(p('after unsubscribe')));
	unmount(second);
	check('B9 unsubscribing the observer stops it', seen, beforeUnsubscribe);
	unmountAll();
}

{
	// Two separate contracts: the imperative `on()/off()` pair, and the binding
	// teardown that detaches declarative `on…` attributes when the element is
	// released.
	let clicks = 0;
	const handler = () => clicks++;
	const node = button({ onclick: handler }, 'click');
	const target = mount(div(node));
	target.querySelector('button').click();
	check('B10 an attribute listener fires while attached', clicks, 1);
	node.on('click', handler);
	target.querySelector('button').click();
	check('B10 on() adds a second listener on the same event', clicks, 3);
	node.off('click', handler);
	target.querySelector('button').click();
	check('B10 off() removes exactly that listener', clicks, 4);

	const detached = target.querySelector('button');
	unmount(target);
	const beforeRelease = clicks;
	detached.click();
	check('B10 the attribute listener is detached on release', clicks, beforeRelease);
	check('B10 the element reports no listener left in its registry', node.listener.length, 0);
}

{
	// The retention path this suite used to document as expected behaviour, now
	// asserted as released: a component's `effect()` and `computed()` belong to
	// the component, so a source state that outlives the view must not keep them
	// subscribed - and must not keep the view's detached DOM alive through them.
	const store = stateOf(0);
	let computes = 0, runs = 0;
	let orphanNode = null;
	const Panel = () => {
		// the closure below captures `orphanNode`, so if the effect survived the
		// unmount the state holds a strong path to a detached node
		const orphan = span('orphan');
		effect(() => {
			runs++;
			store.value;
			if (store.value > 0 && orphan.o) {
				orphanNode = orphan.o;
				orphan.o.textContent = `tick ${store.value}`;
			}
		});
		return div(p(computed(() => { computes++; return `count ${store.value}`; })), orphan);
	};
	const target = mount(div(() => Panel()));
	await settle();
	const afterMount = { computes, runs };
	const whileMounted = store.subscriberCount;
	assertTrue('B12 a mounted component subscribes through its source state', whileMounted > 0,
		`${whileMounted} subscriber(s) on the store`);
	unmount(target);
	check('B12 unmount drops the source subscriptions of its component', store.subscriberCount, 0);
	store.setState(1);
	await settle();
	store.setState(2);
	await settle();
	check('B12 a component effect stops with its component', runs, afterMount.runs);
	check('B12 a component computed stops with its component', computes, afterMount.computes);
	check('B12 no detached node is still driven by the store', orphanNode === null, true);
	check('B12 neither writes into the removed DOM', target.childNodes.length, 0);
	check('B12 the destroyed component left the lifecycle registry', Jetz.liveLifecycles, 0);
}

{
	// The other half of the contract, unchanged: a reactive resource created
	// outside any owner - in test code, in a module, in a callback that outlives
	// the tree - has no teardown to run, so its source keeps it alive until an
	// explicit disposer or the source itself goes away.
	const store = stateOf(0);
	let computes = 0;
	const orphan = computed(() => { computes++; return store.value + 1; });
	const target = mount(div(p(orphan)));
	const afterMount = computes;
	unmount(target);
	store.setState(2);
	check('B13 an unowned computed is still read on demand', orphan.value, 3);
	assertTrue('B13 known retention path for unowned resources', computes > afterMount,
		`${afterMount} compute(s) at unmount, ${computes} after a later write: nothing owns this computed, so the source keeps it. ` +
		'That is the documented boundary - create it in a component or a loop() row, or keep the source short-lived.');
	check('B13 the detached DOM is not written by an unowned computed', target.childNodes.length, 0);
}

{
	// The shallow row path (`rowOf`) keeps ONE version signal per record, so a
	// removed row must stop bumping it, and its proxy must not stay bound.
	const counts = { runs: 0 };
	const items = Array.from({ length: size(200) }, (_, i) => rowOf({ id: i, label: `h${i}` }));
	const list = listOf(...items);
	const target = mount(div(loop(list, item => item.id, item => {
		effect(() => { counts.runs++; item.label; });
		return div({ 'data-id': item.id }, span(item.id));
	})));
	await settle();
	list.clear();
	await settle();
	const frozen = counts.runs;
	for (const item of items) item.label = 'mutated after clear';
	await settle();
	check('B11 shallow row effects release with their view', counts.runs, frozen);
	check('B11 shallow rows leave no DOM', document.querySelectorAll('[data-id]').length, 0);
	unmount(target);
}

// ===========================================================================
// Shared workload for the heap sections. One builder, same shape every cycle,
// so samples are comparable. It returns its handles; the caller nulls them,
// which is what makes the graph unreachable — the harness keeps no registry of
// its own.
// ===========================================================================
function buildWorkload(rows) {
	const counters = { builds: 0, destroys: 0, effectRuns: 0, computeRuns: 0, updates: 0 };
	const items = [];
	for (let i = 0; i < rows; i++) items.push(stateOf({ id: i, label: `row ${i}`, n: i }));
	const list = listOf(...items);

	const Nested = (item) => {
		counters.builds++;
		onDestroy(() => counters.destroys++);
		return span(computed(() => `${item.label.value}:${item.n.value}`));
	};
	const Row = (item) => {
		// the disposer `effect()` returns is deliberately not kept anywhere: a
		// harness that holds its own teardown handles hides exactly the leaks
		// this section looks for, so release is left to the reconciler alone
		effect(() => {
			counters.effectRuns++;
			item.label.value;
			item.n.value;
		});
		return div(
			{ 'data-id': item.id, ...css`row ${() => (item.n.value % 2 ? 'odd' : 'even')}` },
			// the four binding shapes: static text, reactive text, reactive class,
			// reactive style, plus a nested component with its own lifecycle
			span(`row ${item.id}`),
			computed(() => { counters.computeRuns++; return `${item.label.value}/${item.n.value}`; }),
			style`padding: ${() => (item.n.value % 4)}px`,
			() => Nested(item)
		);
	};
	const target = mount(div(p('workload'), loop(list, item => item.id, Row)));
	return { counters, items, list, target };
}

/** Real reactive traffic: `passes` batched writes over every row, then a reorder. */
function updateWorkload(work, passes) {
	for (let pass = 0; pass < passes; pass++) {
		batch(() => {
			for (const item of work.items) item.n.setState(item.n.getValue() + 1);
		});
	}
	work.list.set([...work.items].reverse());
	work.counters.updates += passes;
}

/** Tears the workload down through the public API, then drops every handle. */
function disposeWorkload(work) {
	unmount(work.target);
	work.list.clear();
	// the live object, not a copy: onDestroy still drains on the next sweep, and
	// the caller reads these counts after settle()
	return work.counters;
}

// ===========================================================================
// C. Heap cycles in this process: gc -> baseline -> build -> update -> dispose
//    -> release refs -> gc -> measure, repeated over equivalent workloads.
// ===========================================================================
section('C. heap memory across equivalent cycles');

if (!hasGC) {
	skip('C heap cycles', 'run with `pnpm test:memory` (node --expose-gc) to force collection');
} else {
	const rows = size(400);
	const passes = 5;
	const residuals = [];
	const peaks = [];
	const deltas = [];
	let finalCounters = null;

	row('cycle  before(MiB)   peak(MiB)   after(MiB)   after-before   counters');
	for (let cycle = 1; cycle <= CYCLES; cycle++) {
		collect();
		const before = heapMiB();
		let peak = before;

		let work = buildWorkload(rows);
		await settle();
		peak = Math.max(peak, heapMiB());
		updateWorkload(work, passes);
		await settle();
		peak = Math.max(peak, heapMiB());
		finalCounters = disposeWorkload(work);
		await settle();
		work = null;                     // the only remaining path to the graph

		collect();
		await tick();                    // let queued teardown/microtasks land
		collect();
		const after = heapMiB();
		residuals.push(after);
		peaks.push(peak);
		deltas.push(after - before);
		row(`${String(cycle).padStart(5)}  ${before.toFixed(2).padStart(11)}  ${peak.toFixed(2).padStart(11)}  ${after.toFixed(2).padStart(11)}  ${(after - before).toFixed(2).padStart(13)}   builds=${finalCounters.builds} destroys=${finalCounters.destroys} effectRuns=${finalCounters.effectRuns}${cycle <= WARM_UP_CYCLES ? '  [warm-up]' : ''}`);
	}

	check('C every nested view built was destroyed once', finalCounters.destroys, rows);
	check('C update passes ran on the final cycle', finalCounters.updates, passes);
	assertTrue('C effects re-ran during updates', finalCounters.effectRuns > rows,
		`${finalCounters.effectRuns} runs over ${rows} rows`);
	assertTrue('C computeds re-ran during updates', finalCounters.computeRuns > rows,
		`${finalCounters.computeRuns} computes over ${rows} rows`);

	const verdict = growthVerdict(residuals, GROWTH_LIMIT_MIB);
	metric('heap after dispose', `${residuals.map(value => value.toFixed(2)).join(', ')} MiB`);
	metric('peak during workload', `${peaks.map(value => value.toFixed(2)).join(', ')} MiB`);
	metric('after-before per cycle', `${deltas.map(value => value.toFixed(2)).join(', ')} MiB`);
	if (verdict.verdict === 'inconclusive') {
		skip('C growth rule', `only ${verdict.steps} stabilized cycles — raise JETZ_MEM_CYCLES above ${WARM_UP_CYCLES + 2}`);
	} else {
		metric(`stabilized growth (cycle ${WARM_UP_CYCLES + 1} -> ${CYCLES})`,
			`${verdict.growth.toFixed(2)} MiB, ${verdict.increases}/${verdict.steps} steps up, spread ${verdict.spread.toFixed(2)} MiB`);
		assertTrue(`C no sustained heap growth beyond ${GROWTH_LIMIT_MIB} MiB`,
			verdict.verdict !== 'sustained growth',
			`verdict ${verdict.verdict}: ${verdict.growth.toFixed(2)} MiB, budget ${GROWTH_LIMIT_MIB} MiB`);
	}
	metric('rule', 'a cycle above baseline is not a failure; only monotonic drift across equivalent cycles is');
	unmountAll();
}

// ===========================================================================
// D. WeakRef / FinalizationRegistry — best-effort reachability evidence.
// ===========================================================================
section('D. reachability observation (best effort)');

if (!hasGC || typeof WeakRef !== 'function' || typeof FinalizationRegistry !== 'function') {
	skip('D reachability observation', 'needs node --expose-gc plus WeakRef and FinalizationRegistry');
} else {
	const finalized = [];
	const registry = new FinalizationRegistry(tag => finalized.push(tag));

	/**
	 * Bounded poll: forced collections until the handle empties, then give up.
	 *
	 * The churn first, then the macrotask: V8 leaves the slot that held the most
	 * recent allocation populated until something else is written there, so a
	 * graph released in the same frame reads as "still reachable" for no reason
	 * at all (verified with a bare `{id:1}` object literal). Allocating over it
	 * and yielding to a task boundary is what makes the observation meaningful —
	 * this is a setup step, not a sleep used as proof.
	 */
	let churn = null;
	async function waitForCollection(ref, budgetMs) {
		await tick();
		for (let i = 0; i < 60000; i++) churn = { i };
		await tick();
		const deadline = Date.now() + budgetMs;
		while (Date.now() < deadline) {
			if (ref.deref() === undefined) return true;
			collect();
			await tick();
		}
		return ref.deref() === undefined;
	}
	const report = (name, collected, waitedMs, detail) => {
		if (collected) observe(name, true, `unreachable after ${waitedMs.toFixed(0)} ms of forced major collections`);
		else observe(name, false, `still reachable after ${waitedMs.toFixed(0)} ms: INCONCLUSIVE, not proof of a leak. ` +
			`V8 may keep a WeakRef target in a register, a shadow stack or an internal cache, and jsdom holds its own wrapper map for nodes. ${detail}`);
	};

	// D1 — pure reactivity, no lifecycle components, no FinalizationRegistry:
	// the cleanest possible "everything was dropped" shape.
	async function pureGraph() {
		const source = stateOf(0);
		const derived = Array.from({ length: 50 }, (_, i) => computed(() => source.value + i));
		const items = Array.from({ length: 20 }, (_, i) => stateOf({ id: i, label: `w${i}` }));
		const list = listOf(...items);
		const target = mount(div(p(source), loop(list, item => item.id, item =>
			div({ 'data-id': item.id }, span(item.label), span(computed(() => item.label.value)))
		)));
		await settle();
		unmount(target);
		list.clear();
		await settle();
		return { ref: new WeakRef(derived[7]), listRef: new WeakRef(list) };
	}
	const started1 = Date.now();
	const pure = await pureGraph();
	const pureCollected = await waitForCollection(pure.ref, GC_TIMEOUT_MS);
	report('D1 detached computed', pureCollected, Date.now() - started1,
		'The deterministic release checks (B1-B12) already prove the subscriptions are gone; this only corroborates them.');
	metric('D1 list handle', pure.listRef.deref() === undefined ? 'unreachable' : 'still reachable (inconclusive)');

	// D2 — the same shape plus a FinalizationRegistry, to observe callbacks and a
	// component-bearing graph. Registration itself can lengthen liveness, so this
	// is reported separately from D1.
	async function componentGraph() {
		// a floor of 20 rows keeps the registered row and the probed row distinct
		// at every scale, so a FinalizationRegistry hold cannot explain D2 away
		const work = buildWorkload(Math.max(20, size(40)));
		await settle();
		registry.register(work.items[0], 'row-0');
		registry.register(work.list, 'list');
		updateWorkload(work, 2);
		await settle();
		disposeWorkload(work);
		await settle();
		const ref = new WeakRef(work.items[work.items.length - 1]);
		// shadow every handle the workload object exposed
		work.items.length = 0;
		work.list.clear();
		return ref;
	}
	const started2 = Date.now();
	const componentRef = await componentGraph();
	const componentCollected = await waitForCollection(componentRef, GC_TIMEOUT_MS);
	report('D2 detached row state (registry armed)', componentCollected, Date.now() - started2,
		'A FinalizationRegistry registration is itself a source of liveness in some engines, which is why D1 runs without one.');
	for (let i = 0; i < 4; i++) await tick();   // finalizers queue after collection
	observe('D FinalizationRegistry', finalized.length > 0,
		`${finalized.length} of 2 finalizer(s) ran — a finalizer is a hint, not a contract, and no assertion depends on it`);
	unmountAll();
}

// ===========================================================================
// E. Long-running reactivity: many cheap create/update/dispose rounds.
// ===========================================================================
section('E. long-running create / update / dispose');

{
	const rows = size(80);
	const updatesPerRound = 25;
	const counts = { builds: 0, destroys: 0, mounts: 0, runs: 0 };
	const residuals = [];
	let staleRecompute = 0;
	let retainedContainers = 0;

	const Widget = (item) => {
		counts.builds++;
		onMount(() => counts.mounts++);
		onDestroy(() => counts.destroys++);
		return span(computed(() => item.label.value));
	};

	for (let round = 1; round <= LONG_CYCLES; round++) {
		const items = Array.from({ length: rows }, (_, i) => stateOf({ id: `${round}-${i}`, label: `r${round}i${i}`, n: i }));
		const list = listOf(...items);
		const target = mount(div(loop(list, item => item.id, item => {
			effect(() => { counts.runs++; item.n.value; });
			// `item.id` and `item.label` are bound as an attribute and a text
			// child, so each row state gains a container that teardown must drop
			return div({ 'data-id': item.id }, span(item.label), () => Widget(item));
		})));
		await settle();
		for (let pass = 0; pass < updatesPerRound; pass++) {
			items[pass % rows].n.setState(pass);
		}
		list.set([...items].reverse());
		await settle();
		unmount(target);
		list.clear();
		await settle();

		// A released view must stop reacting: mutate every row of this round and
		// check the run counter cannot move. Deterministic, needs no GC.
		const frozen = counts.runs;
		for (const item of items) item.n.setState(-1);
		await settle();
		if (counts.runs !== frozen) staleRecompute = round;

		// Public observer registry: a row that is gone must hold no DOM container
		// on any of its states.
		retainedContainers += items.reduce((sum, item) =>
			sum + item.label.container.length + item.n.container.length + item.id.container.length, 0);

		collect();
		residuals.push(heapMiB());
		if (round === 1 || round % 10 === 0 || round === LONG_CYCLES) {
			metric(`E round ${round}`, `builds=${counts.builds} destroys=${counts.destroys} runs=${counts.runs} heap=${heapMiB().toFixed(2)} MiB`);
		}
	}

	check(`E every built view was destroyed (${LONG_CYCLES} rounds x ${rows})`, counts.destroys, counts.builds);
	check(`E onDestroy fired exactly once per component`, counts.destroys, counts.builds);
	check(`E onMount fired for every mounted view`, counts.mounts, counts.builds);
	check('E no released view kept a DOM container bound to its state', retainedContainers, 0);
	check('E no round left a recomputing detached row', staleRecompute, 0);
	check('E the strong static remount registry is empty at the end', Jetz.remountByAttr.length, 0);
	check('E nothing left mounted', document.body.children.length, 0);

	const verdict = growthVerdict(residuals, GROWTH_LIMIT_MIB);
	metric('E heap per round', `${residuals[0].toFixed(2)} -> ${residuals[residuals.length - 1].toFixed(2)} MiB, spread ${verdict.spread?.toFixed(2) ?? 'n/a'} MiB`);
	if (verdict.verdict === 'inconclusive') {
		skip('E growth rule', `not enough stabilized rounds (${verdict.steps})`);
	} else {
		assertTrue(`E no unexplained heap growth over ${LONG_CYCLES} rounds`,
			verdict.verdict !== 'sustained growth',
			`verdict ${verdict.verdict}: ${verdict.growth.toFixed(2)} MiB, budget ${GROWTH_LIMIT_MIB} MiB, ${verdict.increases}/${verdict.steps} steps up`);
	}
	unmountAll();
}

// ===========================================================================
// F. Component churn against a surviving store — the shape that used to retain.
//    Pages are built from components, they read application-level state that
//    outlives them, and they are mounted and discarded over and over. Every
//    round must leave the store exactly as it found it: no subscriber of a
//    destroyed component, no lifecycle context in the sweep registry, no DOM.
// ===========================================================================
section('F. component churn against a surviving store');

{
	const rounds = Math.max(30, LONG_CYCLES);
	const widgets = size(20);
	const store = stateOf(0);              // application state: outlives every page
	const counts = { builds: 0, mounts: 0, destroys: 0, effectRuns: 0, computeRuns: 0 };
	const residuals = [];
	let reactingAfterRelease = 0;
	let subscribersAfterRelease = 0;
	let lifecyclesAfterRelease = 0;

	const Card = (item) => {
		counts.builds++;
		onMount(() => counts.mounts++);
		onDestroy(() => counts.destroys++);
		effect(() => { counts.effectRuns++; item.label.value; store.value; });
		return div({ 'data-widget': item.id }, span(computed(() => { counts.computeRuns++; return `${item.label.value}@${store.value}`; })));
	};
	// A page reads the surviving store twice: once through an effect of its own,
	// once through each widget it renders. Both are the component's resources.
	const Page = () => {
		const items = Array.from({ length: widgets }, (_, i) => stateOf({ id: `${roundTag}-${i}`, label: `w${roundTag}-${i}` }));
		const list = listOf(...items);
		effect(() => { counts.effectRuns++; store.value; });
		return div(p(computed(() => { counts.computeRuns++; return `store ${store.value}`; })),
			loop(list, item => item.id, item => div({ 'data-row': item.id }, () => Card(item))));
	};

	let roundTag = 'r0';
	for (let round = 1; round <= rounds; round++) {
		roundTag = `r${round}`;
		const before = { subscribers: store.subscriberCount, lifecycles: Jetz.liveLifecycles };
		const target = mount(div(() => Page()));
		await settle();
		// reactive traffic through the surviving source and through each widget
		store.setState(round);
		await settle();
		unmount(target);
		await settle();

		const frozen = counts.effectRuns;
		store.setState(rounds + round);       // the store outlives the page: nothing may react
		await settle();
		if (counts.effectRuns !== frozen) reactingAfterRelease = round;
		if (store.subscriberCount > before.subscribers) subscribersAfterRelease = round;
		if (Jetz.liveLifecycles > before.lifecycles) lifecyclesAfterRelease = round;

		collect();
		residuals.push(heapMiB());
		if (round === 1 || round % 10 === 0 || round === rounds) {
			metric(`F round ${round}`, `builds=${counts.builds} destroys=${counts.destroys} store subscribers=${store.subscriberCount} live lifecycles=${Jetz.liveLifecycles} heap=${heapMiB().toFixed(2)} MiB`);
		}
	}

	const totalBuilds = counts.builds;
	check(`F every widget built was destroyed once (${rounds} rounds x ${widgets})`, counts.destroys, totalBuilds);
	check('F onMount fired for every mounted widget', counts.mounts, totalBuilds);
	check('F the surviving store keeps no subscriber of a destroyed page', store.subscriberCount, 0);
	check('F the lifecycle registry is empty after the churn', Jetz.liveLifecycles, 0);
	check('F no round left a destroyed page reacting to the store', reactingAfterRelease, 0);
	check('F no round left subscribers behind', subscribersAfterRelease, 0);
	check('F no round left a lifecycle context behind', lifecyclesAfterRelease, 0);
	check('F nothing left mounted', document.body.children.length, 0);
	assertTrue('F the churn really computed and ran effects', counts.computeRuns > rounds && counts.effectRuns > rounds,
		`${counts.effectRuns} effect runs, ${counts.computeRuns} computes over ${rounds} rounds`);

	const verdict = growthVerdict(residuals, GROWTH_LIMIT_MIB);
	metric('F heap per round', `${residuals[0].toFixed(2)} -> ${residuals[residuals.length - 1].toFixed(2)} MiB, spread ${verdict.spread?.toFixed(2) ?? 'n/a'} MiB`);
	if (verdict.verdict === 'inconclusive') {
		skip('F growth rule', `not enough stabilized rounds (${verdict.steps})`);
	} else {
		assertTrue(`F no unexplained heap growth over ${rounds} page rounds`,
			verdict.verdict !== 'sustained growth',
			`verdict ${verdict.verdict}: ${verdict.growth.toFixed(2)} MiB, budget ${GROWTH_LIMIT_MIB} MiB, ${verdict.increases}/${verdict.steps} steps up`);
	}
	unmountAll();
}

// --- report ----------------------------------------------------------------
section('summary');
check('harness registered no lifecycle hook outside a component render', droppedHooks.length, 0);
metric('duration', `${((Date.now() - startedAt) / 1000).toFixed(1)} s`);
metric('heap at exit', `${heapMiB().toFixed(2)} MiB`);

console.log(lines.join('\n'));
const passed = lines.filter(line => line.startsWith('PASS ::')).length;
const skipped = lines.filter(line => line.startsWith('SKIP ::')).length;
console.log(`\n${passed} passed, ${failures} failed${skipped ? `, ${skipped} skipped` : ''}`);
console.log(failures === 0 ? 'ALL PASS' : 'FAILED');
process.exit(failures === 0 ? 0 : 1);
