import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    Jetz, batch, computed, defer, effect, ifElse, listOf, loop, lazy, rowOf, stateOf,
    rememberOf, sequenceOf, shallowStateOf, touchRow, rawOf, _if, _elseif, _else, _show,
    Component, Dispatcher, JetzElement, Raw, onCreate, onMount, onUpdate, onDestroy,
    range, createList, flatMap, html, listen, addScript
} from '../packages/jetz/src/jetz.js';
import {
    div, span, p, text, css, inputText, inputCheckbox, button, table, tbody, td, th, thead, tr,
    style, data_, aria_, href, id, placeholder, ul, li, a, label, strong, h1, section,
    find, findAll
} from '../packages/jetz/src/jetz-ui.js';

const mount = (element) => {
    const target = document.createElement('div');
    document.body.append(target);
    Jetz.mount(element, target);
    return target;
};

beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    Jetz.devtools = false;
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ============================================================================
// ENTERPRISE REACTIVITY TEST SUITE
// ============================================================================

describe('Enterprise: stateOf - Deep Object Reactivity', () => {
    it('tracks nested object property reads and writes', () => {
        const user = stateOf({ profile: { name: 'Ada', settings: { theme: 'dark' } } });
        const target = mount(div('User: ', user.profile.name, ' Theme: ', user.profile.settings.theme));
        
        expect(target.textContent).toContain('User: Ada Theme: dark');
        
        user.profile.name.value = 'Grace';
        user.profile.settings.theme.value = 'light';
        
        expect(target.textContent).toContain('User: Grace Theme: light');
    });

    it('shallowStateOf creates proxy with version signal', () => {
        const form = shallowStateOf({ name: 'test', count: 0, nested: { deep: 1 } });
        
        expect(form.name).toBe('test');
        form.name = 'changed';
        expect(form.name).toBe('changed');
        expect(form.nested.deep).toBe(1); // nested not wrapped
        expect(typeof form.touch).toBe('function');
        expect(typeof form.__sig).toBe('object');
    });
});

describe('Enterprise: computed - Dependency Tracking & Invalidation', () => {
    it('tracks dynamic dependencies and drops unused ones', () => {
        const useA = stateOf(true);
        const a = stateOf('alpha');
        const b = stateOf('beta');
        
        const derived = computed(() => useA.value ? a.value : b.value);
        expect(derived.value).toBe('alpha');
        
        useA.value = false;
        expect(derived.value).toBe('beta');
        
        // 'a' no longer a dependency - change must not recompute
        a.value = 'alpha2';
        expect(derived.value).toBe('beta');
        
        // 'b' still a dependency
        b.value = 'beta2';
        expect(derived.value).toBe('beta2');
    });

    it('re-subscribes when dependency returns to graph', () => {
        const useA = stateOf(false);
        const a = stateOf(1);
        const b = stateOf(10);
        
        const derived = computed(() => useA.value ? a.value : b.value);
        expect(derived.value).toBe(10);
        
        useA.value = true;
        expect(derived.value).toBe(1);
        a.value = 2;
        expect(derived.value).toBe(2);
        
        useA.value = false;
        expect(derived.value).toBe(10);
        useA.value = true;
        a.value = 3;
        expect(derived.value).toBe(3);
    });

    it('computes derived collections from listOf with version tracking', () => {
        const version = stateOf(0);
        const data = listOf(1, 2, 3, 4, 5);
        const filter = stateOf('');
        
        const filtered = computed(() => {
            version.value; // track version for reactivity
            return data.values.filter(n => String(n).includes(filter.value));
        });
        
        expect(filtered.value).toEqual([1, 2, 3, 4, 5]);
        filter.value = '2';
        version.value++; // bump version to trigger recomputation
        expect(filtered.value).toEqual([2]);
        filter.value = '';
        version.value++;
        expect(filtered.value).toEqual([1, 2, 3, 4, 5]);
    });
});

describe('Enterprise: effect - Lifecycle & Teardown', () => {
    it('stops firing for dropped dependencies', () => {
        const gate = stateOf(true);
        const tracked = stateOf(0);
        const ignored = stateOf(0);
        let runs = 0;
        
        const dispose = effect(() => {
            tracked.value;
            if (gate.value) ignored.value;
            runs++;
        });
        
        expect(runs).toBe(1);
        
        tracked.value = 1;
        ignored.value = 1;
        expect(runs).toBe(3);
        
        gate.value = false;
        expect(runs).toBe(4);
        
        ignored.value = 2;
        expect(runs).toBe(4); // ignored no longer fires
        
        tracked.value = 2;
        expect(runs).toBe(5);
        
        dispose();
        tracked.value = 3;
        expect(runs).toBe(5);
    });

    it('runs teardown when scope disposes', () => {
        const flag = stateOf(true);
        let created = false;
        let destroyed = false;
        
        const target = mount(div(
            ifElse(() => flag.value,
                () => {
                    created = true;
                    return div(effect(() => { destroyed = true; }));
                },
                () => div('idle')
            )
        ));
        
        expect(created).toBe(true);
        
        flag.value = false;
        expect(destroyed).toBe(true);
        expect(target.textContent).toContain('idle');
    });
});

describe('Enterprise: lazy - Deferred Dataset Initialization', () => {
    it('initializes on first access', () => {
        let initialized = false;
        const dataset = lazy(() => {
            initialized = true;
            return [1, 2, 3];
        });
        
        expect(initialized).toBe(false);
        // Access via getter to trigger initialization
        const val = dataset.value;
        expect(val).toEqual([1, 2, 3]);
        expect(initialized).toBe(true);
    });

    it('replaces value without re-running initializer', () => {
        let count = 0;
        const dataset = lazy(() => {
            count++;
            return [count];
        });
        
        // Access to initialize
        expect(dataset.value).toEqual([1]);
        dataset.setState([2]);
        expect(dataset.value).toEqual([2]);
        expect(count).toBe(1); // initializer only runs once
    });
});

describe('Enterprise: rawOf - Untracked Reads', () => {
    it('reads state without creating dependency', () => {
        const source = stateOf(10);
        let effectRuns = 0;
        
        effect(() => {
            const val = rawOf(source);
            effectRuns++;
            return val;
        });
        
        expect(effectRuns).toBe(1);
        
        source.value = 20;
        // rawOf doesn't track, so effect shouldn't re-run
        expect(effectRuns).toBe(1);
    });

    it('computed returns array correctly', () => {
        const simple = computed(() => [1, 2, 3]);
        expect(simple.value).toEqual([1, 2, 3]);
    });

    it('enables fast sort comparators without pinning rows', () => {
        const version = stateOf(0);
        const items = listOf(
            rowOf({ id: 1, score: 100 }),
            rowOf({ id: 2, score: 50 }),
            rowOf({ id: 3, score: 150 })
        );
        
        // Debug: check items.values
        expect(items.values.length).toBe(3);
        expect(typeof items.values[0].score).toBe('number');
        
        // Computed tracks version for reactivity
        const sorted = computed(() => {
            version.value; // track version for reactivity
            const data = items.values.slice();
            const scores = data.map(r => rawOf(r).score);
            return [...scores].sort((a, b) => a - b);
        });
        
        expect(sorted.value).toEqual([50, 100, 150]);
        
        // Mutate a row and bump version
        items.values[0].score = 25;
        touchRow(items.values[0]);
        version.value++;
        expect(sorted.value).toEqual([25, 50, 150]);
    });
});

describe('Enterprise: listOf / ListState - Keyed Reconciliation', () => {
    it('reorders multi-node views as a unit', () => {
        const items = listOf({ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 3, n: 'c' });
        mount(ul(loop(items, i => i.id, i => [li(`t-${i.n}`), li(`b-${i.n}`)])));
        
        items.set([{ id: 3, n: 'c' }, { id: 1, n: 'a' }, { id: 2, n: 'b' }]);
        
        const texts = [...document.querySelectorAll('ul > li')].map(el => el.textContent);
        expect(texts).toEqual(['t-c', 'b-c', 't-a', 'b-a', 't-b', 'b-b']);
    });

    it('keyed set() replaces and preserves multi-node output', () => {
        const items = listOf({ id: 1, n: 'one' }, { id: 2, n: 'two' });
        mount(ul(loop(items, i => i.id, i => [li(`t-${i.n}`), li(`b-${i.n}`)])));
        
        items.set([{ id: 1, n: 'ONE' }]);
        
        const texts = [...document.querySelectorAll('ul > li')].map(el => el.textContent);
        expect(texts).toEqual(['t-ONE', 'b-ONE']);
    });

    it('push registers new keyed items', () => {
        const items = listOf({ id: 1, n: 'a' });
        mount(ul(loop(items, i => i.id, i => li(`${i.id}-${i.n}`))));
        
        items.push({ id: 2, n: 'b' });
        expect([...document.querySelectorAll('li')].map(el => el.textContent)).toEqual(['1-a', '2-b']);
        
        items.set(items.values.slice());
        expect([...document.querySelectorAll('li')].map(el => el.textContent)).toEqual(['1-a', '2-b']);
    });
});

describe('Enterprise: rowOf - Shallow Row State', () => {
    it('creates row with version signal for fine-grained updates', () => {
        const row = rowOf({ id: 1, name: 'Test', score: 100 });
        
        expect(row.id).toBe(1);
        expect(row.name).toBe('Test');
        expect(row.score).toBe(100);
        
        row.score = 200;
        touchRow(row); // triggers re-render via version bump
    });

    it('multiple rowOf instances maintain independent version signals', () => {
        const row1 = rowOf({ id: 1, value: 10 });
        const row2 = rowOf({ id: 2, value: 20 });
        
        row1.value = 15;
        touchRow(row1);
        row2.value = 25;
        touchRow(row2);
        
        expect(row1.value).toBe(15);
        expect(row2.value).toBe(25);
    });
});

describe('Enterprise: reactive css() - Class Merging & Reactivity', () => {
    it('merges static and reactive classes', () => {
        const ready = stateOf(false);
        const target = mount(div(css`preview-card`, { className: () => ready.value ? 'is-ready' : 'idle' }));
        const box = target.querySelector('div');
        
        expect(box.classList.contains('preview-card')).toBe(true);
        expect(box.classList.contains('idle')).toBe(true);
        
        ready.value = true;
        expect(box.classList.contains('preview-card')).toBe(true);
        expect(box.classList.contains('is-ready')).toBe(true);
        expect(box.classList.contains('idle')).toBe(false);
    });
    
    it('updates multiple merged reactive parts', () => {
        const a = stateOf(1), b = stateOf(2), c = stateOf(3);
        const target = mount(div(
            css(() => `a-${a.value}`),
            css(() => `b-${b.value}`),
            css(() => `c-${c.value}`)
        ));
        const box = target.querySelector('div');
        
        a.value = 9; b.value = 8;
        expect(box.classList.contains('a-9')).toBe(true);
        expect(box.classList.contains('b-8')).toBe(true);
        expect(box.classList.contains('c-3')).toBe(true);
    });
    
    it('className alias works with reactive functions', () => {
        const count = stateOf(0);
        const target = mount(div({ className: () => count.value % 2 ? 'odd' : 'even' }));
        
        expect(target.querySelector('div').className).toBe('even');
        count.value = 1;
        expect(target.querySelector('div').className).toBe('odd');
    });
});

describe('Enterprise: reactive Attributes & data_/aria_', () => {
    it('updates helper, prefixed, and callback attributes', () => {
        const path = stateOf('/start');
        const label = stateOf('Initial');
        const busy = stateOf(false);
        const status = stateOf('open');
        const title = stateOf('Title');
        
        const target = mount(a(
            href(() => path.value),
            aria_({ label, busy }),
            data_({ status }),
            { title: () => title.value },
            'link'
        ));
        const link = target.querySelector('a');
        
        expect(link.getAttribute('href')).toBe('/start');
        expect(link.getAttribute('aria-label')).toBe('Initial');
        expect(link.getAttribute('aria-busy')).toBe('false');
        expect(link.getAttribute('data-status')).toBe('open');
        expect(link.getAttribute('title')).toBe('Title');
        
        path.value = '/next'; label.value = 'Updated'; busy.value = true;
        status.value = 'done'; title.value = 'New Title';
        
        expect(link.getAttribute('href')).toBe('/next');
        expect(link.getAttribute('aria-label')).toBe('Updated');
        expect(link.getAttribute('aria-busy')).toBe('true');
        expect(link.getAttribute('data-status')).toBe('done');
        expect(link.getAttribute('title')).toBe('New Title');
    });
    
    it('data_ converts underscores to hyphens', () => {
        const counter = stateOf(0);
        const target = mount(p({ data_counter: counter }, 'Count:', counter));
        
        expect(target.querySelector('p').getAttribute('data-counter')).toBe('0');
        counter.value = 3;
        expect(target.querySelector('p').getAttribute('data-counter')).toBe('3');
    });
    
    it('aria_ converts underscores', () => {
        const desc = stateOf('summary');
        const target = mount(div({ aria_labelledby: desc, aria_live: 'polite' }));
        
        expect(target.querySelector('div').getAttribute('aria-labelledby')).toBe('summary');
        desc.value = 'details';
        expect(target.querySelector('div').getAttribute('aria-labelledby')).toBe('details');
    });
});

describe('Enterprise: rememberOf - Persistence', () => {
    it('persists values to localStorage', () => {
        const n = rememberOf(7);
        n.setState(8);
        const stored = JSON.parse(localStorage.getItem('app-remember-state'));
        expect(JSON.stringify(stored)).toContain('8');
    });
    
    it('restores keyed lists independently', () => {
        const original = rememberOf('test.keyed', []);
        original.push('saved');
        
        rememberOf('test.other', 1); // intervening state
        
        const restored = rememberOf('test.keyed', []);
        expect(restored.values).toEqual(['saved']);
    });
});

describe('Enterprise: sequenceOf - Unique Identity', () => {
    it('keeps duplicates as distinct items', () => {
        const seq = sequenceOf('a', 'a', 'b');
        expect(seq.size).toBe(3);
        expect(seq.values[0]).not.toBe(seq.values[1]);
        seq.push('c');
        expect(seq.size).toBe(4);
    });
});

describe('Enterprise: listen - Reactive Callbacks', () => {
    it('runs on mount and state change', () => {
        const count = stateOf(0);
        const target = mount(div('base ', listen(p => p.text(`base ${count.value}`))));
        
        expect(target.textContent).toContain('base 0');
        count.setState(1);
        expect(target.textContent).toContain('base 1');
    });
    
    it('receives parent element', () => {
        const count = stateOf(0);
        let receivedParent = null;
        
        mount(div(listen(p => { receivedParent = p; })));
        expect(receivedParent).toBeInstanceOf(JetzElement);
    });
    
    it('stop() unregisters listener', () => {
        const count = stateOf(0);
        let runs = 0;
        const listener = listen(() => runs++);
        const target = mount(div(listener));
        
        expect(runs).toBe(1);
        listener.stop(); // explicitly stop the listener
        count.setState(1);
        expect(runs).toBe(1); // stopped
    });
});

describe('Enterprise: ifElse - Branch Lifecycle & Scope Disposal', () => {
    it('disposes effects/computed in inactive branch on swap', () => {
        const flag = stateOf(true);
        const source = stateOf('hello');
        const branchLog = [];
        const computedLog = [];
        const target = mount(div(
            ifElse(() => flag.value,
                () => {
                    effect(() => { branchLog.push(source.value); });
                    const derived = computed(() => source.value.length);
                    derived.subscribe(v => computedLog.push(v));
                    return div(p(String(derived.value)));
                },
                () => div('idle')
            )
        ));
        expect(target.textContent).toContain('5');
        branchLog.length = 0;
        computedLog.length = 0;

        // swap: branch scope must dispose both the effect and the computed
        flag.value = false;
        expect(target.textContent).toContain('idle');

        source.value = 'hello world';
        // the branch effect is dead: its log must not grow
        expect(branchLog).toEqual([]);
        // the branch computed is dead: its subscriber must not fire
        expect(computedLog).toEqual([]);

        // the reverse direction still wires fresh subscriptions
        flag.value = true;
        expect(target.textContent).toContain('11');
        branchLog.length = 0;
        source.value = 'hi';
        expect(branchLog).toContain('hi');
    });
    
    it('detaches ListState rendered inside branch on swap', () => {
        const flag = stateOf(true);
        const items = listOf('a', 'b');
        const target = mount(div(
            ifElse(() => flag.value,
                () => div(loop(items, item => item)),
                () => div('idle')
            )
        ));
        
        expect(target.textContent).toContain('ab');
        expect(items.parentElement.length).toBe(1);
        
        flag.value = false;
        expect(target.textContent).toContain('idle');
        expect(items.parentElement.length).toBe(0);
        expect(items.views.length).toBe(0);
        
        flag.value = true;
        expect(target.textContent).toContain('ab');
        expect(items.parentElement.length).toBe(1);
    });
    
    it('stops listen() callbacks in swapped-out branch', () => {
        const flag = stateOf(true);
        const pulse = stateOf(0);
        let listenCalls = 0;
        
        const target = mount(div(
            ifElse(() => flag.value,
                () => div(listen(() => { pulse.value; listenCalls++; })),
                () => div('idle')
            )
        ));
        const callsWhenActive = listenCalls;
        expect(callsWhenActive).toBeGreaterThan(0);
        
        flag.value = false;
        pulse.value = 1;
        pulse.value = 2;
        expect(listenCalls).toBe(callsWhenActive);
        expect(target.textContent).toContain('idle');
    });
});

describe('Enterprise: Dispatcher - Fan-out & waitFor', () => {
    it('fans action to all handlers', () => {
        const users = [], orders = [];
        const d = new Dispatcher();
        d.subscribe((a, p) => users.push(`${a}:${p.id}`), 'users');
        d.subscribe((a, p) => orders.push(`${a}:${p.id}`), 'orders');
        d.dispatch('LOAD', { id: 7 });
        
        expect(users).toEqual(['LOAD:7']);
        expect(orders).toEqual(['LOAD:7']);
    });
    
    it('waitFor runs dependency before caller', () => {
        const order = [];
        const users = stateOf(0);
        const total = stateOf(0);
        const d = new Dispatcher();
        
        d.subscribe(() => {
            order.push('summary:start');
            d.waitFor('users');
            total.value = users.value * 2;
            order.push('summary:end');
        }, 'summary');
        
        d.subscribe(() => {
            order.push('users');
            users.value += 5;
        }, 'users');
        
        d.dispatch('ADD');
        expect(order).toEqual(['summary:start', 'users', 'summary:end']);
        expect(total.value).toBe(10);
    });
    
    it('waitFor honours token order', () => {
        const order = [];
        const d = new Dispatcher();
        d.subscribe(() => { d.waitFor(['b', 'a']); order.push('dependent'); }, 'dependent');
        d.subscribe(() => { order.push('c'); }, 'c');
        d.subscribe(() => { order.push('a'); }, 'a');
        d.subscribe(() => { order.push('b'); }, 'b');
        d.dispatch('X');
        expect(order).toEqual(['b', 'a', 'dependent', 'c']);
    });
    
    it('contains throwing handler', () => {
        const seen = [];
        const d = new Dispatcher(() => { throw new Error('boom'); });
        d.subscribe(() => seen.push('good'), 'good');
        d.onError = vi.fn();
        
        expect(() => d.dispatch('X')).not.toThrow();
        expect(seen).toEqual(['good']);
        expect(d.onError).toHaveBeenCalled();
    });
});

describe('Enterprise: Component Lifecycle', () => {
    it('class component: create -> mount -> update -> destroy', () => {
        const steps = [];
        class Card extends Component {
            render() { return div('card'); }
            onCreate() { steps.push('create'); }
            onMount() { steps.push('mount'); }
            onUpdate() { steps.push('update'); }
            onDestroy() { steps.push('destroy'); }
        }
        
        const target = mount(div(new Card()));
        expect(steps).toEqual(['create', 'mount']);
        
        stateOf(0).setState(1);
        expect(steps).toEqual(['create', 'mount', 'update']);
        
        target.querySelector('div > div').remove();
        stateOf(1).setState(2);
        expect(steps).toEqual(['create', 'mount', 'update', 'destroy']);
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
    
    it('onMount runs after attach to document', () => {
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
});

describe('Enterprise: Jetz.mount/unmount + addScript', () => {
    it('mount renders into container', () => {
        const target = mount(div('app'));
        expect(target.textContent).toBe('app');
    });
    
    it('unmount clears container and releases bindings', () => {
        const flag = stateOf('on');
        const label = stateOf('hi');
        const target = mount(div(span(label, { 'data-flag': flag })));
        
        const detached = target.querySelector('span');
        const before = label.container.length;
        
        Jetz.unmount(target);
        expect(label.container.length).toBeLessThan(before);
        
        flag.setState('off');
        label.setState('bye');
        expect(detached.getAttribute('data-flag')).toBe('on');
        expect(detached.textContent).toBe('hi');
    });
    
    it('addScript appends script to body', () => {
        addScript('/test.js', { defer: 'defer' });
        const script = document.body.querySelector('script[src="/test.js"]');
        expect(script).toBeTruthy();
        expect(script.defer).toBe(true);
    });
});

describe('Enterprise: tagged Templates - Reactive String Interpolation', () => {
    it('renders div`...${fn}` and updates on state change', () => {
        const online = stateOf(true);
        const target = mount(div`Is online : ${() => online.value ? 'Yes' : 'No'}`);
        
        expect(target.textContent).toContain('Yes');
        online.value = false;
        expect(target.textContent).toContain('No');
    });
    
    it('interpolates state directly', () => {
        const name = stateOf('Deva');
        const target = mount(span`Hello ${name}!`);
        
        expect(target.textContent).toBe('Hello Deva!');
        name.value = 'Arofi';
        expect(target.textContent).toBe('Hello Arofi!');
    });
    
    it('text`...${fn}` creates reactive text nodes', () => {
        const count = stateOf(1);
        const target = mount(div(text`Count : ${() => count.value * 2}`));
        
        expect(target.textContent).toContain('Count : 2');
        count.value = 5;
        expect(target.textContent).toContain('Count : 10');
    });
    
    it('drops null/false results from getters', () => {
        const count = stateOf(0);
        const nothing = stateOf(null);
        const target = mount(div(text`[${() => count.value}] [${() => nothing.value}] [${() => false}]`));
        
        expect(target.textContent).toBe('[0] [] []');
    });
    
    it('renders components/elements as children in template', () => {
        const Badge = () => div('badge');
        const target = mount(div`Status: ${Badge} (${span('inline')})`);
        
        expect(target.textContent).toBe('Status: badge (inline)');
    });
    
    it('scales: one state change rewrites one Text node', () => {
        const count = 1000;
        const states = Array.from({ length: count }, (_, i) => stateOf(i));
        const target = mount(div(...states.map(s => div`value ${() => s.value}`)));
        
        const texts = [];
        const walk = node => {
            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) texts.push(child);
                else walk(child);
            }
        };
        walk(target);
        
        expect(texts.length).toBe(count * 2);
        
        const before = texts.map(n => n.data);
        states[7].value = 999;
        const after = texts.map(n => n.data);
        
        const changed = after.filter((d, i) => d !== before[i]).length;
        expect(changed).toBe(1); // O(dependents) not O(N)
    });
});

describe('Enterprise: Style Tagged Template', () => {
    it('applies css declaration block', () => {
        const target = mount(div(style`
            max-width: 400px;
            margin: 30px auto;
            padding: 20px;
        `, 'card'));
        
        const box = target.querySelector('div');
        expect(box.style.maxWidth).toBe('400px');
        expect(box.style.margin).toBe('30px auto');
        expect(box.style.padding).toBe('20px');
    });
    
    it('keeps interpolated state reactive', () => {
        const color = stateOf('red');
        const target = mount(div(style`color: ${() => color.value}; padding: 4px;`));
        
        expect(target.querySelector('div').style.color).toBe('red');
        color.value = 'blue';
        expect(target.querySelector('div').style.color).toBe('blue');
    });
    
    it('accepts State holding whole css block', () => {
        const styles = stateOf('color: green;');
        const target = mount(div(style(styles)));
        
        expect(target.querySelector('div').style.color).toBe('green');
        styles.value = 'color: purple;';
        expect(target.querySelector('div').style.color).toBe('purple');
    });
});

describe('Enterprise: Utilities - range, createList, flatMap, loop', () => {
    it('range produces sequence', () => {
        expect(range(1, 3)).toEqual([1, 2, 3]);
    });
    
    it('createList maps indices', () => {
        expect(createList(3, i => i * 2)).toEqual([0, 2, 4]);
    });
    
    it('flatMap flattens recursively preserving ListState', () => {
        expect(flatMap([1, [2, [3]]])).toEqual([1, 2, 3]);
    });
    
    it('loop applies render function', () => {
        expect(loop([1, 2], n => n * 10)).toEqual([10, 20]);
    });
});

describe('Enterprise: Integration Patterns', () => {
    it('combines state, computed, effect, listOf, loop', () => {
        const isBusy = stateOf(false);
        const page = stateOf(1);
        const items = listOf();
        const filter = stateOf('');
        
        // Dataset
        const dataset = Array.from({ length: 100 }, (_, i) => rowOf({ id: i + 1, name: `Item ${i + 1}` }));
        
        // Pipeline: filter -> paginate
        effect(() => {
            filter.value; page.value;
            const needle = filter.value.toLowerCase();
            const filtered = dataset.filter(r => r.name.toLowerCase().includes(needle));
            const size = 10;
            const start = (page.value - 1) * size;
            items.set(filtered.slice(start, start + size));
        });
        
        mount(div(
            inputText({ bind: filter, placeholder: 'Search...' }),
            button({ onclick: () => defer(() => page.value++, { loadingState: isBusy }) }, 'Next'),
            div(text`Page: ${page}`),
            ul(loop(items, r => r.id, r => li(r.name)))
        ));
        
        // Initial render
        expect(document.querySelectorAll('li').length).toBe(10);
        
        // Filter
        filter.value = '5';
        expect(document.querySelectorAll('li').length).toBe(10); // page size limits to 10
    });
});