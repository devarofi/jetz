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

function serializeRemembered(value) {
	return JSON.stringify(value, (_key, item) => item instanceof State ? item.getValue() : item);
}

function isPlainRememberedObject(value) {
	return value !== null
		&& typeof value === 'object'
		&& !Array.isArray(value)
		&& !(value instanceof State)
		&& !(value instanceof JetzElement)
		&& (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hydrateRememberedItem(item) {
	return isPlainRememberedObject(item)
		? stateOf(JSON.parse(serializeRemembered(item)))
		: item;
}

function subscribeRememberedValues(value, onChange, seen = new Set()) {
	if (value instanceof State) {
		if (seen.has(value)) return;
		seen.add(value);
		value.subscribe(onChange);
		subscribeRememberedValues(value.getValue(), onChange, seen);
		return;
	}
	if (value === null || typeof value !== 'object' || seen.has(value)) return;
	seen.add(value);
	Object.keys(value).forEach(key => {
		if (typeof value[key] !== 'function') {
			subscribeRememberedValues(value[key], onChange, seen);
		}
	});
}
/**
 * Attribute keys accepted as aliases, matched case-insensitively.
 *
 * `className` is the DOM property name (and the JSX one), so it is written far
 * more often than the HTML attribute it stands for. Unlike an unknown key, which
 * would silently land in the DOM as a junk `classname` attribute, it is mapped
 * onto `class` before merging so it folds together with `css()` on the same
 * element. Only the names listed here and the `data_`/`aria_` prefixes below are
 * rewritten - camelCase attribute names that carry meaning (`viewBox`,
 * `preserveAspectRatio`, …) pass through untouched.
 */
const attributeNameAliases = {
	classname: 'class'
};
/**
 * Attribute prefixes whose `_` separator stands for the HTML `-`.
 *
 * `data_counter` reads naturally in an object literal where the quoted hyphenated
 * form (`{ 'data-counter': … }`) does not, and `dataset` only ever exposes the
 * hyphenated spelling. Every `_` after a `data`/`aria` prefix becomes `-`, so
 * `data_row_index` yields `data-row-index` and `dataset.rowIndex`. Only these two
 * prefixes are converted, so `source_map` or `my_data` stay exactly as written.
 */
const dashedAttributePrefixes = new Set(['data', 'aria']);
/**
 * Maps a key onto the attribute it stands for: the `className` alias, then the
 * `data_`/`aria_` underscore form. Anything else is returned untouched, so a typo
 * like `cssClass` still lands in the DOM verbatim rather than being rerouted.
 */
const _attrNameCache = new Map();
function normalizeAttributeName(name) {
	const key = String(name);
	const cached = _attrNameCache.get(key);
	if (cached !== undefined) return cached;
	const alias = attributeNameAliases[key.toLowerCase()];
	if (alias) return _attrNameCache.set(key, alias), alias;
	const separator = key.indexOf('_');
	if (separator > 0 && dashedAttributePrefixes.has(key.slice(0, separator))) {
		const result = key.replace(/_/g, '-');
		return _attrNameCache.set(key, result), result;
	}
	return _attrNameCache.set(key, key), key;
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
    const result = [];
    for (const item of arr) {
        if (Array.isArray(item) && !(item instanceof ListState)) {
            result.push(...flatMap(item));
        } else {
            result.push(item);
        }
    }
    return result;
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

/**
 * A plain (untagged) template literal stringifies an interpolated function into
 * its source text — `div(`online: ${() => state.value ...}`)` renders the code,
 * not the value, and the closure is already gone. Flags that mistake while
 * `Jetz.devtools` is on (displayed code samples can legitimately contain `=>`,
 * so normal runs stay silent) and points at the tagged forms that stay reactive.
 */
const stringifiedFunctionPattern = /(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|\bfunction\s*(?:[A-Za-z_$][\w$]*\s*)?\(/;
function warnStringifiedFunction(child) {
	if (!Jetz.devtools || typeof child !== 'string') return;
	if (!stringifiedFunctionPattern.test(child)) return;
	const snippet = child.length > 120 ? child.slice(0, 120) + '…' : child;
	console.warn(
		'Jetz: a text child looks like a stringified function — a plain template ' +
		'literal flattens `${fn}` to its source code. Use a tagged template ' +
		'instead (div`…${fn}` or text`…${fn}`) so it renders reactively. Child: ' +
		JSON.stringify(snippet)
	);
}
function isPlainObject(val) {
    return val !== null && typeof val === 'object' && !Array.isArray(val) && val.constructor.name === 'Object';
}

// Fast special child detection using constructor.name (avoids instanceof prototype chain walk)
const specialChildNames = new Set([
    'JetzElement', 'State', 'ListState', 'Component',
    'UniqueString', 'UniqueNumber', 'Raw', 'IfElse',
    'StateListener', 'JetzArgument'
]);
function isSpecialChild(val) {
    return val != null && specialChildNames.has(val.constructor?.name);
}

function createElement(tag, ...args) {
    let children = flatMap(args);
    let attr = {};

    for (let i = 0; i < children.length; i++) {
        const arg = children[i];
        if (arg == null) continue;
        if (isPlainObject(arg) && !isSpecialChild(arg)) {
            attr = mergeObject(attr, arg);
            children.splice(i, 1);
            i--;
        }
    }

    return new JetzElement(tag, attr, ...children);
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
 * Disposal scope used while one item of a `loop()` is rendered.
 *
 * Anything created in that window - an `effect()`, a `computed()`, an attribute
 * subscription, a DOM listener, a bound state container - registers its teardown
 * here, so the reconciler can release the whole item at once when it drops the
 * view. Outside a scope nothing is registered and every API behaves exactly as
 * before; a scope nested in another one is owned by it and disposed with it.
 */
class ReactiveScope {
	#disposers = new Set();
	#disposed = false;
	constructor(parent = null) {
		if (parent) parent.add(() => this.dispose());
	}
	get disposed() {
		return this.#disposed;
	}
	add(disposer) {
		if (typeof disposer !== 'function') return;
		// registering into a scope that already closed runs the teardown at once
		if (this.#disposed) { disposer(); return; }
		this.#disposers.add(disposer);
	}
	dispose() {
		if (this.#disposed) return;
		this.#disposed = true;
		this.#disposers.forEach(disposer => {
			try { disposer(); } catch (error) { console.error(error); }
		});
		this.#disposers.clear();
	}
}
/** Scope collecting teardown work for the render currently in progress. */
let _activeScope = null;
/** Runs `callback` inside a fresh scope and returns it together with that scope. */
function withReactiveScope(callback) {
	const previous = _activeScope;
	const scope = new ReactiveScope(previous);
	_activeScope = scope;
	try {
		return { value: callback(), scope };
	} finally {
		_activeScope = previous;
	}
}
/** Registers teardown work in the active scope, if there is one. */
function registerDisposable(disposer) {
	if (_activeScope) _activeScope.add(disposer);
}
/** Releases the scope a rendered view was built in (idempotent). */
function disposeViewScope(view) {
	const scope = view?.__scope;
	if (!scope) return;
	view.__scope = null;
	scope.dispose();
}
/**
 * Structural diagnostics.
 *
 * A binding is evaluated while the framework renders, so by the time its target
 * is read the caller's frames are gone from the stack. These helpers keep enough
 * context to name the code that has to change - the loop item being built and
 * the template that bound it - instead of leaking an internal
 * "Cannot read properties of undefined (reading 'value')".
 */

/** Loop item currently being built, if any. Set by ListState.createItemView(). */
let _renderContext = null;
/** Creation stacks, captured per element when `Jetz.devtools` is on. */
const _elementOrigins = new WeakMap();
/** Frames that belong to the framework rather than to the caller's code. */
const _frameworkFrame = /(?:^|\/)(?:jetz|jetz-ui)(?:\.min)?\.js/;

/**
 * True for every value `bind` accepts: a State, a State subclass, or a custom
 * state object exposing the same read/write/broadcast contract.
 */
function isBindableState(value) {
	if (value instanceof State) return true;
	if (value === null || value === undefined) return false;
	if (typeof value === 'function' && value.prototype instanceof State) return true;
	return 'value' in Object(value)
		&& typeof value.subscribe === 'function'
		&& typeof value.unsubscribe === 'function';
}

/** The first stack frame that is not the framework itself. */
function firstUserFrame(stack) {
	if (!stack) return null;
	for (const line of String(stack).split('\n').slice(1)) {
		const frame = line.trim();
		if (!frame || _frameworkFrame.test(frame) || /\bnode_modules\b/.test(frame)) continue;
		return frame;
	}
	return null;
}

/** Readable description of whatever the caller handed to `bind`. */
function describeBindingTarget(value) {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'an array';
	if (typeof value === 'function') return 'a function that is not a state';
	if (typeof value === 'object') {
		const keys = Object.keys(value);
		return `a plain object with keys [${keys.length ? keys.join(', ') : 'none'}]`;
	}
	return `${typeof value} (${String(value)})`;
}

/** The `bind` lines of a loop item template: they name the failing expression. */
function bindingSnippet(template) {
	if (typeof template !== 'function') return null;
	let source;
	try { source = Function.prototype.toString.call(template); } catch (error) { return null; }
	const hits = source.split('\n')
		.map(line => line.trim())
		.filter(line => /\bbind\b/.test(line))
		.map(line => line.length > 200 ? `${line.slice(0, 197)}...` : line);
	return hits.length ? hits.slice(0, 4).map(line => `    ${line}`).join('\n') : null;
}

/**
 * Thrown when `bind` receives something that cannot be read reactively.
 *
 * It stays a TypeError so existing try/catch keeps working, but the message
 * names the element, what was received and - inside `loop()` - the item and the
 * template the developer has to fix.
 */
export class JetzBindingError extends TypeError {
	constructor(message, options) {
		super(message, options);
		this.name = 'JetzBindingError';
	}
}

/** Builds the guidance shown when a `bind` target is not a state. */
function describeBindingFailure(stateTarget, element) {
	const node = element.o;
	const tag = (node?.tagName ?? element.tagName ?? 'element').toLowerCase();
	const inputType = element.attributes?.type ?? node?.type;
	const lines = [
		`Jetz: \`bind\` on <${tag}${inputType ? ` type="${inputType}"` : ''}> expected a state but received ${describeBindingTarget(stateTarget)}.`,
		'',
		'A `bind` target has to come from stateOf(), computed() or rememberOf().'
	];
	if (stateTarget === undefined) {
		lines.push(
			'',
			'`undefined` usually means the state object is missing that field, e.g.',
			'    stateOf({ id, title })                // then `bind: task.done` reads undefined',
			'    stateOf({ id, done: false, title })   // give every bound field a value'
		);
	}
	if (_renderContext) {
		const { index, key, template } = _renderContext;
		lines.push('', `While rendering the list item at index ${index}${key === undefined ? '' : ` (key ${String(key)})`}.`);
		const snippet = bindingSnippet(template);
		if (snippet) lines.push('The item template binds:', snippet);
	}
	const origin = firstUserFrame(_elementOrigins.get(element));
	if (origin) lines.push('', `The element was built by: ${origin}`);
	else if (!_renderContext) {
		lines.push('', 'Set `Jetz.devtools = true` to include the code that built this element.');
	}
	return lines.join('\n');
}
let _batchDepth = 0;
let _isFlushingBatch = false;
// The pending queues are swapped for fresh instances on every drain instead of
// being copied into an array and cleared: same "snapshot then reset" semantics,
// without materialising a new Array on each pass of the flush loop.
let _pendingBatchStates = new Map();
let _pendingBatchComputations = new Set();
let _pendingBatchEffects = new Set();

function flushBatch() {
	if (_batchDepth > 0 || _isFlushingBatch) return;
	let hasStateChanges = false;
	_isFlushingBatch = true;
	try {
		while (_pendingBatchStates.size || _pendingBatchComputations.size || _pendingBatchEffects.size) {
			while (_pendingBatchStates.size || _pendingBatchComputations.size) {
				// Swap, don't copy: work runs on the detached queue while writes
				// triggered by it land in the fresh one and are picked up next pass.
				const stateChanges = _pendingBatchStates;
				_pendingBatchStates = new Map();
				stateChanges.forEach(notify => {
					hasStateChanges = true;
					notify();
				});
				const computations = _pendingBatchComputations;
				_pendingBatchComputations = new Set();
				computations.forEach(recompute => recompute());
			}
			const effects = _pendingBatchEffects;
			_pendingBatchEffects = new Set();
			effects.forEach(run => run());
		}
	} finally {
		_isFlushingBatch = false;
	}
	if (hasStateChanges) Jetz.triggerByState();
}

function batch(callback) {
	_batchDepth++;
	try {
		return callback();
	} finally {
		_batchDepth--;
		if (_batchDepth === 0) flushBatch();
	}
}
/**
 * Deferred execution with an optional loading indicator.
 *
 * `loadingState` flips to `true` synchronously so the browser paints the
 * loading UI first, `taskFn` runs one animation frame plus one macrotask
 * later (i.e. after that paint), and the flag returns to `false` on the frame
 * after the task finished — a heavy DOM swap cannot visually cancel the
 * indicator while the UI is still busy. The flag is cleared even when
 * `taskFn` throws.
 *
 * @param {Function} taskFn - reactive mutation to run deferred
 * @param {Object} [options] - configuration object
 * @param {State} [options.loadingState] - signal toggled around the task
 */
function defer(taskFn, options = {}) {
	const { loadingState = null } = options;
	// no visual context (SSR, workers): fall back to a ~one-frame timeout so
	// the deferral contract still holds without requestAnimationFrame
	const nextFrame = typeof requestAnimationFrame === 'function'
		? requestAnimationFrame
		: callback => setTimeout(callback, 16);

	if (loadingState) {
		loadingState.value = true;
	}

	nextFrame(() => {
		// one frame lets the browser paint the loading state first
		setTimeout(() => {
			try {
				taskFn();
			} finally {
				if (loadingState) {
					// clear only after the post-render frame: the task's own
					// DOM changes may still be painting at this point
					nextFrame(() => {
						loadingState.value = false;
					});
				}
			}
		}, 0);
	});
}
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
/**
 * Lightweight Flux-style action dispatcher for unidirectional data flow.
 *
 * One action fans out to every registered handler, so domain logic can live in
 * independent stores instead of a single switch:
 *
 *   const dispatcher = new Dispatcher();
 *   dispatcher.subscribe((action, payload) => { ... }, 'users');
 *   dispatcher.subscribe((action, payload) => { ... }, 'orders');
 *   dispatcher.dispatch('LOAD', { id: 1 });
 *
 * Backward compatible: `new Dispatcher(fn)` registers `fn` as the first
 * handler and `dispatch()` returns the first handler's result, so the original
 * single-callback usage behaves exactly as before.
 *
 * Handlers run in registration order. A throwing handler is contained and
 * reported (`onError`, default `console.error`), so one broken store cannot
 * abort the dispatch or take unrelated stores down with it. Even `onError`
 * itself is guarded: a throwing reporter is logged and the dispatch continues.
 *
 * A handler subscribed mid-dispatch takes effect on the *next* dispatch, never
 * the running one. `waitFor` is synchronous and does not await `async`
 * handlers: it runs the dependency's synchronous prefix and returns.
 */
class Dispatcher {
	/** Optional reporter: `(error, action, token) => void`. Defaults to `console.error`. */
	onError = null;
	/** Registered handlers, in invocation order. */
	#handlers = [];
	/** The dispatch cycle currently on the stack, read by `waitFor()`. */
	#cycle = null;

	constructor(callback) {
		if (typeof callback === 'function') this.subscribe(callback);
	}

	/** Number of registered handlers. */
	get size() {
		return this.#handlers.length;
	}

	/**
	 * Registers a handler invoked as `handler(action, ...args)`.
	 *
	 * A handler subscribed *during* a dispatch joins the roster for the *next*
	 * cycle, never the running one: dispatch iterates a snapshot, so the current
	 * fan-out is fixed the moment it starts.
	 *
	 * @param {(action: any, ...args: any[]) => any} handler
	 * @param {any} [token] identifier usable with `waitFor()`; defaults to `handler`
	 * @returns {() => void} unsubscribe function
	 */
	subscribe(handler, token) {
		if (typeof handler !== 'function') {
			throw new TypeError('Jetz Dispatcher: subscribe(handler) expects a function');
		}
		const entry = { handler, token: token === undefined ? handler : token };
		this.#handlers.push(entry);
		return () => { this.unsubscribe(handler); };
	}

	/** Removes a handler previously passed to the constructor or `subscribe()`. */
	unsubscribe(handler) {
		this.#handlers = this.#handlers.filter(entry => entry.handler !== handler);
		return this;
	}

	/**
	 * Runs a prerequisite handler *now*, before the caller continues, so a store
	 * that derives from others can force its dependencies to settle first:
	 *
	 *   dispatcher.subscribe(() => {
	 *     dispatcher.waitFor('users');            // 'users' runs to completion
	 *     total.value = users.count.value + orders.count.value;
	 *   }, 'summary');
	 *
	 * A handler already invoked in the current cycle is not run twice, so
	 * `waitFor` also doubles as a re-entrancy guard. Calling it outside a
	 * dispatch warns and is a no-op. Waiting on an unknown token is a silent
	 * no-op by design, so optional stores can stay unregistered.
	 *
	 * `waitFor` is synchronous: it runs the dependency's *synchronous* prefix
	 * now and returns. An `async` handler's promise resolves later, so `waitFor`
	 * does not await it — order async flows with explicit awaits instead.
	 */
	waitFor(tokens) {
		const cycle = this.#cycle;
		if (cycle == null) {
			console.warn('Jetz Dispatcher: waitFor() called outside dispatch() - ignored.');
			return this;
		}
		const wanted = Array.isArray(tokens) ? tokens : [tokens];
		for (const token of wanted) {
			for (const entry of [...this.#handlers]) {
				if (entry.token !== token) continue;
				this.#run(entry, cycle);
			}
		}
		return this;
	}

	/** Fans `action` out to every registered handler; returns the first result. */
	dispatch(action, ...args) {
		const cycle = { action, args, invoked: new Set() };
		const previous = this.#cycle;
		this.#cycle = cycle;
		let result;
		let captured = false;
		try {
			for (const entry of [...this.#handlers]) {
				// a handler removed by an earlier handler this cycle must not run
				if (cycle.invoked.has(entry) || !this.#handlers.includes(entry)) continue;
				const value = this.#run(entry, cycle);
				if (!captured) {
					captured = true;
					result = value;
				}
			}
		} finally {
			this.#cycle = previous;
		}
		return result;
	}

	#run(entry, cycle) {
		// marked before the call, so a handler that waitFor()s itself or is
		// reached twice in one cycle cannot recurse forever
		if (cycle.invoked.has(entry)) return undefined;
		cycle.invoked.add(entry);
		try {
			return entry.handler(cycle.action, ...cycle.args);
		} catch (error) {
			this.#report(error, cycle.action, entry);
			return undefined;
		}
	}

	#report(error, action, entry) {
		if (typeof this.onError === 'function') {
			try {
				this.onError(error, action, entry.token);
			} catch (reporterError) {
				// a broken reporter must not take the dispatch down with it
				console.error('Jetz Dispatcher: onError threw while reporting', reporterError);
			}
			return;
		}
		const label = typeof entry.token === 'string' ? ` "${entry.token}"` : '';
		console.error(`Jetz Dispatcher: handler${label} threw while handling "${String(action)}"`, error);
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
		Jetz.emitDevtoolsEvent({ type: 'lifecycle', stage: 'create', element: this.entry });
		this.hooks.onCreate.forEach(cb => cb());
	}
	runMount() {
		if (this.mounted || this.destroyed) return;
		this.mounted = true;
		Jetz.emitDevtoolsEvent({ type: 'lifecycle', stage: 'mount', element: this.entry });
		this.hooks.onMount.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onMount')) {
			component.onMount();
		}
	}
	runUpdate() {
		if (!this.mounted || this.destroyed) return;
		Jetz.emitDevtoolsEvent({ type: 'lifecycle', stage: 'update', element: this.entry });
		this.hooks.onUpdate.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onUpdate')) {
			component.onUpdate();
		}
	}
	runDestroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		Jetz.emitDevtoolsEvent({ type: 'lifecycle', stage: 'destroy', element: this.entry });
		this.hooks.onDestroy.forEach(cb => cb());
		const component = this.component;
		if (component && component.constructor.prototype.hasOwnProperty('onDestroy')) {
			component.onDestroy();
		}
	}
}
/**
 * Resolves a component using the same lifecycle context for nested and routed
 * components. A function receives route params when supplied; class instances
 * retain their own lifecycle methods.
 */
export function renderComponent(component, params = null) {
	if (typeof component === 'function' && component.prototype instanceof Component) {
		component = new component();
	}
	if (component instanceof Component) {
		if (arguments.length > 1) component.$params = params;
		const context = new LifecycleContext();
		context.component = component;
		component.$lifecycle = context;
		const previous = _activeLifecycle;
		_activeLifecycle = context;
		let result;
		try {
			if (component.constructor.prototype.hasOwnProperty('onCreate')) {
				component.onCreate();
			}
			context.runCreate();
			result = component.render();
		} finally {
			_activeLifecycle = previous;
		}
		if (result instanceof JetzElement && component.constructor.prototype.hasOwnProperty('onRendered')) {
			result.onRendered(component.onRendered.bind(component));
		}
		const entry = Array.isArray(result) ? result[0] : result;
		if (entry instanceof JetzElement && !entry.lifecycle) {
			entry.attachLifecycle(context);
		}
		return result;
	}
	if (typeof component !== 'function') return component;
	const context = new LifecycleContext();
	const previous = _activeLifecycle;
	_activeLifecycle = context;
	let result;
	try {
		result = params == null ? component.call() : component(params);
	} finally {
		_activeLifecycle = previous;
	}
	const entry = Array.isArray(result) ? result[0] : result;
	if (entry instanceof JetzElement) {
		Jetz.emitDevtoolsEvent({
			type: 'component',
			element: entry,
			name: component.displayName || component.name || 'Anonymous component'
		});
		if (context.hooks.onCreate.length + context.hooks.onMount.length +
			context.hooks.onUpdate.length + context.hooks.onDestroy.length > 0) {
			context.component = component;
			if (!entry.lifecycle) entry.attachLifecycle(context);
		}
	}
	return result;
}
class JetzElement {
	// element rendered
	o;
	tagName;
	attributes;
	children;
	oldStyle = {};
	style = {};
	// class sources merged onto this element, kept so a reactive part can be
	// recomposed instead of being frozen at its mount-time value
	#classParts = [];
	#classUnsubs = [];
	/** Reactive bindings created for this element (listeners, subscriptions, containers). */
	#disposers = new Set();
	/** Scope this element was rendered in by a `loop()` item, if any. */
	__scope = null;
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
		const component = context.component;
		if (component) {
			const name = typeof component === 'function'
				? component.displayName || component.name || 'Anonymous component'
				: component.displayName || component.constructor?.displayName ||
					component.constructor?.name || 'Anonymous component';
			Jetz.emitDevtoolsEvent({ type: 'component', element: this, name });
		}
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
		Jetz.emitDevtoolsEvent({
			type: 'create',
			element: this,
			tag,
			key: _renderContext?.key,
			index: _renderContext?.index
		});
		// Opt-in only: capturing a stack per element is measurable on large lists,
		// so it happens only when the developer asked for binding diagnostics.
		if (Jetz.devtools) _elementOrigins.set(this, new Error().stack);
		// Cache for bound event handlers (callback -> boundCallback)
		this._boundHandlerCache = new Map();
	}

	/**
	 * Records the teardown of one binding this element created and mirrors it
	 * into the active reactive scope, so dropping the element (or the `loop()`
	 * item that owns it) releases it deterministically.
	 */
	#bindTeardown(disposer) {
		const entry = () => {
			if (!this.#disposers.delete(entry)) return;
			try { disposer(); } catch (error) { console.error(error); }
		};
		this.#disposers.add(entry);
		registerDisposable(entry);
	}
	/**
	 * Releases every binding this element created, then its subtree.
	 * Idempotent, and never called implicitly on `remove()`: `if/else` removes an
	 * element only to re-insert the same node later, so teardown is driven by the
	 * reconciler (`loop()`) and by `empty()` where the subtree is really dropped.
	 */
	disposeBindings() {
		this.#releaseBindings();
		this.children.forEach(child => {
			if (child instanceof JetzElement) child.disposeBindings();
		});
		return this;
	}
	/** Releases only this element's own bindings (not its subtree). */
	#releaseBindings() {
		Jetz.emitDevtoolsEvent({ type: 'dispose', element: this });
		[...this.#disposers].forEach(entry => entry());
		this.#unbindClassParts();
		disposeViewScope(this);
		// the static remount registry is a strong root; drop entries owned by a
		// subtree that is being discarded, or it pins the whole detached tree
		if (Jetz.remountByAttr.includes(this)) {
			Jetz.remountByAttr = Jetz.remountByAttr.filter(item => item !== this);
		}
		// conditional children (ifElse branches) hold references to their nodes
		this.collectionConditionalChild.forEach(child => {
			if (typeof child?.disposeBindings === 'function') child.disposeBindings();
		});
		this.collectionConditionalChild = [];
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
		Jetz.emitDevtoolsEvent({
			type: 'attach',
			element: this,
			parent: parent instanceof JetzElement ? parent : null
		});
		// re-rendering replaces `this.o` with a brand new node, so the bindings
		// made for the previous node are stale: drop them instead of piling up.
		// The item scope is untouched: it belongs to the render call that created
		// this element, not to this element's own node.
		if (this.o) {
			[...this.#disposers].forEach(entry => entry());
			this.#unbindClassParts();
		}
		this.#atLifecycles(() => {
			this.o = document.createElement(this.tagName);
			this.assignAttributes();
			this.assignChildren();
			this.initStyle();
			this.initListener();
			this.o.$ = this;
			Jetz.emitDevtoolsEvent({ type: 'render', element: this });
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
	 * While the tree is still detached (initial render / route swap), mount is
	 * deferred: Jetz.onFirstRenderPage() or the lifecycle sweep fires it as
	 * soon as the subtree becomes connected.
	 */
	#notifyMounted() {
		if (!this.o || !this.o.isConnected) return;
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
					if (typeof attrValue === "function") {
						const eventName = attr.substring(2);
						const handler = attrValue.bind(this);
						const node = this.o;
						node.addEventListener(eventName, handler);
						// detach on teardown: a listener bound to `this` is the edge
						// that keeps a removed row (and its captured data) alive
						this.#bindTeardown(() => node.removeEventListener(eventName, handler));
					}
				} else if (attr === 'bind') {
					this.#bindInputValue(attrValue);
				} else if (attr === "style") {
					// object form: { color: 'red', … }
					// string form: a css declaration block, e.g. from `style`…``
					if (attrValue != null && typeof attrValue === 'object' &&
						!(attrValue instanceof State) && !(attrValue instanceof JetzElement)) {
						this.#addStyle(attrValue);
					} else {
						this.#addStyleText(attrValue);
					}
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
		if (!isBindableState(stateTarget)) {
			throw new JetzBindingError(describeBindingFailure(stateTarget, this));
		}
		const inputType = this.attributes.type ?? this.o.type;
		if (this.o instanceof HTMLInputElement && inputType === 'checkbox') {
			this.o.checked = Boolean(stateTarget.value);
			this.#addListener('change', e => {
				stateTarget.value = e.target.checked;
			});
			const sync = value => {
				this.o.checked = Boolean(value);
			};
			stateTarget.subscribe(sync);
			this.#bindTeardown(() => stateTarget.unsubscribe(sync));
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
				this.#applyStyleValue(key, styles[key]);
			}
		}
	}
	/**
	 * Applies a css declaration block given as text (the `style`…`` tagged form).
	 * Every declaration is routed through #applyStyleValue, so a reactive value
	 * (State / callback) inside the block keeps updating on its own.
	 */
	#addStyleText(value) {
		if (value instanceof State) {
			this.#parseStyleText(value.value);
			const apply = next => this.#parseStyleText(next);
			value.subscribe(apply);
			this.#bindTeardown(() => value.unsubscribe(apply));
			return;
		}
		this.#parseStyleText(value);
	}
	#parseStyleText(text) {
		if (text == null) return;
		const declarations = String(text).split(';');
		for (const declaration of declarations) {
			const separator = declaration.indexOf(':');
			// skip blanks, malformed entries and custom properties (--var)
			if (separator <= 0 || String(declaration).slice(0, separator).trimStart().startsWith('--')) continue;
			this.#applyStyleValue(
				declaration.slice(0, separator).trim(),
				declaration.slice(separator + 1).trim()
			);
		}
	}
	/** Binds one css declaration, reacting to its value when it is a State. */
	#applyStyleValue(key, value) {
		if (typeof value === 'function') value = computed(value);
		if (value instanceof State) {
			const styleState = new StyleState(this.o.style, key, value);
			value.addContainer(styleState);
			// the container holds this element's CSSStyleDeclaration, so it
			// must be dropped when the element (row) leaves the tree
			this.#bindTeardown(() => value.removeContainer(styleState));
			this.o.style[key] = value.value;
		} else {
			this.o.style[key] = value;
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
				// the state keeps a strong reference to this node; without this the
				// text/element node of a removed row stays reachable from the row's
				// state and keeps the whole detached subtree with it
				const node = _child;
				this.#bindTeardown(() => child.removeContainers(node, this.o));
			} else if (child instanceof ListState) {
				child.assignParent(this);
				// releasing this element (branch swap, re-render, loop row drop)
				// must take the views this append created with it: otherwise the
				// list keeps pinning the detached rows, their nodes and closures
				this.#bindTeardown(() => {
					child.detachFrom?.(this);
				});
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
					// a branch swap re-renders this element's conditional children via
					// triggerCondition(): the child must be released when this element
					// leaves the tree, otherwise the swap keeps the whole detached
					// subtree (and its closures) reachable from the IfElse instance
					this.#bindTeardown(() => {
						child.disposeBindings?.();
						this.collectionConditionalChild =
							this.collectionConditionalChild.filter(item => item !== child);
					});
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
		} else if (typeof child === 'function' && !(child.prototype instanceof Component)) {
			const childFunction = renderComponent(child);
			if (Array.isArray(childFunction))
				this.append(...childFunction);
			else
				this.append(childFunction);
			return this;
		} else {
			_child = child;
			warnStringifiedFunction(child);
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
		const childComponent = renderComponent(component);
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
		const cached = this._boundHandlerCache.get(listener.callback);
		if (cached) {
			listener.boundCallback = cached;
		} else {
			listener.boundCallback = listener.callback.bind(this);
			this._boundHandlerCache.set(listener.callback, listener.boundCallback);
		}
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
		attrName = normalizeAttributeName(attrName);
		if (typeof attrValue === 'function') {
			attrValue = computed(attrValue);
		}
		if (attrName === 'class') {
			// #bindClassParts also covers a single reactive source, so this one
			// branch handles every case that can change after mount
			if (this.#hasReactiveParts(attrValue)) {
				this.#bindClassParts(attrValue);
			} else {
				this.addClass(attrValue);
			}
		} else {
			if (attrValue instanceof State) {
				const update = value => this.#setAttributeValue(attrName, value);
				update(attrValue.getValue());
				attrValue.subscribe(update);
				this.#bindTeardown(() => attrValue.unsubscribe(update));
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
	/** True when a class value - or any part of a merged array - can change. */
	#hasReactiveParts(value) {
		if (value instanceof State || typeof value === 'function') return true;
		if (Array.isArray(value)) return value.some(item => this.#hasReactiveParts(item));
		return false;
	}
	/**
	 * Binds a class attribute assembled from more than one source.
	 *
	 * `div(css('base'), css(() => …))` merges into `{ class: ['base', state] }`
	 * via mergeObject. A plain array used to fall through to addClass, which
	 * flattened it into a one-off classList, so every reactive part stayed
	 * frozen at the value it happened to hold on mount. Each part is kept so
	 * the whole attribute can be recomposed when any of them changes.
	 */
	#bindClassParts(value) {
		// re-binding replaces the previous wiring; without dropping it a re-render
		// would leave the earlier compose callback subscribed as well
		const newParts = (Array.isArray(value) ? value.flat(Infinity) : [value])
			.map(part => (typeof part === 'function' ? computed(part) : part));
		
		// Reuse subscriptions for unchanged parts (by identity)
		const oldParts = this.#classParts;
		const oldUnsubs = this.#classUnsubs;
		const newUnsubs = [];
		
		newParts.forEach((part, i) => {
			if (!(part instanceof State)) {
				newUnsubs.push(null);
				return;
			}
			// Find matching old part by identity
			const oldPart = oldParts[i];
			if (oldPart === part && oldUnsubs[i]) {
				// Same subscription, keep it
				newUnsubs.push(oldUnsubs[i]);
				return;
			}
			// New or changed part - subscribe
			const compose = () => this.#setClassAttribute(
				this.#classParts.map(p => (p instanceof State ? p.getValue() : p))
			);
			part.subscribe(compose);
			const off = () => part.unsubscribe(compose);
			newUnsubs.push(off);
			this.#bindTeardown(off);
		});
		
		// Unsubscribe only for removed parts
		oldParts.forEach((part, i) => {
			if (!newParts.includes(part) && part instanceof State) {
				oldUnsubs[i]?.();
			}
		});
		
		this.#classParts = newParts;
		this.#classUnsubs = newUnsubs;
		
		// Initial compose
		this.#setClassAttribute(
			this.#classParts.map(part => (part instanceof State ? part.getValue() : part))
		);
	}
	#unbindClassParts() {
		this.#classUnsubs.forEach(off => off?.());
		this.#classUnsubs = [];
		this.#classParts = [];
	}
	#setClassAttribute(value) {
		// `value` is already flat (produced by `#classParts.map(...)`), but each
		// entry can still be a multi-class string like 'a-1 b-2', so it has to be
		// split on whitespace the way `addClass` does. Done with an index loop +
		// charCode scanning: no regex engine, no intermediate filter/flatMap
		// arrays, and consecutive separators collapse for free (space only).
		const values = Array.isArray(value) ? value : [value];
		let className = '';
		for (let i = 0; i < values.length; i++) {
			const item = values[i];
			if (item == null || item === false || item === '') continue;
			const text = typeof item === 'string' ? item : String(item);
			let pending = '';
			for (let j = 0; j < text.length; j++) {
				const code = text.charCodeAt(j);
				// space, tab, LF, CR, FF, VT, NBSP
				if (code === 32 || code === 9 || code === 10 || code === 13 || code === 12 || code === 11 || code === 160) {
					if (pending) { className = className ? className + ' ' + pending : pending; pending = ''; }
				} else {
					pending += text[j];
				}
			}
			if (pending) className = className ? className + ' ' + pending : pending;
		}
		if (className) this.o.setAttribute('class', className);
		else this.o.removeAttribute('class');
	}
	addClass(value) {
		if (typeof (this.o) === 'undefined') {
			this.attributes['class'] = value;
		} else {
			if (Array.isArray(value)) {
				const values = flatMap(value.map(x => (typeof x === 'string') ? x.split(' ') : x))
					// classList stringifies whatever it is given, so a conditional
					// that resolved to false/null would otherwise be added as a
					// class literally named "false" or "null"
					.filter(item => item != null && item !== false && item !== '');
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
		// the children are dropped for good here, so release their bindings too
		this.children.forEach(child => {
			if (child instanceof JetzElement) child.disposeBindings();
		});
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
	/**
	 * When true, elements remember the stack that created them, so a binding error
	 * can point at the offending line. Off by default: it captures a stack per
	 * element, which is measurable on large lists.
	 */
	static devtools = false;
	// Jetz Element Collection that have If Else Annotation
	static remountByAttr = [];
	static #onRenderedCollections = [];
	static #isMounting = false;
	static #devtoolsListeners = new Set();
	// live component lifecycle contexts
	static #lifecycles = new Set();
	/** True while Jetz.mount() renders and triggers the element tree. */
	static get isMounting() {
		return Jetz.#isMounting;
	}
	/** Subscribes to opt-in element and component lifecycle events. */
	static observeDevtools(listener) {
		if (typeof listener !== 'function') throw new TypeError('Jetz.observeDevtools expects a function');
		Jetz.#devtoolsListeners.add(listener);
		return () => Jetz.#devtoolsListeners.delete(listener);
	}
	/** @internal Emits instrumentation only when a devtools subscriber is installed. */
	static emitDevtoolsEvent(event) {
		if (Jetz.#devtoolsListeners.size === 0) return;
		for (const listener of Jetz.#devtoolsListeners) {
			try {
				listener(event);
			} catch (error) {
				console.error('Jetz devtools observer failed:', error);
			}
		}
	}
	/** Registers a component lifecycle context for update/destroy tracking. */
	static registerLifecycle(context) {
		Jetz.#lifecycles.add(context);
	}
	static triggerByState() {
		// Walk by index, not forEach(): forEach() visits a range fixed before the
		// first callback, but a trigger can build new UI whose _if/_elseif children
		// register their parent element onto remountByAttr mid-pass (e.g. an
		// ifElse branch rendering a panel that contains its own conditionals).
		// Such a parent would miss its first trigger and show every branch at once
		// until the next state change. New entries only appear once per freshly
		// built element (IfElse re-renders only on a condition change), so the
		// growing index terminates.
		for (let i = 0; i < this.remountByAttr.length; i++) {
			const element = this.remountByAttr[i];
			element.collectionConditionalChild.forEach(rm => rm.trigger());
		}
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
			} else if (node && !context.mounted) {
				// connected after a route swap or late render: onMount never ran yet
				context.runMount();
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
							const component = element;
							element = component();
							if (element instanceof JetzElement) {
								Jetz.emitDevtoolsEvent({
									type: 'component',
									element,
									name: component.displayName || component.name || 'Anonymous component'
								});
							}
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
		return '1.1.2';
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
				if ($ instanceof JetzElement) {
					$.destroyLifecycle();
					// the container is being wiped: release reactive bindings too
					$.disposeBindings();
				}
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
	/** Detaches a container previously added with `addContainer`/`generateMutable`. */
	removeContainer(container) {
		this.container = this.container.filter(item => item !== container);
		return this;
	}
	/**
	 * Detaches every container bound to `node` or to a node inside `root`.
	 * A state that renders an element swaps its container on every update, so the
	 * exact node is not always the one still held; `root` covers the replacements.
	 */
	removeContainers(node, root = null) {
		this.container = this.container.filter(item => {
			if (item === node) return false;
			if (root != null && item instanceof Node && root.contains?.(item)) return false;
			return true;
		});
		return this;
	}
	generateMutable() {
		let element = null;
		if (this.#value instanceof JetzElement) {
			this.#value.render();
			element = this.#value.getElement();
		} else {
			// Reuse an existing Text node only while it is still unparented.
			// A State may be bound in several trees at once; handing the same
			// node to a second parent would detach it from the first one.
			const existingText = this.container.find(c => c instanceof Text && c.parentNode == null);
			element = existingText ?? new Text(this.#value);
		}
		this.container.push(element);
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
		if (_batchDepth > 0 || _isFlushingBatch) {
			if (!_pendingBatchStates.has(this)) {
				_pendingBatchStates.set(this, () => this.#notify(oldValue));
			}
			return;
		}
		this.#notify(oldValue);
		Jetz.triggerByState();
	}
	#notify(oldValue) {
		this.container = this.container.map(container => {
			if (this.#value instanceof JetzElement) {
				this.#value.render();
				let element = this.#value.getElement();
				// the swapped-out node is detached for good: release its bindings
				const previous = container.$;
				container.replaceWith(element);
				if (previous instanceof JetzElement && previous !== this.#value) {
					previous.disposeBindings?.();
				}
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
	/** Untracked read: returns the value without registering in computed/effect. */
	peek() {
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

/**
 * A list view that owns several sibling elements rendered by one item, e.g.
 * `loop(list, item => [li(item.title), li(item.body)])`. It quacks like a single
 * JetzElement for the view bookkeeping (remove/replace), but keeps the render
 * function's structure in the DOM instead of hiding it behind a carrier tag.
 */
class ListViewGroup {
	constructor(elements) {
		this.elements = elements;
	}
	/** DOM nodes currently backing this view. */
	getNodes() {
		return this.elements.map(element => element?.getElement?.()).filter(Boolean);
	}
	/** First node, so single-node consumers keep working. */
	getElement() {
		return this.getNodes()[0] ?? null;
	}
	remove() {
		this.elements.forEach(element => element?.remove?.());
	}
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
	#syncArray() {
		super.splice(0, this.length, ...this.values);
		this.length = this.values.length;
	}
	#commitValues(values) {
		this.values = values;
		this.#syncArray();
		this.renderView(true);
		if (this.isRemember) this.#persistRemembered();
		return this;
	}

	asUnique() {
		this.uniqueValue = true;
		this.values = this.values.map(val => {
			return this.#fixValue(val)
		});
		this.#syncArray();
		return this;
	}

	/**
	 * Marks this list as persisted to localStorage (per page path) via a
	 * RememberState. Restores previously saved values and keeps saving on
	 * every mutation. Returns the same list for chaining.
	 */
	asRemember(key) {
		if (this.isRemember) return this;
		const objRemember = new RememberState(serializeRemembered(this.values), undefined, key);
		const saved = JSON.parse(objRemember.valueOf());
		this.isRemember = true;
		this.objRemember = objRemember;
		return this.#commitValues(saved.map(item => this.#prepareRememberedItem(item)));
	}
	#prepareRememberedItem(item) {
		const prepared = hydrateRememberedItem(item);
		subscribeRememberedValues(prepared, () => this.#persistRemembered());
		return prepared;
	}
	#persistRemembered() {
		this.objRemember.setState(serializeRemembered(this.values));
	}

	at(index) {
		return this.values[index];
	}

	renderCallback = item => { return item };

	constructor(isRemember = false, ...values) {
		if (isRemember) {
			var objRemember = new RememberState(serializeRemembered(values));
			values = JSON.parse(objRemember.valueOf()).map(hydrateRememberedItem);
			super(...values);
			this.isRemember = true;
			this.objRemember = objRemember;
		} else {
			super(...values);
		}
		this.values = values;
		this.length = values.length;
		if (this.isRemember) {
			this.values.forEach(item => subscribeRememberedValues(item, () => this.#persistRemembered()));
		}
	}
	set(newData) {
		const values = this.isRemember
			? newData.map(item => this.#prepareRememberedItem(item))
			: newData;
		return this.#commitValues(values);
	}
	clear() {
		this.empty();
	}
	empty() {
		this.set([]);
	}
	createItemView(parent, item, index) {
		// Each item render gets its own scope: every effect/computed/binding it
		// creates is registered there and released together when the reconciler
		// drops this view (keyed removal, item swap, or a full refresh).
		const { value: view, scope } = withReactiveScope(() => {
			// Publish which item is being built so a binding error raised by the
			// render callback can name the item and its template instead of only
			// the internal frame that read `.value`.
			const previousContext = _renderContext;
			_renderContext = {
				index,
				key: this._keyFn ? this._keyFn(item) : undefined,
				template: this.renderCallback
			};
			try {
				return this.#buildItemView(parent, item, index);
			} finally {
				_renderContext = previousContext;
			}
		});
		if (view != null && typeof view === 'object') view.__scope = scope;
		return view;
	}
	#buildItemView(parent, item, index) {
		var renderedItem = this.renderCallback(item, index);
		// a render function may return several nodes for one item: keep them as
		// siblings instead of collapsing them into a carrier element
		const parts = (Array.isArray(renderedItem) ? renderedItem.flat(Infinity) : [renderedItem])
			.filter(entry => entry != null && entry !== false);
		if (parts.length === 1 && parts[0] instanceof JetzElement) {
			parts[0].render(parent);
			return parts[0];
		}
		if (parts.length > 1 && parts.every(entry => entry instanceof JetzElement)) {
			// render eagerly so the nodes exist for keyed reordering, matching
			// the single-element path below
			parts.forEach(element => element.render(parent));
			return new ListViewGroup(parts);
		}
		// plain values need a carrier element so views stay removable/replaceable
		const carrier = createElement('span', renderedItem);
		carrier.render(parent);
		return carrier;
	}
	/** DOM nodes backing a stored view (single element, group, or raw node). */
	#viewNodes(view) {
		if (view instanceof JetzElement) return [view.getElement()];
		if (view instanceof ListViewGroup) return view.getNodes();
		return view ? [view] : [];
	}
	/** Removes a stored view whatever shape it has. */
	#removeView(view) {
		// release the item's reactive scope before detaching its nodes
		disposeViewScope(view);
		if (view instanceof JetzElement) { view.disposeBindings?.(); view.remove(); return; }
		if (view instanceof ListViewGroup) { view.elements.forEach(element => element?.disposeBindings?.()); view.remove(); return; }
		view?.remove?.();
	}
	/** Attaches a freshly created view to its parent element. */
	#appendView(parent, view) {
		if (view instanceof ListViewGroup) {
			parent.append(...view.elements);
			return;
		}
		parent.append(view);
	}
	push(...items) {
		for (let _i = 0; _i < items.length; _i++) {
			let item = items[_i];

			if (this.uniqueValue)
				item = this.#fixValue(item);
			if (this.isRemember)
				item = this.#prepareRememberedItem(item);
			super.push(item);
			this.values.push(item);
			this.parentElement.map((parent, i) => {
				this.newView(i, this.views[i], item, this.values.length - 1);
				// Keep keyed bookkeeping in sync: `newView` appends the node
				// directly, so without registering the key here a later keyed
				// refresh (set/insertAt/...) cannot find this item and would
				// create a duplicate view for it.
				if (this._useKeyedReconciliation && this._keyFn) {
					const keyMap = this._keyMaps[i];
					const currentView = this.views[i]?.[this.views[i].length - 1];
					if (keyMap && currentView) {
						keyMap.set(this._keyFn(item), { item, view: currentView });
					}
				}
				return parent;
			});
			// remember effect
			if (this.isRemember) {
				this.#persistRemembered();
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

				// 1. Detect how many old keys survive into the new set
				let retainedCount = 0;
				for (const [key] of keyMap) {
					if (newKeySet.has(key)) retainedCount++;
				}

				// 2. Full-swap fast path: every old key is gone, every new key is
				//    fresh. Remove all old views, render into a DocumentFragment,
				//    then append once — 1 DOM operation instead of N.
				if (retainedCount === 0) {
					// Remove old views
					for (const [key, entry] of keyMap) {
						this.#removeView(entry.view);
					}
					keyMap.clear();
					// Render all new items and collect DOM nodes
					const frag = document.createDocumentFragment();
					const newViews = [];
					for (let j = 0; j < newKeys.length; j++) {
						const item = this.values[j];
						const rendered = this.createItemView(parent, item, j);
						keyMap.set(newKeys[j], { item, view: rendered });
						newViews.push(rendered);
						const domNodes = this.#viewNodes(rendered);
						for (let d = 0; d < domNodes.length; d++) frag.appendChild(domNodes[d]);
					}
					parent.o.appendChild(frag);
					this.views[parentIdx] = newViews;
					return;
				}

				// 3. Incremental path: some keys survive, reconcile individually
				// Remove items no longer in the list
				for (const [key, entry] of keyMap) {
					if (!newKeySet.has(key)) {
						this.#removeView(entry.view);
						keyMap.delete(key);
					}
				}
				// Add/reorder items
				let prevNode = null;
				for (let j = 0; j < newKeys.length; j++) {
					const key = newKeys[j];
					let entry = keyMap.get(key);
					if (entry && entry.item !== this.values[j]) {
						this.#removeView(entry.view);
						keyMap.delete(key);
						entry = undefined;
					}
					if (!entry) {
						// New item: create view
						const rendered = this.createItemView(parent, this.values[j], j);
						entry = { item: this.values[j], view: rendered };
						keyMap.set(key, entry);
						// Insert at correct position
						const domNodes = this.#viewNodes(rendered);
						if (prevNode) {
							prevNode.after(...domNodes);
						} else {
							parent.o.prepend(...domNodes);
						}
					} else {
						// Existing item: reorder if needed
						entry.item = this.values[j];
						const domNodes = this.#viewNodes(entry.view);
						const domNode = domNodes[0];
						if (prevNode) {
							if (domNode?.previousSibling !== prevNode) {
								prevNode.after(...domNodes);
							}
						} else {
							if (parent.o.firstChild !== domNode) {
								parent.o.prepend(...domNodes);
							}
						}
					}
					const entryNodes = this.#viewNodes(entry.view);
					prevNode = entryNodes[entryNodes.length - 1] ?? prevNode;
				}
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
					this.#removeView(v);
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
		this.#appendView(this.parentElement[index], renderedItem);
	}
	remove(item) {
		const index = this.values.indexOf(item);
		if (index !== -1) this.removeAt(index);
	}
	removeAt(index) {
		if (!Number.isInteger(index) || index < 0 || index >= this.values.length) return;
		const removedItem = this.values[index];
		this.values.splice(index, 1);
		this.views.forEach(view => {
			this.#removeView(view[index]);
			view.splice(index, 1);
		});
		this.splice(index, 1);
		this.#syncArray();
		if (this._useKeyedReconciliation && this._keyFn) {
			const removedKey = this._keyFn(removedItem);
			this._keyMaps.forEach(keyMap => keyMap?.delete(removedKey));
		}
		if (this.isRemember) this.#persistRemembered();
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
		return this.values.map(callback);
	}
	transform(callback) {
		const mapped = this.values.map(callback);
		const values = this.isRemember
			? mapped.map(item => this.#prepareRememberedItem(item))
			: mapped;
		return this.#commitValues(values);
	}
	replaceAt(index, item) {
		if (!Number.isInteger(index) || index < 0 || index >= this.values.length) return this;
		const value = this.isRemember ? this.#prepareRememberedItem(item) : item;
		const values = this.values.slice();
		values[index] = value;
		return this.#commitValues(values);
	}
	updateAt(index, updater) {
		if (!Number.isInteger(index) || index < 0 || index >= this.values.length) return this;
		return this.replaceAt(index, updater(this.values[index], index));
	}
	insertAt(index, ...items) {
		if (this.isRemember) items = items.map(item => this.#prepareRememberedItem(item));
		const values = this.values.slice();
		values.splice(index, 0, ...items);
		this.#commitValues(values);
		Jetz.triggerByState();
		return this;
	}
	sort(compareFn) {
		return this.#commitValues(this.values.slice().sort(compareFn));
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
				this.#appendView(this.parentElement[lastIndex], renderedItem);
				this.views[this.views.length - 1].push(renderedItem);
				keyMap.set(this._keyFn(value), { item: value, view: renderedItem });
			});
		} else {
			this._keyMaps.push(null);
			this.values.forEach((value, i) => {
				var renderedItem = this.createItemView(this.parentElement[lastIndex], value, i);
				this.#appendView(this.parentElement[lastIndex], renderedItem);
				this.views[this.views.length - 1].push(renderedItem);
			});
		}
	}
	setViews(views) {
		this.views = views;
		if (views.length > 0)
			this.parentElement = views[0].parent;
	}
	/**
	 * Detaches the views this list rendered into `parent` at `parentIndex`.
	 * Used when a list lives inside an `ifElse()` branch: a branch swap must
	 * remove exactly these nodes and release their scopes/bindings, otherwise
	 * the inactive branch stays in the DOM and reachable from the list.
	 */
	detachFrom(parent, parentIndex) {
		if (parent == null || !Array.isArray(this.parentElement)) return this;
		// resolve the entry defensively: the stored index can shift when an
		// earlier entry for the same list was already detached
		const index = (parentIndex != null && this.parentElement[parentIndex] === parent)
			? parentIndex
			: this.parentElement.indexOf(parent);
		if (index < 0 || !Array.isArray(this.views?.[index])) return this;
		const views = this.views[index];
		views.forEach(view => this.#removeView(view));
		this.views.splice(index, 1);
		this.parentElement.splice(index, 1);
		this._keyMaps.splice(index, 1);
		return this;
	}
	toState() {
		return this.#commitValues(this.values.map(value => stateOf(value)));
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
	// `typeof null === "object"`, so an explicit null check has to come first.
	// Without it `stateOf(null)` fell into the object branch and threw on
	// `value.toObject = …`, which broke conditional classes like
	// css(() => ready ? 'is-ready' : null).
	if (value !== null && typeof value === 'object' && !(value instanceof JetzElement)) {
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
 * Lazy signal: initializer runs only on first `.value` read.
 * Like SolidJS's `lazy()` — defers expensive computation until actually needed.
 * Subsequent reads return the cached value without re-running the initializer.
 */
function lazy(initializer) {
	let initialized = false;
	let value;
	const state = new State(undefined, {
		get() {
			if (!initialized) {
				initialized = true;
				value = initializer();
			}
			return value;
		},
		set(obj, next) {
			initialized = true;
			value = next;
			obj.setState(next);
			return true;
		}
	});
	// Override getValue to return the lazy value
	const originalGetValue = state.getValue.bind(state);
	state.getValue = () => {
		if (!initialized) {
			initialized = true;
			value = initializer();
		}
		return value;
	};
	// Override setState to track initialization
	const originalSetState = state.setState.bind(state);
	state.setState = (next) => {
		initialized = true;
		value = next;
		originalSetState(next);
	};
	return state;
}

/**
 * Shallow row state: Proxy-based lazy getters at row granularity.
 *
 * Data stays a plain object in a WeakMap; every property read goes through ONE
 * shared version State (no per-cell State/computed). `rawOf()` reads the plain
 * object directly (untracked, for the filter/sort pipeline); tracked reads and
 * any write bump the single row version so only that row's cells re-render.
 */
/** Registry for shallow rows: untracked raw access without `in`-operator traps. */
const _shallowRows = new WeakSet();
const _shallowData = new WeakMap();
function shallowStateOf(value, handler = { get(value) { return value } }) {
	if (value === null || typeof value !== 'object' || value instanceof JetzElement || Array.isArray(value)) {
		return stateOf(value, handler);
	}
	const data = value;
	const version = new State(0);
	const bump = () => version.setState(version.peek() + 1);
	const proxy = new Proxy(data, {
		get(target, prop, receiver) {
			if (prop === '__sig') return version;
			if (prop === '__data') return target;
			if (prop === 'toObject') return () => ({ ...target });
			if (prop === 'touch') return bump;
			if (prop === 'set') return (patch) => {
				if (patch != null && typeof patch === 'object') Object.assign(target, patch);
				bump();
			};
			if (prop === 'peek') return (key) => target[key];
			// Symbols / then / prototype: never subscribe, never wrap.
			if (typeof prop !== 'string') {
				const fallback = target[prop];
				if (typeof fallback === 'function') return fallback.bind(target);
				return fallback;
			}
			// Own data keys: tracked read on the single row version signal.
			if (Object.hasOwnProperty.call(target, prop)) {
				version.value;
				return target[prop];
			}
			const fallback = target[prop];
			if (typeof fallback === 'function') return fallback.bind(target);
			return fallback;
		},
		set(target, prop, next) {
			target[prop] = next;
			bump();
			return true;
		},
		has(target, prop) {
			return prop in target;
		}
	});
	_shallowRows.add(proxy);
	_shallowData.set(proxy, data);
	return proxy;
}
/** Alias tuned for table/grid records: `rowOf({...})` === `shallowStateOf({...})`. */
function rowOf(value) {
	return shallowStateOf(value);
}
/** Untracked access to a shallow row's plain data (for filter/sort pipelines). */
function rawOf(row) {
	if (row != null && (typeof row === 'object' || typeof row === 'function')) {
		try { if (_shallowRows.has(row)) return _shallowData.get(row) ?? row; } catch (e) { /* fall through */ }
	}
	return row;
}
/** Manually bump a shallow row's version (row-level refresh). No-op for other values. */
function touchRow(row) {
	try {
		if (row != null && typeof row.touch === 'function') row.touch();
	} catch (e) { /* ignore */ }
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
				const key = normalizeAttributeName(prop);
				const value = obj[prop];
				// check prop in newobj
				if (Object.hasOwnProperty.call(newObj, key)) {
					const value2 = newObj[key];
					// check datatype
					if (Array.isArray(value)) {
						newObj[key] = Array.isArray(value2) ? [...value, ...value2] : [...value, value2];
					} else if (Array.isArray(value2)) {
						newObj[key] = [...value2, value];
					} else {
						newObj[key] = [value2, value];
					}
				} else {
					newObj[key] = Array.isArray(value) ? [...value] : value;
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
	currentViews = [];
	currentStates = [];
	currentLists = [];
	currentListeners = [];
	currentScope = null;
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
			// tracked so a later branch swap can release the previous branch
			this.currentViews.push(result);
			return [result.getElement()];
		}
		if (result instanceof State || result.prototype instanceof State) {
			const node = result.generateMutable();
			// the state keeps this node alive; drop it on the next swap so a
			// detached branch is neither pinned nor updated after unmount
			this.currentStates.push({ state: result, node });
			return [node];
		}
		if (result instanceof ListState) {
			// list rendering is delegated to the parent element (stays reactive)
			this.targetParent.append(result);
			// remember which parent entry this append created so the swap can
			// detach exactly these views again
			this.currentLists.push({ list: result, parent: this.targetParent, index: result.parentElement.length - 1 });
			return [];
		}
		if (result instanceof StateListener) {
			// a listener renders no node but stays reachable from the parent's
			// conditional registry + global remount list; stop it on swap
			this.targetParent.append(result);
			this.currentListeners.push(result);
			return [];
		}
		if (result instanceof Raw) {
			return Array.from(toNodes(result.get()));
		}
		warnStringifiedFunction(result);
		return [document.createTextNode(result)];
	}

	/** Releases the branch currently on screen (its bindings and nodes). */
	disposeBindings() {
		this.#clearBranch();
		return this;
	}
	/**
	 * Detaches the active branch so nothing keeps it alive: nodes leave the
	 * DOM, element bindings unsubscribe, state containers drop their nodes,
	 * delegated lists detach their views, and the branch scope releases any
	 * computed()/effect() created while the branch rendered. After this the
	 * branch is immediately eligible for garbage collection.
	 */
	#clearBranch() {
		this.currentNodes.forEach(node => node.remove?.());
		this.currentNodes = [];
		this.currentViews.forEach(view => view.disposeBindings?.());
		this.currentViews = [];
		this.currentStates.forEach(({ state, node }) => {
			try { state.removeContainer?.(node); } catch (error) { /* ignore */ }
		});
		this.currentStates = [];
		this.currentLists.forEach(({ list, parent, index }) => {
			try { list.detachFrom?.(parent, index); } catch (error) { /* ignore */ }
		});
		this.currentLists = [];
		this.currentListeners.forEach(listener => {
			try { listener.stop?.(); } catch (error) { /* ignore */ }
		});
		this.currentListeners = [];
		if (this.currentScope) {
			try { this.currentScope.dispose(); } catch (error) { /* ignore */ }
			this.currentScope = null;
		}
	}
	trigger() {
		if (!this.targetParent || typeof this.targetParent.o === 'undefined') return;
		// the parent element may have been re-rendered since the last trigger
		// (a loop() item view renders once detached, then again on attach): a
		// marker left in the discarded node is orphaned, so re-anchor to the
		// live node. A merely unmounted marker (pre-mount tree) is still
		// contained by the parent and must be kept.
		if (this.marker != null && !this.marker.isConnected && !this.targetParent.o.contains(this.marker)) {
			this.#clearBranch();
			this.marker = null;
			this.rendered = false;
		}
		this.#initMarker();
		const condition = this.#evaluateCondition();
		if (this.rendered && this.lastCondition == condition) return;
		// each trigger renders a brand new branch, so the previous one is really
		// dropped here: detach nodes and release subscriptions/listeners before
		// re-rendering, otherwise the inactive branch stays reachable
		this.#clearBranch();
		const branch = condition ? this.trueCallback : this.falseCallback;
		// evaluate AND render the branch inside one scope: computed()/effect()
		// created while the callback runs (often as arguments of the branch's
		// root element) are owned by the branch and released with it on the
		// next swap - evaluating the callback outside would leave them wired
		const scoped = withReactiveScope(() => {
			const branchResult = (typeof branch === 'function') ? branch.call() : branch;
			return this.#resolveBranch(branchResult ?? null);
		});
		this.currentScope = scoped.scope;
		this.currentNodes = scoped.value;
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
	/**
	 * Called when the parent element releases its bindings (branch swap,
	 * re-render, `loop()` row removal): detaches the listener so it neither
	 * fires nor keeps its closure reachable from the detached subtree.
	 */
	disposeBindings() {
		this.stop();
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
	// `_deps` is the only registry of dependencies: it holds the State instances
	// themselves, so teardown can call `unsubscribe` directly on each one. Keeping
	// a parallel `_unsubs` array of per-dependency closures doubled the allocation
	// (and the GC pressure) of every recompute for no extra reach.
	function scheduleTrack() {
		if (_isFlushingBatch) _pendingBatchComputations.add(track);
		else track();
	}

	function track() {
		// Prevent circular recomputation
		if (_computing) return;
		_computing = true;

		// Unsubscribe from the previous dependency set
		_deps.forEach(dep => dep.unsubscribe(scheduleTrack));
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
		_deps.forEach(dep => dep.subscribe(scheduleTrack));

		return result;
	}

const initialValue = track();
// Create a proper State wrapper that always has .value getter
const derivedState = new State(initialValue, {
	get(obj) {
		return obj.getValue();
	},
	set(obj, val) {
		obj.setState(val);
		return true;
	}
});

	// Override the recompute to update the state
	const originalTrack = track;
	track = function () {
		_computing = true;

		_deps.forEach(dep => dep.unsubscribe(scheduleTrack));
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

		_deps.forEach(dep => dep.subscribe(scheduleTrack));

		derivedState.value = result;
		return result;
	};

	// Scope teardown: drop every dependency subscription this computed holds.
	// Only registered while a `loop()` item is being rendered, so a computed
	// created outside a loop keeps living until it is garbage collected.
	registerDisposable(() => {
		_deps.forEach(dep => dep.unsubscribe(scheduleTrack));
		_deps = new Set();
	});

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
	let _running = false;
	let _disposed = false;
	function scheduleRun() {
		if (_isFlushingBatch) _pendingBatchEffects.add(run);
		else run();
	}

	function run() {
		if (_disposed || _running) return;
		_running = true;

		// Unsubscribe from the previous dependency set (`_deps` holds the State
		// instances, so no per-dependency teardown closures are needed).
		_deps.forEach(dep => dep.unsubscribe(scheduleRun));
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
		_deps.forEach(dep => dep.subscribe(scheduleRun));
	}

	// Run immediately to collect initial dependencies and execute effect
	run();

	// Return dispose function
	function dispose() {
		_disposed = true;
		_deps.forEach(dep => dep.unsubscribe(scheduleRun));
		_deps.clear();
	}
	// scope teardown for effects created inside a `loop()` item
	registerDisposable(dispose);
	return dispose;
}

export { Jetz, Dispatcher, Component, JetzElement, State, RememberState, Raw, createElement, rememberOf, stateOf, shallowStateOf, rowOf, rawOf, touchRow, computed, effect, batch, defer, lazy, _show, _else, _elseif, _if, html, listen, onCreate, onMount, onUpdate, onDestroy };
