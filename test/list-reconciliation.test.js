/**
 * Keyed list reconciliation: what a `loop()` may do to the DOM and to the
 * components it owns.
 *
 * The contract these tests protect:
 *  - a row that only changes position keeps its element, its component, its
 *    effects and any state written into its DOM nodes;
 *  - a row that leaves the list is released exactly once, whatever shape the
 *    operation has (single removal, replacement, clear);
 *  - the reconciler does not pay for a whole-body rebuild when a few rows move,
 *    so several tests assert the number of DOM operations directly. Those
 *    counts are deliberate: they are the performance invariant, not an
 *    incidental detail.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { batch, computed, effect, Jetz, listOf, loop, onDestroy, rawOf, rowOf, touchRow } from '../packages/jetz/src/jetz.js';
import { div, span } from '../packages/jetz/src/jetz-ui.js';

const mount = (element) => {
  const target = document.createElement('div');
  document.body.append(target);
  Jetz.mount(element, target);
  return target;
};

const rows = (...ids) => ids.map((id) => rowOf({ id, label: `row ${id}` }));
const orderOf = (body) => Array.from(body.children, (node) => node.dataset.id).join(',');

/**
 * `onDestroy` of a detached component is drained by the lifecycle sweep, which
 * runs on the next state trigger. Anything that checks destruction settles
 * first, so the assertion is about the count and not about the scheduling.
 */
const settle = async () => {
  Jetz.triggerByState();
  await Promise.resolve();
  await Promise.resolve();
};

/**
 * A row that owns a nested function component and an effect, plus a counter of
 * how often each was built. A row that is rebuilt raises `builds`; a row that
 * is dropped raises `destroys` once its sweep runs.
 */
function keyedTable(items) {
  const counts = { builds: 0, nested: 0, effects: 0, destroys: 0 };
  const Nested = (item) => {
    counts.nested++;
    onDestroy(() => counts.destroys++);
    return span(computed(() => item.label));
  };
  const Row = (item) => {
    counts.builds++;
    effect(() => {
      counts.effects++;
      item.label;
    });
    return div({ 'data-id': item.id }, span(computed(() => item.label)), () => Nested(item));
  };
  const body = mount(div(loop(items, (item) => item.id, Row))).querySelector('div');
  return { items, body, counts };
}

/** How many nodes were placed into `body` while `act` ran (a move is a placement). */
async function countPlacements(body, act) {
  let added = 0;
  const observer = new MutationObserver((records) => {
    for (const record of records) added += record.addedNodes.length;
  });
  observer.observe(body, { childList: true });
  await act();
  await Promise.resolve();
  observer.disconnect();
  return added;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('keyed reconciliation', () => {
  it('reorders rows by keeping every node it already had', () => {
    const items = listOf(...rows(1, 2, 3, 4));
    const { body } = keyedTable(items);
    const byId = Object.fromEntries(Array.from(body.children, (node) => [node.dataset.id, node]));

    items.set([items.values[3], items.values[1], items.values[2], items.values[0]]);

    expect(orderOf(body)).toBe('4,2,3,1');
    for (const [id, node] of Object.entries(byId)) {
      expect(body.querySelector(`[data-id="${id}"]`)).toBe(node);
      expect(node.isConnected).toBe(true);
    }
  });

  it('moves only the rows that are out of order', async () => {
    const items = listOf(...rows(1, 2, 3, 4, 5));
    const { body } = keyedTable(items);
    const [one, two, three, four, five] = items.values;

    // one row changes place: exactly one node has to be re-parented
    expect(await countPlacements(body, () => items.set([five, one, two, three, four]))).toBe(1);
    expect(orderOf(body)).toBe('5,1,2,3,4');
  });

  it('relocates a distant swap without touching the run between the two rows', async () => {
    const items = listOf(...rows(1, 2, 3, 4, 5));
    const { body } = keyedTable(items);
    const [one, two, three, four, five] = items.values;

    // rows 1 and 4 trade places: 2, 3 and 5 stay exactly where they are
    expect(await countPlacements(body, () => items.set([four, two, three, one, five]))).toBe(2);
    expect(orderOf(body)).toBe('4,2,3,1,5');
  });

  it('reverses by moving every row except the one the ordered run keeps', async () => {
    const items = listOf(...rows(1, 2, 3, 4, 5));
    const { body } = keyedTable(items);
    const byId = Object.fromEntries(Array.from(body.children, (node) => [node.dataset.id, node]));

    const moved = await countPlacements(body, () => items.set(items.values.slice().reverse()));

    expect(orderOf(body)).toBe('5,4,3,2,1');
    // a full reversal has an increasing run of one, so n-1 rows must move — and
    // no row may be rebuilt to achieve it
    expect(moved).toBe(4);
    expect(body.children.length).toBe(5);
    for (const [id, node] of Object.entries(byId)) {
      expect(body.querySelector(`[data-id="${id}"]`)).toBe(node);
    }
  });

  it('moves the first row to the end in a single placement', async () => {
    const items = listOf(...rows(1, 2, 3, 4, 5));
    const { body } = keyedTable(items);
    const [one, two, three, four, five] = items.values;

    // the mirror of last-to-first: one row leaves the front, the run stays put
    expect(await countPlacements(body, () => items.set([two, three, four, five, one]))).toBe(1);
    expect(orderOf(body)).toBe('2,3,4,5,1');
  });

  it('reuses every row across an arbitrary permutation', async () => {
    const items = listOf(...rows(1, 2, 3, 4, 5, 6));
    const { body, counts } = keyedTable(items);
    await settle();
    const byId = Object.fromEntries(Array.from(body.children, (node) => [node.dataset.id, node]));
    const buildsBefore = counts.builds;

    // a fixed "random" order. Its longest increasing run of previous positions
    // is 3 (rows 1, 2, 4), so exactly the other three rows may move — the
    // minimal-move invariant, asserted directly because it is the point.
    const moved = await countPlacements(body, () => items.set([3, 6, 1, 5, 2, 4].map((id) => items.values.find((v) => v.id === id))));

    expect(orderOf(body)).toBe('3,6,1,5,2,4');
    expect(moved).toBe(3);
    expect(counts.builds).toBe(buildsBefore);
    expect(counts.destroys).toBe(0);
    for (const [id, node] of Object.entries(byId)) {
      expect(body.querySelector(`[data-id="${id}"]`)).toBe(node);
    }
  });

  it('never destroys a row that only changed position', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body, counts } = keyedTable(items);
    await settle();
    const buildsBefore = counts.builds;

    items.set([items.values[2], items.values[0], items.values[1]]);
    await settle();

    expect(orderOf(body)).toBe('3,1,2');
    expect(counts.builds).toBe(buildsBefore);
    expect(counts.destroys).toBe(0);
  });

  it('keeps DOM state written into a row across a reorder', () => {
    const items = listOf(...rows(1, 2, 3));
    const { body } = keyedTable(items);
    body.children[0].dataset.mark = 'typed';

    items.set(items.values.slice().reverse());

    const marked = body.querySelector('[data-mark="typed"]');
    expect(marked).not.toBeNull();
    expect(marked.dataset.id).toBe('1');
  });

  it('places a row inserted in the middle without touching the others', async () => {
    const items = listOf(...rows(1, 2, 4, 5));
    const { body } = keyedTable(items);

    const added = await countPlacements(body, () => items.insertAt(2, rowOf({ id: 3, label: 'row 3' })));

    expect(orderOf(body)).toBe('1,2,3,4,5');
    expect(added).toBe(1);
  });

  it('sorts through rawOf and reuses every row', () => {
    const items = listOf(rowOf({ id: 1, label: 'b' }), rowOf({ id: 2, label: 'a' }), rowOf({ id: 3, label: 'c' }));
    const { body } = keyedTable(items);
    const byId = Object.fromEntries(Array.from(body.children, (node) => [node.dataset.id, node]));

    items.sort((x, y) => rawOf(x).label.localeCompare(rawOf(y).label));

    expect(Array.from(body.children, (node) => node.dataset.id).join(',')).toBe('2,1,3');
    for (const [id, node] of Object.entries(byId)) {
      expect(body.querySelector(`[data-id="${id}"]`)).toBe(node);
    }
  });

  it('renders one row per key when two items share a key', async () => {
    // A key addresses one row, so duplicates cannot take part in minimal
    // moves: the plan declines and the previous position-by-position walk
    // handles it. Documented behaviour — the item that owns the key LAST in
    // the list is the one the row ends up showing, and nothing throws.
    const items = listOf(...rows(1, 2));
    const { body } = keyedTable(items);
    const twin = rowOf({ id: 1, label: 'row 1 twin' });

    items.set([items.values[0], items.values[1], twin]);
    await settle();

    expect(orderOf(body)).toBe('2,1');
    expect(body.lastElementChild.textContent).toBe('row 1 twinrow 1 twin');
  });

  it('falls back to the walk when a retained view is not in this parent', () => {
    const items = listOf(...rows(1, 2, 3));
    const { body } = keyedTable(items);

    // an outside removal leaves a key map entry whose node is gone; the list
    // must still end up in the right order rather than relocate nothing
    body.children[1].remove();
    items.set([items.values[0], items.values[1], items.values[2]]);

    expect(orderOf(body)).toBe('1,2,3');
  });
});

describe('bulk replacement and clearing', () => {
  it('builds each row element exactly once when the list is set', () => {
    const items = listOf();
    const { body } = keyedTable(items);
    const create = vi.spyOn(document, 'createElement');

    items.set(rows(1, 2, 3));

    // one div per row plus two spans per row; the surrounding table costs nothing
    expect(create.mock.calls.length).toBe(9);
    create.mockRestore();
    expect(orderOf(body)).toBe('1,2,3');
  });

  it('builds each row element exactly once when a row is pushed', () => {
    const items = listOf(...rows(1));
    keyedTable(items);
    const create = vi.spyOn(document, 'createElement');

    items.push(rowOf({ id: 2, label: 'row 2' }));

    expect(create.mock.calls.length).toBe(3);
    create.mockRestore();
  });

  it('replaces the whole body in one DOM operation', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body } = keyedTable(items);
    const replace = vi.spyOn(body, 'replaceChildren');

    items.set(rows(4, 5, 6));

    expect(replace.mock.calls.length).toBe(1);
    expect(orderOf(body)).toBe('4,5,6');
    replace.mockRestore();
  });

  it('keeps a sibling the host owns instead of deleting it with the rows', () => {
    const items = listOf(...rows(1, 2));
    const target = document.createElement('div');
    document.body.append(target);
    Jetz.mount(div(div('Totals', loop(items, (item) => item.id, (item) => div({ 'data-id': item.id })))), target);
    const body = target.querySelector('div').lastElementChild;

    items.set(rows(3, 4));

    expect(orderOf(body)).toBe('3,4');
    expect(target.textContent).toContain('Totals');
    expect(body.children.length).toBe(2);
  });

  it('clears the list without leaving any row behind', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body, counts } = keyedTable(items);

    items.clear();
    await settle();

    expect(body.children.length).toBe(0);
    expect(counts.destroys).toBe(3);
  });
});

describe('list disposal and lifecycle', () => {
  it('destroys a dropped row and its nested component exactly once', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body, counts } = keyedTable(items);
    await settle();

    items.removeAt(1);
    await settle();
    // a second sweep must not repeat the callback for the same component
    Jetz.triggerByState();

    expect(orderOf(body)).toBe('1,3');
    expect(counts.destroys).toBe(1);
  });

  it('destroys every row once when the list is replaced', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { counts } = keyedTable(items);
    await settle();

    items.set(rows(4, 5));
    await settle();
    Jetz.triggerByState();

    expect(counts.destroys).toBe(3);
  });

  it('releases the effect of a row that leaves the list', async () => {
    const items = listOf(...rows(1, 2));
    const { counts } = keyedTable(items);
    await settle();

    const victim = items.values[0];
    items.removeAt(0);
    await settle();
    const runsBefore = counts.effects;

    victim.set({ label: 'after removal' });
    await settle();

    expect(counts.effects).toBe(runsBefore);
  });

  it('gives a destroy callback the same DOM state whether one row or the whole body left', async () => {
    const connected = [];
    const items = listOf(...rows(1, 2, 3));
    const Nested = (item) => {
      const node = span(computed(() => item.label));
      onDestroy(() => connected.push(node.o.isConnected));
      return node;
    };
    const body = mount(div(
      loop(items, (item) => item.id, (item) => div({ 'data-id': item.id }, () => Nested(item)))
    )).querySelector('div');
    await settle();

    items.removeAt(0);
    await settle();
    const afterOneRemoval = [...connected];

    items.clear();
    await settle();

    // a bulk detach must not deliver a different lifecycle than a per-row one:
    // both drain through the sweep, after the node has left the document
    expect(afterOneRemoval).toEqual([false]);
    expect(connected).toEqual([false, false, false]);
    expect(body.children.length).toBe(0);
  });
});

describe('list reactivity survives reconciliation', () => {
  it('updates a touched row inside batch without rebuilding any row', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body, counts } = keyedTable(items);
    await settle();
    const buildsBefore = counts.builds;
    const byId = Object.fromEntries(Array.from(body.children, (node) => [node.dataset.id, node]));

    batch(() => {
      rawOf(items.values[1]).label = 'edited';
      touchRow(items.values[1]);
    });
    await settle();

    expect(body.children[1].textContent).toBe('editededited');
    expect(counts.builds).toBe(buildsBefore);
    for (const [id, node] of Object.entries(byId)) {
      expect(body.querySelector(`[data-id="${id}"]`)).toBe(node);
    }
  });

  it('fires the list version signal once per mutation', () => {
    const items = listOf(...rows(1));
    const seen = [];
    items.subscribe(() => seen.push(items.size));

    items.push(rowOf({ id: 2, label: 'row 2' }));
    items.set(rows(3, 4, 5));
    items.clear();

    expect(seen).toEqual([2, 3, 0]);
  });

  it('keeps a nested component reading its own item after a reorder', async () => {
    const items = listOf(...rows(1, 2, 3));
    const { body } = keyedTable(items);

    items.set([items.values[2], items.values[0], items.values[1]]);
    rawOf(items.values[0]).label = 'renamed';
    touchRow(items.values[0]);
    await settle();

    expect(Array.from(body.children, (node) => `${node.dataset.id}:${node.textContent}`))
      .toEqual(['3:renamedrenamed', '1:row 1row 1', '2:row 2row 2']);
  });
});
