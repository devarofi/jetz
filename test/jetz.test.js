import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	Component, Dispatcher, Jetz, JetzElement, Raw, State,
	_else, _elseif, _if, _show, addScript, batch, computed, createElement, createList, effect, flatMap,
	html, ifElse, listen, listOf, loop, onCreate, onDestroy, onMount, onUpdate,
	range, rememberOf, sequenceOf, stateOf
} from '../src/lib/jetz.js';
import { aria_, base, body, css, data_, div, head, htmlElement, link, meta, search, slot, span, p, ul, li, a, button, href, style, styleElement, title } from '../src/lib/jetz-ui.js';
import * as ui from '../src/lib/jetz-ui.js';
import { Router, group, route } from '../src/lib/jetz-router.js';
import { Middleware } from '../src/lib/middleware.js';

const mount = (element) => {
	const target = document.createElement('div');
	document.body.append(target);
	Jetz.mount(element, target);
	return target;
};

beforeEach(() => {
	document.body.innerHTML = '';
	localStorage.clear();
});

describe('render', () => {
	it('renders an element into the mount target', () => {
		const target = mount(div('Hello'));
		expect(target.textContent).toBe('Hello');
	});
	it('composes nested elements and arrays', () => {
		const target = mount(div([span('a'), span('b')], p('c')));
		expect(target.querySelectorAll('span').length).toBe(2);
		expect(target.querySelector('p').textContent).toBe('c');
	});
});

describe('HTML document elements', () => {
	it('provides factories for document and metadata tags', () => {
		const elements = [htmlElement(), head(), body(), title(), base(), link(), meta(), styleElement(), search(), slot()];
		expect(elements.map(element => element.tagName)).toEqual([
			'html', 'head', 'body', 'title', 'base', 'link', 'meta', 'style', 'search', 'slot'
		]);
	});
});

describe('typed input factories', () => {
	it('creates every standard input type and preserves other attributes', () => {
		const inputs = [
			[ui.inputButton, 'button'], [ui.inputCheckbox, 'checkbox'], [ui.inputColor, 'color'],
			[ui.inputDate, 'date'], [ui.inputDateTimeLocal, 'datetime-local'], [ui.inputEmail, 'email'],
			[ui.inputFile, 'file'], [ui.inputHidden, 'hidden'], [ui.inputImage, 'image'],
			[ui.inputMonth, 'month'], [ui.inputNumber, 'number'], [ui.inputPassword, 'password'],
			[ui.inputRadio, 'radio'], [ui.inputRange, 'range'], [ui.inputReset, 'reset'],
			[ui.inputSearch, 'search'], [ui.inputSubmit, 'submit'], [ui.inputTel, 'tel'],
			[ui.inputText, 'text'], [ui.inputTime, 'time'], [ui.inputUrl, 'url'], [ui.inputWeek, 'week']
		];
		const target = mount(div(inputs.map(([factory]) => factory({ type: 'text', name: 'field' }))));
		const rendered = [...target.querySelectorAll('input')];

		expect(rendered.map(element => element.type)).toEqual(inputs.map(([, type]) => type));
		expect(rendered.every(element => element.name === 'field')).toBe(true);
	});
});

describe('checkbox state binding', () => {
	it('synchronizes checked state in both directions', () => {
		const done = stateOf(false);
		const target = mount(ui.inputCheckbox({ bind: done }));
		const checkbox = target.querySelector('input');

		expect(checkbox.checked).toBe(false);
		checkbox.checked = true;
		checkbox.dispatchEvent(new Event('change', { bubbles: true }));
		expect(done.value).toBe(true);
		done.value = false;
		expect(checkbox.checked).toBe(false);
		done.value = true;
		expect(checkbox.checked).toBe(true);

		const genericDone = stateOf(false);
		const genericTarget = mount(ui.input(ui.type('checkbox'), { bind: genericDone }));
		const genericCheckbox = genericTarget.querySelector('input');
		genericCheckbox.checked = true;
		genericCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
		expect(genericDone.value).toBe(true);
	});
});

describe('route head metadata', () => {
	it('sets metadata on navigation and replaces only prior route metadata', () => {
		window.history.replaceState({}, '', '/');
		const router = new Router(
			route('/', {
				component: () => div('Home'),
				head: () => [title('Home'), meta({ name: 'description', content: 'Home page' })]
			}),
			route('/about', {
				component: () => div('About'),
				head: () => [
					title('About Jetz'),
					meta({ name: 'description', content: 'Learn about the Jetz framework.' })
				]
			})
		);
		router.install(Jetz);

		expect(document.title).toBe('Home');
		expect(document.head.querySelector('meta[name="description"]').content).toBe('Home page');
		router.to('/about');
		expect(document.title).toBe('About Jetz');
		expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
		expect(document.head.querySelector('meta[name="description"]').content)
			.toBe('Learn about the Jetz framework.');
		router.to('/');
		expect(document.title).toBe('Home');
		expect(document.head.querySelector('meta[name="description"]').content).toBe('Home page');
		document.head.querySelector('meta[name="description"]')?.remove();
		document.title = '';
	});

	it('keeps the legacy positional route signature', () => {
		const component = () => div('legacy');
		const definition = route('/legacy', component);
		expect(definition.component).toBe(component);
		expect(definition.middlewares).toEqual([]);
	});
});

describe('dynamic route paths', () => {
	it('extracts named path segments and passes them to the component', () => {
		window.history.replaceState({}, '', '/');
		let receivedParams;
		const router = new Router(
			route('/', () => div('Home')),
			route('/order/:orderId/message', {
				component: params => {
					receivedParams = params;
					return div(`Order ${params.orderId}`);
				}
			})
		);
		router.install(Jetz);
		router.to('/order/A%2012/message');
		expect(receivedParams).toEqual({ orderId: 'A 12' });
	});

	it('prefers an exact static route over a dynamic match', () => {
		window.history.replaceState({}, '', '/');
		let selectedRoute;
		const router = new Router(
			route('/', () => div('Home')),
			route('/products/:productId', {
				component: () => {
					selectedRoute = 'dynamic';
					return div('Product');
				}
			}),
			route('/products/new', {
				component: () => {
					selectedRoute = 'static';
					return div('New product');
				}
			})
		);
		router.install(Jetz);
		router.to('/products/new');
		expect(selectedRoute).toBe('static');
	});
});

describe('nested route groups', () => {
	it('joins prefixes and runs inherited middleware before child middleware', () => {
		window.history.replaceState({}, '', '/');
		const calls = [];
		let receivedParams;
		class AuthGuard extends Middleware {
			next(params) {
				calls.push(['auth', params?.id]);
				return true;
			}
		}
		class AdminGuard extends Middleware {
			next(params) {
				calls.push(['admin', params?.id]);
				return true;
			}
		}
		class RoleGuard extends Middleware {
			next(params) {
				calls.push(['role', params?.id]);
				return true;
			}
		}
		const router = new Router([
			route('/', () => div('Home')),
			group('/admin', {
				middlewares: AuthGuard,
				routes: [
					route('/', () => {
						receivedParams = 'dashboard';
						return div('Dashboard');
					}),
					group('/users', {
						middlewares: [AdminGuard, RoleGuard],
						routes: [
							route('/', () => {
								receivedParams = 'users';
								return div('Users');
							}),
							route('/:id', params => {
								receivedParams = params;
								return div(`User ${params.id}`);
							})
						]
					})
				]
			})
		]);
		router.install(Jetz);
		router.to('/admin/users/42');
		expect(receivedParams).toEqual({ id: '42' });
		expect(calls).toEqual([['auth', '42'], ['admin', '42'], ['role', '42']]);
		calls.length = 0;
		router.to('/admin');
		expect(receivedParams).toBe('dashboard');
		expect(calls).toEqual([['auth', undefined]]);
		calls.length = 0;
		router.to('/admin/users');
		expect(receivedParams).toBe('users');
		expect(calls).toEqual([['auth', undefined], ['admin', undefined], ['role', undefined]]);
	});
});

describe('stateOf', () => {
	it('binds a state to a child and updates the DOM', () => {
		const count = stateOf(0);
		mount(div('Count : ', count));
		expect(document.body.textContent).toContain('Count : 0');
		count.setState(5);
		expect(document.body.textContent).toContain('Count : 5');
	});
	it('notifies subscribers with new and old values', () => {
		const seen = [];
		const s = stateOf('a').subscribe((nv, ov) => seen.push([nv, ov]));
		s.setState('b');
		expect(seen).toEqual([['b', 'a']]);
	});
	it('unsubscribe stops notifications', () => {
		const fn = vi.fn();
		const s = stateOf(1).subscribe(fn);
		s.unsubscribe(fn);
		s.setState(2);
		expect(fn).not.toHaveBeenCalled();
	});
	it('accepts null, which typeof reports as an object', () => {
		// stateOf used to treat null as a plain object and throw while trying to
		// attach toObject, so any `cond ? 'x' : null` state crashed on creation
		const s = stateOf(null);
		expect(s.getValue()).toBeNull();
		s.value = 'now set';
		expect(s.getValue()).toBe('now set');
	});
	it('accepts false and other falsy primitives', () => {
		expect(stateOf(false).getValue()).toBe(false);
		expect(stateOf(0).getValue()).toBe(0);
		expect(stateOf('').getValue()).toBe('');
		expect(stateOf(undefined).getValue()).toBeUndefined();
	});
});

describe('batch', () => {
	it('coalesces nested state notifications, computed values, effects, and DOM updates', () => {
		const first = stateOf(1);
		const second = stateOf(2);
		const total = computed(() => first.value + second.value);
		const seen = [];
		const effectRuns = [];
		first.subscribe((next, previous) => seen.push([next, previous]));
		total.subscribe(value => seen.push(value));
		const dispose = effect(() => effectRuns.push(`${first.value}:${second.value}`));
		const target = mount(div(first, ':', second, ':', total));
		effectRuns.length = 0;

		const result = batch(() => {
			first.value = 3;
			batch(() => {
				second.value = 4;
				first.value = 5;
			});
			return 'done';
		});

		expect(result).toBe('done');
		expect(first.value).toBe(5);
		expect(total.value).toBe(9);
		expect(seen).toEqual([[5, 1], 9]);
		expect(effectRuns).toEqual(['5:4']);
		expect(target.textContent).toBe('5:4:9');
		dispose();
	});
	it('flushes changes even when the callback throws', () => {
		const value = stateOf(0);
		const seen = [];
		value.subscribe((next, previous) => seen.push([next, previous]));

		expect(() => batch(() => {
			value.value = 1;
			throw new Error('batch failed');
		})).toThrow('batch failed');
		expect(value.value).toBe(1);
		expect(seen).toEqual([[1, 0]]);
	});
});

describe('reactive css classes', () => {
	it('updates a class when a callback interpolation reads state', () => {
		const task = stateOf({ done: false, title: 'Review the API' });
		const target = mount(li(
			css`task-number ${() => task.done.value ? 'completed' : ''}`,
			task.title
		));
		const item = target.querySelector('li');

		expect(item.className).toBe('task-number');
		task.done.value = true;
		expect(item.className).toBe('task-number completed');
		task.done.value = false;
		expect(item.className).toBe('task-number');
		expect(item.textContent).toBe('Review the API');
	});

	it('swaps a whole class from a plain function argument', () => {
		const count = stateOf(0);
		const target = mount(div(css(() => count.value % 2 === 0 ? 'text-red-200' : 'text-green-200')));
		const box = target.querySelector('div');

		expect(box.className).toBe('text-red-200');
		count.value = 1;
		expect(box.className).toBe('text-green-200');
		count.value = 2;
		expect(box.className).toBe('text-red-200');
	});

	it('drops the class entirely when a function yields null', () => {
		const ready = stateOf(false);
		const target = mount(div(css(() => ready.value ? 'is-ready' : null)));
		const box = target.querySelector('div');

		expect(box.hasAttribute('class')).toBe(false);
		ready.value = true;
		expect(box.className).toBe('is-ready');
		ready.value = false;
		expect(box.hasAttribute('class')).toBe(false);
	});

	it('treats a falsy interpolation as absent, not as the text "false"', () => {
		// cssValue used to end with `?? ''`, which only drops nullish values, so
		// a falsy branch was concatenated into the literal class "false"
		const done = stateOf(false);
		const target = mount(div(css`task ${() => done.value ? 'completed' : false}`));
		const box = target.querySelector('div');

		expect(box.className).toBe('task');
		done.value = true;
		expect(box.className).toBe('task completed');
		done.value = false;
		expect(box.className).toBe('task');
		expect(box.classList.contains('false')).toBe(false);
	});

	it('ignores falsy values from a plain css() call', () => {
		// classList stringifies its input, so these would otherwise land as
		// classes literally named "false" and "null"
		const target = mount(div(css('card'), css(false), css(null)));
		const box = target.querySelector('div');

		expect(box.className).toBe('card');
	});

	it('keeps a static class reactive when merged with a function class', () => {
		const active = stateOf(true);
		const target = mount(div(css('p-2 base'), css(() => active.value ? 'is-active' : 'is-idle')));
		const box = target.querySelector('div');

		// mergeObject folds both sources into one array, so the static part has
		// to survive every recomposition of the reactive one
		expect(box.classList.contains('base')).toBe(true);
		expect(box.classList.contains('p-2')).toBe(true);
		expect(box.classList.contains('is-active')).toBe(true);
		active.value = false;
		expect(box.classList.contains('base')).toBe(true);
		expect(box.classList.contains('is-idle')).toBe(true);
		expect(box.classList.contains('is-active')).toBe(false);
	});

	it('updates each reactive part when several css() calls are merged', () => {
		const a = stateOf(1);
		const b = stateOf(2);
		const c = stateOf(3);
		const target = mount(div(
			css(() => `a-${a.value}`),
			css(() => `b-${b.value}`),
			css(() => `c-${c.value}`)
		));
		const box = target.querySelector('div');

		expect(box.classList.contains('a-1')).toBe(true);
		expect(box.classList.contains('b-2')).toBe(true);
		expect(box.classList.contains('c-3')).toBe(true);

		a.value = 9;
		b.value = 8;
		expect(box.classList.contains('a-9')).toBe(true);
		expect(box.classList.contains('a-1')).toBe(false);
		expect(box.classList.contains('b-8')).toBe(true);
		expect(box.classList.contains('c-3')).toBe(true);
	});

	it('reacts to a function passed straight to the class attribute', () => {
		const parity = stateOf(0);
		const target = mount(div({ class: () => parity.value % 2 ? 'odd' : 'even' }));
		const box = target.querySelector('div');

		expect(box.className).toBe('even');
		parity.value = 1;
		expect(box.className).toBe('odd');
	});

	it('accepts className as an alias for the class attribute', () => {
		const target = mount(div({ className: 'card wide' }, 'x'));
		const box = target.querySelector('div');

		expect(box.className).toBe('card wide');
		expect(box.hasAttribute('classname')).toBe(false);
	});

	it('reacts to a function passed through className', () => {
		const count = stateOf(0);
		const target = mount(div({ className: () => count.value % 2 ? 'text-red-200' : 'text-green-200' }));
		const box = target.querySelector('div');

		expect(box.className).toBe('text-green-200');
		count.value = 1;
		expect(box.className).toBe('text-red-200');
		count.value = 2;
		expect(box.className).toBe('text-green-200');
	});

	it('folds className together with css() instead of replacing it', () => {
		const ready = stateOf(false);
		const target = mount(div(css`preview-card`, { className: () => ready.value ? 'is-ready' : 'idle' }));
		const box = target.querySelector('div');

		// the alias is resolved before merging, so both sources share the class
		// key and recompose as one attribute rather than clobbering each other
		expect(box.classList.contains('preview-card')).toBe(true);
		expect(box.classList.contains('idle')).toBe(true);
		ready.value = true;
		expect(box.classList.contains('preview-card')).toBe(true);
		expect(box.classList.contains('is-ready')).toBe(true);
		expect(box.classList.contains('idle')).toBe(false);
	});

	it('matches the alias regardless of capitalisation', () => {
		const target = mount(div({ classname: 'lower' }, 'x'));
		expect(target.querySelector('div').className).toBe('lower');
	});

	it('resolves the alias for attributes added after mount', () => {
		const target = mount(div('x'));
		const box = new JetzElement('div');
		box.o = target.querySelector('div');
		box.addAttr('className', 'late');

		expect(target.querySelector('div').className).toBe('late');
	});

	it('only rewrites listed aliases, leaving other keys alone', () => {
		// camelCase names that carry meaning (SVG's viewBox, preserveAspectRatio)
		// must survive untouched, so the alias table cannot lowercase everything
		const target = mount(div({ preserveAspectRatio: 'none' }, 'x'));
		const box = target.querySelector('div');

		expect(box.className).toBe('');
		expect(box.getAttribute('preserveaspectratio')).toBe('none');
	});

});

describe('reactive attributes', () => {
	it('updates state-backed helper, prefixed, and callback attributes', () => {
		const path = stateOf('/start');
		const label = stateOf('Initial label');
		const status = stateOf('open');
		const title = stateOf('Initial title');
		const busy = stateOf(false);
		const target = mount(a(
			href(() => path.value),
			aria_({ label, busy }),
			data_({ status }),
			{ title: () => title.value },
			'link'
		));
		const link = target.querySelector('a');

		expect(link.getAttribute('href')).toBe('/start');
		expect(link.getAttribute('aria-label')).toBe('Initial label');
		expect(link.getAttribute('aria-busy')).toBe('false');
		expect(link.getAttribute('data-status')).toBe('open');
		expect(link.getAttribute('title')).toBe('Initial title');

		path.value = '/next';
		label.value = 'Updated label';
		busy.value = true;
		status.value = 'done';
		title.value = 'Updated title';
		expect(link.getAttribute('href')).toBe('/next');
		expect(link.getAttribute('aria-label')).toBe('Updated label');
		expect(link.getAttribute('aria-busy')).toBe('true');
		expect(link.getAttribute('data-status')).toBe('done');
		expect(link.getAttribute('title')).toBe('Updated title');
	});

	it('updates style properties from callback dependencies', () => {
		const color = stateOf('red');
		const target = mount(div(style({ color: () => color.value })));
		const box = target.querySelector('div');

		expect(box.style.color).toBe('red');
		color.value = 'blue';
		expect(box.style.color).toBe('blue');
	});

	it('adds and removes boolean attributes when their state changes', () => {
		const disabled = stateOf(false);
		const target = mount(button({ disabled }, 'Save'));
		const saveButton = target.querySelector('button');

		expect(saveButton.disabled).toBe(false);
		expect(saveButton.hasAttribute('disabled')).toBe(false);
		disabled.value = true;
		expect(saveButton.disabled).toBe(true);
		expect(saveButton.hasAttribute('disabled')).toBe(true);
		disabled.value = false;
		expect(saveButton.disabled).toBe(false);
		expect(saveButton.hasAttribute('disabled')).toBe(false);
	});
});

describe('data_ and aria_ underscore keys', () => {
	it('writes a data_ key as a hyphenated attribute and stays reactive', () => {
		const counter = stateOf(0);
		const target = mount(p(css`counter-${counter}`, { data_counter: counter }, 'Counter:', counter));
		const paragraph = target.querySelector('p');

		// the object-literal spelling must land on the attribute dataset reads,
		// not on a junk `data_counter` attribute that CSS and dataset both miss
		expect(paragraph.getAttribute('data-counter')).toBe('0');
		expect(paragraph.dataset.counter).toBe('0');
		expect(paragraph.hasAttribute('data_counter')).toBe(false);

		counter.value = 3;
		expect(paragraph.getAttribute('data-counter')).toBe('3');
		expect(paragraph.dataset.counter).toBe('3');
	});

	it('separates every segment of a multi-word key', () => {
		const target = mount(div({ data_row_index: 2 }));
		const box = target.querySelector('div');

		expect(box.getAttribute('data-row-index')).toBe('2');
		expect(box.dataset.rowIndex).toBe('2');
	});

	it('writes an aria_ key as a hyphenated attribute', () => {
		const described = stateOf('summary');
		const target = mount(div({ aria_labelledby: described, aria_live: 'polite' }, 'x'));
		const box = target.querySelector('div');

		expect(box.getAttribute('aria-labelledby')).toBe('summary');
		expect(box.getAttribute('aria-live')).toBe('polite');

		described.value = 'details';
		expect(box.getAttribute('aria-labelledby')).toBe('details');
	});

	it('keeps callback values reactive through the underscore spelling', () => {
		const visible = stateOf(false);
		const target = mount(div({ data_toggle: () => (visible.value ? 'Shown' : 'Hidden') }));
		const box = target.querySelector('div');

		expect(box.getAttribute('data-toggle')).toBe('Hidden');
		visible.value = true;
		expect(box.getAttribute('data-toggle')).toBe('Shown');
	});

	it('reaches the same attribute as the data_ helper', () => {
		const target = mount(div({ data_status: 'raw' }, 'x'));
		const helper = mount(div(data_({ status: 'helper' }), 'x'));

		// both spellings must name the same attribute, which is what makes them
		// interchangeable rather than two look-alikes that miss each other
		expect(target.querySelector('div').getAttributeNames())
			.toEqual(helper.querySelector('div').getAttributeNames());
		expect(target.querySelector('div').getAttribute('data-status')).toBe('raw');
		expect(helper.querySelector('div').getAttribute('data-status')).toBe('helper');
	});

	it('leaves every other underscore key exactly as written', () => {
		// only the data/aria prefixes carry a hyphenated meaning, so guessing on
		// other keys would rewrite custom attributes the author actually wants
		const target = mount(div({ source_map: 'a', my_data: 'b', x_: 'c', _data: 'd' }, 'x'));
		const box = target.querySelector('div');

		expect(box.getAttribute('source_map')).toBe('a');
		expect(box.getAttribute('my_data')).toBe('b');
		expect(box.getAttribute('x_')).toBe('c');
		expect(box.getAttribute('_data')).toBe('d');
		expect(box.getAttributeNames()).toEqual(['source_map', 'my_data', 'x_', '_data']);
	});
});

describe('listOf / ListState', () => {
	it('renders one view per value via loop()', () => {
		const items = listOf('a', 'b');
		mount(ul(loop(items, item => li(item))));
		expect(document.querySelectorAll('ul > li').length).toBe(2);
	});
	it('keeps multi-node render output as siblings, without a carrier element', () => {
		// regression: a render fn returning an array used to be wrapped in a
		// <span> carrier, so the DOM no longer matched the render function
		const items = listOf('a', 'b');
		mount(ul(loop(items, item => [li(`t-${item}`), li(`b-${item}`)])));
		expect(document.querySelectorAll('ul > li').length).toBe(4);
		expect(document.querySelectorAll('ul > span').length).toBe(0);
		expect([...document.querySelectorAll('ul > li')].map(el => el.textContent))
			.toEqual(['t-a', 'b-a', 't-b', 'b-b']);
	});
	it('renders multi-node output for remembered lists the same way', () => {
		const items = listOf('a').asRemember('unit.multi-node');
		mount(ul(loop(items, item => [li(`t-${item}`), li(`b-${item}`)])));
		expect(document.querySelectorAll('ul > span').length).toBe(0);
		expect([...document.querySelectorAll('ul > li')].map(el => el.textContent)).toEqual(['t-a', 'b-a']);
	});
	it('still uses a carrier element for plain (non element) values', () => {
		mount(ul(loop(listOf('a', 'b'))));
		expect(document.querySelectorAll('ul > span').length).toBe(2);
	});
	it('list.map() is a derived snapshot: it renders but never updates', () => {
		// map() returns a plain array, so the list's views are never wired up
		const items = listOf('a', 'b');
		const mapped = items.map(item => li(item));
		expect(Array.isArray(mapped)).toBe(true);
		expect(mapped instanceof listOf('x').constructor).toBe(false);
		const target = mount(ul(mapped));
		expect([...target.querySelectorAll('li')].map(el => el.textContent)).toEqual(['a', 'b']);
		items.push('c');
		expect(target.querySelectorAll('li').length).toBe(2);
		expect(items.size).toBe(3);
	});
	it('a bare list child uses the carrier element and stays reactive', () => {
		const items = listOf('a', 'b');
		const target = mount(ul(items));
		expect([...target.querySelectorAll('span')].map(el => el.textContent)).toEqual(['a', 'b']);
		items.push('c');
		expect([...target.querySelectorAll('span')].map(el => el.textContent)).toEqual(['a', 'b', 'c']);
	});
	it('loop() applies the render function and stays reactive', () => {
		const items = listOf('a', 'b');
		const target = mount(ul(loop(items, item => li(item))));
		expect([...target.querySelectorAll('li')].map(el => el.textContent)).toEqual(['a', 'b']);
		items.push('c');
		expect([...target.querySelectorAll('li')].map(el => el.textContent)).toEqual(['a', 'b', 'c']);
	});
	it('removes every node of a multi-node view', () => {
		const items = listOf('a', 'b');
		mount(ul(loop(items, item => [li(`t-${item}`), li(`b-${item}`)])));
		items.removeAt(0);
		expect([...document.querySelectorAll('ul > li')].map(el => el.textContent)).toEqual(['t-b', 'b-b']);
		items.remove('b');
		expect(document.querySelectorAll('li').length).toBe(0);
	});
	it('keyed reconciliation reorders multi-node views as a unit', () => {
		const items = listOf({ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 3, n: 'c' });
		mount(ul(loop(items, i => i.id, i => [li(`t-${i.n}`), li(`b-${i.n}`)])));
		items.set([{ id: 3, n: 'c' }, { id: 1, n: 'a' }, { id: 2, n: 'b' }]);
		expect([...document.querySelectorAll('ul > li')].map(el => el.textContent))
			.toEqual(['t-c', 'b-c', 't-a', 'b-a', 't-b', 'b-b']);
	});
	it('keyed set() replacing an item keeps multi-node output', () => {
		const items = listOf({ id: 1, n: 'one' }, { id: 2, n: 'two' });
		mount(ul(loop(items, i => i.id, i => [li(`t-${i.n}`), li(`b-${i.n}`)])));
		items.set([{ id: 1, n: 'ONE' }]);
		expect([...document.querySelectorAll('ul > li')].map(el => el.textContent)).toEqual(['t-ONE', 'b-ONE']);
	});
	it('push adds a view and set replaces all', () => {
		const items = listOf('a');
		mount(ul(loop(items, item => li(item))));
		items.push('b', 'c');
		expect(document.querySelectorAll('li').length).toBe(3);
		items.set(['x']);
		expect(document.querySelectorAll('li').length).toBe(1);
		expect(document.querySelector('li').textContent).toBe('x');
	});
	it('removeAt and insertAt update the views', () => {
		const items = listOf('a', 'b', 'c');
		mount(ul(loop(items, item => li(item))));
		items.removeAt(1);
		expect(document.querySelectorAll('li').length).toBe(2);
		expect(items[1]).toBe(items.values[1]);
		items.insertAt(0, 'z');
		expect(document.querySelector('li').textContent).toBe('z');
		expect([...items]).toEqual(items.values);
	});
	it('keeps backing array slots synchronized after replacement mutations', () => {
		const items = listOf('b', 'a');
		items.set(['c', 'a']);
		expect(items[0]).toBe('c');
		items.sort();
		expect([...items]).toEqual(['a', 'c']);
		items.transform(value => value.toUpperCase());
		expect([...items]).toEqual(['A', 'C']);
		items.replaceAt(0, 'first');
		items.updateAt(1, value => `${value}!`);
		expect([...items]).toEqual(items.values);
		expect([...items]).toEqual(['first', 'C!']);
	});
	it('refreshes a keyed view when replacing an item with the same key', () => {
		const items = listOf({ id: 1, title: 'before' });
		const target = mount(ul(loop(items, item => item.id, item => li(item.title))));

		items.replaceAt(0, { id: 1, title: 'after' });

		expect(target.textContent).toBe('after');
	});
	it('exposes helpers: at, first, last, filter, includes, size', () => {
		const items = listOf(1, 2, 3);
		expect(items.at(1)).toBe(2);
		expect(items.first()).toBe(1);
		expect(items.last()).toBe(3);
		expect(items.filter(n => n > 1)).toEqual([2, 3]);
		expect(items.includes(3)).toBe(true);
		expect(items.size).toBe(3);
	});
});

describe('view cleanup lifecycle', () => {
	it('disposes effects created inside a removed loop item', () => {
		const ticks = stateOf(0);
		const runs = [];
		const rows = listOf({ id: 1 }, { id: 2 });
		mount(ul(loop(rows, row => row.id, row => {
			effect(() => { runs.push(row.id); ticks.value; });
			return li(row.id);
		})));

		expect(runs).toEqual([1, 2]);
		rows.set([]);
		ticks.value = 5;
		// both item scopes were released: no effect re-ran after the list emptied
		expect(runs).toEqual([1, 2]);
		expect(rows.size).toBe(0);
	});
	it('unsubscribes attribute/state bindings of a removed keyed view', () => {
		const flag = stateOf('on');
		const items = listOf({ id: 1 }, { id: 2 });
		mount(ul(loop(items, i => i.id, i => li({ 'data-flag': flag }))));
		expect(document.querySelectorAll('li[data-flag="on"]').length).toBe(2);

		items.removeAt(0);
		flag.setState('off');
		// the removed row must not have been updated by the state any more
		expect(document.querySelectorAll('ul > li').length).toBe(1);
		expect(document.querySelector('li').getAttribute('data-flag')).toBe('off');
	});
	it('drops the text-node container of a removed view', () => {
		const label = stateOf('hello');
		const items = listOf('a');
		mount(ul(loop(items, item => li(label))));
		const before = label.container.length;

		items.removeAt(0);
		expect(label.container.length).toBeLessThan(before);
	});
	it('detaches the click handler of a removed view', () => {
		const hits = vi.fn();
		const items = listOf('a');
		mount(ul(loop(items, item => li(item, { onclick: hits }))));
		const row = document.querySelector('ul > li');
		row.click();
		expect(hits).toHaveBeenCalledTimes(1);

		items.removeAt(0);
		// the detached node keeps no listener: calling it must not reach the handler
		row.click();
		expect(hits).toHaveBeenCalledTimes(1);
	});
	it('keeps surviving rows reactive when a sibling is removed', () => {
		const count = stateOf(0);
		const items = listOf(1, 2);
		const target = mount(ul(loop(items, id => li(id, {
			onclick: () => { count.value = id; }
		}))));
		const rows = [...target.querySelectorAll('li')];

		rows[0].click();
		expect(count.value).toBe(1);
		items.removeAt(0);
		rows[1].click();
		expect(count.value).toBe(2);
		expect([...target.querySelectorAll('li')].map(el => el.textContent)).toEqual(['2']);
	});
	it('releases bindings of a subtree dropped by empty()', () => {
		const flag = stateOf('on');
		const box = div(span({ 'data-flag': flag }));
		const target = mount(box);
		expect(target.querySelector('span').getAttribute('data-flag')).toBe('on');

		box.empty();
		flag.setState('off');
		expect(target.querySelector('span')).toBe(null);
	});
	it('releases bindings on Jetz.unmount()', () => {
		const flag = stateOf('on');
		const label = stateOf('hi');
		const target = mount(div(span(label, { 'data-flag': flag })));
		const detached = target.querySelector('span');
		const before = label.container.length;

		Jetz.unmount(target);
		expect(label.container.length).toBeLessThan(before);
		// the detached node keeps no live binding either
		flag.setState('off');
		label.setState('bye');
		expect(detached.getAttribute('data-flag')).toBe('on');
		expect(detached.textContent).toBe('hi');
	});
	it('leaves bindings alone for elements rendered outside a loop', () => {
		const flag = stateOf('on');
		const target = mount(div(span({ 'data-flag': flag })));
		flag.setState('off');
		expect(target.querySelector('span').getAttribute('data-flag')).toBe('off');
	});
	it('disposeBindings() is idempotent', () => {
		const box = div(span('x'));
		mount(box);
		expect(() => { box.disposeBindings(); box.disposeBindings(); }).not.toThrow();
	});
});

describe('sequenceOf', () => {
	it('keeps duplicate values as distinct items and still supports push', () => {
		const seq = sequenceOf('a', 'a', 'b');
		expect(seq.size).toBe(3);
		expect(seq.values[0]).not.toBe(seq.values[1]);
		expect(() => seq.push('c')).not.toThrow();
		expect(seq.size).toBe(4);
	});
});

describe('rememberOf', () => {
	it('persists values in localStorage', () => {
		const n = rememberOf(7);
		n.setState(8);
		const stored = JSON.parse(localStorage.getItem('app-remember-state'));
		expect(JSON.stringify(stored)).toContain('8');
	});
	it('restores keyed lists independently of creation order', () => {
		const original = rememberOf('unit.keyed-list', []);
		original.push('saved');

		rememberOf('unit.intervening-state', 1);
		const restored = rememberOf('unit.keyed-list', []);
		expect(restored.values).toEqual(['saved']);
	});
});

describe('remembered list object states', () => {
	it('hydrates nested object properties and persists their changes', () => {
		const original = listOf({ id: 1, details: { title: 'Before' } }).asRemember('unit.object-list');
		const originalTask = original.values[0];

		expect(originalTask.id).toBeInstanceOf(State);
		expect(originalTask.details.title).toBeInstanceOf(State);
		originalTask.details.title.value = 'After';
		original.push({ id: 2, details: { title: 'Added' } });
		expect(original.values[1].details.title).toBeInstanceOf(State);
		original.replaceAt(1, { id: 2, details: { title: 'Replaced' } });

		const restored = listOf({ id: 0, details: { title: 'Default' } }).asRemember('unit.object-list');
		const restoredTask = restored.values[0];
		expect(restoredTask.id).toBeInstanceOf(State);
		expect(restoredTask.details.title).toBeInstanceOf(State);
		expect(restoredTask.details.title.value).toBe('After');
		expect(restored.values[1].details.title.value).toBe('Replaced');
		expect(restored[1]).toBe(restored.values[1]);
	});
});

describe('conditional element (_if/_elseif/_else)', () => {
	it('selects the matching branch', () => {
		const state = stateOf(1);
		const target = mount(div(
			div('one', _if(() => state.value === 1)),
			div('two', _elseif(() => state.value === 2)),
			div('other', _else)
		));
		const text = () => target.textContent;
		expect(text()).toContain('one');
		state.setState(2);
		expect(text()).toContain('two');
		state.setState(3);
		expect(text()).toContain('other');
	});
	it('_show is an alias of _if', () => {
		const state = stateOf(false);
		const target = mount(div(div('shown', _show(() => state.value))));
		expect(target.textContent).not.toContain('shown');
		state.setState(true);
		expect(target.textContent).toContain('shown');
	});
});

describe('ifElse', () => {
	it('swaps branches when the state changes', () => {
		const isShow = stateOf(true);
		const target = mount(div(
			ifElse(
				() => isShow.value,
				() => div('Im true'),
				() => 'Im false'
			)
		));
		expect(target.textContent).toContain('Im true');
		isShow.setState(false);
		expect(target.textContent).toContain('Im false');
		isShow.setState(true);
		expect(target.textContent).toContain('Im true');
	});
	it('works without an else branch', () => {
		const isShow = stateOf(false);
		const target = mount(div(ifElse(() => isShow.value, () => 'yes')));
		expect(target.textContent).not.toContain('yes');
		isShow.setState(true);
		expect(target.textContent).toContain('yes');
	});
});

describe('listen', () => {
	it('runs the listener on render and on every state change', () => {
		const count = stateOf(0);
		const target = mount(div('base ', listen(parent => parent.text(`base ${count.value}`))));
		expect(target.textContent).toContain('base 0');
		count.setState(1);
		expect(target.textContent).toContain('base 1');
	});
});
describe('component lifecycle', () => {
	it('class component: create, mount then destroy when detached', () => {
		const steps = [];
		class Card extends Component {
			render() { return div('card'); }
			onCreate() { steps.push('create'); }
			onMount() { steps.push('mount'); }
			onDestroy() { steps.push('destroy'); }
		}
		const target = mount(div(new Card()));
		expect(steps).toEqual(['create', 'mount']);
		target.querySelector('div > div').remove();
		stateOf(1).setState(2); // sweep fires onDestroy for detached nodes
		expect(steps).toEqual(['create', 'mount', 'destroy']);
	});
	it('function component hooks fire', () => {
		const steps = [];
		function Widget() {
			onCreate(() => steps.push('create'));
			onMount(() => steps.push('mount'));
			return div('widget');
		}
		mount(div(Widget));
		expect(steps).toEqual(['create', 'mount']);
	});
	it('function onMount runs only once the element is attached to the document', () => {
		// regression: the hook used to run while the tree was still detached, so
		// DOM lookups inside onMount resolved to null (stuck editors/canvases)
		let foundDuringMount = null;
		function Widget() {
			onMount(() => {
				foundDuringMount = document.getElementById('lifecycle-widget') !== null;
			});
			return div({ id: 'lifecycle-widget' }, 'widget');
		}
		mount(div(Widget));
		expect(foundDuringMount).toBe(true);
	});
	it('onUpdate fires on state change while mounted', () => {
		const steps = [];
		class Live extends Component {
			render() { return div('live'); }
			onUpdate() { steps.push('update'); }
		}
		mount(div(new Live()));
		expect(steps).toEqual([]);
		stateOf(0).setState(1);
		expect(steps).toEqual(['update']);
	});
});

describe('utilities', () => {
	it('range, createList, flatMap, loop', () => {
		expect(range(1, 3)).toEqual([1, 2, 3]);
		expect(createList(3, i => i * 2)).toEqual([0, 2, 4]);
		expect(flatMap([1, [2, [3]]])).toEqual([1, 2, 3]);
		expect(loop([1, 2], n => n * 10)).toEqual([10, 20]);
	});
	it('html() creates Raw content', () => {
		const target = mount(div(html('<b>bold</b>')));
		expect(target.querySelector('b')?.textContent).toBe('bold');
		expect(html('<i>x</i>').get()).toBe('<i>x</i>');
	});
	it('createElement builds a JetzElement', () => {
		const el = createElement('section', { id: 's1' }, 'body');
		expect(el).toBeInstanceOf(JetzElement);
		mount(el);
		expect(document.getElementById('s1').textContent).toBe('body');
	});
});

describe('Dispatcher', () => {
	it('dispatches an action to its handler', () => {
		let got = null;
		const d = new Dispatcher((action, value) => { got = [action, value]; });
		d.dispatch('save', 42);
		expect(got).toEqual(['save', 42]);
	});
});

describe('Jetz helpers', () => {
	it('unmount clears the target and reports a version', () => {
		const target = mount(div('app'));
		Jetz.unmount(target);
		expect(target.innerHTML).toBe('');
		expect(Jetz.version).toBeTruthy();
	});
	it('addScript appends a script element to the body', () => {
		addScript('/test.js', { defer: 'defer' });
		const script = document.body.querySelector('script[src="/test.js"]');
		expect(script).toBeTruthy();
		expect(script.defer).toBe(true);
	});
});
