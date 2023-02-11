
const Obj = {
    isEmpty: function(target){
        if(target){
            for (const _ in target) {
                return false;
            }
        }
        return true;
    },
    isNotEmpty: function(target){
        return !Obj.isEmpty(target);
    }
}
/** 
 * @param {Array} arr
 */
export function flatMap(arr){
    let newArr = [];
    arr.forEach(item => {
        if(Array.isArray(item)){
            if(item instanceof ListState){
                newArr.push(item);
            }else{
                newArr = [...newArr, ...flatMap(item)];
            }
        }else{
            newArr.push(item);
        }
    });
    return newArr;
}
export function css(value){
    return { class: value };
}
export function addScript(src, options = {}){
    document.addEventListener('DOMContentLoaded', e => {
        e.preventDefault();
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.body.append(script);
    });
}

Object.prototype.toString = function(){
    if(this.constructor.name === State.name)
        return this.value;
	else if(this.constructor.name === ListState.name)
		return this.values.join(',');
    return this;
}

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
	lifecycles = {
		onRendered: null,
		onStart: null
	}

	constructor(tag, attributes, ...children) {
		this.tagName = tag;
		this.attributes = attributes;
		this.children = children;
	}

	#atLifecycles(main){
		if(this.lifecycles.onStart){
			this.lifecycles.onStart();
		}
		main()
		if(this.lifecycles.onRendered){
			Jetz.addRenderedEffect(this.lifecycles.onRendered);
		}
	}

	render(parent = null) {
		this.parent = parent; // Parent JetzElement
		this.#atLifecycles(() => {
			this.o = document.createElement(this.tagName);
			this.assignAttributes();
			this.assignChildren();
			this.initStyle();
			this.initListener();
			this.o.instance = this;
		})
	}
	getElement(){
		return this.o;
	}
	onRendered(callback = null){
		this.lifecycles.onRendered = callback;
		return this;
	}
	onStart(callback = () => {}){
		this.lifecycles.onStart = callback;
		return this;
	}
	assignAttributes() {
		for (const attr in this.attributes) {
			if (Object.hasOwnProperty.call(this.attributes, attr)) {
				const attrValue = this.attributes[attr];
				if (typeof attrValue === "function") {
					this.o.addEventListener(attr.substring(2), attrValue.bind(this));
				}else if(attr === 'bind'){
					this.#bindInputValue(attrValue);
				} else {
					if (attr === "style") {
						this.#addStyle(attrValue);
						console.log(this.attributes, this.o)
						continue;
					}
					this.addAttr(attr, attrValue);
				}
			}
		}
	}
	#bindInputValue(stateTarget){
		this.#addListener('input', e => {
			stateTarget.value = e.target.value
		})
	}
	#addStyle(styles) {
		for (const key in styles) {
			if (Object.hasOwnProperty.call(styles, key)) {
				const value = styles[key];
				if(typeof(value) === 'object' && value instanceof State){
					const styleState = new StyleState(this.o.style, key, value);
					value.addContainer(styleState);
					this.o.style[key] = value.value;
				}else{
					this.o.style[key] = value;
				}
			}
		}
	}
	assignChildren() {
		this.#appendChildren(this.children);
	}
	#appendChildren(children) {
		children.forEach((child) => {
			this.append(child);
		});
	}
	append(child, ...children) {
		if (children.length > 0) {
			this.#appendChildren([child, ...children]);
			return this;
		}
		let _child;
		if (typeof child === "object") {
			if(child instanceof JetzElement){
				child.render(this);
				_child = child.getElement();
			}else if(child instanceof State){
				_child = child.generateMutable();
			}else if(child instanceof ListState){
				// this.#appendChildren(child.views.flat(2));
				child.assignParent(this);
				return this;
			}else if(child instanceof Component){
				const childComponent = child.render();
				if(Array.isArray(childComponent)){
					this.#appendChildren(childComponent);
					return this;
				}else{
					_child = childComponent;
				}
			}
		}else if(typeof child === 'function'){
			let childFunction = child.call();
			this.append(childFunction);
			return this;
		} else {
			_child = child;
		}

		if (typeof this.o === "undefined") {
			this.children.push(_child);
		} else {
			this.o.append(_child);
		}
		if(child instanceof JetzElement){
			if(child.lifecycles.onRendered){
				child.lifecycles.onRendered()
			}
		}
		return this;
	}
	initStyle() {
		// check if this.style have a value
		if (Obj.isNotEmpty(this.style)) {
			this.#addStyle(this.style);
		}
		this.style = new Proxy(this.style, {
			set: (function(target, symbol, value) {
				this.o.style[symbol] = value;
				target[symbol] = value;
				console.log(this.o.style, symbol, value)
				return true;
			}).bind(this),
		});
	}
	initListener() {
		this.listener.forEach((_listener) => {
			this.#addListener(_listener.eventName, _listener.callback.bind(this));
		});
	}
	hide() { 
		if (typeof this.o !== "undefined") {
			this.o.style.display = "none";
			if (typeof this.oldStyle.display === "undefined") {
				this.oldStyle.display = this.o.style.display ?? "";
			}
		} else {
			this.style.display = "none";
		}

		return this;
	}
	show() {
		if (this.oldStyle === undefined && this.oldStyle.display) {
			if (this.oldStyle.display !== "none") {
				this.o.style.display = this.oldStyle.display;
			} else {
				this.o.style.display = null;
			}
		} else {
			this.o.style.display = null;
		}
		return this;
	}
	text(data) {
		if (this.o) {
			this.o.innerText = data;
		}
		return this;
	}
	removeAttr(attrName) {
		this.o.removeAttribute(attrName);
		return this;
	}
	addAttr(attrName, attrValue) {
		if(attrName === 'class'){
			this.addClass(attrValue);
		}else{
			// is state
			if(attrValue instanceof State){
				// let newAttr = document.createAttribute(attrName);
				// newAttr.value = attrValue.value;
				let newAttr = this.o.getAttributeNode(attrName);
				if(newAttr == null){
					newAttr = document.createAttribute(attrName);
					this.o.setAttributeNode(newAttr);
				}
				if(attrName === 'value'){
					this.o.value = attrValue;
				}else{
					newAttr.nodeValue = attrValue;
				}
				attrValue.addContainer(newAttr);
			}else{
				this.o.setAttribute(attrName, attrValue);
			}
		}
		return this;
	} 
	addClass(value) {
		if(typeof(this.o) === 'undefined'){
			this.attributes['class'] = value;
		}else{
			if(Array.isArray(value)){
				const values = flatMap(value.map(x => (typeof x === 'string') ? x.split(' ') : x));
				this.#addClassClassification(values);
			}else if(typeof value === 'string'){
				this.o.classList.add(...(value.split(' ')));
			}
		}
		return this;
	}
	#addClassClassification(cssClass){
		this.o.classList.add(...cssClass);
	}
	toggleClass(className){
		this.o.classList.toggle(className);
	}
	removeClass(className) {
		if (className === "*") {
			this.removeAttr("class");
		} else {
			this.o.classList.remove(className);
		}
		return this;
	}
	replaceClass(oldClass, newClass) {
		if (oldClass === "*") {
			this.o.classList = [];
		}
		this.o.classList.replace(oldClass, newClass);
		return this;
	}
	#addListener(eventName, callback) {
		this.o.addEventListener(eventName, callback);
	}
	on(eventName, callback = (e) => {}) {
		this.listener.push({ eventName, callback });
		return this;
	}
	data(dataName) {
		const value = this.o.dataset[dataName];
		if (typeof value === "undefined") {
			console.error(`data ${dataName} no exist in ${this.o}`);
		}
		return value;
	}
	value(newValue = null) {
		if(newValue != null){
			if (typeof this.o.value === "undefined") {
				console.error(`The ${this.o} not support for value`);
				return undefined;
			}
			if (typeof newValue !== "undefined") {
				this.o.value = newValue;
			}
		}
		return this.o.value;
	}
	empty() {
		this.children = [];
		this.o.innerHTML = "";
		return this;
	}
	remove() {
		this.o.remove();
		this.parent.removeChild(this);
	}
	removeChild(_child) {
		this.children = this.children.filter(
			(child) => child.position !== _child.position,
		);
	}
	id(idName) {
		this.attributes.id = idName;
		return this;
	}
	findId(idName) {
		var element = document.getElementById(idName);
		return element.instance;
	}
}

class Reactive {
	static isReactive = false;

	static clear(){
		Reactive.isReactive = false;
	}
}

function _(text){
	Reactive.isReactive = true;
	return text;
}

class Jetz {
	static #onRenderedCollections = [];
	static addRenderedEffect(callback){
		Jetz.#onRenderedCollections.push(callback)
	}
	static onFirstRenderPage(){
		Jetz.#onRenderedCollections.forEach(callback => callback());
	}
	// static #startListener = [];
	static mount(jetzElement, target, event = { onStart(){}, onLoad(){} }) {
		// debugger;
		this.onStart(event.onStart);

		jetzElement.render();
		let element = jetzElement.getElement();
		target.append(element);
		
		Jetz.onFirstRenderPage();
		
		this.onLoad(event.onLoad);
	}
	static style(cssStyle) {
		const _style = document.createElement("style");
		_style.textContent = cssStyle;
		document.head.append(_style);
	}
	static onStart(callback){
		if(callback != null){
			callback.call();
		}
	}
	static onLoad(callback){
		if(callback != null){
			document.addEventListener('DOMContentLoaded', () => {
				callback();
			});
		}
	}
}
class StyleState {
	container;
	key;
	value;
	constructor(container, key, value) {
		this.container = container;
		this.key = key;
		this.value = value;
	}
}
class State{
	value;
	container = [];
	constructor(value){
		this.value = value;
	}
	addContainer(container){
		this.container.push(container)
	}
	generateMutable(){
		let element = null;
		if(this.value instanceof JetzElement){
			this.value.render();
			element = this.value.getElement();
		}else{
			element = new Text(this.value);
		}
		this.container.push(element);
		// Will added in element tree
		return element;
	}
	setState(newValue){
		this.value = newValue;
		this.container = this.container.map(container => {
			if(this.value instanceof JetzElement){
				this.value.render();
				let element = this.value.getElement();
				container.replaceWith(element);
				// trigger lifecycle
				if(this.value.lifecycles.onRendered)
					this.value.lifecycles.onRendered();
				return element;
			}else if(typeof(this.value) === 'object'){
				console.log('obj')
			}else{
				this.#assignContainerValue(container, this.value);
			}
			return container;
		});
	}
	#assignContainerValue(container, value){
		if(container instanceof HTMLElement){
			container.innerHTML = value;
		}else if(container instanceof Attr){
			if(container.nodeName === 'value'){
				container.ownerElement.value = value;
				container.nodeValue = value;
			}else
				container.nodeValue = value;
		}else if(container instanceof Text){
			container.textContent = value;
		}else if(container instanceof StyleState){
			console.log('style dec')
			container.value = value;
			container.container[container.key] = container.value;
		}
	}
	getValue(){
		return this.value;
	}
}


export class ListState extends Array{
	parentElement = [];
	values = [];
	views = [];

	at(index){
		return this.values[index];
	}

	renderCallback = item => { return item };

	constructor(...values){
		super(...values);
		this.values = values;
		this.length = values.length;
	}
	createItemView(parent, item, index){
		var renderedItem = this.renderCallback(item, index);
		renderedItem.render(parent);
		return renderedItem;
	}
	push(item){
		super.push(item);
		this.values.push(item);
		this.parentElement.map((parent, i) => {
			this.newView(i, this.views[i], item);
			return parent;
		})
	}
	renderView(refresh = false){
		if(refresh){
			this.views = this.views.map(view => {
				// if its HTML element
					view.map(v => {
						if(v instanceof JetzElement)
							v.remove();
						return [];
					})
				return [];
			})
		}
		this.views.map((view, i) => {
			this.values.forEach(_item => {
				this.newView(i, view, _item)
			})
			return view;
		});
	}
	newView(index, view, content){
		var renderedItem = this.createItemView(this.parentElement[index], content, this.length-1);
		view.push(renderedItem);
		this.parentElement[index].append(renderedItem);
	}
	remove(item){
		const index = this.values.indexOf(item);
		this.removeAt(index);
	}
	removeAt(index){
		this.values.splice(index, 1);
		this.views = this.views.map((view, i) => {
			view[index].remove();
			view.splice(index, 1);
			return view;
		});
		this.splice(index, 1);
	}
	get(index){
		return this.values[index];
	}
	map(callback){
		this.values = this.values.map(callback);
		this.renderView(true);
	}
	assignParent(parent){
		// new stack view
		this.views.push([]);
		this.parentElement.push([]);
		let lastIndex = this.parentElement.length - 1;
		this.parentElement[lastIndex] = parent;
		this.values.forEach((value, i) => {
			var renderedItem = this.createItemView(this.parentElement[lastIndex], value, i);
			this.parentElement[lastIndex].append(renderedItem);
			this.views[this.views.length - 1].push(renderedItem);
		});
	}
	toState(){
		this.values = this.values.map(value => stateOf(value));
		return this;
	}
	*[Symbol.iterator](){
		yield* this.values;
	}
}

export function listOf(...items){
	return new ListState(...items);
}
export function loop(collections, render = (item, index = 0) => { return item; }){
	if(collections instanceof ListState)
		collections.renderCallback = render;
	else{
		let rendered = [];
		for (let index = 0; index < collections.length; index++) {
			const item = collections[index];
			rendered.push(render(item, index));
		}
		return rendered;
	}
	return collections;
}

function stateOf(value, handler = { get(value){ return value } }){
	const optDefaultProxy = {
		get(obj, prop){
			let outValue = handler.get(obj[prop]);
			return outValue ?? obj[prop];
		},
		set(obj, prop, value){
			obj.setState(value);
			return true;
		}
	};
	let optProxy = optDefaultProxy
	if(typeof value === 'object' && !(value instanceof JetzElement)){
		for (const prop in value) {
			if (Object.hasOwnProperty.call(value, prop)) {
				const propValue = value[prop];
				value[prop] = stateOf(propValue);
			}
		}
		return value;
	}else{
		let objState = new State(value);
		let proxy = new Proxy(objState, optProxy);
		
		// custom function string

		return proxy;
	}
}

function mergeObject(obj1, ...obj2){
	if(obj2 === undefined || obj2 == null) obj2 = [];
	obj2.push(obj1);
	var newObj = {};
	for (const i in obj2) {
		var obj = obj2[i];
		for (const prop in obj) {
			if (Object.hasOwnProperty.call(obj, prop)) {
				const value = obj[prop];
				// check prop in newobj
				if(Object.hasOwnProperty.call(newObj, prop)){
					const value2 = newObj[prop];
					// check datatype
					if(Array.isArray(value)){
						newObj[prop] = (Array.isArray(value2)) ? 
										value.push(...value2) : value.push(value2);
					}else if(Array.isArray(value2)){
						newObj[prop] = (Array.isArray(value)) ? 
										value2.push(...value) : value.push(value);
					}else{
						if(Array.isArray(newObj[prop])){
							newObj[prop].push(value2);
						}else{
							newObj[prop] = [newObj[prop], value];
						}
					}
				}else{
					newObj[prop] = value;
				}
			}else{
				newObj[prop] = obj[prop];
			}
		}
	}
	return newObj;
}

function createElement(tag, ...args) {
	args = flatMap(args);
	let attr = {};
	if (args.length > 0) {
		args = args.filter(( arg, position ) => {
			if (typeof arg === "object") {
				if (arg instanceof JetzElement) {
					return true;
				}else if(arg instanceof State){
					return true;
				}else if(arg instanceof ListState){
					return true;
				}else if(arg instanceof Component){
					return true;
				} else {
					// skipped
					attr = mergeObject(arg, attr);
					return false;
				}
			}
			return true;
		});
		if (typeof args[0] === "object") {
			if(args[0].constructor.name === 'Object'){
				console.log(args[0].constructor.name === 'Object')
				attr = args[0];
				args = args.slice(1);
			}
		}
	}
	return new JetzElement(tag, attr, ...args);
}

class Dispacher{
    #actionDispatch;
    constructor(callback = action => {}){
        this.#actionDispatch = callback;
    }
    dispatch(action){
        console.info('Called dispacher', this)
        return this.#actionDispatch(action);
    }
}

class Component {
	render(){
		return null;
	};
}

export { JetzElement, Jetz, Dispacher, Component, createElement, stateOf, _ };
