import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Jetz, stateOf } from '../packages/jetz/src/jetz.js';
import { div, span, p, text } from '../packages/jetz/src/jetz-ui.js';

const mount = (element) => {
  const target = document.createElement('div');
  document.body.append(target);
  Jetz.mount(element, target);
  return target;
};

beforeEach(() => {
  document.body.innerHTML = '';
  Jetz.devtools = false;
});

describe('reactive tagged templates', () => {
  it('renders div`…${fn}` as text and updates it when the state changes', () => {
    const stateOnline = stateOf(true);
    const target = mount(div`Is Online : ${() => stateOnline.value ? 'Yes' : 'No'}`);
    expect(target.textContent).toContain('Is Online : Yes');
    stateOnline.value = false;
    expect(target.textContent).toContain('Is Online : No');
    stateOnline.value = true;
    expect(target.textContent).toContain('Is Online : Yes');
  });

  it('interpolates state values directly in an element tag template', () => {
    const name = stateOf('Deva');
    const target = mount(span`Hello ${name}!`);
    expect(target.textContent).toBe('Hello Deva!');
    name.value = 'Arofi';
    expect(target.textContent).toBe('Hello Arofi!');
  });

  it('keeps static-only tag templates working', () => {
    const target = mount(p`just text`);
    expect(target.textContent).toBe('just text');
  });

  it('renders text`…${fn}` reactively (previously a one-shot call)', () => {
    const count = stateOf(1);
    const target = mount(div(text`Count : ${() => count.value * 2}`));
    expect(target.textContent).toContain('Count : 2');
    count.value = 5;
    expect(target.textContent).toContain('Count : 10');
  });

  it('keeps text`…${state}` interpolation reactive (existing behaviour)', () => {
    const count = stateOf(1);
    const count2 = stateOf(10);
    const target = mount(div(text`Count : ${count} and ${count2}`));
    expect(target.textContent).toBe('Count : 1 and 10');
    count.value = 2;
    expect(target.textContent).toBe('Count : 2 and 10');
  });

  it('shows 0 from a getter but drops null/false results', () => {
    const count = stateOf(0);
    const nothing = stateOf(null);
    const target = mount(
      div(text`[${() => count.value}] [${() => nothing.value}] [${() => false}]`)
    );
    expect(target.textContent).toBe('[0] [] []');
    count.value = 7;
    expect(target.textContent).toBe('[7] [] []');
  });

  it('still renders interpolated components and elements as children', () => {
    const Badge = () => div('badge');
    const target = mount(div`Status: ${Badge} (${span('inline')})`);
    expect(target.textContent).toBe('Status: badge (inline)');
  });

  it('warns under devtools when a plain string contains a flattened function', () => {
    const stateOnline = stateOf(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Jetz.devtools = true;
    try {
      const target = mount(div(`Is Online : ${() => stateOnline.value ? 'Yes' : 'No'}`));
      const messages = warn.mock.calls.map(call => String(call[0]));
      expect(messages.some(message => message.includes('tagged template'))).toBe(true);
      // the flattened source is dead text: it renders literally
      expect(target.textContent).toContain('() =>');
      // and flipping the state does not change it
      stateOnline.value = false;
      expect(target.textContent).toContain('() =>');
      expect(target.textContent).toContain('Yes');
    } finally {
      warn.mockRestore();
    }
  });

  it('stays silent without devtools', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      mount(div(`Is Online : ${() => true}`));
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe('tagged template node topology', () => {
  const collectTexts = (root) => {
    const out = [];
    const walk = node => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) out.push(child);
        else walk(child);
      }
    };
    walk(root);
    return out;
  };

  it('splits static and dynamic parts into separate Text nodes and only rewrites the dynamic one', () => {
    const stateOnline = stateOf(true);
    const target = mount(div`Is Online : ${() => stateOnline.value ? 'Yes' : 'No'}`);
    const row = target.firstChild;
    // "Is Online : " and the getter result each own one Text node;
    // the trailing empty chunk must NOT become an empty Text node
    expect(row.childNodes.length).toBe(2);
    const staticNode = row.childNodes[0];
    const dynamicNode = row.childNodes[1];
    expect(staticNode.nodeType).toBe(Node.TEXT_NODE);
    expect(dynamicNode.nodeType).toBe(Node.TEXT_NODE);
    expect(staticNode.data).toBe('Is Online : ');
    expect(dynamicNode.data).toBe('Yes');

    stateOnline.value = false;
    // the same two nodes are reused: static text is never re-created or
    // rewritten, the update only swaps the data of the dynamic node
    expect(row.childNodes.length).toBe(2);
    expect(row.childNodes[0]).toBe(staticNode);
    expect(row.childNodes[1]).toBe(dynamicNode);
    expect(staticNode.data).toBe('Is Online : ');
    expect(dynamicNode.data).toBe('No');
  });

  it('creates one Text node per static chunk and per interpolated value', () => {
    const a = stateOf('A');
    const b = stateOf('B');
    const target = mount(div`x${a}y${b}z`);
    const row = target.firstChild;
    expect(Array.from(row.childNodes).map(node => node.data)).toEqual(['x', 'A', 'y', 'B', 'z']);
    a.value = 'A2';
    expect(row.childNodes.length).toBe(5);
    expect(row.childNodes[1].data).toBe('A2');
    expect(row.childNodes[3].data).toBe('B');
  });

  it('renders a lone interpolation as a single Text node (no empty nodes around it)', () => {
    const count = stateOf(1);
    const target = mount(div`${() => count.value}`);
    expect(target.firstChild.childNodes.length).toBe(1);
    expect(target.firstChild.firstChild.data).toBe('1');
    count.value = 2;
    expect(target.firstChild.childNodes.length).toBe(1);
    expect(target.firstChild.firstChild.data).toBe('2');
  });

  it('scales to a thousand reactive strings: one state change rewrites exactly one Text node', () => {
    const count = 1000;
    const states = Array.from({ length: count }, (_, index) => stateOf(index));
    const target = mount(div(...states.map(s => div`value ${() => s.value}`)));

    const texts = collectTexts(target);
    // 1000 rows x (one static chunk + one dynamic node), no empty leftovers
    expect(texts.length).toBe(count * 2);

    const before = texts.map(node => node.data);
    states[7].value = 999;
    const after = texts.map(node => node.data);

    const changed = after.filter((data, index) => data !== before[index]).length;
    // O(dependents): flipping one state touches one node, not the whole page
    expect(changed).toBe(1);
    expect(texts[15].data).toBe('999'); // row 7, dynamic node
    expect(texts[14].data).toBe('value '); // its static sibling untouched
  });
});
