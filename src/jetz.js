class JetzElement {
    // element rendered
    o;
    tagName;
    attributes;
    children;
    oldStyle = {};
    style = {};
    listener = [];
    parent;
    position;
    childPosition = 0;

    constructor(tag, attributes, ...children){
        this.tagName = tag;
        this.attributes = attributes;
        this.children = children;
    }

    render(parent = null){
        this.parent = parent; // Parent JetzElement
        this.o = document.createElement(this.tagName);
        this.assignAttributes();
        this.assignChildren();
        this.initStyle();
        this.initListener();
        this.initPosition();
        return this.o;
    }
    initPosition(){
        if(this.parent != null){
            this.position = this.parent.childPosition++;
        }else{
            this.position = -1;
        }
    }
    assignAttributes(){
        for (const attr in this.attributes) {
            if (Object.hasOwnProperty.call(this.attributes, attr)) {
                const attrValue = this.attributes[attr];
                if(typeof(attrValue) == 'function'){
                    this.o.addEventListener(attr.substring(2), attrValue.bind(this));
                }else{
                    if(attr == 'style'){
                        // addStyle
                        this.#addStyle(attrValue);
                        continue;
                    }
                    this.addAttr(attr, attrValue);
                }
            }
        }
    }
    #addStyle(styles){
        for (const key in styles) {
            if (Object.hasOwnProperty.call(styles, key)) {
                const value = styles[key];
                this.o.style[key] = value;
            }
        }
    }
    assignChildren(){
        this.#appendChildren(this.children);
    }
    #appendChildren(children){
        children.forEach(child => {
            this.append(child);
        });
    }
    append(child, ...children){
        if(children.length > 0){
            this.#appendChildren([child, ...children]);
            return this;
        }
        let _child;
        if(typeof(child) == 'object' && child instanceof JetzElement)
            _child = child.render(this);
        else 
            _child = child;

        if(typeof(this.o) == 'undefined')
            this.children.push(_child);
        else
            this.o.append(_child);
        return this;
    }
    initStyle(){
        this.style = new Proxy(this.o.style, {
            set(target, symbol, value){
                target[symbol] = value;
                return true;
            }
        });
    }
    initListener(){
        this.listener.forEach(_listener => {
            this.#addListener(_listener.eventName, _listener.callback);
        });
    }
    hide(){
        if(typeof(this.o) != 'undefined'){
            this.o.style.display = 'none';
            if(typeof(this.oldStyle.display) == 'undefined')
                this.oldStyle.display = this.o.style.display ?? '';
        }else
            this.style.display = 'none';
        
        return this;
    }
    show(){
        this.o.style.display = this.oldStyle.display;
        return this;
    }
    removeAttr(attrName){
        this.o.removeAttribute(attrName);
        return this;
    }
    addAttr(attrName, attrValue){
        this.o.setAttribute(attrName, attrValue)
        return this;
    }
    addClass(className){
        this.o.classList.add(className);
        return this;
    }
    removeClass(className){
        if(className == '*')
            this.removeAttr('class');
        else
            this.o.classList.remove(className);
        return this;
    }
    replaceClass(oldClass, newClass){
        if(oldClass == '*'){
            this.o.classList = [];
        }
        this.o.classList.replace(oldClass, newClass);
        return this;
    }
    #addListener(eventName, callback){
        this.o.addEventListener(eventName, callback);
    }
    on(eventName, callback = e => {}){
        this.listener.push({ eventName, callback  });
        return this;
    }
    data(dataName){
        const value = this.o.dataset[dataName];
        if(typeof(value) == 'undefined') console.error('data ' + dataName + ' no exist in ' + this.o);
        return value;
    }
    value(newValue){
        if(typeof(this.o.value) == 'undefined'){
            console.error('The ' + this.o + ' not support for value');
            return undefined;
        }
        if(typeof(newValue) != 'undefined')
            this.o.value = newValue;
        return this.o.value;
    }
    empty(){
        this.children = [];
        this.o.innerHTML = '';
        return this;
    }
    remove(){
        this.o.remove();
        this.parent.removeChild(this);
    }
    removeChild(_child){
        this.children = this.children.filter(child => 
            child.position != _child.position)
    }
}

class Jetz {
    static mount(element, target){
        let _render = element.render();
        target.append(_render)
    }
    static style(cssStyle){
        const _style = document.createElement('style');
        _style.textContent = cssStyle;
        document.head.append(_style)
    }
}

function createElement(tag, ...args){
    let attr = {};
    if(args.length > 0){
        args = args.filter(arg => {
            if(typeof(arg) == 'object'){
                if(arg instanceof JetzElement){
                    return true;
                }else{
                    attr = { ...arg, ...attr };
                    return false;
                }
            }
            return true;
        });
        if(typeof(args[0]) == 'object' && !(args[0] instanceof JetzElement)){
            attr = args[0];
            args = args.slice(1);
        }
    }
    return new JetzElement(tag, attr, ...args);
}

export {JetzElement, Jetz, createElement}