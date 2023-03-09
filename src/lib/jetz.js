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
NodeList.prototype.last = function(){
	return this[this.length - 1];
}
Array.prototype.last = function(){
	return this[this.length - 1];
}
Array.prototype.take = function(to){
	return this.slice(0, to);
}
Number.prototype.range = function(to){
	return range(this.valueOf(), to);
}
class UniqueString extends String {
    constructor(val){
        super(val)
    }
}
class UniqueNumber extends Number {
    constructor(val){
        super(val)
    }
}
function toNodes(content){
	let _ = document.createElement('_');
	_.innerHTML = content;
	return _.childNodes;
}
export function range(start, to) {
	let arr = [];
	while(start <= to){
		arr.push(start);
		start++;
	}
	return arr;
}
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
export function addScript(src, options = {}){
    document.addEventListener('DOMContentLoaded', e => {
        e.preventDefault();
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.body.append(script);
    });
}
export class JetzArgument {
	element;
	setElement(element){
		this.element = element;
	}
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
				}else if(
					arg instanceof UniqueString ||
					arg instanceof UniqueNumber
					){
					return true;
				} else if(arg instanceof Raw){
					return true;
				} else if(arg.constructor.prototype instanceof JetzArgument){
					attr = mergeObject(attr, { arg });
					return false;
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
				attr = args[0];
				args = args.slice(1);
			}
		}
	}
	return new JetzElement(tag, attr, ...args);
}
class Dispatcher{
    #actionDispatch;
    constructor(callback = action => {}){
        this.#actionDispatch = callback;
    }
    dispatch(action, ...args){
        return this.#actionDispatch(action, ...args);
    }
}

class Component {
	$params;
	static new(...arg){
		return new this(...arg);
	}
	render(){
		return null;
	};
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
	};
	collectionConditionalChild = [];
	renderPosition = 0; // 0 parent, 1 after, 2 before

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
	triggerCondition(){
		this.collectionConditionalChild.forEach(condition => {
			condition.trigger();
		})
	}
	setPrevious(previous){
		this.previousElement = previous;
	}
	render(parent = null, renderPosition = 0) {
		this.collectionConditionalChild = [];
		this.renderPosition = renderPosition;
		this.parent = parent; // Parent JetzElement
		this.#atLifecycles(() => {
			this.o = document.createElement(this.tagName);
			this.assignAttributes();
			this.assignChildren();
			this.initStyle();
			this.initListener();
			this.o.$ = this;
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
				if(attr.substring(0, 2) == 'on') {
					if (typeof attrValue === "function")
						this.o.addEventListener(attr.substring(2), attrValue.bind(this));
				}else if(attr === 'bind'){
					this.#bindInputValue(attrValue);
				} else if (attr === "style") {
					this.#addStyle(attrValue);
					continue;
				}else if(attr === 'if' || attr === 'else' || attr === 'elseif'){
					this.#assignConditionalAttr(attr, attrValue);
				} else{
					this.addAttr(attr, attrValue);
				}
			} 
		}
	}
	#assignConditionalAttr(attrName, attrValue){
		if(attrName === 'if'){
			let attrSpecial = new If(this, attrValue);
			// // check is assign or not
			this.parent.collectionConditionalChild.push(attrSpecial);
			if(Jetz.isAllowToRemount(this.parent)){
				Jetz.remountByAttr.push(this.parent);
			}
		}else if(attrName === 'else'){
			var currentIfElement = this.parent.collectionConditionalChild.last();
			var newElse = new Else(this, currentIfElement);
			if(currentIfElement){
				currentIfElement._else = newElse;
			}
		}else if(attrName === 'elseif'){
			var currentIfElement = this.parent.collectionConditionalChild.last();
			if(currentIfElement){
				let newElseIf = new ElseIf(this, attrValue);
				currentIfElement.addElseIf(newElseIf);
			}else{
				throw new Error('expect IF declaration before ELSE IF', this.o);
			}
		}
	}
	#bindInputValue(stateTarget){
		this.#addListener('input', e => {
			stateTarget.value = e.target.value
		});
		this.addAttr('value', stateTarget);
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
		children.forEach((child, i) => {
			if(child instanceof JetzElement){
				this.addPreviousElement(child, children, i);
			}
			this.append(child);
		});
	}
	addPreviousElement(element, children, childPosition){
		const prevPosition = childPosition - 1;
		if(prevPosition >= 0){
			let childPrev = children[prevPosition];
			if(childPrev instanceof State)
				element.setPrevious(childPrev.container.last());
			else
				element.setPrevious(childPrev);
		}
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
				child.assignParent(this);
				return this;
			}else if(
				child instanceof UniqueString ||
				child instanceof UniqueNumber
				){
				_child = child;
			}else if(child instanceof Raw){
				_child = child;
			}
		}else if(typeof child === 'function'){
		
			let childFunction = child.call();
			this.append(childFunction);
			return this;
		} else {
			_child = child;
		}
		if(child instanceof Component){
			const childComponent = child.render();
			if(Array.isArray(childComponent)){
				this.#appendChildren(childComponent);
				return this;
			}
			this.append(childComponent);
			return this;
		}else if(child.prototype instanceof Component){
			child = new child();
			const childComponent = child.render();
			if(Array.isArray(childComponent)){
				this.#appendChildren(childComponent);
				return this;
			}
			this.append(childComponent);
			return this;
		}
		if (typeof this.o === "undefined") {
			this.children.push(_child);
		} else {
			if(this.renderPosition == 0){
				if(_child instanceof Raw){
					let nodes = toNodes(_child.get());
					if(nodes.length > 0)
						this.o.append(...nodes);
				}else{
					this.o.append(_child);
				}
			}else if(this.renderPosition == 1){
				console.log(_child, 'render')
			}
		}
		if(child instanceof JetzElement){
			if(child.lifecycles.onRendered){
				child.lifecycles.onRendered();
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
			}else if(typeof attrValue === 'object'){
				if(attrValue.constructor.prototype instanceof JetzArgument){
					attrValue.setElement(this);
					attrValue.onAssigned();
				}
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
	}
	id(idName) {
		this.attributes.id = idName;
		return this;
	}
	findId(idName) {
		var element = document.getElementById(idName);
		return element.$;
	}
}
class Jetz {
	// Jetz Element Collection that have If Else Annotation
	static remountByAttr = []; 
	static #onRenderedCollections = [];
	static addRenderedEffect(callback){
		Jetz.#onRenderedCollections.push(callback)
	}
	static onFirstRenderPage(){
		Jetz.#onRenderedCollections.forEach(callback => callback());
	}
	static mount(jetzElement, target, event = { onStart(){}, onLoad(){} }) {
		let components = flatMap([jetzElement])
		this.onStart(event.onStart);
		if(Array.isArray(components)){
			components.forEach(element => {
				if(typeof element === 'function'){
					element = element();
				}
				
				element.render();
				target.append(element.getElement());
			});
		}
		Jetz.onFirstRenderPage();
		Jetz.triggerByState();
		
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
	static triggerByState(){
		this.remountByAttr.forEach(element => {
			element.collectionConditionalChild.forEach(rm => rm.trigger())
		});
	}
	static isAllowToRemount(findElement){
		return Jetz.remountByAttr.filter(element => {
			return element == findElement;
		}).length == 0
	}
	static use(app){
		app.install(Jetz);
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
	#value;
	container = [];
	#handler;
	constructor(value, handler = { get(obj){}, set(obj){} }){
		this.#value = value;
		this.#handler = handler;
	}
	addContainer(container){
		this.container.push(container)
	}
	generateMutable(){
		let element = null;
		if(this.#value instanceof JetzElement){
			this.#value.render();
			element = this.#value.getElement();
		}else{
			element = new Text(this.#value);
		}
		this.container.push(element);
		// Will added in element tree
		return element;
	}
	setState(newValue){
		this.#value = newValue;
		this.container = this.container.map(container => {
			if(this.#value instanceof JetzElement){
				this.#value.render();
				let element = this.#value.getElement();
				container.replaceWith(element);
				// trigger lifecycle
				if(this.#value.lifecycles.onRendered)
					this.#value.lifecycles.onRendered();
				return element;
			}else if(typeof(this.#value) === 'object'){
				console.log('obj')
			}else{
				this.#assignContainerValue(container, this.#value);
			}
			return container;
		});
		Jetz.triggerByState();
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
			container.value = value;
			container.container[container.key] = container.value;
		}
	}
	getValue(){
		return this.#value;
	}
	get value(){
		return this.#value;
	}
	set value(val){
		this.#handler.set(this, val);
	}
	toString(){
		if(this.constructor.name === State.name)
			return this.#value;
		else if(this.constructor.name === ListState.name)
			return this.values.join(',');
	}
	valueOf(){
		return this.#value;
	}
}


export class ListState extends Array {
	parentElement = [];
	values = [];
	views = [];
	uniqueValue = false;

	asUnique(){
		this.uniqueValue = true;
		this.values = this.values.map(val => {
			return this.#fixValue(val)
		});
		return this;
	}

	at(index){
		return this.values[index];
	}

	renderCallback = item => { return item };

	constructor(...values){
		super(...values);
		this.values = values;
		this.length = values.length;
	}
	set(newData){
		this.values = newData;
		super.values = newData;
		this.renderView(true);
	}
	createItemView(parent, item, index){
		var renderedItem = this.renderCallback(item, index);
		renderedItem.render(parent);
		return renderedItem;
	}
	push(item){
		if(this.uniqueValue)
			item = this.#fixValue(item);

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
		// trigger state
		Jetz.triggerByState();
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
	#fixValue(value){
		if(typeof value === 'string'){
			return new UniqueString(value);
		}else if(typeof value === 'number'){
			return new UniqueNumber(value);
		}else{
			return value;
		}
	}
	take(to){
		return this.values.take(to)
	}
	*[Symbol.iterator](){
		yield* this.values;
	}
}
export function listOf(...items){
	return new ListState(...items);
}

export function sequenceOf(...items){
	let listState = new ListState(...items);
	return listState.asUnique();
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
	let instance = null;
	if(typeof value === 'object' && !(value instanceof JetzElement)){
		for (const prop in value) {
			if (Object.hasOwnProperty.call(value, prop)) {
				const propValue = value[prop];
				value[prop] = stateOf(propValue);
			}
		}
		instance = value;
	}else{
		const optDefaultProxy = {
			get(obj, prop){
				let outValue = handler.get(obj[prop]);
				return outValue ?? obj[prop];
			},
			set(obj, value){
				obj.setState(value);
				return true;
			}
		};
		let objState = new State(value, optDefaultProxy);
		// custom function string
		instance = objState;
	}
	return instance;
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
class Raw {
	#content;
	constructor(content) {
		this.#content = content;
	}
	get(){
		return this.#content;
	}
	set(content){
		this.#content = content;
	}
	valueOf(){
		return this.#content;
	}
}
class AttrSpecial{
    value;
	element;
	
	beforeNode; // 0
	afterNode; // 1
	parentNode; // 2

	positionElement;

	_else;
	_elseIf = [];

	isDefined = false;

	constructor(element, value) {
		this.value = value;
		this.element = element;
	}

	initContainer(){
		if(!this.isDefined){
			if(this.element.o.previousSibling){
				this.beforeNode = this.element.o.previousSibling;
				this.positionElement = 0;
			}else if(this.element.o.nextElementSibling){
				this.afterNode = this.element.o.nextElementSibling;
				this.positionElement = 1;
			}else{
				this.parentNode = this.element.o.parentNode;
				this.positionElement = 2;
			}
			this.isDefined = true;
		}
	}
	addElseIf(elseIf){
		this._elseIf.push(elseIf);
	}

	hide(){
		this.initContainer();
		this.element.remove();
	}
	show(){
		this.initContainer();
		if(this.positionElement == 0){
			this.beforeNode.after(this.element.o);
		}
	}
}
class If extends AttrSpecial{
	triggerResult;
	constructor(element, value) {
		super(element, value);
	}
	trigger(){
		let condition = this.value.call();
		this.triggerResult = condition;
		this.show();

		let parentIf = this;
		let elseIfCondition = false;
		let elseCondition = false;

		this._elseIf.forEach((__elseIf, i) => {
			__elseIf.setParentIf(parentIf);
			__elseIf.initContainer();
			__elseIf.trigger();
			if(!elseIfCondition){
				elseIfCondition = __elseIf.triggerResult;
			}
			if(__elseIf.triggerResult && !condition){
				elseCondition = false;
				__elseIf.show();
			}else{
				__elseIf.hide();
			}
		});
		if(!condition)
			this.hide();
		if(this._else){
			this._else.setParentIf(this);
			this._else.initContainer();
			this._else.hide();
			
			if(!elseIfCondition && !condition){
				elseCondition = true;
			}
			if(elseCondition){
				this._else.show();
			}
		}
	}
}
class ElseIf extends AttrSpecial{
	parentIfCondition;
	positionElement;
	constructor(element, value) {
		super(element, value);
	}
	setParentIf(parentIf){
		this.beforeNode = parentIf.beforeNode;
		this.afterNode = parentIf.afterNode;
		this.parentNode = parentIf.parentNode;
		this.positionElement = parentIf.positionElement;
	}
	initContainer(){
	}
	trigger(){
		return this.triggerResult = this.value();
	}
}

class Else {
	element;
	currentIf;
	
	parentIfCondition;
	positionElement;
	
	initContainer(){
		if(this.parentIfCondition.positionElement == 0){
			this.beforeNode = this.parentIfCondition.beforeNode;
		}else if(this.parentIfCondition.positionElement == 1){
			this.afterNode = this.parentIfCondition.afterNode;
		}else{
			this.parentNode = this.parentIfCondition.parentNode;
		}
		this.positionElement = this.parentIfCondition.positionElement;
	}
	setParentIf(parentIf){
		this.parentIfCondition = parentIf;
	}

	constructor(element, currentIf) {
		this.element = element;
		this.currentIf = currentIf;
	}

	hide(){
		if(this.positionElement == 0){ 
			this.element.remove();
		}
	}
	show(){
		if(this.positionElement == 0){
			this.element.render(this.currentIf.element.parent);
			this.beforeNode.after(this.element.getElement());
		}else if(this.positionElement == 1){
			console.log('after');
		}else{
			console.log('parent');
		}
	}
}
const _if = boolCallback => ({ if:boolCallback })
const _elseif = boolCallback => ({ elseif:boolCallback })
const _else = { else:null };
const html = content => new Raw(content);
const _show = _if;

export { JetzElement, Jetz, Dispatcher, Component, createElement, stateOf, _show, _else, _elseif, _if, html };
