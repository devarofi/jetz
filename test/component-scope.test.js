/**
 * Ownership of reactive resources.
 *
 * `effect()` and `computed()` created while a component renders are resources of
 * that component, the same way its DOM nodes are. The contract these tests
 * protect:
 *  - when the component's view is dropped, its resources stop reacting to states
 *    that outlive it, and they leave those states' subscriber lists - so a
 *    long-lived store cannot keep a destroyed view alive through them;
 *  - a resource created outside any managed render has no owner, so it keeps
 *    living until its own disposer runs. That is documented behaviour, not a
 *    defect, and these tests pin it so the boundary cannot silently move;
 *  - releasing one owner must not disturb a neighbour: surviving rows keep their
 *    DOM nodes, their components and their reactivity.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
	Component, computed, effect, Jetz, listOf, loop, onDestroy, onMount, stateOf
} from '../packages/jetz/src/jetz.js';
import { div, p, span } from '../packages/jetz/src/jetz-ui.js';

const mount = (element) => {
	const target = document.createElement('div');
	document.body.append(target);
	Jetz.mount(element, target);
	return target;
};

const settle = async () => {
	Jetz.triggerByState();
	await Promise.resolve();
	await Promise.resolve();
};

const rows = (count, prefix = 'row') => Array.from({ length: count }, (_, i) =>
	stateOf({ id: `${prefix}-${i}`, label: `${prefix} ${i}`, n: i }));

beforeEach(() => {
	document.body.innerHTML = '';
});

describe('A. a component owns the effects it creates', () => {
	it('stops a function component effect and releases its subscriptions on unmount', async () => {
		const store = stateOf(0);
		let runs = 0;
		const Panel = () => {
			effect(() => { runs++; store.value; });
			return div(span('panel'));
		};

		const target = mount(div(() => Panel()));
		await settle();
		expect(runs).toBe(1);
		expect(store.subscriberCount).toBeGreaterThan(0);

		Jetz.unmount(target);
		await settle();
		expect(store.subscriberCount).toBe(0);

		store.setState(1);
		await settle();
		expect(runs).toBe(1);
	});

	it('stops a class component effect on unmount', async () => {
		const store = stateOf(0);
		let runs = 0;
		class Panel extends Component {
			render() { return div(span('panel')); }
			onCreate() { effect(() => { runs++; store.value; }); }
		}

		const target = mount(div(() => new Panel()));
		await settle();
		expect(runs).toBe(1);

		Jetz.unmount(target);
		await settle();
		expect(store.subscriberCount).toBe(0);
		store.setState(5);
		await settle();
		expect(runs).toBe(1);
	});

	it('never writes into the DOM of a released view', async () => {
		const store = stateOf(0);
		const Panel = () => {
			const node = span('idle');
			effect(() => {
				const at = store.value;
				if (node.o) node.o.textContent = `store ${at}`;
			});
			return div(node);
		};

		const target = mount(div(() => Panel()));
		await settle();
		store.setState(1);
		await settle();
		const cell = target.querySelector('span');
		expect(cell.textContent).toBe('store 1');   // while mounted the effect drives the node

		Jetz.unmount(target);
		await settle();
		store.setState(2);
		await settle();
		expect(cell.textContent).toBe('store 1');   // the closed-over node was never written again
		expect(cell.isConnected).toBe(false);
		expect(target.textContent).toBe('');
	});

	it('releases a nested component effect with the outer view', async () => {
		const store = stateOf(0);
		let runs = 0;
		const Inner = () => {
			effect(() => { runs++; store.value; });
			return span('inner');
		};
		const Outer = () => div(p(() => Inner()));

		const target = mount(div(() => Outer()));
		await settle();
		const afterMount = runs;
		Jetz.unmount(target);
		await settle();
		expect(store.subscriberCount).toBe(0);

		store.setState(3);
		await settle();
		expect(runs).toBe(afterMount);
	});

	it('keeps an unowned effect alive until its own disposer runs', async () => {
		const store = stateOf(0);
		let runs = 0;
		// created outside any render: nothing owns it, so it must keep working
		const dispose = effect(() => { runs++; store.value; });
		await settle();
		expect(store.subscriberCount).toBe(1);

		store.setState(1);
		await settle();
		expect(runs).toBe(2);

		dispose();
		expect(store.subscriberCount).toBe(0);
		store.setState(2);
		await settle();
		expect(runs).toBe(2);
	});
});

describe('B. a component owns the computeds it creates', () => {
	it('stops recomputing after its component is unmounted', async () => {
		const store = stateOf(0);
		let computes = 0;
		const Panel = () => {
			const label = computed(() => { computes++; return `count ${store.value}`; });
			return div(p(label));
		};

		const target = mount(div(() => Panel()));
		await settle();
		const afterMount = computes;
		Jetz.unmount(target);
		await settle();
		expect(store.subscriberCount).toBe(0);

		store.setState(7);
		await settle();
		expect(computes).toBe(afterMount);
	});

	it('keeps a computed created outside a managed render readable on demand', async () => {
		const store = stateOf(0);
		let computes = 0;
		const orphan = computed(() => { computes++; return store.value + 1; });
		const target = mount(div(p(orphan)));
		await settle();
		const afterMount = computes;

		Jetz.unmount(target);
		await settle();
		store.setState(2);
		await settle();
		// no owner, so no teardown: the source keeps it subscribed and correct.
		expect(orphan.value).toBe(3);
		expect(computes).toBeGreaterThan(afterMount);
	});

	it('leaves a surviving sibling computed subscribed', async () => {
		const store = stateOf(0);
		let gone = 0, alive = 0;
		const Dead = () => {
			effect(() => { gone++; store.value; });
			return span('dead');
		};
		const Live = () => {
			computed(() => { alive++; return store.value; });
			return span('live');
		};
		const target = document.createElement('div');
		document.body.append(target);
		Jetz.mount(div(() => Dead()), target);
		Jetz.mount(div(() => Live()), target);
		await settle();

		Jetz.unmount(target.firstElementChild);
		await settle();
		store.setState(1);
		await settle();
		expect(gone).toBe(1);
		expect(alive).toBeGreaterThan(1);
		expect(store.subscriberCount).toBeGreaterThan(0);
	});
});

describe('C. keyed row lifecycle', () => {
	/**
	 * A row is a `loop()` render: the effect it creates is owned by the row scope,
	 * and the component nested in it owns its own lifecycle. Both must go when the
	 * row goes, and neither may disturb the rows that stay.
	 */
	const keyedTable = (items) => {
		const store = stateOf(0);
		const list = listOf(...items);
		const counts = { builds: 0, destroys: 0, runs: 0 };
		const Label = (item) => {
			counts.builds++;
			onDestroy(() => counts.destroys++);
			return span(computed(() => item.label.value));
		};
		const target = mount(div(loop(list, item => item.id, (item) => {
			effect(() => { counts.runs++; store.value; item.n.value; });
			return div({ 'data-id': item.id }, () => Label(item));
		})));
		return { store, list, counts, body: target.querySelector('div'), target };
	};

	it('releases one row without disturbing its neighbours', async () => {
		const items = rows(5);
		const { store, list, counts, body } = keyedTable(items);
		await settle();
		const nodes = [...body.children];
		expect(store.subscriberCount).toBe(5);
		expect(counts.builds).toBe(5);

		list.remove(items[2]);
		await settle();
		expect(body.children.length).toBe(4);
		expect([...body.children]).toEqual([nodes[0], nodes[1], nodes[3], nodes[4]]);
		expect(counts.destroys).toBe(1);
		expect(store.subscriberCount).toBe(4);

		const runsAfterRemove = counts.runs;
		store.setState(1);
		await settle();
		// exactly the four survivors react - the released row cannot
		expect(counts.runs).toBe(runsAfterRemove + 4);

		// a survivor is still fully reactive, on its original DOM node
		items[3].label.setState('changed');
		await settle();
		expect(nodes[3].textContent).toBe('changed');
		expect(nodes[3].isConnected).toBe(true);
		expect(nodes[2].isConnected).toBe(false);

		const frozen = counts.runs;
		items[2].n.setState(99);       // the released row's own state changes
		await settle();
		expect(counts.runs).toBe(frozen);
	});

	it('survives repeated add, remove and reorder rounds', async () => {
		const items = rows(4, 'a');
		const { store, list, counts, body } = keyedTable(items);
		await settle();

		let size = 4;
		for (let round = 1; round <= 3; round++) {
			const extra = stateOf({ id: `b-${round}`, label: `added ${round}`, n: round });
			list.push(extra);
			await settle();
			expect(body.children.length, `round ${round} add`).toBe(size + 1);
			expect(store.subscriberCount, `round ${round} add`).toBe(size + 1);

			const before = [...body.children];
			list.set(list.values.slice().reverse());
			await settle();
			expect(body.children.length, `round ${round} reorder`).toBe(size + 1);
			// a reorder moves the same DOM nodes, it does not rebuild them
			expect([...body.children]).toEqual(before.reverse());
			expect(store.subscriberCount, `round ${round} reorder`).toBe(size + 1);

			list.remove(extra);
			list.remove(items[round]);
			await settle();
			size -= 1;
			expect(body.children.length, `round ${round} remove`).toBe(size);
			expect(store.subscriberCount, `round ${round} remove`).toBe(size);
		}

		const runsAtEnd = counts.runs;
		store.setState(9);
		await settle();
		expect(counts.runs).toBe(runsAtEnd + size);

		list.clear();
		await settle();
		expect(body.children.length).toBe(0);
		expect(store.subscriberCount).toBe(0);
		expect(counts.destroys).toBe(counts.builds);

		const frozen = counts.runs;
		store.setState(10);
		await settle();
		expect(counts.runs).toBe(frozen);
	});

	it('releases a component nested in a row when only that row goes', async () => {
		const store = stateOf(0);
		const items = rows(3, 'c');
		const list = listOf(...items);
		let nestedRuns = 0;
		const Badge = (item) => {
			effect(() => { nestedRuns++; store.value; });
			return span(computed(() => item.label.value));
		};
		const Row = (item) => div({ 'data-id': item.id }, () => Badge(item));

		const target = mount(div(loop(list, item => item.id, Row)));
		const body = target.querySelector('div');
		await settle();
		expect(store.subscriberCount).toBe(3);

		list.remove(items[1]);
		await settle();
		expect(store.subscriberCount).toBe(2);
		expect(body.children.length).toBe(2);

		const afterRemove = nestedRuns;
		store.setState(4);
		await settle();
		expect(nestedRuns).toBe(afterRemove + 2);
	});
});

describe('D. mount / unmount churn against a surviving store', () => {
	it('returns subscriber and lifecycle counts to baseline over 30 rounds', async () => {
		const store = stateOf(0);
		const counts = { builds: 0, mounts: 0, destroys: 0, runs: 0, computes: 0 };
		const Card = () => {
			counts.builds++;
			onMount(() => counts.mounts++);
			onDestroy(() => counts.destroys++);
			effect(() => { counts.runs++; store.value; });
			return span(computed(() => `card ${store.value}`));
		};
		const Page = () => {
			const list = listOf(...rows(3, 'd'));
			effect(() => { counts.computes++; store.value; });
			return div(p(computed(() => `page ${store.value}`)),
				loop(list, item => item.id, item => div({ 'data-row': item.id }, () => Card())));
		};

		for (let round = 1; round <= 30; round++) {
			const target = mount(div(() => Page()));
			await settle();
			store.setState(round);
			await settle();
			Jetz.unmount(target);
			await settle();
			target.remove();

			expect(store.subscriberCount, `round ${round} left subscribers`).toBe(0);
			expect(Jetz.liveLifecycles, `round ${round} left lifecycle contexts`).toBe(0);
			expect(document.body.children.length, `round ${round} left markup`).toBe(0);
		}

		expect(counts.builds).toBe(90);
		expect(counts.mounts).toBe(90);
		expect(counts.destroys).toBe(90);

		const frozen = { runs: counts.runs, computes: counts.computes };
		store.setState(99);
		await settle();
		expect(counts.runs).toBe(frozen.runs);
		expect(counts.computes).toBe(frozen.computes);
	});
});
