import { createElement } from './jetz.js'
export function find(selector){
    return document.querySelector(selector);
}
export function findAll(selector){
    return document.querySelectorAll(selector);
}
// Attributes
export function src(source){
    return { src: source.toString() };
}
export function placeholder(text){
    return { placeholder: text.toString() };
}
export function name(text){
    return { name: text.toString() };
}
export function width(number){
    return { width: number.toString() };
}
export function height(number){
    return { height: number.toString() };
}
export function alt(text){
    return { alt: text.toString() };
}
export function href(text){
    return { href: text.toString() }
}
export function id(text){
    return { id: text.toString() }
}
export function type(text){
    return { type: text.toString() }
}
export function style(styles){
    return { style: styles }
}
export function role(role){
    return { role: role.toString() }
}
export function tabindex(tabindex){
    return { tabindex: tabindex.toString() }
}
export function data_(objData){
    let obj = {};
    for (const key in objData) {
        if (Object.hasOwnProperty.call(objData, key)) {
            const value = objData[key];
            obj['data-' + key] = value;
        }
    }
    return obj;
}
export function aria_(objAria){
    let obj = {};
    for (const key in objAria) {
        if (Object.hasOwnProperty.call(objAria, key)) {
            const value = objAria[key];
            obj['aria-' + key] = value;
        }
    }
    return obj;
}
export const wrap = {
    wrap: 'hard'
};
export function text(...content){
    let originalText = content[0].raw;
    let raw = content;
    let length = originalText.length + raw.length -1;

    let originalTextIndex = 0;
    let rawIndex = 1;
    let contentMerging = [];
    for (let i = 0; i < length; i++) {
        if(i % 2 === 0){
            contentMerging.push(originalText[originalTextIndex]);
            originalTextIndex++;
        }else{
            contentMerging.push(raw[rawIndex]);
            rawIndex++;
        }
    } 
    return contentMerging;
}
export function css(value){
    return { class: value.toString() };
}
export const value = val => ({ value: val.toString() });
// INPUT
export function inputText(...args) {
    return createElement('input', { type:'text' }, ...args);
}
export function inputNumber(...args) {
    return createElement('input', { type:'number' }, ...args);
}
export function address(...args){
    return createElement('address', ...args);
}
export function article(...args){
    return createElement('article', ...args);
}
export function aside(...args){
    return createElement('aside', ...args);
}
export function footer(...args){
    return createElement('footer', ...args);
}
export function header(...args){
    return createElement('header', ...args);
}
export function hgroup(...args){
    return createElement('hgroup', ...args);
}
export function h1(...args){
    return createElement('h1', ...args);
}
export function h2(...args){
    return createElement('h2', ...args);
}
export function h3(...args){
    return createElement('h3', ...args);
}
export function h4(...args){
    return createElement('h4', ...args);
}
export function h5(...args){
    return createElement('h5', ...args);
}
export function h6(...args){
    return createElement('h6', ...args);
}
export function nav(...args){
    return createElement('nav', ...args);
}
export function section(...args){
    return createElement('section', ...args);
}
export function div(...args){
    return createElement('div', ...args);
}
export function dd(...args){
    return createElement('dd', ...args);
}
export function dl(...args){
    return createElement('dl', ...args);
}
export function dt(...args){
    return createElement('dt', ...args);
}
export function figcaption(...args){
    return createElement('figcaption', ...args);
}
export function figure(...args){
    return createElement('figure', ...args);
}
export function picture(...args){
    return createElement('picture', ...args);
}
export function hr(...args){
    return createElement('hr', ...args);
}
export function img(...args){
    return createElement('img', ...args);
}
export function li(...args){
    return createElement('li', ...args);
}
export function main(...args){
    return createElement('main', ...args);
}
export function ol(...args){
    return createElement('ol', ...args);
}
export function p(...args){
    return createElement('p', ...args);
}
export function pre(...args){
    return createElement('pre', ...args);
}
export function ul(...args){
    return createElement('ul', ...args);
}
export function a(...args){
    return createElement('a', ...args);
}
export function b(...args){
    return createElement('b', ...args);
}
export function abbr(...args){
    return createElement('abbr', ...args);
}
export function bdi(...args){
    return createElement('bdi', ...args);
}
export function bdo(...args){
    return createElement('bdo', ...args);
}
export function br(...args){
    return createElement('br', ...args);
}
export function cite(...args){
    return createElement('cite', ...args);
}
export function code(...args){
    return createElement('code', ...args);
}
export function data(...args){
    return createElement('data', ...args);
}
export function dfn(...args){
    return createElement('dfn', ...args);
}
export function em(...args){
    return createElement('em', ...args);
}
export function i(...args){
    return createElement('i', ...args);
}
export function kbd(...args){
    return createElement('kbd', ...args);
}
export function mark(...args){
    return createElement('mark', ...args);
}
export function q(...args){
    return createElement('q', ...args);
}
export function rp(...args){
    return createElement('rp', ...args);
}
export function rt(...args){
    return createElement('rt', ...args);
}
export function ruby(...args){
    return createElement('ruby', ...args);
}
export function s(...args){
    return createElement('s', ...args);
}
export function samp(...args){
    return createElement('samp', ...args);
}
export function small(...args){
    return createElement('small', ...args);
}
export function span(...args){
    return createElement('span', ...args);
}
export function strong(...args){
    return createElement('strong', ...args);
}
export function sub(...args){
    return createElement('sub', ...args);
}
export function sup(...args){
    return createElement('sup', ...args);
}
export function time(...args){
    return createElement('time', ...args);
}
export function u(...args){
    return createElement('u', ...args);
}
export function wbr(...args){
    return createElement('wbr', ...args);
}
export function area(...args){
    return createElement('area', ...args);
}
export function audio(...args){
    return createElement('audio', ...args);
}
export function map(...args){
    return createElement('map', ...args);
}
export function track(...args){
    return createElement('track', ...args);
}
export function video(...args){
    return createElement('video', ...args);
}
export function embed(...args){
    return createElement('embed', ...args);
}
export function object(...args){
    return createElement('object', ...args);
}
export function param(...args){
    return createElement('param', ...args);
}
export function source(...args){
    return createElement('source', ...args);
}
export function canvas(...args){
    return createElement('canvas', ...args);
}
export function script(...args){
    return createElement('script', ...args);
}
export function noscript(...args){
    return createElement('noscript', ...args);
}
export function del(...args){
    return createElement('del', ...args);
}
export function ins(...args){
    return createElement('ins', ...args);
}
export function caption(...args){
    return createElement('caption', ...args);
}
export function col(...args){
    return createElement('col', ...args);
}
export function colgroup(...args){
    return createElement('colgroup', ...args);
}
export function table(...args){
    return createElement('table', ...args);
}
export function thead(...args){
    return createElement('thead', ...args);
}
export function tbody(...args){
    return createElement('tbody', ...args);
}
export function td(...args){
    return createElement('td', ...args);
}
export function th(...args){
    return createElement('th', ...args);
}
export function tr(...args){
    return createElement('tr', ...args);
}
export function button(...args){
    return createElement('button', ...args);
}
export function datalist(...args){
    return createElement('datalist', ...args);
}
export function fieldset(...args){
    return createElement('fieldset', ...args);
}
export function form(...args){
    return createElement('form', ...args);
}
export function input(...args){
    return createElement('input', ...args);
}
export function label(...args){
    return createElement('label', ...args);
}
export function legend(...args){
    return createElement('legend', ...args);
}
export function meter(...args){
    return createElement('meter', ...args);
}
export function optgroup(...args){
    return createElement('optgroup', ...args);
}
export function option(...args){
    return createElement('option', ...args);
}
export function output(...args){
    return createElement('output', ...args);
}
export function progress(...args){
    return createElement('progress', ...args);
}
export function select(...args){
    return createElement('select', ...args);
}
export function textarea(...args){
    return createElement('textarea', ...args);
}
export function details(...args){
    return createElement('details', ...args);
}
export function dialog(...args){
    return createElement('dialog', ...args);
}
export function menu(...args){
    return createElement('menu', ...args);
}
export function summary(...args){
    return createElement('summary', ...args);
}
export function template(...args){
    return createElement('template', ...args);
}
export function blockquote(...args){
    return createElement('blockquote', ...args);
}
export function iframe(...args){
    return createElement('iframe', ...args);
}
export function tfoot(...args){
    return createElement('tfoot', ...args);
}
// Event Listener
export const onAbort = callback => ({
    onabort: callback
})
export const onAnimationEnd = callback => ({
    onanimationend: callback
})
export const onAnimationIteration = callback => ({
    onanimationiteration: callback
})
export const onAnimationstart = callback => ({
    onanimationstart: callback
})
export const onAuxclick = callback => ({
    onauxclick: callback
})
export const onBeforecopy = callback => ({
    onbeforecopy: callback
})
export const onBeforecut = callback => ({
    onbeforecut: callback
})
export const onBeforeinput = callback => ({
    onbeforeinput: callback
})
export const onBeforematch = callback => ({
    onbeforematch: callback
})
export const onBeforepaste = callback => ({
    onbeforepaste: callback
})
export const onBeforexrselect = callback => ({
    onbeforexrselect: callback
})
export const onBlur = callback => ({
    onblur: callback
})
export const onCancel = callback => ({
    oncancel: callback
})
export const onCanplay = callback => ({
    oncanplay: callback
})
export const onCanplaythrough = callback => ({
    oncanplaythrough: callback
})
export const onChange = callback => ({
    onchange: callback
})
export const onClick = callback => ({
    onclick: callback
})
export const onClose = callback => ({
    onclose: callback
})
export const onContentvisibilityautostatechange = callback => ({
    oncontentvisibilityautostatechange: callback
})
export const onContextlost = callback => ({
    oncontextlost: callback
})
export const onContextmenu = callback => ({
    oncontextmenu: callback
})
export const onContextrestored = callback => ({
    oncontextrestored: callback
})
export const onCopy = callback => ({
    oncopy: callback
})
export const onCuechange = callback => ({
    oncuechange: callback
})
export const onCut = callback => ({
    oncut: callback
})
export const onDblclick = callback => ({
    ondblclick: callback
})
export const onDrag = callback => ({
    ondrag: callback
})
export const onDragend = callback => ({
    ondragend: callback
})
export const onDragenter = callback => ({
    ondragenter: callback
})
export const onDragleave = callback => ({
    ondragleave: callback
})
export const onDragover = callback => ({
    ondragover: callback
})
export const onDragstart = callback => ({
    ondragstart: callback
})
export const onDrop = callback => ({
    ondrop: callback
})
export const onDurationchange = callback => ({
    ondurationchange: callback
})
export const onEmptied = callback => ({
    onemptied: callback
})
export const onEnded = callback => ({
    onended: callback
})
export const onError = callback => ({
    onerror: callback
})
export const onFocus = callback => ({
    onfocus: callback
})
export const onFormdata = callback => ({
    onformdata: callback
})
export const onFullscreenchange = callback => ({
    onfullscreenchange: callback
})
export const onFullscreenerror = callback => ({
    onfullscreenerror: callback
})
export const onGotpointercapture = callback => ({
    ongotpointercapture: callback
})
export const onInput = callback => ({
    oninput: callback
})
export const onInvalid = callback => ({
    oninvalid: callback
})
export const onKeydown = callback => ({
    onkeydown: callback
})
export const onKeypress = callback => ({
    onkeypress: callback
})
export const onKeyup = callback => ({
    onkeyup: callback
})
export const onLoad = callback => ({
    onload: callback
})
export const onLoadeddata = callback => ({
    onloadeddata: callback
})
export const onLoadedmetadata = callback => ({
    onloadedmetadata: callback
})
export const onLoadstart = callback => ({
    onloadstart: callback
})
export const onLostpointercapture = callback => ({
    onlostpointercapture: callback
})
export const onMousedown = callback => ({
    onmousedown: callback
})
export const onMouseenter = callback => ({
    onmouseenter: callback
})
export const onMouseleave = callback => ({
    onmouseleave: callback
})
export const onMousemove = callback => ({
    onmousemove: callback
})
export const onMouseout = callback => ({
    onmouseout: callback
})
export const onMouseover = callback => ({
    onmouseover: callback
})
export const onMouseup = callback => ({
    onmouseup: callback
})
export const onMousewheel = callback => ({
    onmousewheel: callback
})
export const onPaste = callback => ({
    onpaste: callback
})
export const onPause = callback => ({
    onpause: callback
})
export const onPlay = callback => ({
    onplay: callback
})
export const onPlaying = callback => ({
    onplaying: callback
})
export const onPointercancel = callback => ({
    onpointercancel: callback
})
export const onPointerdown = callback => ({
    onpointerdown: callback
})
export const onPointerenter = callback => ({
    onpointerenter: callback
})
export const onPointerleave = callback => ({
    onpointerleave: callback
})
export const onPointermove = callback => ({
    onpointermove: callback
})
export const onPointerout = callback => ({
    onpointerout: callback
})
export const onPointerover = callback => ({
    onpointerover: callback
})
export const onPointerrawupdate = callback => ({
    onpointerrawupdate: callback
})
export const onPointerup = callback => ({
    onpointerup: callback
})
export const onProgress = callback => ({
    onprogress: callback
})
export const onRatechange = callback => ({
    onratechange: callback
})
export const onReset = callback => ({
    onreset: callback
})
export const onResize = callback => ({
    onresize: callback
})
export const onScroll = callback => ({
    onscroll: callback
})
export const onSearch = callback => ({
    onsearch: callback
})
export const onSecuritypolicyviolation = callback => ({
    onsecuritypolicyviolation: callback
})
export const onSeeked = callback => ({
    onseeked: callback
})
export const onSeeking = callback => ({
    onseeking: callback
})
export const onSelect = callback => ({
    onselect: callback
})
export const onSelectionchange = callback => ({
    onselectionchange: callback
})
export const onSelectstart = callback => ({
    onselectstart: callback
})
export const onSlotchange = callback => ({
    onslotchange: callback
})
export const onStalled = callback => ({
    onstalled: callback
})
export const onSubmit = callback => ({
    onsubmit: callback
})
export const onSuspend = callback => ({
    onsuspend: callback
})
export const onTimeupdate = callback => ({
    ontimeupdate: callback
})
export const onToggle = callback => ({
    ontoggle: callback
})
export const onTransitioncancel = callback => ({
    ontransitioncancel: callback
})
export const onTransitionend = callback => ({
    ontransitionend: callback
})
export const onTransitionrun = callback => ({
    ontransitionrun: callback
})
export const onTransitionstart = callback => ({
    ontransitionstart: callback
})
export const onVolumechange = callback => ({
    onvolumechange: callback
})
export const onWaiting = callback => ({
    onwaiting: callback
})
export const onWebkitanimationend = callback => ({
    onwebkitanimationend: callback
})
export const onWebkitanimationiteration = callback => ({
    onwebkitanimationiteration: callback
})
export const onWebkitanimationstart = callback => ({
    onwebkitanimationstart: callback
})
export const onWebkitfullscreenchange = callback => ({
    onwebkitfullscreenchange: callback
})
export const onWebkitfullscreenerror = callback => ({
    onwebkitfullscreenerror: callback
})
export const onWebkittransitionend = callback => ({
    onwebkittransitionend: callback
})
export const onWheel = callback => ({
    onwheel: callback
})