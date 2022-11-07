import { createElement } from './jetz.js'

export let css = text => text;

export function inputText(...args) {
    return createElement('input', { type:'text' }, ...args);
}
export function inputNumber(...args) {
    return createElement('input', { type:'number' }, ...args);
}
export function span(...args) {
    return createElement('span', ...args);
}
export function div(...args) {
    return createElement('div', ...args);
}
export function button(...args) {
    return createElement('button', ...args);
}
export function i(...args){
    return createElement('i', ...args);
}
export function ul(...args){
    return createElement('ul', ...args);
}
export function li(...args){
    return createElement('li', ...args);
}