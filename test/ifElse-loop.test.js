import { describe, it, expect, beforeEach } from 'vitest';
import { Jetz, stateOf, listOf, loop, ifElse, computed, effect, listen } from '../packages/jetz/src/jetz.js';
import { div, p, input, type, inputText } from '../packages/jetz/src/jetz-ui.js';

const mount = (element) => {
  const target = document.createElement('div');
  document.body.append(target);
  Jetz.mount(element, target);
  return target;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ifElse inside loop()', () => {
  it('paints the first branch for nested state on mount', () => {
    const tasks = listOf(
      stateOf({ id: 201, done: true, title: 'A', profile: { is_online: true } }),
      stateOf({ id: 202, done: false, title: 'B', profile: { is_online: false } })
    );
    const target = mount(
      div(
        loop(tasks, t => t.id.value, t => div(
          ifElse(() => t.profile.is_online.value,
            () => div('Online'),
            () => div('Offline')
          )
        ))
      )
    );
    expect(target.textContent).toContain('Online');
    expect(target.textContent).toContain('Offline');
  });

  it('toggles nested is_online via checkbox click', () => {
    const tasks = listOf(
      stateOf({ id: 201, done: true, title: 'A', profile: { is_online: true } })
    );
    const task = tasks.values[0];
    const target = mount(
      div(
        loop(tasks, t => t.id.value, t => div(
          input(type`checkbox`, { bind: t.profile.is_online }),
          ifElse(() => t.profile.is_online.value,
            () => div('Online'),
            () => div('Offline')
          )
        ))
      )
    );
    expect(target.textContent).toContain('Online');
    const box = target.querySelector('input[type=checkbox]');
    box.checked = false;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    expect(task.profile.is_online.value).toBe(false);
    expect(target.textContent).toContain('Offline');
    expect(target.textContent).not.toContain('Online');
  });

  it('keeps pushed rows reactive', () => {
    const tasks = listOf(
      stateOf({ id: 201, profile: { is_online: true } })
    );
    const target = mount(
      div(
        loop(tasks, t => t.id.value, t => div(
          ifElse(() => t.profile.is_online.value,
            () => p('Online'),
            () => p('Offline')
          )
        ))
      )
    );
    tasks.push(stateOf({ id: 202, profile: { is_online: false } }));
    expect(target.textContent).toContain('Offline');
    tasks.values[1].profile.is_online.value = true;
    expect(target.textContent.match(/Online/g).length).toBe(2);
  });

  it('unmounts the inactive branch: nodes leave the DOM and subscribers detach', () => {
    const flag = stateOf(true);
    const title = stateOf('active-title');
    const target = mount(
      div(
        ifElse(() => flag.value,
          () => div(
            inputText({ bind: title }),
            title,
            listen(() => { flag.value; })
          ),
          () => div('idle')
        )
      )
    );
    const watcher = stateOf(0);
    const probe = effect(() => { watcher.value = title.value.length; });
    const activeBox = target.querySelector('input[type=text]');
    expect(activeBox).not.toBeNull();
    const containersBefore = title.container.length;
    expect(containersBefore).toBeGreaterThan(0);

    // swap true -> false: the whole active subtree must be released
    flag.value = false;
    expect(target.textContent).toContain('idle');
    expect(target.textContent).not.toContain('active-title');
    expect(target.querySelector('input[type=text]')).toBeNull();
    expect(title.container.length).toBeLessThan(containersBefore);

    // the detached bindings must be dead: writing the old branch state
    // updates nothing in the DOM and re-triggers nothing visible
    title.value = 'ghost-write';
    expect(target.textContent).toContain('idle');
    expect(target.textContent).not.toContain('ghost-write');

    // the other state touched by the branch effect keeps working
    watcher.value = 42;
    expect(watcher.value).toBe(42);
    probe();
  });

  it('disposes effect()/computed() created inside the branch on true -> false swap', () => {
    const flag = stateOf(true);
    const source = stateOf('hello');
    const branchLog = [];
    const computedLog = [];
    const target = mount(
      div(
        ifElse(() => flag.value,
          () => {
            // both register their teardown in the branch's reactive scope
            effect(() => { branchLog.push(source.value); });
            const derived = computed(() => source.value.length);
            // subscribe outside the framework to observe stale updates
            derived.subscribe(value => computedLog.push(value));
            return div(p(String(derived.value)));
          },
          () => div('idle')
        )
      )
    );
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

  it('detaches a ListState rendered inside the branch on swap', () => {
    const flag = stateOf(true);
    const items = listOf('a', 'b');
    const target = mount(
      div(
        ifElse(() => flag.value,
          () => div(loop(items, item => item)),
          () => div('idle')
        )
      )
    );
    expect(target.textContent).toContain('ab');
    // list registered one parent entry for the branch
    expect(items.parentElement.length).toBe(1);
    expect(items.views[0].length).toBe(2);

    flag.value = false;
    // branch swap removed the rendered rows and released the parent entry
    expect(target.textContent).toContain('idle');
    expect(target.textContent).not.toContain('a');
    expect(items.parentElement.length).toBe(0);
    expect(items.views.length).toBe(0);

    // flipping back re-attaches cleanly (no stale index bookkeeping)
    flag.value = true;
    expect(target.textContent).toContain('ab');
    expect(items.parentElement.length).toBe(1);
  });

  it('stops listen() callbacks returned by the branch on swap', () => {
    const flag = stateOf(true);
    const pulse = stateOf(0);
    let listenCalls = 0;
    const target = mount(
      div(
        ifElse(() => flag.value,
          () => div(listen(() => { pulse.value; listenCalls++; })),
          () => div('idle')
        )
      )
    );
    const callsWhenActive = listenCalls;
    expect(callsWhenActive).toBeGreaterThan(0);

    flag.value = false;
    // the listener was stopped: further global triggers must not invoke it
    const callsAfterSwap = listenCalls;
    pulse.value = 1;
    pulse.value = 2;
    expect(listenCalls).toBe(callsAfterSwap);
    expect(target.textContent).toContain('idle');
  });
});
