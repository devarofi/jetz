class Element {
    // element rendered
    o;
    tagName;
    attributes;
    children;
    oldStyle = {};
    style;
    listener = [];

    constructor(tag, attributes, ...children){
        this.tagName = tag;
        this.attributes = attributes;
        this.children = children;
    }

    render(){
        this.o = document.createElement(this.tagName);
        this.assignAttributes();
        this.assignChildren();
        this.initStyle();
        this.initListener();
        return this.o;
    }
    assignAttributes(){
        for (const attr in this.attributes) {
            if (Object.hasOwnProperty.call(this.attributes, attr)) {
                const attrValue = this.attributes[attr];
                if(typeof(attrValue) == 'function'){
                    this.o.addEventListener(attr.substring(2), attrValue);
                }else{
                    
                    this.addAttr(attr, attrValue);
                }
            }
        }
    }
    assignChildren(){
        this.children.forEach(child => {
            let _child;
            if(typeof(child) == 'object' && child instanceof Element)
                _child = child.render();
            else 
                _child = child;
            this.o.append(_child);
        })
    }
    hide(){
        if(typeof(this.oldStyle.display) == 'undefined')
            this.oldStyle.display = this.o.style.display ?? '';
        
        this.o.style.display = 'none';
    }
    show(){
        this.o.style.display = this.oldStyle.display;
    }
    initStyle(){
        this.style = new Proxy(this.o.style, {
            set(target, symbol, value){
                target[symbol] = value;
            }
        })
    }
    initListener(){
        this.listener.forEach(_listener => {
            this.#addListener(_listener.eventName, _listener.callback);
        })
    }
    remoteAttr(attrName){
        this.o.removeAttribute(attrName);
    }
    addAttr(attrName, attrValue){
        this.o.setAttribute(attrName, attrValue)
    }
    addClass(className){

    }
    removeClass(className){

    }
    #addListener(eventName, callback){
        this.o.addEventListener(eventName, callback);
    }
    on(eventName, callback = e => {}){
        this.listener.push({ eventName, callback  });
        return this;
    }
}

class App {
    static mount(element, target){
        let _render = element.render();
        target.append(_render)
    }
}

function createElement(tag, ...args){
    let attr = {};
    if(args.length > 0){
        args = args.filter(arg => {
            if(typeof(arg) == 'object'){
                if(arg instanceof Element){
                    return true;
                }else{
                    attr = { ...arg, ...attr };
                    return false;
                }
            }
            return true;
        });
        if(typeof(args[0]) == 'object' && !(args[0] instanceof Element)){
            attr = args[0];
            args = args.slice(1);
        }
    }
    return new Element(tag, attr, ...args);
}

function inputText(...args) {
    return createElement('input', { type:'text' }, ...args);
}
function numberText(...args) {
    return createElement('input', { type:'number' }, ...args);
}
function span(...args) {
    return createElement('span', ...args);
}
function div(...args) {
    return createElement('div', ...args);
}
function button(...args) {
    return createElement('button', ...args);
}

let noticeComponent = div(
    inputText({
        placeholder: 'Input text here'
    }),
    numberText({
        placeholder: 'Your age'
    }),
    span('Be aware, this content may be harmfull')
);

let hideBtn = button({
    class:'item',
    onclick:() => {
        noticeComponent.hide();
    }
}, 'Hide');

let showBtn = button({
    class:'item'
}, 'Show').on('click', () => {
    noticeComponent.style.marginLeft = margin + 'px';
});

let devaComponent = 
div({ class:'container' },
    // SPAN
    noticeComponent, 
    // BUTTON
    hideBtn, showBtn
);

App.mount(devaComponent, document.body);