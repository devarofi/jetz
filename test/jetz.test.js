import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	Component, Dispatcher, Jetz, JetzElement, Raw, State,
	_else, _elseif, _if, _show, addScript, createElement, createList, flatMap,
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

describe('listOf / ListState', () => {
	it('renders one view per value via loop()', () => {
		const items = listOf('a', 'b');
		mount(ul(loop(items, item => li(item))));
		expect(document.querySelectorAll('ul > li').length).toBe(2);
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
		items.insertAt(0, 'z');
		expect(document.querySelector('li').textContent).toBe('z');
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
