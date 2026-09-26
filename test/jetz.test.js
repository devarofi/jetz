import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	Component, Dispatcher, Jetz, JetzElement, Raw, State,
	_else, _elseif, _if, _show, addScript, createElement, createList, flatMap,
	html, ifElse, listen, listOf, loop, onCreate, onDestroy, onMount, onUpdate,
	range, rememberOf, sequenceOf, stateOf
} from '../src/lib/jetz.js';
import { div, span, p, ul, li } from '../src/lib/jetz-ui.js';

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
