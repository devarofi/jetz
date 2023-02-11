import { createElement } from './jetz'

// INPUT
export function inputText(...args) {
    return createElement('input', { type:'text' }, ...args);
}
export function inputNumber(...args) {
    return createElement('input', { type:'number' }, ...args);
}
export function button(...args) {
    return createElement('button', ...args);
}
export function form(...args){
    return createElement('form', ...args);
}
export function select(...args){
    return createElement('select', ...args);
}
export function option(...args){
    return createElement('option', ...args);
}
export function canvas(...args){
    return createElement('canvas', ...args);
}
// CONTAINER
export function span(...args) {
    return createElement('span', ...args);
}
export function div(...args) {
    return createElement('div', ...args);
}
export function header(...args) {
    return createElement('header', ...args);
}
export function nav(...args){
    return createElement('nav', ...args);
}
export function section(...args){
    return createElement('section', ...args);
}
export function aside(...args){
    return createElement('aside', ...args);
}
export function article(...args){
    return createElement('article', ...args);
}
export function footer(...args){
    return createElement('footer', ...args);
}
export function details(...args){
    return createElement('details', ...args);
}
export function summary(...args){
    return createElement('summary', ...args);
}
export function main(...args){
    return createElement('main', ...args);
}
export function video(...args){
    return createElement('video', ...args);
}
export function audio(...args){
    return createElement('audio', ...args);
}
export function source(...args){
    return createElement('source', ...args);
}
// TABLE
export function table(...args){
    return createElement('table', ...args);
}
export function tr(...args){
    return createElement('tr', ...args);
}
export function td(...args){
    return createElement('td', ...args);
}
export function thead(...args){
    return createElement('thead', ...args);
}
export function tbody(...args){
    return createElement('tbody', ...args);
}
export function colgroup(...args){
    return createElement('colgroup', ...args);
}
export function col(...args){
    return createElement('col', ...args);
}
export function th(...args){
    return createElement('th', ...args);
}
export function tfoot(...args){
    return createElement('tfoot', ...args);
}
// LIST
export function ul(...args){
    return createElement('ul', ...args);
}
export function ol(...args){
    return createElement('ol', ...args);
}
export function li(...args){
    return createElement('li', ...args);
}
// TEXT
export function i(...args){
    return createElement('i', ...args);
}
export function b(...args){
    return createElement('b', ...args);
}
export function p(...args){
    return createElement('p', ...args);
}
export function a(...args){
    return createElement('a', ...args);
}

export function hr(...args){
    return createElement('hr', ...args);
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
export function h7(...args){
    return createElement('h7', ...args);
}
export function label(...args){
    return createElement('label', ...args);
}
export function textarea(...args){
    return createElement('textarea', ...args);
}
export function br(){
    return createElement('br');
}