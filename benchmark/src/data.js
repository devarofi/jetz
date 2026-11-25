/**
 * The data set every arm renders.
 *
 * Shaped after the published js-framework-benchmark table so results stay
 * comparable with other projects: one keyed label cell, one text cell, then six
 * cells made of a two-character prefix plus a link. All arms receive the SAME
 * rows (generated from a fixed seed), so a difference in the numbers can only
 * come from how a framework turns those rows into DOM.
 */

export const DATA_LEN = 18;
/** col1 + col-md-hidden + six col-sm-hidden cells. */
export const CELL_COUNT = 8;

const ADJECTIVES = ['pretty', 'elegant', 'self', 'confused', 'large', 'recent', 'onerous', 'furry', 'humiliating', 'ad hoc', 'materialistic', 'delicious', 'cut', 'tawdry', 'valuable', 'vast', 'unwritten', 'awful', 'supportive', 'outstanding'];
const NOUNS = ['her', 'them', 'myself', 'people', 'Vietnamese', 'Cantonese', 'German', 'object', 'program', 'bird', 'window', 'panel', 'flower', 'rabbit', 'car', 'coffeetable', 'couch', 'book', 'sea', 'horse'];
const VERBS = ['take', 'feel', 'leave', 'sing', 'swim', 'appear', 'read', 'cry', 'buy', 'die', 'hate', 'understand', 'promote', 'wait', 'remain', 'produce', 'write', 'lift', 'let', 'jump'];
const POOL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/** Deterministic PRNG: the same seed always yields the same table. */
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Ids keep rising across calls. Re-creating a table must therefore produce keys
 * no arm has seen before — otherwise a keyed implementation could "win" by
 * recycling DOM it was supposed to build again.
 */
let nextId = 1;
export function resetIds() { nextId = 1; }

export function makeRows(count, seed = 20261018) {
    const rnd = mulberry32(seed);
    const rows = new Array(count);
    for (let i = 0; i < count; i++) {
        const data = new Array(DATA_LEN);
        for (let d = 0; d < DATA_LEN; d++) data[d] = POOL[(rnd() * POOL.length) | 0];
        rows[i] = {
            id: nextId++,
            label: '',
            text: `${ADJECTIVES[(rnd() * ADJECTIVES.length) | 0]} ${NOUNS[(rnd() * NOUNS.length) | 0]} ${VERBS[(rnd() * VERBS.length) | 0]}`,
            data
        };
    }
    return rows;
}

/** Indices updated by the "partial update" op: every tenth row, like the published suite. */
export function tenthIndices(count) {
    const out = [];
    for (let i = 0; i < count; i += 10) out.push(i);
    return out;
}

export const UPDATE_LABEL = 'Hello World!!!';
export const SELECT_LABEL = 'selected';

/** The two rows the "swap rows" op exchanges. */
export const SWAP_A = 1;
export const SWAP_B = 998;

/**
 * The six trailing cells, as descriptors, so all four arms emit byte-identical
 * markup: five `<span class="pre">` cells and a final `<span class="post">`.
 */
export function dataCells(row) {
    const out = [];
    for (let i = 0; i < DATA_LEN; i += 3) {
        out.push({
            cls: i + 3 >= DATA_LEN ? 'post' : 'pre',
            pair: row.data[i] + row.data[i + 1],
            link: row.data[i + 2]
        });
    }
    return out;
}

/* -------------------------------------------------------------------------- */
/*  Reading the rendered table back — used to verify an arm really rendered    */
/* -------------------------------------------------------------------------- */

export function rowCount(tbody) { return tbody ? tbody.children.length : 0; }

export function labelAt(tbody, index) {
    const tr = tbody?.children[index];
    if (!tr) return null;
    const a = tr.querySelector('td.col1 a');
    return a ? a.textContent : null;
}

export function isSelectedAt(tbody, index) {
    const tr = tbody?.children[index];
    return tr ? tr.classList.contains('danger') : false;
}

/** The text column — used to prove a swap moved the right rows. */
export function textAt(tbody, index) {
    const tr = tbody?.children[index];
    if (!tr) return null;
    const a = tr.querySelector('td.col-md-hidden a');
    return a ? a.textContent : null;
}
