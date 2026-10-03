import { computed, createElement, Jetz, State } from './jetz.js'

// ---------- factories (deduplicate the repetitive helpers below) ----------

/**
 * Turns a tagged template's static chunks and interpolated values into children.
 * An interpolated function is probed once to see what it produces:
 * - primitives (string/number/boolean/null/undefined) become a computed()
 *   text state, so `div`Is online : ${() => online.value ? 'Yes' : 'No'}``
 *   re-renders whenever a state read inside the getter changes.
 * - objects (elements, components, states, arrays) keep the previous
 *   one-shot function-child behaviour and are passed through untouched.
 * In devtools mode, the probe is wrapped in try/catch for better DX.
 * In production, the probe runs without try/catch overhead.
 */
function templateChildren(strings, values) {
    const children = [];
    strings.forEach((chunk, index) => {
        if (chunk !== '') children.push(chunk);
        if (index >= values.length) return;
        
        const value = values[index];
        if (value === '') return;
        if (typeof value !== 'function') {
            children.push(value);
            return;
        }

        let probe;
        if (Jetz.devtools) {
            try { 
                probe = value(); 
            } catch (error) {
                console.error("Jetz: Error executing interpolated function.", value);
                throw error;
            }
        } else {
            probe = value();
        }

        const isTextGetter = probe == null || (typeof probe !== 'object' && typeof probe !== 'function');
        
        children.push(isTextGetter
            ? computed(() => {
                const result = value();
                return result == null || result === false ? '' : result;
            })
            : value);
    });
    return children;
}

/** Creates a named element factory bound to a tag. The factory doubles as a
 * tagged template — div`Is online : ${...}` — see templateChildren(). */
const elementOf = tag => (...args) => {
    if (args.length > 0 && Array.isArray(args[0]) && Object.hasOwn(args[0], 'raw'))
        return createElement(tag, templateChildren(args[0], args.slice(1)));
    return createElement(tag, ...args);
};

/** Creates an attribute helper: value => ({ [key]: value }) */
const attrOf = key => value => ({
    [key]: value instanceof State || typeof value === 'function' ? value : value.toString()
});

function cssValue(value) {
    if (typeof value === 'function') value = value();
    if (value instanceof State) value = value.value;
    return value == null || value === false ? '' : value;
}

/**
 * Coerces one interpolated value inside a `style` template into declaration text.
 * null/undefined/false contribute nothing (the `cond ? 'color:red' : false`
 * idiom), everything else is stringified as-is.
 */
function styleValue(value) {
    if (typeof value === 'function') value = value();
    if (value instanceof State) value = value.value;
    return value == null || value === false ? '' : value;
}

/** Creates a class attribute, supporting reactive tagged-template interpolations. */
export function css(value, ...values) {
    if (Array.isArray(value) && Object.hasOwn(value, 'raw')) {
        const strings = value;
        const render = () => strings.reduce((className, part, index) => {
            return className + part + (index < values.length ? cssValue(values[index]) : '');
        }, '');
        const isReactive = values.some(item => typeof item === 'function' || item instanceof State);
        return { class: isReactive ? computed(render) : render() };
    }
    if (typeof value === 'function') return { class: computed(value) };
    if (value instanceof State) return { class: value };
    return { class: value };
}

/** Creates an event-attribute helper: callback => ({ [event]: callback }) */
const listenerOf = event => callback => ({ [event]: callback });

/** Prefixes every key of an object ('data-…' / 'aria-…' attributes). */
const prefixedAttrs = (prefix, objData) => {
    const obj = {};
    for (const key in objData) {
        if (Object.hasOwnProperty.call(objData, key)) {
            obj[prefix + key] = objData[key];
        }
    }
    return obj;
};

// ---------- query ----------

export function find(selector) {
    return document.querySelector(selector);
}
export function findAll(selector) {
    return document.querySelectorAll(selector);
}

// ---------- attributes ----------

export const src = attrOf('src');
export const placeholder = attrOf('placeholder');
export const name = attrOf('name');
export const width = attrOf('width');
export const height = attrOf('height');
export const alt = attrOf('alt');
export const href = attrOf('href');
export const id = attrOf('id');
export const type = attrOf('type');
export const role = attrOf('role');
export const tabindex = attrOf('tabindex');
export const value = attrOf('value');
/**
 * Style attribute helper. Call it with an object of CSS properties, or use it as
 * a tagged template for a css block:
 *
 *   div(style({ color: 'red' }))
 *   div(style`
 *     max-width: 400px;
 *     margin: 30px auto;
 *   `)
 *
 * Interpolated functions/states stay reactive: the whole declaration block is
 * recomposed whenever a value they read changes.
 */
export const style = (value, ...values) => {
    if (Array.isArray(value) && Object.hasOwn(value, 'raw')) {
        const strings = value;
        const render = () => strings.reduce((cssText, part, index) => {
            return cssText + part + (index < values.length ? styleValue(values[index]) : '');
        }, '');
        const isReactive = values.some(item => typeof item === 'function' || item instanceof State);
        return { style: isReactive ? computed(render) : render() };
    }
    if (typeof value === 'function' || value instanceof State) {
        return { style: value instanceof State ? value : computed(value) };
    }
    return { style: value };
};
export const data_ = objData => prefixedAttrs('data-', objData);
export const aria_ = objAria => prefixedAttrs('aria-', objAria);
export const wrap = {
    wrap: 'hard'
};

// tagged template: merges static strings with interpolated values;
// interpolated functions render as reactive text (see templateChildren)
export function text(...content) {
    return templateChildren(content[0], content.slice(1));
}

// ---------- elements ----------

const inputOf = inputType => (...args) => {
    const element = createElement('input', ...args);
    element.attributes.type = inputType;
    return element;
};

export const inputButton = inputOf('button');
export const inputCheckbox = inputOf('checkbox');
export const inputColor = inputOf('color');
export const inputDate = inputOf('date');
export const inputDateTimeLocal = inputOf('datetime-local');
export const inputEmail = inputOf('email');
export const inputFile = inputOf('file');
export const inputHidden = inputOf('hidden');
export const inputImage = inputOf('image');
export const inputMonth = inputOf('month');
export const inputNumber = inputOf('number');
export const inputPassword = inputOf('password');
export const inputRadio = inputOf('radio');
export const inputRange = inputOf('range');
export const inputReset = inputOf('reset');
export const inputSearch = inputOf('search');
export const inputSubmit = inputOf('submit');
export const inputTel = inputOf('tel');
export const inputText = inputOf('text');
export const inputTime = inputOf('time');
export const inputUrl = inputOf('url');
export const inputWeek = inputOf('week');

export const htmlElement = elementOf('html');
export const head = elementOf('head');
export const body = elementOf('body');
export const title = elementOf('title');
export const base = elementOf('base');
export const link = elementOf('link');
export const meta = elementOf('meta');
export const styleElement = elementOf('style');

export const address = elementOf('address');
export const article = elementOf('article');
export const aside = elementOf('aside');
export const footer = elementOf('footer');
export const header = elementOf('header');
export const hgroup = elementOf('hgroup');
export const h1 = elementOf('h1');
export const h2 = elementOf('h2');
export const h3 = elementOf('h3');
export const h4 = elementOf('h4');
export const h5 = elementOf('h5');
export const h6 = elementOf('h6');
export const nav = elementOf('nav');
export const section = elementOf('section');
export const div = elementOf('div');
export const dd = elementOf('dd');
export const dl = elementOf('dl');
export const dt = elementOf('dt');
export const figcaption = elementOf('figcaption');
export const figure = elementOf('figure');
export const picture = elementOf('picture');
export const hr = elementOf('hr');
export const img = elementOf('img');
export const li = elementOf('li');
export const main = elementOf('main');
export const ol = elementOf('ol');
export const p = elementOf('p');
export const pre = elementOf('pre');
export const ul = elementOf('ul');
export const a = elementOf('a');
export const b = elementOf('b');
export const abbr = elementOf('abbr');
export const bdi = elementOf('bdi');
export const bdo = elementOf('bdo');
export const br = elementOf('br');
export const cite = elementOf('cite');
export const code = elementOf('code');
export const data = elementOf('data');
export const dfn = elementOf('dfn');
export const em = elementOf('em');
export const i = elementOf('i');
export const kbd = elementOf('kbd');
export const mark = elementOf('mark');
export const q = elementOf('q');
export const rp = elementOf('rp');
export const rt = elementOf('rt');
export const ruby = elementOf('ruby');
export const s = elementOf('s');
export const samp = elementOf('samp');
export const small = elementOf('small');
export const span = elementOf('span');
export const strong = elementOf('strong');
export const sub = elementOf('sub');
export const sup = elementOf('sup');
export const time = elementOf('time');
export const u = elementOf('u');
export const wbr = elementOf('wbr');
export const area = elementOf('area');
export const audio = elementOf('audio');
export const map = elementOf('map');
export const track = elementOf('track');
export const video = elementOf('video');
export const embed = elementOf('embed');
export const object = elementOf('object');
export const param = elementOf('param');
export const source = elementOf('source');
export const search = elementOf('search');
export const canvas = elementOf('canvas');
export const script = elementOf('script');
export const noscript = elementOf('noscript');
export const del = elementOf('del');
export const ins = elementOf('ins');
export const caption = elementOf('caption');
export const col = elementOf('col');
export const colgroup = elementOf('colgroup');
export const table = elementOf('table');
export const thead = elementOf('thead');
export const tbody = elementOf('tbody');
export const td = elementOf('td');
export const th = elementOf('th');
export const tr = elementOf('tr');
export const button = elementOf('button');
export const datalist = elementOf('datalist');
export const fieldset = elementOf('fieldset');
export const form = elementOf('form');
export const input = elementOf('input');
export const label = elementOf('label');
export const legend = elementOf('legend');
export const meter = elementOf('meter');
export const optgroup = elementOf('optgroup');
export const option = elementOf('option');
export const output = elementOf('output');
export const progress = elementOf('progress');
export const select = elementOf('select');
export const textarea = elementOf('textarea');
export const details = elementOf('details');
export const dialog = elementOf('dialog');
export const menu = elementOf('menu');
export const summary = elementOf('summary');
export const slot = elementOf('slot');
export const template = elementOf('template');
export const blockquote = elementOf('blockquote');
export const iframe = elementOf('iframe');
export const tfoot = elementOf('tfoot');

// ---------- event listener attributes ----------

export const onAbort = listenerOf('onabort');
export const onAnimationEnd = listenerOf('onanimationend');
export const onAnimationIteration = listenerOf('onanimationiteration');
export const onAnimationstart = listenerOf('onanimationstart');
export const onAuxclick = listenerOf('onauxclick');
export const onBeforecopy = listenerOf('onbeforecopy');
export const onBeforecut = listenerOf('onbeforecut');
export const onBeforeinput = listenerOf('onbeforeinput');
export const onBeforematch = listenerOf('onbeforematch');
export const onBeforepaste = listenerOf('onbeforepaste');
export const onBeforexrselect = listenerOf('onbeforexrselect');
export const onBlur = listenerOf('onblur');
export const onCancel = listenerOf('oncancel');
export const onCanplay = listenerOf('oncanplay');
export const onCanplaythrough = listenerOf('oncanplaythrough');
export const onChange = listenerOf('onchange');
export const onClick = listenerOf('onclick');
export const onClose = listenerOf('onclose');
export const onContentvisibilityautostatechange = listenerOf('oncontentvisibilityautostatechange');
export const onContextlost = listenerOf('oncontextlost');
export const onContextmenu = listenerOf('oncontextmenu');
export const onContextrestored = listenerOf('oncontextrestored');
export const onCopy = listenerOf('oncopy');
export const onCuechange = listenerOf('oncuechange');
export const onCut = listenerOf('oncut');
export const onDblclick = listenerOf('ondblclick');
export const onDrag = listenerOf('ondrag');
export const onDragend = listenerOf('ondragend');
export const onDragenter = listenerOf('ondragenter');
export const onDragleave = listenerOf('ondragleave');
export const onDragover = listenerOf('ondragover');
export const onDragstart = listenerOf('ondragstart');
export const onDrop = listenerOf('ondrop');
export const onDurationchange = listenerOf('ondurationchange');
export const onEmptied = listenerOf('onemptied');
export const onEnded = listenerOf('onended');
export const onError = listenerOf('onerror');
export const onFocus = listenerOf('onfocus');
export const onFormdata = listenerOf('onformdata');
export const onFullscreenchange = listenerOf('onfullscreenchange');
export const onFullscreenerror = listenerOf('onfullscreenerror');
export const onGotpointercapture = listenerOf('ongotpointercapture');
export const onInput = listenerOf('oninput');
export const onInvalid = listenerOf('oninvalid');
export const onKeydown = listenerOf('onkeydown');
export const onKeypress = listenerOf('onkeypress');
export const onKeyup = listenerOf('onkeyup');
export const onLoad = listenerOf('onload');
export const onLoadeddata = listenerOf('onloadeddata');
export const onLoadedmetadata = listenerOf('onloadedmetadata');
export const onLoadstart = listenerOf('onloadstart');
export const onLostpointercapture = listenerOf('onlostpointercapture');
export const onMousedown = listenerOf('onmousedown');
export const onMouseenter = listenerOf('onmouseenter');
export const onMouseleave = listenerOf('onmouseleave');
export const onMousemove = listenerOf('onmousemove');
export const onMouseout = listenerOf('onmouseout');
export const onMouseover = listenerOf('onmouseover');
export const onMouseup = listenerOf('onmouseup');
export const onMousewheel = listenerOf('onmousewheel');
export const onPaste = listenerOf('onpaste');
export const onPause = listenerOf('onpause');
export const onPlay = listenerOf('onplay');
export const onPlaying = listenerOf('onplaying');
export const onPointercancel = listenerOf('onpointercancel');
export const onPointerdown = listenerOf('onpointerdown');
export const onPointerenter = listenerOf('onpointerenter');
export const onPointerleave = listenerOf('onpointerleave');
export const onPointermove = listenerOf('onpointermove');
export const onPointerout = listenerOf('onpointerout');
export const onPointerover = listenerOf('onpointerover');
export const onPointerrawupdate = listenerOf('onpointerrawupdate');
export const onPointerup = listenerOf('onpointerup');
export const onProgress = listenerOf('onprogress');
export const onRatechange = listenerOf('onratechange');
export const onReset = listenerOf('onreset');
export const onResize = listenerOf('onresize');
export const onScroll = listenerOf('onscroll');
export const onSearch = listenerOf('onsearch');
export const onSecuritypolicyviolation = listenerOf('onsecuritypolicyviolation');
export const onSeeked = listenerOf('onseeked');
export const onSeeking = listenerOf('onseeking');
export const onSelect = listenerOf('onselect');
export const onSelectionchange = listenerOf('onselectionchange');
export const onSelectstart = listenerOf('onselectstart');
export const onSlotchange = listenerOf('onslotchange');
export const onStalled = listenerOf('onstalled');
export const onSubmit = listenerOf('onsubmit');
export const onSuspend = listenerOf('onsuspend');
export const onTimeupdate = listenerOf('ontimeupdate');
export const onToggle = listenerOf('ontoggle');
export const onTransitioncancel = listenerOf('ontransitioncancel');
export const onTransitionend = listenerOf('ontransitionend');
export const onTransitionrun = listenerOf('ontransitionrun');
export const onTransitionstart = listenerOf('ontransitionstart');
export const onVolumechange = listenerOf('onvolumechange');
export const onWaiting = listenerOf('onwaiting');
export const onWebkitanimationend = listenerOf('onwebkitanimationend');
export const onWebkitanimationiteration = listenerOf('onwebkitanimationiteration');
export const onWebkitanimationstart = listenerOf('onwebkitanimationstart');
export const onWebkitfullscreenchange = listenerOf('onwebkitfullscreenchange');
export const onWebkitfullscreenerror = listenerOf('onwebkitfullscreenerror');
export const onWebkittransitionend = listenerOf('onwebkittransitionend');
export const onWheel = listenerOf('onwheel');