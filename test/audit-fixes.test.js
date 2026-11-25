/**
 * Regression tests for the audit fixes (see AUDIT.md, findings #1-#16).
 * Every test names the finding it locks down.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	Jetz, Component, ListState, batch, computed, effect, ifElse, listOf, loop,
	onDestroy, onMount, onUpdate, stateOf,
} from '../packages/jetz/src/jetz.js';
import { css, div, span } from '../packages/jetz/src/jetz-ui.js';
import { Router, route } from '../packages/jetz/src/jetz-router.js';

const mount = (element) => {
	const target = document.createElement('div');
	document.body.append(target);
	Jetz.mount(element, target);
	return target;
};

beforeEach(() => {
	document.body.innerHTML = '';
	Jetz.remountByAttr.length = 0;
	window.history.replaceState('', '', '/');
});

afterEach(() => {
	Jetz.errorHandler = null;
});

describe('#1/#12 remembered lists: stable subscriptions and row identity', () => {
	it('re-setting the same rows does not accumulate subscriptions', () => {
		const rows = [stateOf(1), stateOf(2)];
		const list = listOf().asRemember('audit-1');
		list.set(rows);
		const before = rows.map(row => row.subscriberCount);
		for (let i = 0; i < 50; i++) list.set(rows);
		expect(rows.map(row => row.subscriberCount)).toEqual(before);
	});

	it('nested states are subscribed once per list', () => {
		const row = stateOf({ a: 1 });
		const list = listOf().asRemember('audit-1b');
		for (let i = 0; i < 20; i++) list.set([row]);
		// exactly one persist subscription after 20 set() calls
		expect(row.a.subscriberCount).toBe(1);
	});

	it('transform(identity) keeps row identity', () => {
		const list = listOf().asRemember('audit-1c');
		list.set([{ a: 1 }]);
		const row = list.values[0];
		list.transform(item => item);
		expect(list.values[0]).toBe(row);
	});
});

describe('#2 onUpdate re-entrancy', () => {
	it('an onUpdate hook that writes state cannot recurse to a stack overflow', () => {
		let updates = 0;
		function Child() {
			const n = stateOf(0);
			onUpdate(() => {
				updates++;
				if (updates > 1000) throw new Error('RUNAWAY');
				n.value = n.value + 1;
			});
			return div(n);
		}
		expect(() => {
			mount(() => div(Child));
			const driver = stateOf(0);
			driver.value = 1;
			driver.value = 2;
		}).not.toThrow();
		expect(updates).toBeGreaterThanOrEqual(1);
		expect(updates).toBeLessThan(50);
	});
});

describe('#3 subscriber error isolation', () => {
	it('a throwing subscriber does not freeze later subscribers (computed)', () => {
		const errors = [];
		Jetz.errorHandler = error => errors.push(error);
		const s = stateOf('x');
		s.subscribe(() => { throw new Error('bad subscriber'); });
		const c = computed(() => s.value + '!');
		s.value = 'y';
		expect(c.value).toBe('y!');
		expect(errors.length).toBeGreaterThan(0);
	});
});

describe('#4 duplicate keys never drop rows', () => {
	it('a duplicate key in a keyed list degrades to classic rendering (no row lost)', () => {
		const warnings = [];
		const originalWarn = console.warn;
		console.warn = (...args) => warnings.push(args.join(' '));
		let host;
		try {
			const items = listOf({ id: 1, t: 'a' }, { id: 1, t: 'b' });
			host = mount(div(loop(items, item => item.id, item => div(item.t))));
			items.push({ id: 1, t: 'c' });
			items.set(items.values.slice());
		} finally {
			console.warn = originalWarn;
		}
		expect(host.firstElementChild.children.length).toBe(3);
		expect(host.textContent).toBe('abc');
		expect(warnings.some(line => line.includes('keys must be unique'))).toBe(true);
	});
});

describe('#5 large lists', () => {
	it('150k items sync without a stack overflow', () => {
		const big = new Array(150000).fill(0).map((_, i) => i);
		const list = ListState.fromArray(big);
		expect(list.size).toBe(150000);
		expect(() => list.set(big.slice().reverse())).not.toThrow();
		expect(list.at(0)).toBe(149999);
		expect(list.size).toBe(150000);
	});
});

describe('#6 lifecycle inside ifElse branches', () => {
	it('function component hooks fire and onDestroy runs on branch swap', () => {
		const calls = [];
		function Child() {
			onMount(() => calls.push('mount'));
			onDestroy(() => calls.push('destroy'));
			return div('child');
		}
		const show = stateOf(true);
		const target = mount(div(ifElse(() => show.value, () => Child, () => null)));
		expect(calls).toContain('mount');
		show.value = false;
		expect(calls).toContain('destroy');
		expect(target.textContent).not.toContain('child');
	});

	it('class component hooks fire inside a branch', () => {
		const calls = [];
		class Child extends Component {
			onCreate() { calls.push('create'); }
			onMount() { calls.push('mount'); }
			onDestroy() { calls.push('destroy'); }
			render() { return div('class child'); }
		}
		const show = stateOf(true);
		mount(div(ifElse(() => show.value, () => new Child(), () => null)));
		expect(calls).toContain('create');
		expect(calls).toContain('mount');
		show.value = false;
		expect(calls).toContain('destroy');
	});
});

describe('#7 root component lifecycle via Jetz.mount', () => {
	it('function root gets onMount/onDestroy', () => {
		const calls = [];
		function App() {
			onMount(() => calls.push('mount'));
			onDestroy(() => calls.push('destroy'));
			return div('app');
		}
		const target = mount(App);
		expect(calls).toEqual(['mount']);
		Jetz.unmount(target);
		expect(calls).toEqual(['mount', 'destroy']);
	});

	it('class root mounts without throwing and gets hooks', () => {
		const calls = [];
		class App extends Component {
			onMount() { calls.push('mount'); }
			render() { return div('app'); }
		}
		const target = mount(App);
		expect(calls).toEqual(['mount']);
		Jetz.unmount(target);
	});
});

describe('#8 router: repeated navigation to the same URL', () => {
	it('to() with new params resolves again', () => {
		const seen = [];
		const router = new Router(
			route('/', () => { seen.push('home'); return div('home'); }),
			route('/users', params => { seen.push(params); return div('users'); }),
		);
		Jetz.use(router);
		try {
			router.to('/users', { page: 1 });
			router.to('/users', { page: 2 });
			expect(seen).toEqual(['home', { page: 1 }, { page: 2 }]);
		} finally {
			router.destroy();
		}
	});
});

describe('#9 list mutations re-evaluate conditionals', () => {
	it('set() updates ifElse even when the version signal was never read', () => {
		const list = listOf(1, 2);
		const show = stateOf(false);
		const host = mount(div(
			ifElse(() => list.size > 1, () => div('big'), () => div('small')),
			span(show)
		));
		expect(host.textContent).toContain('big');
		list.set([1]);
		expect(host.textContent).toContain('small');
		expect(host.textContent).not.toContain('big');
	});
});

describe('#10 stateOf custom handler', () => {
	it('get maps reads and set runs on writes', () => {
		const setCalls = [];
		const s = stateOf(5, {
			get: value => value * 10,
			set: value => { setCalls.push(value); },
		});
		expect(s.value).toBe(50);
		s.value = 7;
		expect(setCalls).toEqual([7]);
		expect(s.getValue()).toBe(7);
		expect(s.value).toBe(70);
	});
});

describe('#11 css class parts rebind', () => {
	it('shifting parts do not accumulate subscriptions', () => {
		const s1 = stateOf('a');
		const s2 = stateOf('b');
		const el = div(css(s1), css(s2));
		el.render();
		const before = s1.subscriberCount + s2.subscriberCount;
		el.addAttr('class', [s2, s1]);
		el.addAttr('class', [s1, s2]);
		el.addAttr('class', [s2, s1]);
		expect(s1.subscriberCount + s2.subscriberCount).toBe(before);
	});
});

describe('#13 RememberState persistence', () => {
	it('writes do not re-read the storage blob', () => {
		const list = listOf().asRemember('audit-13');
		const getItem = vi.spyOn(Storage.prototype, 'getItem');
		try {
			list.set([stateOf(1)]);
			list.set([stateOf(2)]);
			expect(getItem).not.toHaveBeenCalled();
			expect(list.values.map(v => v.getValue())).toEqual([2]);
		} finally {
			getItem.mockRestore();
		}
	});
});

describe('#14 router destroy', () => {
	it('destroy() detaches the window listeners', () => {
		let renders = 0;
		const router = new Router(
			route('/', () => { renders++; return div('home'); }),
			route('/other', () => { renders++; return div('other'); }),
		);
		Jetz.use(router);
		const afterInstall = renders;
		router.destroy();
		window.dispatchEvent(new PopStateEvent('popstate'));
		window.dispatchEvent(new HashChangeEvent('hashchange'));
		expect(renders).toBe(afterInstall);
	});
});

describe('#15 batch flush cycle guard', () => {
	it('a self-writing effect inside batch() terminates and is reported', () => {
		const errors = [];
		Jetz.errorHandler = error => errors.push(error);
		const n = stateOf(0);
		let dispose;
		expect(() => {
			batch(() => {
				dispose = effect(() => {
					const current = n.value;
					n.setState(current + 1);
				});
			});
		}).not.toThrow();
		dispose();
		expect(errors.some(error => String(error.message).includes('batch flush exceeded'))).toBe(true);
	});
});

describe('#16 remove() is a real teardown', () => {
	it('remove() releases bindings and the remount registry', () => {
		const s = stateOf('x');
		const cond = stateOf(true);
		const el = div(css(s), div({ if: () => cond.value }, 'inner'));
		el.render();
		expect(s.subscriberCount).toBe(1);
		expect(Jetz.remountByAttr.length).toBe(1);
		el.remove();
		expect(s.subscriberCount).toBe(0);
		expect(Jetz.remountByAttr.length).toBe(0);
	});

	it('hidden _if branches keep their bindings (unchanged contract)', () => {
		const s = stateOf('x');
		const cond = stateOf(true);
		const host = mount(div(div({ if: () => cond.value }, s)));
		expect(s.container.length).toBe(1);
		cond.value = false;
		expect(s.container.length).toBe(1);
		cond.value = true;
		expect(s.container.length).toBe(1);
		expect(host.textContent).toBe('x');
	});
});

describe('hardening: list-valued URL attributes', () => {
	it('a hostile scheme in a srcset entry is blocked', () => {
		const originalWarn = console.warn;
		console.warn = () => { };
		try {
			const hostile = div({ srcset: 'ok.png 1x, javascript:alert(1) 2x' });
			hostile.render();
			expect(hostile.o.getAttribute('srcset')).toBe('about:blank#blocked');

			const safe = div({ srcset: 'a.png 1x, b.png 2x' });
			safe.render();
			expect(safe.o.getAttribute('srcset')).toBe('a.png 1x, b.png 2x');
		} finally {
			console.warn = originalWarn;
		}
	});
});
