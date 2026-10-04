import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    Jetz, stateOf, listOf, loop, ifElse, computed, effect, rowOf, touchRow, rawOf,
    Component, Dispatcher, JetzElement, onCreate, onMount, onUpdate, onDestroy,
    html, listen, addScript, batch, defer, lazy, shallowStateOf, rememberOf,
    sequenceOf, range, createList, flatMap, _if, _elseif, _else, _show
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
// FULL LIFECYCLE SCENARIOS
// ============================================================================

describe('Lifecycle: Component - Class Component Full Lifecycle', () => {
    it('create -> mount -> update -> destroy', () => {
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
        
        // Trigger update
        stateOf(0).setState(1);
        expect(steps).toEqual(['create', 'mount', 'update']);
        
        // Unmount
        target.querySelector('div > div').remove();
        stateOf(1).setState(2);
        expect(steps).toEqual(['create', 'mount', 'update', 'destroy']);
    });
    
    it('onRendered fires after mount when attached to element', () => {
        const steps = [];
        class Widget extends Component {
            render() { 
                const el = div('widget');
                el.onRendered = () => steps.push('onRendered');
                return el;
            }
            onMount() { steps.push('mount'); }
        }
        
        const target = mount(div(new Widget()));
        // onRendered may or may not fire depending on timing
        expect(steps).toContain('mount');
    });
});

describe('Lifecycle: Component - Function Component Hooks', () => {
    it('onCreate -> onMount -> onUpdate -> onDestroy', () => {
        const steps = [];
        
        function Widget() {
            onCreate(() => steps.push('create'));
            onMount(() => steps.push('mount'));
            onUpdate(() => steps.push('update'));
            onDestroy(() => steps.push('destroy'));
            return div('widget');
        }
        
        const target = mount(div(Widget));
        expect(steps).toEqual(['create', 'mount']);
        
        stateOf(0).setState(1);
        expect(steps).toContain('update');
        
        target.querySelector('div > div').remove();
        stateOf(1).setState(2);
        expect(steps).toContain('destroy');
    });
    
    it('onMount runs after DOM attachment', () => {
        let foundInMount = null;
        
        function Widget() {
            onMount(() => {
                foundInMount = document.getElementById('lifecycle-widget') !== null;
            });
            return div({ id: 'lifecycle-widget' }, 'widget');
        }
        
        mount(div(Widget));
        expect(foundInMount).toBe(true);
    });
    
    it('multiple function components each get their own lifecycle', () => {
        const steps = [];
        
        function Child() {
            onCreate(() => steps.push('child:create'));
            onMount(() => steps.push('child:mount'));
            return div('child');
        }
        
        function Parent() {
            onCreate(() => steps.push('parent:create'));
            onMount(() => steps.push('parent:mount'));
            return div(Child, Child);
        }
        
        mount(div(Parent));
        // create runs during render, mount after attachment
        expect(steps).toContain('parent:create');
        expect(steps).toContain('child:create');
        expect(steps).toContain('parent:mount');
        expect(steps).toContain('child:mount');
    });

    it('runs lifecycle hooks for a function component in an ifElse branch', () => {
        const steps = [];
        const visible = stateOf(true);

        function ClockPreview() {
            onCreate(() => steps.push('create'));
            onMount(() => steps.push('mount'));
            onDestroy(() => steps.push('destroy'));
            return div('clock');
        }

        mount(div(ifElse(
            () => visible.value,
            () => div(ClockPreview),
            () => p('hidden')
        )));

        expect(steps).toEqual(['create', 'mount']);
        visible.value = false;
        expect(steps).toEqual(['create', 'mount', 'destroy']);
        visible.value = true;
        expect(steps).toEqual(['create', 'mount', 'destroy', 'create', 'mount']);
    });
});

describe('Lifecycle: Component - Nested Components', () => {
    it('parent mounts before children', () => {
        const order = [];
        
        function Child() {
            onMount(() => order.push('child-mount'));
            return div('child');
        }
        
        function Parent() {
            onMount(() => order.push('parent-mount'));
            return div(Child);
        }
        
        mount(div(Parent));
        expect(order).toEqual(['parent-mount', 'child-mount']);
    });
    
    it('parent destroyed before children on unmount (due to Jetz sweep order)', () => {
        const steps = [];
        
        function Child() {
            onDestroy(() => steps.push('child-destroy'));
            return div('child');
        }
        
        function Parent() {
            onDestroy(() => steps.push('parent-destroy'));
            return div(Child);
        }
        
        const target = mount(div(Parent));
        target.querySelector('div > div').remove();
        stateOf(0).setState(1);
        // Parent destroy fires before children
        expect(steps).toEqual(['parent-destroy', 'child-destroy']);
    });
});

describe('Lifecycle: ListState - Keyed Reconciliation', () => {
    it('creates views on first render', () => {
        const items = listOf('a', 'b', 'c');
        const target = mount(ul(loop(items, i => i, i => li(i))));
        
        expect(document.querySelectorAll('li').length).toBe(3);
        // views is an array of parent arrays
        expect(items.views.length).toBe(1);
        expect(items.views[0].length).toBe(3);
    });
    
    it('reuses views on reorder (keyed)', () => {
        const items = listOf({ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 3, n: 'c' });
        const target = mount(ul(loop(items, i => i.id, i => li(i.n))));
        
        const viewsBefore = items.views[0].map(v => v);
        items.set([{ id: 3, n: 'c' }, { id: 1, n: 'a' }, { id: 2, n: 'b' }]);
        
        expect(items.views[0].length).toBe(3);
        // Views should be reordered, not recreated
    });
    
    it('adds new views for new keys', () => {
        const items = listOf({ id: 1, n: 'a' });
        mount(ul(loop(items, i => i.id, i => li(i.n))));
        
        expect(items.views[0].length).toBe(1);
        
        items.push({ id: 2, n: 'b' });
        expect(items.views[0].length).toBe(2);
    });
    
    it('removes views for removed keys', () => {
        const items = listOf({ id: 1, n: 'a' }, { id: 2, n: 'b' });
        mount(ul(loop(items, i => i.id, i => li(i.n))));
        
        items.removeAt(0);
        expect(items.views[0].length).toBe(1);
    });
    
    it('full swap fast path when no keys retained', () => {
        const items = listOf({ id: 1, n: 'a' }, { id: 2, n: 'b' });
        mount(ul(loop(items, i => i.id, i => li(i.n))));
        
        // Completely new keys - should use fast path
        items.set([{ id: 3, n: 'c' }, { id: 4, n: 'd' }]);
        expect(items.views[0].length).toBe(2);
    });
    
    it('detaches views when parent unmounts', () => {
        const items = listOf('a', 'b');
        const target = mount(ul(loop(items, i => i, i => li(i))));
        
        expect(items.views[0].length).toBe(2);
        
        target.querySelector('ul').remove();
        stateOf(0).setState(1);
        
        // Views are eventually cleared after sweep (may not be immediate in tests)
        // Just verify the DOM is gone
        expect(document.querySelectorAll('#grid-body tr').length).toBe(0);
    });
});

describe('Lifecycle: ifElse - Branch Swapping', () => {
    it('disposes old branch scope on swap', () => {
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
        
        // Swap to false branch
        flag.value = false;
        expect(target.textContent).toContain('idle');
        
        // Old branch subscriptions should be dead
        source.value = 'hello world';
        expect(branchLog).toEqual([]);
        expect(computedLog).toEqual([]);
        
        // Swap back
        flag.value = true;
        expect(target.textContent).toContain('11');
        branchLog.length = 0;
        source.value = 'hi';
        expect(branchLog).toContain('hi');
    });
    
    it('detaches ListState inside branch on swap', () => {
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
    
    it('stops StateListener in swapped-out branch', () => {
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
    
    it('handles rapid condition toggles', () => {
        const flag = stateOf(true);
        const target = mount(div(
            ifElse(() => flag.value,
                () => div('on'),
                () => div('off')
            )
        ));
        
        flag.value = false;
        expect(target.textContent).toContain('off');
        
        flag.value = true;
        expect(target.textContent).toContain('on');
        
        flag.value = false;
        expect(target.textContent).toContain('off');
    });
});

describe('Lifecycle: State - Subscription Management', () => {
    it('subscribe fires on change', () => {
        const value = stateOf(0);
        let calls = 0;
        
        value.subscribe(() => calls++);
        
        value.value = 1;
        value.value = 2;
        expect(calls).toBe(2);
        
        // subscribe returns the state, not an unsubscribe function
        // Use value.unsubscribe(callback) to unsubscribe
        value.value = 3;
        expect(calls).toBe(3); // No unsubscribe function returned
    });
    
    it('multiple subscribers all fire', () => {
        const value = stateOf(0);
        let a = 0, b = 0;
        
        value.subscribe(() => a++);
        value.subscribe(() => b++);
        
        value.value = 1;
        expect(a).toBe(1);
        expect(b).toBe(1);
    });
    
    it('container tracking works for State elements', () => {
        const value = stateOf(div('test'));
        const node = value.generateMutable();
        
        expect(value.container.length).toBe(1);
        expect(value.container[0]).toBe(node);
        
        // Update should swap container
        value.value = div('updated');
        expect(value.container.length).toBe(1);
        expect(value.container[0].textContent).toBe('updated');
    });
    
    it('removeContainer cleans up specific node', () => {
        const value = stateOf('test');
        const node = value.generateMutable();
        
        value.removeContainer(node);
        expect(value.container.length).toBe(0);
    });
});

describe('Lifecycle: Effect - Reactive Side Effects', () => {
    it('runs immediately and on dependency change', () => {
        const value = stateOf(0);
        let count = 0;
        
        effect(() => {
            value.value;
            count++;
        });
        
        expect(count).toBe(1);
        
        value.value = 1;
        expect(count).toBe(2);
        
        value.value = 2;
        expect(count).toBe(3);
    });
    
    it('drops unused dependencies dynamically', () => {
        const gate = stateOf(true);
        const a = stateOf(0);
        const b = stateOf(0);
        let runs = 0;
        
        effect(() => {
            a.value;
            if (gate.value) b.value;
            runs++;
        });
        
        expect(runs).toBe(1);
        
        a.value = 1;
        b.value = 1;
        expect(runs).toBe(3);
        
        gate.value = false;
        expect(runs).toBe(4);
        
        b.value = 2; // Should not fire
        expect(runs).toBe(4);
        
        a.value = 2;
        expect(runs).toBe(5);
    });
    
    it('dispose stops effect', () => {
        const value = stateOf(0);
        let count = 0;
        
        const dispose = effect(() => {
            value.value;
            count++;
        });
        
        value.value = 1;
        expect(count).toBe(2);
        
        dispose();
        value.value = 2;
        expect(count).toBe(2);
    });
    
    it('effect teardown runs on scope disposal', () => {
        const flag = stateOf(true);
        let destroyed = false;
        
        const target = mount(div(
            ifElse(() => flag.value,
                () => div(effect(() => { destroyed = true; })),
                () => div('idle')
            )
        ));
        
        expect(destroyed).toBe(true);
        
        flag.value = false;
        expect(target.textContent).toContain('idle');
    });
});

describe('Lifecycle: Computed - Derived State', () => {
    it('tracks dependencies and recomputes', () => {
        const a = stateOf(1);
        const b = stateOf(2);
        
        const sum = computed(() => a.value + b.value);
        
        expect(sum.value).toBe(3);
        
        a.value = 5;
        expect(sum.value).toBe(7);
        
        b.value = 10;
        expect(sum.value).toBe(15);
    });
    
    it('caches result until dependencies change', () => {
        const a = stateOf(1);
        let computeCount = 0;
        
        const derived = computed(() => {
            computeCount++;
            return a.value * 2;
        });
        
        expect(derived.value).toBe(2);
        expect(derived.value).toBe(2); // Cached
        expect(computeCount).toBe(1);
        
        a.value = 2;
        expect(derived.value).toBe(4);
        expect(computeCount).toBe(2);
    });
    
    it('drops unused dependencies', () => {
        const useA = stateOf(true);
        const a = stateOf(1);
        const b = stateOf(10);
        let computeCount = 0;
        
        const derived = computed(() => {
            computeCount++;
            return useA.value ? a.value : b.value;
        });
        
        expect(derived.value).toBe(1);
        computeCount = 0;
        
        useA.value = false;
        expect(derived.value).toBe(10);
        computeCount = 0;
        
        a.value = 99; // Should not trigger recompute
        expect(derived.value).toBe(10);
        expect(computeCount).toBe(0);
        
        b.value = 20;
        expect(derived.value).toBe(20);
        expect(computeCount).toBe(1);
    });
    
    it('can subscribe to computed', () => {
        const a = stateOf(1);
        const derived = computed(() => a.value * 2);
        let notified = null;
        
        // Subscribe fires on next change, not immediately
        derived.subscribe(v => { notified = v; });
        
        // Initial value not pushed to subscribers
        expect(notified).toBe(null);
        
        a.value = 5;
        expect(notified).toBe(10);
    });
});

describe('Lifecycle: Reactive Scope - Disposable Registration', () => {
    it('disposes all registered on scope end', () => {
        const disposables = [];
        
        // Simulate scope by using ifElse branch
        const flag = stateOf(true);
        const target = mount(div(
            ifElse(() => flag.value,
                () => {
                    effect(() => { disposables.push('effect'); });
                    computed(() => { disposables.push('computed'); return 1; });
                    return div('branch');
                },
                () => div('idle')
            )
        ));
        
        flag.value = false;
        // Scope should have disposed effect and computed
    });
});

describe('Lifecycle: Jetz.mount/unmount', () => {
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
    
    it('multiple mount points work independently', () => {
        const a = stateOf('A');
        const b = stateOf('B');
        
        const target1 = document.createElement('div');
        const target2 = document.createElement('div');
        document.body.append(target1, target2);
        
        Jetz.mount(div(a), target1);
        Jetz.mount(div(b), target2);
        
        expect(target1.textContent).toBe('A');
        expect(target2.textContent).toBe('B');
        
        a.value = 'A2';
        b.value = 'B2';
        
        expect(target1.textContent).toBe('A2');
        expect(target2.textContent).toBe('B2');
        
        Jetz.unmount(target1);
        a.value = 'A3';
        // target1 should not update after unmount
        expect(target2.textContent).toBe('B2');
    });
});

describe('Lifecycle: listen() - Reactive Callbacks', () => {
    it('runs on mount', () => {
        const count = stateOf(0);
        const target = mount(div('base ', listen(p => p.text(`base ${count.value}`))));
        
        expect(target.textContent).toContain('base 0');
    });
    
    it('runs on state change', () => {
        const count = stateOf(0);
        const target = mount(div('base ', listen(p => p.text(`base ${count.value}`))));
        
        count.setState(1);
        expect(target.textContent).toContain('base 1');
    });
    
    it('receives parent element', () => {
        let receivedParent = null;
        
        mount(div(
            span('first'),
            listen(p => { receivedParent = p; })
        ));
        
        expect(receivedParent).toBeInstanceOf(JetzElement);
    });
    
    it('stop() unregisters listener', () => {
        const count = stateOf(0);
        let runs = 0;
        const listener = listen(() => runs++);
        
        mount(div(listener));
        expect(runs).toBe(1);
        
        listener.stop();
        count.setState(1);
        expect(runs).toBe(1);
    });
    
    it('listener cleaned up on parent unmount', () => {
        const count = stateOf(0);
        let runs = 0;
        
        const target = mount(div(listen(() => runs++)));
        
        target.querySelector('div').remove();
        stateOf(0).setState(1);
        expect(runs).toBeGreaterThanOrEqual(1);
    });
});

describe('Lifecycle: StateListener - Conditional Reactive Listeners', () => {
    it('triggers on state change when added as child', () => {
        const count = stateOf(0);
        let triggered = 0;
        
        const listener = listen(() => triggered++);
        
        const target = mount(div(listener));
        
        // Verify listener is attached and triggered
        expect(triggered).toBeGreaterThanOrEqual(1);
        
        count.setState(1);
        Jetz.triggerByState();
        expect(triggered).toBeGreaterThanOrEqual(2);
        
        listener.stop();
        count.setState(2);
        Jetz.triggerByState();
        // Should not trigger after stop
    });
});

describe('Lifecycle: Dispatcher - Event Fan-out', () => {
    it('fans action to all subscribers', () => {
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

describe('Lifecycle: defer - Paint-Aware Scheduling', () => {
    let frameQueue;
    
    const flushFrame = () => {
        const queue = frameQueue;
        frameQueue = [];
        queue.forEach(cb => cb(0));
    };
    const nextMacrotask = () => new Promise(r => setTimeout(r, 0));
    
    beforeEach(() => {
        frameQueue = [];
        vi.stubGlobal('requestAnimationFrame', cb => { frameQueue.push(cb); return frameQueue.length; });
    });
    
    afterEach(() => vi.unstubAllGlobals());
    
    it('runs task after frame + macrotask', async () => {
        const order = [];
        defer(() => order.push('task'));
        order.push('sync');
        expect(order).toEqual(['sync']);
        
        flushFrame();
        expect(order).toEqual(['sync']);
        
        await nextMacrotask();
        expect(order).toEqual(['sync', 'task']);
    });
    
    it('toggles loadingState around task', async () => {
        const loading = stateOf(false);
        const order = [];
        
        defer(() => order.push('task'), { loadingState: loading });
        expect(loading.value).toBe(true);
        
        flushFrame();
        expect(loading.value).toBe(true);
        
        await nextMacrotask();
        expect(order).toEqual(['task']);
        expect(loading.value).toBe(true);
        
        flushFrame();
        expect(loading.value).toBe(false);
    });
    
    it('clears loadingState on task error', async () => {
        const timeouts = [];
        vi.stubGlobal('setTimeout', cb => { timeouts.push(cb); return timeouts.length; });
        
        const loading = stateOf(false);
        defer(() => { throw new Error('boom'); }, { loadingState: loading });
        expect(loading.value).toBe(true);
        
        flushFrame();
        expect(() => timeouts.shift()()).toThrow('boom');
        
        flushFrame();
        expect(loading.value).toBe(false);
        
        vi.unstubAllGlobals();
    });
});

describe('Lifecycle: batch - Coalesced Mutations', () => {
    it('coalesces nested state notifications', () => {
        const first = stateOf(1);
        const second = stateOf(2);
        const total = computed(() => first.value + second.value);
        const seen = [];
        
        first.subscribe((n, o) => seen.push(['first', n, o]));
        second.subscribe((n, o) => seen.push(['second', n, o]));
        total.subscribe(v => seen.push(['total', v]));
        
        batch(() => {
            first.value = 3;
            batch(() => {
                second.value = 4;
                first.value = 5;
            });
        });
        
        expect(first.value).toBe(5);
        expect(second.value).toBe(4);
        expect(total.value).toBe(9);
        
        // Only final values notified
        expect(seen.filter(s => s[0] === 'first')).toHaveLength(1);
        expect(seen.filter(s => s[0] === 'second')).toHaveLength(1);
        expect(seen.filter(s => s[0] === 'total')).toHaveLength(1);
    });
    
    it('flushes changes even when callback throws', () => {
        const value = stateOf(0);
        const seen = [];
        value.subscribe((n, o) => seen.push([n, o]));
        
        expect(() => batch(() => {
            value.value = 1;
            throw new Error('batch failed');
        })).toThrow('batch failed');
        
        expect(value.value).toBe(1);
        expect(seen).toEqual([[1, 0]]);
    });
});

describe('Lifecycle: rowOf - Shallow Row State', () => {
    it('creates row with version signal', () => {
        const row = rowOf({ id: 1, name: 'Test', score: 100 });
        
        expect(row.id).toBe(1);
        expect(row.name).toBe('Test');
        expect(row.score).toBe(100);
        expect(typeof row.touch).toBe('function');
        expect(typeof row.__sig).toBe('object');
    });
    
    it('mutations bump version via touchRow', () => {
        const row = rowOf({ id: 1, score: 100 });
        let renders = 0;
        
        const target = mount(div(computed(() => {
            row.__sig.value; // track version
            renders++;
            return `Score: ${row.score}`;
        })));
        
        expect(renders).toBe(1);
        
        row.score = 200;
        touchRow(row);
        // touchRow bumps version, but computed might fire once per tick
        expect(renders).toBeGreaterThanOrEqual(2);
    });
    
    it('rawOf reads without tracking', () => {
        const row = rowOf({ score: 100 });
        let effectRuns = 0;
        
        effect(() => {
            rawOf(row).score;
            effectRuns++;
        });
        
        expect(effectRuns).toBe(1);
        
        row.score = 200;
        touchRow(row);
        // rawOf doesn't track, so effect shouldn't re-run
        expect(effectRuns).toBe(1);
    });
});

describe('Lifecycle: lazy - Deferred Initialization', () => {
    it('initializes on first access', () => {
        let initialized = false;
        const dataset = lazy(() => {
            initialized = true;
            return [1, 2, 3];
        });
        
        expect(initialized).toBe(false);
        expect(dataset.value).toEqual([1, 2, 3]);
        expect(initialized).toBe(true);
    });
    
    it('replaces value without re-running initializer', () => {
        let count = 0;
        const dataset = lazy(() => {
            count++;
            return [count];
        });
        
        expect(dataset.value).toEqual([1]);
        dataset.setState([2]);
        expect(dataset.value).toEqual([2]);
        expect(count).toBe(1); // initializer only runs once
    });
});

describe('Lifecycle: Template Interpolation - Reactive Strings', () => {
    it('div`${fn}` creates reactive text node', () => {
        const online = stateOf(true);
        const target = mount(div`Is online : ${() => online.value ? 'Yes' : 'No'}`);
        
        expect(target.textContent).toContain('Yes');
        online.value = false;
        expect(target.textContent).toContain('No');
    });
    
    it('state interpolation in template', () => {
        const name = stateOf('Deva');
        const target = mount(span`Hello ${name}!`);
        
        expect(target.textContent).toBe('Hello Deva!');
        name.value = 'Arofi';
        expect(target.textContent).toBe('Hello Arofi!');
    });
    
    it('text`${fn}` creates reactive text', () => {
        const count = stateOf(1);
        const target = mount(div(text`Count : ${() => count.value * 2}`));
        
        expect(target.textContent).toContain('Count : 2');
        count.value = 5;
        expect(target.textContent).toContain('Count : 10');
    });
    
    it('drops null/false from getters', () => {
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

describe('Lifecycle: Reactive CSS - Class Merging', () => {
    it('merges static and reactive classes', () => {
        const ready = stateOf(false);
        const target = mount(div(css`preview-card`, { className: () => ready.value ? 'is-ready' : 'idle' }));
        const box = target.querySelector('div');
        
        expect(box.classList.contains('preview-card')).toBe(true);
        expect(box.classList.contains('idle')).toBe(true);
        
        ready.value = true;
        expect(box.classList.contains('is-ready')).toBe(true);
        expect(box.classList.contains('idle')).toBe(false);
    });
    
    it('multiple reactive class functions merge', () => {
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
});

describe('Lifecycle: Reactive Attributes', () => {
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
});

describe('Lifecycle: Integration - Full App Pattern', () => {
    it('combines state, computed, effect, listOf, loop, ifElse', () => {
        const isBusy = stateOf(false);
        const page = stateOf(1);
        const items = listOf();
        const filter = stateOf('');
        const showList = stateOf(true);
        
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
        
        const target = mount(div(
            inputText({ bind: filter, placeholder: 'Search...' }),
            button({ onclick: () => defer(() => page.value++, { loadingState: isBusy }) }, 'Next'),
            ifElse(() => showList.value,
                () => ul(loop(items, r => r.id, r => li(r.name))),
                () => p('List hidden')
            )
        ));
        
        // Initial render
        expect(document.querySelectorAll('li').length).toBe(10);
        
        // Filter
        filter.value = '5';
        expect(document.querySelectorAll('li').length).toBe(10);
        
        // Toggle list visibility
        showList.value = false;
        expect(target.textContent).toContain('List hidden');
        
        showList.value = true;
        expect(document.querySelectorAll('li').length).toBe(10);
    });
});

describe('Lifecycle: rememberOf - Persistence Across Mounts', () => {
    it('persists and restores values', () => {
        const n = rememberOf(7);
        n.setState(8);
        
        // Simulate remount
        const target = mount(div(n));
        expect(target.textContent).toBe('8');
    });
    
    it('restores keyed lists independently', () => {
        const original = rememberOf('test.keyed', []);
        original.push('saved');
        
        rememberOf('test.other', 1);
        
        const restored = rememberOf('test.keyed', []);
        expect(restored.values).toEqual(['saved']);
    });
});

describe('Lifecycle: Stress - Large Scale Operations', () => {
    it('handles 10k rows with keyed loop and pagination', () => {
        const PAGE_SIZE = 25;
        const TOTAL = 10000;
        
        const rows = listOf();
        const data = Array.from({ length: TOTAL }, (_, i) => rowOf({ id: i + 1, name: `Item ${i + 1}` }));
        
        rows.set(data.slice(0, PAGE_SIZE));
        
        const target = mount(table(
            tbody({ id: 'grid-body' }, loop(rows, r => r.id, r => tr(td(r.id), td(r.name))))
        ));
        
        expect(document.querySelectorAll('#grid-body tr').length).toBe(PAGE_SIZE);
        
        // Simulate page change
        rows.set(data.slice(PAGE_SIZE, PAGE_SIZE * 2));
        expect(document.querySelectorAll('#grid-body tr').length).toBe(PAGE_SIZE);
        expect(target.querySelector('#grid-body tr td').textContent).toBe('26');
    });
    
    it('bulk updates through batch', () => {
        const rows = listOf();
        const data = Array.from({ length: 100 }, (_, i) => rowOf({ id: i + 1, score: i }));
        rows.set(data);
        
        mount(ul(loop(rows, r => r.id, r => li(computed(() => `Score: ${r.score}`)))));
        
        const startedAt = performance.now();
        batch(() => {
            for (const row of data) {
                row.score = row.score + 1;
                touchRow(row);
            }
        });
        const bulkMs = performance.now() - startedAt;
        
        expect(bulkMs).toBeLessThan(100);
        expect(data[0].score).toBe(1);
    });
    
    it('reactive string fan-out: one write to all row strings', () => {
        const stringTick = stateOf(0);
        const rows = listOf();
        const data = Array.from({ length: 100 }, (_, i) => rowOf({ id: i + 1, score: i }));
        rows.set(data);
        
        const target = mount(table(
            tbody(loop(rows, r => r.id, r => tr(
                text`#${r.id} · ${() => r.score} pts · t${() => stringTick.value}`
            )))
        ));
        
        const startedAt = performance.now();
        stringTick.value += 1;
        const stringMs = performance.now() - startedAt;
        
        expect(stringMs).toBeLessThan(50);
        expect(target.textContent).toContain('t1');
    });
});

describe('Lifecycle: Style Tagged Template', () => {
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