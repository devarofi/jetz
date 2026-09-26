import { createElement } from './jetz.js'

// ---------- factories (deduplicate the repetitive helpers below) ----------

/** Creates a named element factory bound to a tag. */
const elementOf = tag => (...args) => createElement(tag, ...args);

/** Creates an attribute helper: value => ({ [key]: value }) */
const attrOf = key => value => ({ [key]: value.toString() });

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
export const css = attrOf('class');
export const style = styles => ({ style: styles });
export const data_ = objData => prefixedAttrs('data-', objData);
export const aria_ = objAria => prefixedAttrs('aria-', objAria);
export const wrap = {
    wrap: 'hard'
};

// tagged template: merges static strings with interpolated values
export function text(...content) {
    const strings = content[0].raw;
    const values = content.slice(1);
    const merged = [];
    strings.forEach((str, i) => {
        merged.push(str);
        if (i < values.length) merged.push(values[i]);
    });
    return merged;
}

// ---------- elements ----------

export const inputText = (...args) => createElement('input', { type: 'text' }, ...args);
export const inputNumber = (...args) => createElement('input', { type: 'number' }, ...args);

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