const Obj = {
	isEmpty: function (target) {
		if (target) {
			for (const _ in target) {
				return false;
			}
		}
		return true;
	},
	isNotEmpty: function (target) {
		return !Obj.isEmpty(target);
	}
}
const booleanAttributes = new Set([
	'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
	'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert', 'ismap',
	'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
	'playsinline', 'readonly', 'required', 'reversed', 'selected'
]);
const booleanAttributeProperties = {
	allowfullscreen: 'allowFullscreen',
	formnovalidate: 'formNoValidate',
	itemscope: 'itemScope',
	ismap: 'isMap',
	nomodule: 'noModule',
	playsinline: 'playsInline',
	readonly: 'readOnly'
};
NodeList.prototype.last = function () {
	return this[this.length - 1];
}
Array.prototype.last = function () {
	return this[this.length - 1];
}
Array.prototype.take = function (to) {
	return this.slice(0, to);
}
Number.prototype.range = function (to) {
	return range(this.valueOf(), to);
}
class UniqueString extends String {
	constructor(val) {
		super(val)
	}
}
class UniqueNumber extends Number {
	constructor(val) {
		super(val)
	}
}
function toNodes(content) {
	let _ = document.createElement('_');
	_.innerHTML = content;
	return _.childNodes;
}
export function range(start, to) {
	let arr = [];
	while (start <= to) {
		arr.push(start);
		start++;
	}
	return arr;
}
export function flatMap(arr) {
	let newArr = [];
	arr.forEach(item => {
		if (Array.isArray(item)) {
			if (item instanceof ListState) {
				newArr.push(item);
			} else {
				newArr = [...newArr, ...flatMap(item)];
			}
		} else {
			newArr.push(item);
		}
	});
	return newArr;
}
/**
 * Injects an external script into the document.
 * @param {string} src - script source URL
 * @param {object} [options] - element attributes (async, defer, type, ...) or an `onload` callback
 */
export function addScript(src, options = {}) {
	const inject = () => {
		const script = document.createElement('script');
		script.setAttribute('src', src);
		for (const key in options) {
			if (Object.hasOwnProperty.call(options, key)) {
				const optValue = options[key];
				if (key === 'onload' && typeof optValue === 'function') {
					script.addEventListener('load', optValue);
				} else {
					script.setAttribute(key, optValue);
				}
			}
		}
		document.body.append(script);
	};
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', inject);
	} else {
		inject();
	}
}
export class JetzArgument {
	element;
	setElement(element) {
		this.element = element;
	}
}

function createElement(tag, ...args) {
	args = flatMap(args);
	let attr = {};
	if (args.length > 0) {
		args = args.filter((arg, position) => {
			if (typeof arg === "object") {
				if (arg == null) return false;
				if (arg instanceof JetzElement) {
					return true;
				} else if (arg instanceof State || arg.prototype instanceof State) {
					return true;
				} else if (arg instanceof ListState) {
					return true;
				} else if (arg instanceof Component) {
					return true;
				} else if (
					arg instanceof UniqueString ||
					arg instanceof UniqueNumber
				) {
					return true;
				} else if (arg instanceof Raw) {
					return true;
				} else if (arg instanceof IfElse || arg instanceof StateListener) {
					return true;
				} else if (arg.constructor.prototype instanceof JetzArgument) {
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
			if (args[0].constructor.name === 'Object') {
				attr = args[0];
				args = args.slice(1);
			}
		}
	}
	return new JetzElement(tag, attr, ...args);
}
/**
 * Active component lifecycle context while a component's render() executes.
 * Standalone hooks like onMount(() => ...) register against this context.
 */
let _activeLifecycle = null;
/**
 * Dependency tracking context for computed() and effect().
 * When set, any State.value read will register itself here.
 */
let _trackingEffect = null;
/**
 * Registers a hook on the currently rendering component. Intended for
 * function components:
 *
 *   function UserComponent(user) {
 *     onMount(() => { ... });
 *     return div(user.name);
 *   }
 */
function useLifecycle(stage, callback) {
	if (_activeLifecycle) {
		_activeLifecycle.add(stage, callback);
	} else if (typeof console !== 'undefined') {
		console.warn(`Jetz: ${stage}() called outside of a component render; ignored.`);
	}
}
const onCreate = callback => useLifecycle('onCreate', callback);
const onMount = callback => useLifecycle('onMount', callback);
const onUpdate = callback => useLifecycle('onUpdate', callback);
const onDestroy = callback => useLifecycle('onDestroy', callback);
class Dispatcher {
	#actionDispatch;
	constructor(callback = action => { }) {
		this.#actionDispatch = callback;
	}
	dispatch(action, ...args) {
		return this.#actionDispatch(action, ...args);
	}
}

class Component {
	$params;
	static new(...arg) {
		return new this(...arg);
	}
	render() {
		return null;
	};
	/** Runs once before the component's render() is invoked. */
	onCreate() { }
	/** Runs once after the component's element is attached to the document. */
	onMount() { }
	/** Runs on every state change while the component is alive. */
	onUpdate() { }
	/** Runs once when the component's element is removed from the document. */
	onDestroy() { }
	/** @deprecated use onMount() instead */
	onRendered() { }
}
/**
 * Collects the lifecycle hooks registered by a component (class or function).
 * A single context drives all four stages, so class components and function
 * components share the same machinery.
 */
class LifecycleContext {
	component = null;
	entry = null;
	mounted = false;
	destroyed = false;
	#created = false;
	hooks = { onCreate: [], onMount: [], onUpdate: [], onDestroy: [] };
	add(stage, callback) {
		if (typeof callback === 'function' && stage in this.hooks) {
			this.hooks[stage].push(callback);
		}
	}
	runCreate() {
		if (this.#created) return;
		this.#created = true;
		this.hooks.onCreate.forEach(cb => cb());
	}
	runMount() {
		if (this.mounted || this.destroyed) return;
		this.mounted = true;
		this.hooks.onMount.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onMount')) {
			component.onMount();
		}
	}
	runUpdate() {
		if (!this.mounted || this.destroyed) return;
		this.hooks.onUpdate.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onUpdate')) {
			component.onUpdate();
		}
	}
	runDestroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		this.hooks.onDestroy.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onDestroy')) {
			component.onDestroy();
		}
	}
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
	/** Component lifecycle context attached by Component rendering. */
	lifecycle = null;
	attachLifecycle(context) {
		this.lifecycle = context;
		context.entry = this;
		Jetz.registerLifecycle(context);
		context.runCreate();
	}
	#notifyLifecycleUpdate() {
		if (this.lifecycle) this.lifecycle.runUpdate();
	}

	constructor(tag, attributes, ...children) {
		this.tagName = tag;
		this.attributes = attributes;
		this.children = children;
	}

	#atLifecycles(main) {
		if (this.lifecycles.onStart) {
			this.lifecycles.onStart();
		}
		main()
		if (this.lifecycles.onRendered) {
			Jetz.addRenderedEffect(this.lifecycles.onRendered);
		}
	}
	triggerCondition() {
		this.collectionConditionalChild.forEach(condition => {
			condition.trigger();
		});
		// this.collectionConditionalChild = [];
	}
	setPrevious(previous) {
		this.previousElement = previous;
	}
	render(parent = null, renderPosition = 0) {
		this.renderPosition = renderPosition;
		this.parent = parent; // Parent JetzElement
		this.#atLifecycles(() => {
			this.o = document.createElement(this.tagName);
			this.assignAttributes();
			this.assignChildren();
			this.initStyle();
			this.initListener();
			this.o.$ = this;
			// class components fire their own onMount/onRendered once their
			// element exists; function components registered through context
			if (this.lifecycle) {
				const component = this.lifecycle.component;
				if (component && component.constructor.prototype.hasOwnProperty('onRendered')) {
					const prevHook = this.lifecycles.onRendered;
					this.lifecycles.onRendered = () => {
						prevHook?.();
						component.onRendered();
					};
				}
			}
		})
		// if the element is attached to the document right away, mount now
		if (this.o && this.o.isConnected && this.lifecycle) {
			this.lifecycle.runMount();
		}
	}
	/**
	 * Fires onMount for this element and its subtree once the nodes are in
	 * the document. Called by the parent after appending the child.
	 */
	#notifyMounted() {
		if (!this.o) return;
		if (this.lifecycle) this.lifecycle.runMount();
		this.children.forEach(child => {
			if (child instanceof JetzElement) child.#notifyMounted();
		});
	}
	getElement() {
		return this.o;
	}
	onRendered(callback = null) {
		this.lifecycles.onRendered = callback;
		return this;
	}
	onStart(callback = () => { }) {
		this.lifecycles.onStart = callback;
		return this;
	}
	assignAttributes() {
		for (const attr in this.attributes) {
			if (Object.hasOwnProperty.call(this.attributes, attr)) {
				const attrValue = this.attributes[attr];
				if (attr.substring(0, 2) == 'on') {
					if (typeof attrValue === "function")
						this.o.addEventListener(attr.substring(2), attrValue.bind(this));
				} else if (attr === 'bind') {
					this.#bindInputValue(attrValue);
				} else if (attr === "style") {
					this.#addStyle(attrValue);
					continue;
				} else if (attr === 'if' || attr === 'else' || attr === 'elseif') {
					this.#assignConditionalAttr(attr, attrValue);
				} else {
					if (attr == 'arg') {
					}
					this.addAttr(attr, attrValue);
				}
			}
		}
	}
	#assignConditionalAttr(attrName, attrValue) {
		if (!this.parent) {
			console.warn(`Jetz: '${attrName}' attribute on a root element has no parent, skipped.`);
			return;
		}
		if (attrName === 'if') {
			let attrSpecial = new If(this, attrValue);
			// // check is assign or not
			this.parent.collectionConditionalChild.push(attrSpecial);
			if (Jetz.isAllowToRemount(this.parent)) {
				Jetz.remountByAttr.push(this.parent);
			}
		} else if (attrName === 'else') {
			var currentIfElement = this.parent.collectionConditionalChild.last();
			var newElse = new Else(this, currentIfElement);
			if (currentIfElement) {
				currentIfElement._else = newElse;
			}
		} else if (attrName === 'elseif') {
			var currentIfElement = this.parent.collectionConditionalChild.last();
			if (currentIfElement) {
				let newElseIf = new ElseIf(this, attrValue);
				currentIfElement.addElseIf(newElseIf);
			} else {
				throw new Error('expect IF declaration before ELSE IF', this.o);
			}
		}
	}
	#bindInputValue(stateTarget) {
		const inputType = this.attributes.type ?? this.o.type;
		if (this.o instanceof HTMLInputElement && inputType === 'checkbox') {
			this.o.checked = Boolean(stateTarget.value);
			this.#addListener('change', e => {
				stateTarget.value = e.target.checked;
			});
			stateTarget.subscribe(value => {
				this.o.checked = Boolean(value);
			});
			return;
		}
		this.#addListener('input', e => {
			stateTarget.value = e.target.value
		});
		this.addAttr('value', stateTarget);
	}
	#addStyle(styles) {
		for (const key in styles) {
			if (Object.hasOwnProperty.call(styles, key)) {
				let value = styles[key];
				if (typeof value === 'function') value = computed(value);
				if (value instanceof State) {
					const styleState = new StyleState(this.o.style, key, value);
					value.addContainer(styleState);
					this.o.style[key] = value.value;
				} else {
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
			if (child instanceof JetzElement) {
				this.addPreviousElement(child, children, i);
			}
			this.append(child);
		});
	}
	addPreviousElement(element, children, childPosition) {
		const prevPosition = childPosition - 1;
		if (prevPosition >= 0) {
			let childPrev = children[prevPosition];
			if (childPrev instanceof State || childPrev.prototype instanceof State)
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
			if (child instanceof JetzElement) {
				child.render(this);
				_child = child.getElement();
			} else if (child instanceof State || child.prototype instanceof State) {
				_child = child.generateMutable();
			} else if (child instanceof ListState) {
				child.assignParent(this);
				return this;
			} else if (
				child instanceof UniqueString ||
				child instanceof UniqueNumber
			) {
				_child = child;
			} else if (child instanceof Raw) {
				_child = child;
			} else if (child instanceof IfElse) {
				child.attachParent(this);
				if (!this.collectionConditionalChild.includes(child)) {
					this.collectionConditionalChild.push(child);
					if (Jetz.isAllowToRemount(this)) {
						Jetz.remountByAttr.push(this);
					}
				}
				if (typeof this.o !== "undefined") {
					// marker + first branch are rendered here to keep the child order
					child.trigger();
				} else {
					// parent is not rendered yet, replay on render
					this.children.push(child);
				}
				return this;
			} else if (child instanceof StateListener) {
				this.#appendStateListener(child);
				return this;
			}
		} else if (typeof child === 'function') {
			// function component: run inside a lifecycle context so its
			// onMount/onUpdate/onDestroy hooks are registered
			const context = new LifecycleContext();
			const previous = _activeLifecycle;
			_activeLifecycle = context;
			let childFunction;
			try {
				childFunction = child.call();
			} finally {
				_activeLifecycle = previous;
			}
			if (context.hooks.onCreate.length + context.hooks.onMount.length +
				context.hooks.onUpdate.length + context.hooks.onDestroy.length > 0) {
				// it registered hooks -> treat it as a function component
				context.component = child;
				const result = Array.isArray(childFunction) ? childFunction[0] : childFunction;
				if (result instanceof JetzElement && !result.lifecycle) {
					result.attachLifecycle(context);
				}
			}
			if (Array.isArray(childFunction))
				this.append(...childFunction);
			else
				this.append(childFunction);
			return this;
		} else {
			_child = child;
		}
		if (child instanceof Component) {
			return this.#appendComponent(child);
		} else if (typeof child != 'undefined' && child.prototype instanceof Component) {
			return this.#appendComponent(new child());
		}
		if (typeof this.o === "undefined") {
			this.children.push(_child);
		} else {
			if (this.renderPosition == 0) {
				if (_child instanceof Raw) {
					let nodes = toNodes(_child.get());
					if (nodes.length > 0)
						this.o.append(...nodes);
				} else {
					this.o.append(_child);
				}
			}
			// newly attached subtree is in the document: fire onMount down the tree
			if (child instanceof JetzElement && child.o) child.#notifyMounted();
		}
		if (child instanceof JetzElement) {
			if (child.lifecycles.onRendered) {
				child.lifecycles.onRendered();
			}
		}

		return this;
	}
	/** Registers a reactive listener child - it renders nothing, its callback is triggered instead. */
	#appendStateListener(listener) {
		listener.attachParent(this);
		listener.attachPrev(typeof this.o !== "undefined" ? this.o.lastChild : null);
		if (!this.collectionConditionalChild.includes(listener)) {
			this.collectionConditionalChild.push(listener);
			if (Jetz.isAllowToRemount(this)) {
				Jetz.remountByAttr.push(this);
			}
		}
		if (typeof this.o === "undefined") {
			// parent is not rendered yet, replay on render
			this.children.push(listener);
		} else if (!Jetz.isMounting) {
			// during a mount the first call comes from Jetz.triggerByState(),
			// which would otherwise notify the listener twice
			listener.trigger();
		}
		return this;
	}
	/** Renders a Component (instance or class) and wires its lifecycle hooks. */
	#appendComponent(component) {
		// set up the lifecycle context: class hooks + standalone function hooks
		const context = new LifecycleContext();
		context.component = component;
		component.$lifecycle = context;
		// run render() inside the context so function-component hooks register
		const previous = _activeLifecycle;
		_activeLifecycle = context;
		let childComponent;
		try {
			// class hook: onCreate runs before render()
			if (component.constructor.prototype.hasOwnProperty('onCreate')) {
				component.onCreate();
			}
			context.runCreate();
			childComponent = component.render();
		} finally {
			_activeLifecycle = previous;
		}
		if (childComponent instanceof JetzElement && component.constructor.prototype.hasOwnProperty('onRendered')) {
			// must be wired before the element renders, otherwise the hook is never invoked
			childComponent.onRendered(component.onRendered.bind(component));
		}
		if (childComponent instanceof JetzElement && !childComponent.lifecycle) {
			childComponent.attachLifecycle(context);
		} else if (Array.isArray(childComponent)) {
			context.entry = childComponent[0] instanceof JetzElement ? childComponent[0] : null;
			if (context.entry) {
				context.entry.attachLifecycle(context);
			}
		}
		if (Array.isArray(childComponent)) {
			this.#appendChildren(childComponent);
			return this;
		}
		this.append(childComponent);
		return this;
	}
	initStyle() {
		// check if this.style have a value
		if (Obj.isNotEmpty(this.style)) {
			this.#addStyle(this.style);
		}
		this.style = new Proxy(this.style, {
			set: (function (target, symbol, value) {
				this.o.style[symbol] = value;
				target[symbol] = value;
				return true;
			}).bind(this),
		});
	}
	initListener() {
		this.listener.forEach((_listener) => {
			this.#attachListener(_listener);
		});
	}
	/** Binds and attaches a listener entry once, keeping the bound reference for off(). */
	#attachListener(listener) {
		if (listener.boundCallback) return;
		listener.boundCallback = listener.callback.bind(this);
		this.#addListener(listener.eventName, listener.boundCallback);
	}
	hide() {
		if (typeof this.o !== "undefined") {
			// preserve original display value before hiding
			if (typeof this.oldStyle.display === "undefined") {
				this.oldStyle.display = this.o.style.display ?? "";
			}
			this.o.style.display = "none";
		} else {
			this.style.display = "none";
		}

		return this;
	}
	show() {
		if (typeof this.o === "undefined") {
			delete this.style.display;
			return this;
		}
		if (this.oldStyle.display && this.oldStyle.display !== "none") {
			this.o.style.display = this.oldStyle.display;
		} else {
			this.o.style.display = null;
		}
		return this;
	}
	text(data) {
		if (this.o) {
			this.o.textContent = data;
		}
		return this;
	}
	removeAttr(attrName) {
		this.o.removeAttribute(attrName);
		return this;
	}
	addAttr(attrName, attrValue) {
		if (typeof attrValue === 'function') {
			attrValue = computed(attrValue);
		}
		if (attrName === 'class') {
			if (attrValue instanceof State) {
				this.#setClassAttribute(attrValue.getValue());
				attrValue.subscribe(value => this.#setClassAttribute(value));
			} else {
				this.addClass(attrValue);
			}
		} else {
			if (attrValue instanceof State) {
				const update = value => this.#setAttributeValue(attrName, value);
				update(attrValue.getValue());
				attrValue.subscribe(update);
			} else if (typeof attrValue === 'object') {
				if (attrValue !== null && attrValue.constructor.prototype instanceof JetzArgument) {
					attrValue.setElement(this);
					attrValue.onAssigned();
				}
			} else {
				this.#setAttributeValue(attrName, attrValue);
			}
		}
		return this;
	}
	#setAttributeValue(attrName, value) {
		if (attrName === 'value') {
			this.o.value = value;
			if (value == null) this.o.removeAttribute(attrName);
			else this.o.setAttribute(attrName, value);
			return;
		}
		if (booleanAttributes.has(attrName.toLowerCase())) {
			const enabled = Boolean(value);
			if (enabled) this.o.setAttribute(attrName, attrName);
			else this.o.removeAttribute(attrName);
			const property = booleanAttributeProperties[attrName.toLowerCase()] || attrName.toLowerCase();
			if (property in this.o) this.o[property] = enabled;
			return;
		}
		this.o.setAttribute(attrName, value);
	}
	#setClassAttribute(value) {
		const values = Array.isArray(value) ? flatMap(value) : [value];
		const className = values
			.filter(item => item != null && item !== false)
			.flatMap(item => String(item).split(/\s+/))
			.filter(Boolean)
			.join(' ');
		if (className) this.o.setAttribute('class', className);
		else this.o.removeAttribute('class');
	}
	addClass(value) {
		if (typeof (this.o) === 'undefined') {
			this.attributes['class'] = value;
		} else {
			if (Array.isArray(value)) {
				const values = flatMap(value.map(x => (typeof x === 'string') ? x.split(' ') : x));
				this.#addClassClassification(values);
			} else if (typeof value === 'string') {
				this.o.classList.add(...(value.split(' ')));
			}
		}
		return this;
	}
	#addClassClassification(cssClass) {
		this.o.classList.add(...cssClass);
	}
	toggleClass(className) {
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
			this.o.className = "";
			return this;
		}
		this.o.classList.replace(oldClass, newClass);
		return this;
	}
	#addListener(eventName, callback) {
		this.o.addEventListener(eventName, callback);
	}
	on(eventName, callback = (e) => { }) {
		const listener = { eventName, callback };
		this.listener.push(listener);
		// the element can already be rendered, so attach right away
		if (typeof this.o !== "undefined") {
			this.#attachListener(listener);
		}
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
		if (newValue != null) {
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
		// fire destroy hooks for the removed subtree
		if (this.o) {
			[...this.o.childNodes].forEach(node => {
				const $ = node.$;
				if ($ instanceof JetzElement) $.destroyLifecycle();
			});
		}
		this.children = [];
		this.o.innerHTML = "";
		return this;
	}
	remove() {
		if (this.o) {
			this.destroyLifecycle();
			this.o.remove();
		}
	}
	/** Fires onDestroy for this element and its whole subtree. */
	destroyLifecycle() {
		if (this.lifecycle) this.lifecycle.runDestroy();
		this.children.forEach(child => {
			if (child instanceof JetzElement) child.destroyLifecycle();
		});
	}
	/** Removes a previously attached event listener. */
	off(eventName, callback) {
		const listener = this.listener.find(item => item.eventName === eventName && item.callback === callback);
		this.o.removeEventListener(eventName, listener?.boundCallback ?? callback);
		if (listener) {
			this.listener = this.listener.filter(item => item !== listener);
		}
		return this;
	}
	/** Applies style(s) before or after render. */
	setStyle(styles) {
		if (typeof this.o === "undefined") {
			Object.assign(this.style, styles);
		} else {
			this.#addStyle(styles);
		}
		return this;
	}
	getStyle(key) {
		return this.o ? this.o.style[key] : this.style[key];
	}
	/** Gets an attribute value (rendered or pending). */
	attr(name) {
		return this.o ? this.o.getAttribute(name) : this.attributes[name];
	}
	disable() {
		this.addAttr('disabled', 'disabled');
		return this;
	}
	enable() {
		this.removeAttr('disabled');
		return this;
	}
	focus() {
		if (this.o) this.o.focus();
		return this;
	}
	blur() {
		if (this.o) this.o.blur();
		return this;
	}
	getParent() {
		return this.parent;
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
	static #isMounting = false;
	// live component lifecycle contexts
	static #lifecycles = new Set();
	/** True while Jetz.mount() renders and triggers the element tree. */
	static get isMounting() {
		return Jetz.#isMounting;
	}
	/** Registers a component lifecycle context for update/destroy tracking. */
	static registerLifecycle(context) {
		Jetz.#lifecycles.add(context);
	}
	static triggerByState() {
		this.remountByAttr.forEach(element => {
			element.collectionConditionalChild.forEach(rm => rm.trigger())
		});
		if (!Jetz.#isMounting) {
			Jetz.#sweepLifecycles();
		}
	}
	/** Fires onUpdate for live components and onDestroy for detached ones. */
	static #sweepLifecycles() {
		Jetz.#lifecycles.forEach(context => {
			const node = context.entry?.o;
			if (node && !node.isConnected) {
				context.runDestroy();
				Jetz.#lifecycles.delete(context);
			} else if (context.mounted && !context.destroyed) {
				context.runUpdate();
			}
		});
	}
	static addRenderedEffect(callback) {
		Jetz.#onRenderedCollections.push(callback)
	}
	static onFirstRenderPage() {
		Jetz.#onRenderedCollections.forEach(callback => callback());
		// nodes are attached after mount; fire onMount for every live component
		Jetz.#lifecycles.forEach(context => {
			if (context.entry?.o?.isConnected) {
				context.runMount();
			}
		});
	}
	static mount(jetzElement, target, event = { onStart() { }, onLoad() { } }) {
		if (typeof (target) === 'string') {
			target = document.querySelector(target);
		}
		if (target == null) {
			console.error('Jetz.mount: mount target not found');
			return;
		}
		let components = flatMap([jetzElement])
		this.onStart(event.onStart);
		Jetz.#isMounting = true;
		try {
			if (Array.isArray(components)) {
				components.forEach(element => {
					if (element != null) {
						if (typeof element === 'function') {
							element = element();
						}

						element.render();
						target.append(element.getElement());
					}
				});
			}
			Jetz.onFirstRenderPage();
			Jetz.triggerByState();
		} finally {
			Jetz.#isMounting = false;
		}

		this.onLoad(event.onLoad);
	}
	static style(cssStyle) {
		const _style = document.createElement("style");
		_style.textContent = cssStyle;
		document.head.append(_style);
	}
	static onStart(callback) {
		if (callback != null) {
			callback.call();
		}
	}
	static onLoad(callback) {
		if (callback != null) {
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => callback());
			} else {
				callback();
			}
		}
	}
	static isAllowToRemount(findElement) {
		return Jetz.remountByAttr.filter(element => {
			return element == findElement;
		}).length == 0
	}
	static use(app) {
		app.install(Jetz);
	}
	static get version() {
		return '1.0.0';
	}
	/** Clears the target container (string selector or element). */
	static unmount(target) {
		if (typeof target === 'string') {
			target = document.querySelector(target);
		}
		if (target) {
			// fire onDestroy for components rendered inside the container
			[...target.querySelectorAll('*')].forEach(node => {
				const $ = node.$;
				if ($ instanceof JetzElement) $.destroyLifecycle();
			});
			target.innerHTML = '';
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
/**
 * Reactive state container. Bind it to attributes/children to keep the DOM
 * in sync; call `setState` (or set `.value`) to update all bound containers.
 */
class State {

	#value;
	container = [];
	#handler;
	#subscribers = [];
	constructor(value, handler = { get(obj, prop) { return obj[prop] }, set(obj) { } }) {
		this.#value = value;
		this.#handler = handler;
	}
	addContainer(container) {
		this.container.push(container)
	}
	generateMutable() {
		let element = null;
		if (this.#value instanceof JetzElement) {
			this.#value.render();
			element = this.#value.getElement();
		} else {
			element = new Text(this.#value);
		}
		this.container.push(element);
		// Will added in element tree
		return element;
	}
	/** Registers a listener invoked as `listener(newValue, oldValue)` on every change. */
	subscribe(listener) {
		if (typeof listener === 'function') this.#subscribers.push(listener);
		return this;
	}
	unsubscribe(listener) {
		this.#subscribers = this.#subscribers.filter(fn => fn !== listener);
		return this;
	}
	setState(newValue) {
		const oldValue = this.#value;
		this.#value = newValue;
		this.container = this.container.map(container => {
			if (this.#value instanceof JetzElement) {
				this.#value.render();
				let element = this.#value.getElement();
				container.replaceWith(element);
				// trigger lifecycle
				if (this.#value.lifecycles.onRendered)
					this.#value.lifecycles.onRendered();
				return element;
			} else if (typeof (this.#value) === 'object') {
				// console.log('obj')
			} else {
				this.#assignContainerValue(container, this.#value);
			}
			return container;
		});
		this.#subscribers.forEach(fn => fn(this.#value, oldValue));
		Jetz.triggerByState();
	}
	#assignContainerValue(container, value) {
		if (container instanceof HTMLElement) {
			container.innerHTML = value;
		} else if (container instanceof Attr) {
			if (container.nodeName === 'value') {
				container.ownerElement.value = value;
				container.nodeValue = value;
			} else
				container.nodeValue = value;
		} else if (container instanceof Text) {
			container.textContent = value;
		} else if (container instanceof StyleState) {
			container.value = value;
			container.container[container.key] = container.value;
		}
	}
	getValue() {
		return this.#value;
	}
	get value() {
		// auto-tracking: register this state as a dependency
		if (_trackingEffect) {
			_trackingEffect.add(this);
		}
		this.#handler.get(this);
		return this.getValue();
	}
	set value(val) {
		this.#handler.set(this, val);
	}
	toString() {
		if (this.constructor.name === State.name)
			return String(this.#value);
		else if (this.constructor.name === ListState.name)
			return this.values.join(',');
	}
	valueOf() {
		return this.#value;
	}
}

class _RememberStateTemp {
	static storageDriver = (function () {
		try { return localStorage; } catch (e) { return null; }
	})();
	static keyRememberState = 'app-remember-state';
	static rememberCollections = {};
	static assignCollectionValue(id, childKey, childValue) {
		if (this.storageDriver == null) return;
		let dataCollection = {};
		const oldCollection = this.storageDriver.getItem(this.keyRememberState);
		if (oldCollection != null) {
			try {
				dataCollection = JSON.parse(oldCollection);
			} catch (e) {
				dataCollection = {};
			}
			this.rememberCollections = dataCollection
		}
		if (this.rememberCollections.hasOwnProperty(id) == false) {
			this.rememberCollections[id] = {};
		}
		this.rememberCollections[id][childKey] = childValue;
		// save collection
		try {
			this.storageDriver.setItem(this.keyRememberState, JSON.stringify(this.rememberCollections));
		} catch (e) { /* storage unavailable or full */ }
	}
	static getCollectionValue(id, key, def = null) {
		if (this.storageDriver == null) return def;
		const collections = this.rememberCollections[id];
		if (collections == null) return def;
		const value = collections[key];
		if (value == null) return def;
		return value;
	}
	static init() {
		if (this.storageDriver == null) {
			this.rememberCollections = {};
			return;
		}
		const _rememberCollections = this.storageDriver.getItem(this.keyRememberState);
		if (_rememberCollections == null) {
			this.rememberCollections = {};
		} else {
			try {
				this.rememberCollections = JSON.parse(_rememberCollections);
			} catch (e) {
				this.rememberCollections = {};
			}
		}
	}
}
_RememberStateTemp.init();

class RememberState extends State {
	id;
	static #idTemp = 0;
	static generateId(_state) {
		RememberState.#idTemp++;
		_state.id = _state.pathId + RememberState.#idTemp;
	}
	valueOf() {
		return this.getValue();
	}
	pathId = location.pathname.split('/').join('__');
	constructor(value, handler = { get(obj) { }, set(obj) { } }, key) {
		super(value, handler);
		if (key === undefined) {
			RememberState.generateId(this);
		} else {
			this.id = `${this.pathId}__key__${key}`;
		}
		let oldValue = _RememberStateTemp.getCollectionValue(this.pathId, this.id);
		if (oldValue != null) {
			this.setState(oldValue);
		}
	}
	setState(newValue) {
		super.setState(newValue);
		_RememberStateTemp.assignCollectionValue(this.pathId, this.id, newValue);
	}
	toString() {
		return this.getValue();
	}
	// toInteger(){
	// 	return this.getValue();
	// }
}

export class ListState extends Array {
	parentElement = [];
	values = [];
	views = [];
	uniqueValue = false;
	isRemember = false;
	objRemember;
	/** @internal key extractor for keyed reconciliation */
	_keyFn = null;
	/** @internal enable keyed reconciliation */
	_useKeyedReconciliation = false;
	/** @internal maps key -> { item, view (JetzElement) } per parent */
	_keyMaps = [];

	asUnique() {
		this.uniqueValue = true;
		this.values = this.values.map(val => {
			return this.#fixValue(val)
		});
		return this;
	}

	/**
	 * Marks this list as persisted to localStorage (per page path) via a
	 * RememberState. Restores previously saved values and keeps saving on
	 * every mutation. Returns the same list for chaining.
	 */
	asRemember(key) {
		if (this.isRemember) return this;
		const objRemember = new RememberState(JSON.stringify(this.values), undefined, key);
		const saved = JSON.parse(objRemember.valueOf());
		// adopt persisted values, if any
		if (JSON.stringify(saved) !== JSON.stringify(this.values)) {
			this.values = saved;
			super.splice(0, this.length, ...saved);
			this.length = saved.length;
			this.renderView(true);
		}
		this.isRemember = true;
		this.objRemember = objRemember;
		return this;
	}

	at(index) {
		return this.values[index];
	}

	renderCallback = item => { return item };

	constructor(isRemember = false, ...values) {
		if (isRemember) {
			var objRemember = new RememberState(JSON.stringify(values));
			values = JSON.parse(objRemember.valueOf());
			super(...values);
			this.isRemember = true;
			this.objRemember = objRemember;
		} else {
			super(...values);
		}
		this.values = values;
		this.length = values.length;
	}
	set(newData) {
		this.values = newData;
		this.length = this.values.length;
		this.renderView(true);
		// remember effect
		if (this.isRemember) {
			this.objRemember.setState(JSON.stringify(this.values));
		}
		return this;
	}
	clear() {
		this.empty();
	}
	empty() {
		this.set([]);
	}
	createItemView(parent, item, index) {
		var renderedItem = this.renderCallback(item, index);
		if (renderedItem instanceof JetzElement) {
			renderedItem.render(parent);
			return renderedItem;
		}
		// plain values need a carrier element so views stay removable/replaceable
		const carrier = createElement('span', renderedItem);
		carrier.render(parent);
		return carrier;
	}
	push(...items) {
		for (let _i = 0; _i < items.length; _i++) {
			let item = items[_i];

			if (this.uniqueValue)
				item = this.#fixValue(item);
			super.push(item);
			this.values.push(item);
			this.parentElement.map((parent, i) => {
				this.newView(i, this.views[i], item, this.values.length - 1);
				return parent;
			});
			// remember effect
			if (this.isRemember) {
				this.objRemember.setState(JSON.stringify(this.values));
			}
		}
	}
	renderView(refresh = false) {
		// Keyed reconciliation path
		if (this._useKeyedReconciliation && this._keyFn && refresh) {
			this._keyMaps.forEach((keyMap, parentIdx) => {
				const parent = this.parentElement[parentIdx];
				if (!parent || !parent.o) return;
				const newKeys = this.values.map(item => this._keyFn(item));
				const newKeySet = new Set(newKeys);
				// 1. Remove items no longer in the list
				for (const [key, entry] of keyMap) {
					if (!newKeySet.has(key)) {
						if (entry.view instanceof JetzElement) entry.view.remove();
						keyMap.delete(key);
					}
				}
				// 2. Add/reorder items
				let prevNode = null;
				newKeys.forEach((key, j) => {
					let entry = keyMap.get(key);
					if (!entry) {
						// New item: create view
						const rendered = this.createItemView(parent, this.values[j], j);
						entry = { item: this.values[j], view: rendered };
						keyMap.set(key, entry);
						// Insert at correct position
						const domNode = rendered instanceof JetzElement ? rendered.getElement() : rendered;
						if (prevNode) {
							prevNode.after(domNode);
						} else {
							parent.o.prepend(domNode);
						}
					} else {
						// Existing item: reorder if needed
						entry.item = this.values[j];
						const domNode = entry.view instanceof JetzElement ? entry.view.getElement() : entry.view;
						if (prevNode) {
							if (domNode.previousSibling !== prevNode) {
								prevNode.after(domNode);
							}
						} else {
							if (parent.o.firstChild !== domNode) {
								parent.o.prepend(domNode);
							}
						}
					}
					prevNode = entry.view instanceof JetzElement ? entry.view.getElement() : entry.view;
				});
				// Rebuild views array from keyMap order
				this.views[parentIdx] = newKeys.map(k => keyMap.get(k).view);
			});
			return;
		}
		// Classic (non-keyed) path
		if (refresh) {
			this.views = this.views.map(view => {
				// if its HTML element
				view.map(v => {
					if (v instanceof JetzElement)
						v.remove();
					return [];
				})
				return [];
			})
		}
		this.views.map((view, i) => {
			this.values.forEach((_item, j) => {
				this.newView(i, view, _item, j)
			})
			return view;
		});
	}
	newView(index, view, content, _index) {
		var renderedItem = this.createItemView(this.parentElement[index], content, _index);
		view.push(renderedItem);
		this.parentElement[index].append(renderedItem);
	}
	remove(item) {
		const index = this.values.indexOf(item);
		if (index !== -1) this.removeAt(index);
	}
	removeAt(index) {
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
	get(index) {
		if (typeof index == 'number') {
			return this.values[index];
		} else if (typeof index == 'string') {
			if (index == 'length') return this.length;
		} else {

		}
	}
	map(callback) {
		this.values = this.values.map(callback);
		this.renderView(true);
		return this;
	}
	insertAt(index, ...items) {
		this.values.splice(index, 0, ...items);
		this.splice(index, 0, ...items);
		this.length = this.values.length;
		this.renderView(true);
		Jetz.triggerByState();
		return this;
	}
	sort(compareFn) {
		this.values.sort(compareFn);
		this.renderView(true);
		return this;
	}
	filter(searchCallback) {
		return this.values.filter(searchCallback);
	}
	indexOf(item) {
		return this.values.indexOf(item);
	}
	includes(item) {
		return this.values.includes(item);
	}
	first() {
		return this.values[0];
	}
	last() {
		return this.values[this.values.length - 1];
	}
	get size() {
		return this.values.length;
	}
	assignParent(parent) {
		// new stack view
		this.views.push([]);
		this.parentElement.push([]);
		let lastIndex = this.parentElement.length - 1;
		this.parentElement[lastIndex] = parent;
		// Initialize keyed map for this parent
		if (this._useKeyedReconciliation && this._keyFn) {
			const keyMap = new Map();
			this._keyMaps.push(keyMap);
			this.values.forEach((value, i) => {
				var renderedItem = this.createItemView(this.parentElement[lastIndex], value, i);
				this.parentElement[lastIndex].append(renderedItem);
				this.views[this.views.length - 1].push(renderedItem);
				keyMap.set(this._keyFn(value), { item: value, view: renderedItem });
			});
		} else {
			this._keyMaps.push(null);
			this.values.forEach((value, i) => {
				var renderedItem = this.createItemView(this.parentElement[lastIndex], value, i);
				this.parentElement[lastIndex].append(renderedItem);
				this.views[this.views.length - 1].push(renderedItem);
			});
		}
	}
	setViews(views) {
		this.views = views;
		if (views.length > 0)
			this.parentElement = views[0].parent;
	}
	toState() {
		this.values = this.values.map(value => stateOf(value));
		return this;
	}
	#fixValue(value) {
		if (typeof value === 'string') {
			return new UniqueString(value);
		} else if (typeof value === 'number') {
			return new UniqueNumber(value);
		} else {
			return value;
		}
	}
	take(to) {
		return this.values.take(to)
	}
	find(searchCallback = value => true) {
		return this.values.filter(searchCallback);
	}
	*[Symbol.iterator]() {
		yield* this.values;
	}
}
export function listOf(...items) {
	return new ListState(false, ...items);
}

export function sequenceOf(...items) {
	let listState = new ListState(false, ...items);
	return listState.asUnique();
}
/**
 * Renders a collection. Supports two signatures:
 *
 *   loop(list, renderFn)           — classic (re-renders all on change)
 *   loop(list, keyFn, renderFn)    — keyed reconciliation (updates only changed items)
 *
 * The keyed form is important for large lists: when one item out of 1000 changes,
 * only that single item is updated instead of re-rendering all 1000.
 *
 * @example
 * // Classic
 * loop(users, user => div(user.name))
 *
 * // Keyed
 * loop(users, user => user.id, user => UserCard(user))
 */
export function loop(collections, keyOrRender, render) {
	// Detect keyed form: loop(list, keyFn, renderFn)
	if (typeof render === 'function' && typeof keyOrRender === 'function') {
		if (collections instanceof ListState) {
			collections._keyFn = keyOrRender;
			collections.renderCallback = render;
			collections._useKeyedReconciliation = true;
		} else {
			// static array: keyed doesn't help, just render
			let rendered = [];
			for (let index = 0; index < collections.length; index++) {
				rendered.push(render(collections[index], index));
			}
			return rendered;
		}
		return collections;
	}
	// Classic form: loop(list, renderFn)
	const renderFn = keyOrRender ?? ((item, index) => item);
	if (collections instanceof ListState) {
		collections.renderCallback = renderFn;
	} else {
		let rendered = [];
		for (let index = 0; index < collections.length; index++) {
			const item = collections[index];
			rendered.push(renderFn(item, index));
		}
		return rendered;
	}
	return collections;
}
export function createList(length, callbackItem = (index) => { return index; }) {
	var dataList = [];
	for (let index = 0; index < length; index++) {
		dataList.push(callbackItem(index));
	}
	return dataList;
}
function rememberOf(keyOrValue, value) {
	const hasKey = arguments.length > 1;
	const key = hasKey ? keyOrValue : undefined;
	const initialValue = hasKey ? value : keyOrValue;
	if (hasKey && typeof key !== 'string') {
		throw new TypeError('rememberOf key must be a string');
	}
	const remember = (rememberKey, rememberValue) => rememberKey === undefined
		? rememberOf(rememberValue)
		: rememberOf(rememberKey, rememberValue);
	let instance = null;
	if (typeof initialValue === 'object' && initialValue !== null && !(initialValue instanceof Array) && !(initialValue instanceof JetzElement)) {
		for (const prop in initialValue) {
			if (Object.hasOwnProperty.call(initialValue, prop)) {
				const propValue = initialValue[prop];
				initialValue[prop] = remember(key === undefined ? undefined : `${key}.${prop}`, propValue);
			}
		}
		instance = initialValue;
	} else if (initialValue instanceof Array) {
		instance = new ListState(false, ...initialValue).asRemember(key);
	} else {
		const optDefaultProxy = {
			get(obj, prop) {
				return obj.getValue();
			},
			set(obj, value) {
				obj.setState(value);
				return true;
			}
		};
		let objState = new RememberState(initialValue, optDefaultProxy, key);
		// custom function string
		instance = objState;
	}
	return instance;
}
let PageSession = {
	setItem(key, value) {
		try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
	},
	getItem(key, def = null) {
		try {
			const raw = sessionStorage.getItem(key);
			return raw == null ? def : JSON.parse(raw);
		} catch (e) {
			return def;
		}
	}
}
function stateOf(value, handler = { get(value) { return value } }) {
	let instance = null;
	if (typeof value === 'object' && !(value instanceof JetzElement)) {
		for (const prop in value) {
			if (Object.hasOwnProperty.call(value, prop)) {
				const propValue = value[prop];
				value[prop] = stateOf(propValue);
			}
		}
		value.toObject = function () {
			let _obj = {};
			for (const key in value) {
				if (Object.hasOwnProperty.call(value, key)) {
					const element = value[key];
					_obj[key] = element.value;
				}
			}
			delete _obj['toObject'];
			return _obj;
		}
		instance = value;
	} else {
		const optDefaultProxy = {
			get(obj) {
				let outValue = handler.get(obj);
				return outValue ?? obj.getValue();
			},
			set(obj, value) {
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
/**
 * Merges objects into a new object without mutating the inputs.
 * Conflicting values are collected into arrays; array values are concatenated.
 */
function mergeObject(obj1, ...obj2) {
	const sources = [obj1, ...obj2].filter(src => src != null && typeof src === 'object');
	var newObj = {};
	for (const obj of sources) {
		for (const prop in obj) {
			if (Object.hasOwnProperty.call(obj, prop)) {
				const value = obj[prop];
				// check prop in newobj
				if (Object.hasOwnProperty.call(newObj, prop)) {
					const value2 = newObj[prop];
					// check datatype
					if (Array.isArray(value)) {
						newObj[prop] = Array.isArray(value2) ? [...value, ...value2] : [...value, value2];
					} else if (Array.isArray(value2)) {
						newObj[prop] = [...value2, value];
					} else {
						newObj[prop] = [value2, value];
					}
				} else {
					newObj[prop] = Array.isArray(value) ? [...value] : value;
				}
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
	get() {
		return this.#content;
	}
	set(content) {
		this.#content = content;
	}
	valueOf() {
		return this.#content;
	}
}
class AttrSpecial {
	value;
	element;

	beforeNode; // anchor after the sibling preceding this element (positionElement 0)
	parentNode; // anchor at the start of the parent (positionElement 2)

	positionElement;

	_else;
	_elseIf = [];

	isDefined = false;

	constructor(element, value) {
		this.value = value;
		this.element = element;
	}

	initContainer() {
		if (!this.isDefined) {
			if (this.element.o.previousSibling) {
				// anchored after the sibling that precedes this element
				this.beforeNode = this.element.o.previousSibling;
				this.positionElement = 0;
			} else {
				// first child: anchor at the start of the parent. The sibling that
				// follows belongs to the same conditional group and can be detached,
				// so it must not be used as an anchor.
				this.parentNode = this.element.o.parentNode;
				this.positionElement = 2;
			}
			this.isDefined = true;
		}
	}
	addElseIf(elseIf) {
		this._elseIf.push(elseIf);
	}

	hide() {
		this.initContainer();
		this.element.remove();
	}
	show() {
		this.initContainer();
		if (this.positionElement == 0 && this.beforeNode) {
			this.beforeNode.after(this.element.o);
		} else if (this.positionElement == 2 && this.parentNode) {
			this.parentNode.prepend(this.element.o);
		}
	}
}
class If extends AttrSpecial {
	triggerResult;
	lastCondition;
	lastElseIfResults;
	constructor(element, value) {
		super(element, value);
	}
	trigger() {
		const condition = this.value.call();
		this.triggerResult = condition;

		// the anchors of this element must exist before the _elseif / _else
		// branches copy them (initContainer only runs once and does not touch the DOM)
		this.initContainer();

		// every branch must be evaluated on every trigger, otherwise an _elseif /
		// _else would keep the previous result while this condition stays the same
		const elseIfResults = this._elseIf.map(__elseIf => {
			__elseIf.setParentIf(this);
			__elseIf.initContainer();
			__elseIf.trigger();
			return __elseIf.triggerResult;
		});
		const matchedElseIf = elseIfResults.findIndex(result => result);

		// nothing changed - keep the DOM untouched
		const unchanged = this.lastCondition === condition
			&& this.lastElseIfResults != null
			&& this.lastElseIfResults.length === elseIfResults.length
			&& this.lastElseIfResults.every((result, index) => result === elseIfResults[index]);
		if (unchanged) return;

		if (condition) {
			this.show();
		} else {
			this.hide();
		}
		this._elseIf.forEach((__elseIf, index) => {
			if (!condition && index === matchedElseIf) {
				__elseIf.show();
			} else {
				__elseIf.hide();
			}
		});
		if (this._else) {
			this._else.setParentIf(this);
			this._else.initContainer();
			if (!condition && matchedElseIf === -1) {
				this._else.show();
			} else {
				this._else.hide();
			}
		}
		this.lastCondition = condition;
		this.lastElseIfResults = elseIfResults;
	}
}
class ElseIf extends AttrSpecial {
	parentIfCondition;
	positionElement;
	constructor(element, value) {
		super(element, value);
	}
	setParentIf(parentIf) {
		this.beforeNode = parentIf.beforeNode;
		this.parentNode = parentIf.parentNode;
		this.positionElement = parentIf.positionElement;
	}
	initContainer() {
	}
	trigger() {
		return this.triggerResult = this.value();
	}
}

class Else {
	element;
	currentIf;

	parentIfCondition;
	positionElement;

	initContainer() {
		if (this.parentIfCondition.positionElement == 0) {
			this.beforeNode = this.parentIfCondition.beforeNode;
		} else {
			this.parentNode = this.parentIfCondition.parentNode;
		}
		this.positionElement = this.parentIfCondition.positionElement;
	}
	setParentIf(parentIf) {
		this.parentIfCondition = parentIf;
	}

	constructor(element, currentIf) {
		this.element = element;
		this.currentIf = currentIf;
	}

	hide() {
		this.element.remove();
	}
	show() {
		if (this.positionElement == 0 && this.beforeNode) {
			this.beforeNode.after(this.element.getElement());
		} else if (this.positionElement == 2 && this.parentNode) {
			this.parentNode.prepend(this.element.getElement());
		}
	}
}

/**
 * Reactive inline conditional child produced by `ifElse()`.
 * The matching branch is rendered in place (anchored by a comment marker) and
 * swapped whenever the condition changes - i.e. on every state update.
 */
class IfElse {
	targetParent;
	marker = null;
	currentNodes = [];
	lastCondition;
	rendered = false;

	constructor(condition, trueCallback, falseCallback = null) {
		this.condition = condition;
		this.trueCallback = trueCallback;
		this.falseCallback = falseCallback;
	}

	attachParent(element) {
		this.targetParent = element;
	}

	#evaluateCondition() {
		const condition = this.condition;
		if (typeof condition === 'function') return condition.call();
		if (condition instanceof State) return condition.getValue();
		return condition;
	}

	#initMarker() {
		if (this.marker != null) return;
		this.marker = document.createComment(' jetz:ifElse ');
		this.targetParent.o.append(this.marker);
	}

	/** Normalizes a branch result into a list of DOM nodes. */
	#resolveBranch(result) {
		if (result == null || result === false) return [];
		if (Array.isArray(result)) {
			return result.map(item => this.#resolveBranch(item)).flat();
		}
		if (typeof result === 'function') {
			if (result.prototype instanceof Component) {
				return this.#resolveBranch(new result());
			}
			return this.#resolveBranch(result.call());
		}
		if (result instanceof Component) {
			const rendered = result.render();
			if (rendered instanceof JetzElement && result.constructor.prototype.hasOwnProperty('onRendered')) {
				rendered.onRendered(result.onRendered.bind(result));
			}
			return this.#resolveBranch(rendered);
		}
		if (result instanceof JetzElement) {
			result.render(this.targetParent);
			return [result.getElement()];
		}
		if (result instanceof State || result.prototype instanceof State) {
			return [result.generateMutable()];
		}
		if (result instanceof ListState) {
			// list rendering is delegated to the parent element (stays reactive)
			this.targetParent.append(result);
			return [];
		}
		if (result instanceof Raw) {
			return Array.from(toNodes(result.get()));
		}
		return [document.createTextNode(result)];
	}

	trigger() {
		if (!this.targetParent || typeof this.targetParent.o === 'undefined') return;
		this.#initMarker();
		const condition = this.#evaluateCondition();
		if (this.rendered && this.lastCondition == condition) return;
		// remove the previously rendered branch
		this.currentNodes.forEach(node => node.remove());
		this.currentNodes = [];
		const branch = condition ? this.trueCallback : this.falseCallback;
		const branchResult = (typeof branch === 'function') ? branch.call() : branch;
		this.currentNodes = this.#resolveBranch(branchResult ?? null);
		if (this.currentNodes.length > 0) {
			this.marker.after(...this.currentNodes);
		}
		this.lastCondition = condition;
		this.rendered = true;
	}
}

/**
 * Reactive listener child created by `listen()`.
 * It renders nothing: the callback runs once when the parent element rendered and
 * again on every state change. The callback receives the parent element as `this`
 * and as the first argument, followed by the DOM node that precedes the listener.
 */
class StateListener {
	targetParent;
	targetPrev;
	listener;
	stopped = false;
	constructor(fn = () => { }) {
		this.listener = fn;
	}
	attachPrev(element) {
		this.targetPrev = element;
	}
	attachParent(element) {
		this.targetParent = element;
	}
	trigger() {
		if (this.stopped) return;
		this.listener.call(this.targetParent, this.targetParent, this.targetPrev);
	}
	/** Unregisters the listener from its parent element. */
	stop() {
		this.stopped = true;
		if (this.targetParent) {
			this.targetParent.collectionConditionalChild =
				this.targetParent.collectionConditionalChild.filter(item => item !== this);
		}
		return this;
	}
}

/**
 * Registers a reactive callback as a child of an element (nothing is rendered in its place).
 * @param {(parent: JetzElement, prev: Node|null) => void} fn - called when the parent rendered and on every state change
 * @returns {StateListener} the listener, call `.stop()` to unregister it
 * @example
 * div( 'Count : ', counter, listen(parent => parent.addClass(`count-${counter.value}`)) )
 */
function listen(fn) {
	return new StateListener(fn);
}
/**
 * Inline reactive conditional. Renders the branch matching `condition` and
 * re-evaluates it on every state change (same trigger cycle as `_if`).
 * @param {() => boolean} condition - called on render and on every state change
 * @param {() => any} trueCallback - content rendered when the condition is truthy
 * @param {() => any} [falseCallback] - content rendered when the condition is falsy
 * @returns {IfElse} an appendable child, use it inside an element
 * @example
 * div( ifElse(() => isShow.value, () => div('Im true'), () => 'Im false') )
 */
export function ifElse(condition, trueCallback, falseCallback = null) {
	return new IfElse(condition, trueCallback, falseCallback);
}
const _if = boolCallback => ({ if: boolCallback })
const _elseif = boolCallback => ({ elseif: boolCallback })
const _else = { else: null };
const html = content => new Raw(content);
const _show = _if;

/**
 * Creates a derived/computed state that automatically tracks its dependencies.
 * The compute function is executed immediately, and any `state.value` reads
 * inside it are recorded. Whenever a dependency changes, the computed value
 * is recalculated and all bound DOM containers are updated.
 *
 * @param {() => any} computeFn - pure function that derives a value from one or more states
 * @returns {State} a read-only reactive state
 *
 * @example
 * const firstName = stateOf('Deva');
 * const lastName = stateOf('Arofi');
 * const fullName = computed(() => `${firstName.value} ${lastName.value}`);
 * // use it like any state:
 * span(fullName)  // auto-updates when firstName or lastName changes
 */
function computed(computeFn) {
	let _computing = false;
	let _deps = new Set();
	let _unsubs = [];

	function track() {
		// Prevent circular recomputation
		if (_computing) return;
		_computing = true;

		// Unsubscribe from old dependencies
		_unsubs.forEach(fn => fn());
		_unsubs = [];
		_deps = new Set();

		// Collect dependencies by tracking State.value reads
		const prevTracking = _trackingEffect;
		_trackingEffect = _deps;
		let result;
		try {
			result = computeFn();
		} finally {
			_trackingEffect = prevTracking;
			_computing = false;
		}

		// Subscribe to all discovered dependencies
		_deps.forEach(dep => {
			const listener = () => {
				track();
			};
			dep.subscribe(listener);
			_unsubs.push(() => dep.unsubscribe(listener));
		});

		return result;
	}

	const initialValue = track();
	const derivedState = stateOf(initialValue);

	// Override the recompute to update the state
	const originalTrack = track;
	track = function () {
		_computing = true;

		_unsubs.forEach(fn => fn());
		_unsubs = [];
		_deps = new Set();

		const prevTracking = _trackingEffect;
		_trackingEffect = _deps;
		let result;
		try {
			result = computeFn();
		} finally {
			_trackingEffect = prevTracking;
			_computing = false;
		}

		_deps.forEach(dep => {
			const listener = () => { track(); };
			dep.subscribe(listener);
			_unsubs.push(() => dep.unsubscribe(listener));
		});

		derivedState.value = result;
		return result;
	};

	return derivedState;
}

/**
 * Runs a side-effect function that automatically tracks its state dependencies.
 * The effect re-runs whenever any accessed state changes.
 * Returns a dispose function to stop the effect and clean up subscriptions.
 *
 * @param {() => void} effectFn - function containing side-effects
 * @returns {() => void} dispose function
 *
 * @example
 * const counter = stateOf(0);
 * const dispose = effect(() => {
 *   document.title = `Count: ${counter.value}`;
 * });
 * // later: dispose() to stop the effect
 */
function effect(effectFn) {
	let _deps = new Set();
	let _unsubs = [];
	let _running = false;
	let _disposed = false;

	function run() {
		if (_disposed || _running) return;
		_running = true;

		// Unsubscribe from old dependencies
		_unsubs.forEach(fn => fn());
		_unsubs = [];
		_deps = new Set();

		// Collect dependencies by tracking State.value reads
		const prevTracking = _trackingEffect;
		_trackingEffect = _deps;
		try {
			effectFn();
		} finally {
			_trackingEffect = prevTracking;
			_running = false;
		}

		// Subscribe to all discovered dependencies
		_deps.forEach(dep => {
			const listener = () => { run(); };
			dep.subscribe(listener);
			_unsubs.push(() => dep.unsubscribe(listener));
		});
	}

	// Run immediately to collect initial dependencies and execute effect
	run();

	// Return dispose function
	return function dispose() {
		_disposed = true;
		_unsubs.forEach(fn => fn());
		_unsubs = [];
		_deps.clear();
	};
}

export { Jetz, Dispatcher, Component, JetzElement, State, RememberState, Raw, createElement, rememberOf, stateOf, computed, effect, _show, _else, _elseif, _if, html, listen, onCreate, onMount, onUpdate, onDestroy };
