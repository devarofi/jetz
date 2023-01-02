import { createElement } from './jetz'

export let css = text => text;
// INPUT
export function inputText(...args) {
    return createElement('input', { type:'text' }, ...args);
}
export function inputNumber(...args) {
    return createElement('input', { type:'number' }, ...args);
}
// CONTAINER
export function span(...args) {
    return createElement('span', ...args);
}
export function div(...args) {
    return createElement('div', ...args);
}
export function button(...args) {
    return createElement('button', ...args);
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
export function nav(...args){
    return createElement('nav', ...args);
}
export function a(...args){
    return createElement('a', ...args);
}