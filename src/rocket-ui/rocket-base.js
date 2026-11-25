/**
 * base-ui.js — Base class and mechanisms for building UI components on Jetz.
 *
 * Built on:  jetz.js (core), jetz-ui.js (element helpers), and optionally
 *            jetz-router.js / jetz-session.js through Jetz.$route / Jetz.$session.
 *
 * What BaseUI gives a component
 * ─────────────────────────────────────────────────────────────────────────────
 *  Props        constructor props + router $params, defaults, type checks,
 *               State-or-plain values (`val()` unwraps)
 *  State        `initState()` → reactive `this.state`, `set()`, `reset()`,
 *               `snapshot()`, `remember()` (persisted), `list()`, `model()`
 *  Compute      `computed()`, `effect()` (auto-disposed), `watch()`
 *  Interaction  `action()` (batched handler), `emit()` (callback prop + DOM
 *               CustomEvent), `on()` (window/document/element listeners),
 *               `publish()/subscribe()` (app-wide bus), `navigate()`
 *  Lifecycle    `setup() → build() → mounted() → updated() → destroyed()`
 *               with automatic cleanup of effects, listeners and timers
 *  Template     `rootAttrs()` (class/variants/id/attrs), `cx()`, `ref()`,
 *               `when()`, `each()`, `children`
 *  Async        `task()` → { data, error, loading, run }
 *  Routing      `static route(path)` produces a route entry for jetz-router
 *
 * Framework facts this file is designed around (read these before extending):
 *  1. Jetz only calls a class's own onCreate/onMount/onUpdate/onDestroy when the
 *     method is defined directly on the CONCRETE class prototype
 *     (`constructor.prototype.hasOwnProperty`). Inherited hooks are skipped, so a
 *     base class cannot rely on them. BaseUI therefore registers hooks through
 *     the global onMount/onUpdate/onDestroy and exposes mounted()/updated()/
 *     destroyed() for subclasses.
 *  2. Handlers written as `function () {}` get `this` rebound to the JetzElement.
 *     Use arrow functions or `this.action(fn)` so `this` stays the component.
 *  3. `updated()` runs after ANY state change in the app (Jetz.triggerByState),
 *     not only this component's state. Keep it cheap.
 *  4. stateOf() on an array does not make a list. Arrays in `initState()` are
 *     converted to ListState automatically; use `each()` to render them.
 *  5. `ifElse()` renders component instances via `render()` directly, outside
 *     renderComponent(). BaseUI detects that and opens its own lifecycle scope,
 *     so mounted()/destroyed() still work inside `when()` branches.
 */

import {
  Component,
  Dispatcher,
  Jetz,
  JetzArgument,
  JetzElement,
  ListState,
  State,
  batch,
  computed,
  createElement,
  effect,
  flatMap,
  ifElse,
  listOf,
  loop,
  onDestroy,
  onMount,
  onUpdate,
  rememberOf,
  renderComponent,
} from '../lib/jetz.js';

/* ──────────────────────────────────────────────────────────────────────────
 * Small utilities
 * ────────────────────────────────────────────────────────────────────────── */

/** True for `{}` / Object.create(null) style objects (not State, element, etc.). */
export function isPlain(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** True for State instances and anything that satisfies Jetz's `bind` contract. */
export function isState(value) {
  if (value instanceof State) return true;
  return (
    value !== null &&
    typeof value === 'object' &&
    'value' in value &&
    typeof value.subscribe === 'function' &&
    typeof value.unsubscribe === 'function'
  );
}

/** Read a possibly-reactive value. Inside computed()/effect() this tracks it. */
export function unwrap(value) {
  return isState(value) ? value.value : value;
}

/** Read a possibly-reactive value WITHOUT tracking. */
export function peek(value) {
  if (value instanceof State) return value.peek();
  return isState(value) ? value.value : value;
}

/**
 * A single reactive cell for any value (primitives, objects, Dates, class
 * instances). Unlike stateOf(), it never recurses into objects.
 */
export function cell(initial) {
  return new State(initial, {
    get: (s) => s.getValue(),
    set: (s, v) => (s.setState(v), true),
  });
}

/**
 * Compose class names. Accepts strings, arrays, State, functions (reactive) and
 * `{ className: condition }` maps where condition is boolean | State | function.
 * Returns an array that Jetz understands as a (reactive) `class` value.
 */
export function cx(...parts) {
  const out = [];
  const walk = (part) => {
    if (part === null || part === undefined || part === false || part === '') return;
    if (Array.isArray(part)) return part.forEach(walk);
    if (isPlain(part)) {
      for (const [name, cond] of Object.entries(part)) {
        if (typeof cond === 'function') out.push(() => (cond() ? name : ''));
        else if (isState(cond)) out.push(() => (cond.value ? name : ''));
        else if (cond) out.push(name);
      }
      return;
    }
    out.push(part);
  };
  parts.forEach(walk);
  return out;
}

/** Deep copy of plain data (arrays / plain objects); other values are kept as-is. */
function clonePlain(value) {
  if (Array.isArray(value)) return value.map(clonePlain);
  if (isPlain(value)) {
    const out = {};
    for (const key of Object.keys(value)) out[key] = clonePlain(value[key]);
    return out;
  }
  return value;
}

/** Convert plain initial data into reactive structure (States / ListStates). */
function buildState(value) {
  if (value instanceof State || value instanceof ListState) return value;
  if (Array.isArray(value)) return listOf(...value);
  if (isPlain(value)) {
    const out = {};
    for (const key of Object.keys(value)) out[key] = buildState(value[key]);
    return out;
  }
  return cell(value);
}

/** Reactive structure → plain data (no tracking). */
export function toPlain(value) {
  if (value instanceof ListState) return value.values.map(toPlain);
  if (value instanceof State) return toPlain(value.peek());
  if (Array.isArray(value)) return value.map(toPlain);
  if (isPlain(value)) {
    const out = {};
    for (const key of Object.keys(value)) {
      if (typeof value[key] === 'function') continue; // e.g. toObject
      out[key] = toPlain(value[key]);
    }
    return out;
  }
  return value;
}

/** Apply a patch onto a reactive state tree (callers wrap this in batch()). */
function assignState(target, patch) {
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    const current = target[key];
    if (current instanceof State) {
      if (!Object.is(current.peek(), next)) current.setState(next);
    } else if (current instanceof ListState) {
      if (Array.isArray(next)) current.set(next);
      else console.warn(`Jetz BaseUI: state "${key}" is a list; expected an array.`);
    } else if (isPlain(current) && isPlain(next)) {
      assignState(current, next);
    } else {
      target[key] = buildState(next); // new key, or shape changed
    }
  }
}

const kebab = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

let uidCounter = 0;
/** Unique, stable-per-call id for aria-* wiring. */
export function uid(prefix = 'ui') {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

/** App-wide pub/sub bus (a Jetz Dispatcher). Prefer `this.publish/subscribe`. */
export const bus = new Dispatcher();

/* ──────────────────────────────────────────────────────────────────────────
 * Prop schema
 * ──────────────────────────────────────────────────────────────────────────
 * static propTypes = {
 *   label:    String,                                   // type only
 *   size:     { type: String, default: 'md' },          // default
 *   count:    { type: Number, required: true },         // required
 *   mode:     { type: String, validator: v => ['a', 'b'].includes(v) },
 *   value:    [String, Number],                         // several types
 *   items:    { type: Array, default: () => [] },       // factory defaults
 *   onChange: Function,
 * };
 * Props may also be State instances: they are checked on their current value.
 * Defaults always apply; type/required checks only warn when Jetz.devtools = true.
 */

function normalizeSpec(spec) {
  if (spec === null || spec === undefined) return {};
  if (typeof spec === 'function' || Array.isArray(spec)) return { type: spec };
  return spec;
}

function matchesType(value, T) {
  switch (T) {
    case String: return typeof value === 'string';
    case Number: return typeof value === 'number';
    case Boolean: return typeof value === 'boolean';
    case Function: return typeof value === 'function';
    case Symbol: return typeof value === 'symbol';
    case Array: return Array.isArray(value);
    case Object: return value !== null && typeof value === 'object' && !Array.isArray(value);
    default: return typeof T === 'function' ? value instanceof T : true;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Ref — attach to an element with `{ ref: this.ref('name') }`
 * ──────────────────────────────────────────────────────────────────────────
 * Uses Jetz's JetzArgument mechanism (same as asLink): when an attribute value
 * is a JetzArgument, Jetz calls setElement(el) then onAssigned().
 */
export class Ref extends JetzArgument {
  /** The wrapped HTMLElement, or null before render. */
  get current() {
    return this.element?.getElement?.() ?? null;
  }
  onAssigned() {}
  focus() {
    this.element?.focus();
    return this;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * BaseUI
 * ────────────────────────────────────────────────────────────────────────── */

export class BaseUI extends Component {
  /* ---- static configuration (override in subclasses) ---- */

  /** Prop schema, see the block above. */
  static propTypes = {};
  /** Always-applied root class. */
  static baseClass = '';
  /**
   * Prop-driven classes: { propName: { value: 'class-name' } }.
   * Example: { size: { sm: 'ui-sm', lg: 'ui-lg' } } adds 'ui-lg' when size === 'lg'.
   * Reactive when the prop is a State.
   */
  static variants = null;
  /** Prefix for DOM CustomEvents fired by emit(). */
  static eventPrefix = 'ui:';
  /** Route-level middlewares (see middleware.js) used by static route(). */
  static middlewares = [];
  /** Optional route head(params) → title/meta elements, used by static route(). */
  static head = undefined;

  /* ---- instance fields ---- */

  /** Resolved props: defaults < constructor props < router $params. */
  props = {};
  /** Slot content passed after the props object. */
  children = [];
  /** Reactive state tree created from initState(). */
  state = undefined;
  /** Root JetzElement (null if build() returned something else). */
  el = null;
  /** Named Ref objects created through ref(). */
  refs = {};

  #given;
  #initial = {};
  #cleanups = [];
  #mountFns = [];
  #updateFns = [];
  #destroyed = false;
  #uid = null;

  /**
   * new MyComponent(props?, ...children)
   * If the first argument is not a plain object it is treated as a child.
   */
  constructor(props = {}, ...children) {
    super();
    if (props !== null && props !== undefined && !isPlain(props)) {
      children.unshift(props);
      props = {};
    }
    this.#given = props ?? {};
    this.children = flatMap(children).filter((c) => c !== null && c !== undefined && c !== false);
    this.props = this.#resolveProps();
  }

  /* ======================================================================
   * Hooks for subclasses
   * ====================================================================== */

  /** Return the initial state as plain data. Arrays become ListStates. */
  initState(_props) {
    return {};
  }

  /** Runs before build(). Create computed values, effects, watchers here. */
  setup() {}

  /** REQUIRED. Return a JetzElement (or array / component). */
  build() {
    throw new Error(`${this.constructor.name} must implement build()`);
  }

  /** After the root element is connected to the document. DOM is available. */
  mounted() {}

  /** After any Jetz state update while mounted (app-wide; keep it cheap). */
  updated() {}

  /** When the element leaves the document. Cleanup runs right after. */
  destroyed() {}

  /** Fallback UI when setup()/build() throws. */
  renderError(error) {
    return createElement(
      'div',
      { class: 'jetz-error', role: 'alert' },
      Jetz.devtools ? `${this.constructor.name} failed to render: ${error?.message ?? error}` : '',
    );
  }

  /* ======================================================================
   * Rendering core (do not override; implement build() instead)
   * ====================================================================== */

  render() {
    const lc = this.$lifecycle;
    const insideRenderComponent = lc && lc.component === this && !lc.entry && !lc.destroyed;
    if (insideRenderComponent) return this.#compose();

    // Rendered directly (e.g. inside an ifElse branch) → open our own scope so the
    // global onMount/onUpdate/onDestroy hooks work.
    const scoped = () => this.#compose();
    scoped.displayName = this.constructor.displayName || this.constructor.name;
    return renderComponent(scoped);
  }

  #compose() {
    this.#teardown(); // re-render of the same instance: drop previous effects/listeners
    this.#destroyed = false;
    this.props = this.#resolveProps();
    this.#ensureState();

    onMount(() => this.#runMount());
    onUpdate(() => this.#runUpdate());
    onDestroy(() => this.#runDestroy());

    let out;
    try {
      this.setup();
      out = this.build();
    } catch (error) {
      console.error(`Jetz BaseUI: ${this.constructor.name} failed to render`, error);
      this.#teardown();
      out = this.renderError(error);
    }

    const root = Array.isArray(out) ? out[0] : out;
    this.el = root instanceof JetzElement ? root : null;
    return out;
  }

  #attempt(label, fn) {
    try {
      return fn();
    } catch (error) {
      console.error(`Jetz BaseUI: ${this.constructor.name}.${label}() threw`, error);
    }
  }

  #runMount() {
    this.#attempt('mounted', () => this.mounted());
    this.#mountFns.splice(0).forEach((fn) => {
      const result = this.#attempt('onMounted', fn);
      if (typeof result === 'function') this.#cleanups.push(result);
    });
  }

  #runUpdate() {
    this.#attempt('updated', () => this.updated());
    this.#updateFns.forEach((fn) => this.#attempt('onUpdated', fn));
  }

  #runDestroy() {
    this.#destroyed = true;
    this.#attempt('destroyed', () => this.destroyed());
    this.#teardown();
  }

  #teardown() {
    const cleanups = this.#cleanups.splice(0).reverse();
    cleanups.forEach((fn) => this.#attempt('cleanup', fn));
    this.#mountFns.length = 0;
    this.#updateFns.length = 0;
  }

  /* ======================================================================
   * Props
   * ====================================================================== */

  #resolveProps() {
    const schema = this.constructor.propTypes ?? {};
    const params = isPlain(this.$params) ? this.$params : {};
    const out = { ...this.#given, ...params };
    const name = this.constructor.name;

    for (const [key, raw] of Object.entries(schema)) {
      const spec = normalizeSpec(raw);
      const types = [].concat(spec.type ?? []);

      if (out[key] === undefined && 'default' in spec) {
        const d = spec.default;
        out[key] = typeof d === 'function' && !types.includes(Function) ? d.call(this) : d;
      }

      if (!Jetz.devtools) continue;
      const value = out[key];
      if (value === undefined || value === null) {
        if (spec.required) console.warn(`Jetz BaseUI: ${name} is missing required prop "${key}".`);
        continue;
      }
      const current = peek(value);
      if (types.length && !types.some((T) => matchesType(current, T))) {
        console.warn(
          `Jetz BaseUI: ${name} prop "${key}" expected ${types.map((T) => T?.name ?? String(T)).join(' | ')}, got`,
          current,
        );
      }
      if (typeof spec.validator === 'function' && !spec.validator(current)) {
        console.warn(`Jetz BaseUI: ${name} prop "${key}" failed validation.`, current);
      }
    }
    return out;
  }

  /** Read a prop, unwrapping State (tracks inside computed()/effect()). */
  val(name) {
    return unwrap(this.props[name]);
  }

  /** Read a prop without tracking. */
  peek(name) {
    return peek(this.props[name]);
  }

  /** Stable unique id (props.id wins) for aria-labelledby / for= wiring. */
  get id() {
    if (this.props.id !== undefined && this.props.id !== null) return this.props.id;
    return (this.#uid ??= uid(kebab(this.constructor.name)));
  }

  /* ======================================================================
   * State
   * ====================================================================== */

  #ensureState() {
    if (this.state !== undefined) return;
    const init = this.initState(this.props) ?? {};
    this.#initial = clonePlain(init);
    this.state = buildState(init);
  }

  /** Batched partial update: this.set({ open: true, user: { name: 'A' } }). */
  set(patch) {
    batch(() => assignState(this.state, patch));
    return this;
  }

  /** Restore the values returned by initState(). */
  reset() {
    return this.set(clonePlain(this.#initial));
  }

  /** Plain, non-reactive copy of the current state. */
  snapshot() {
    return toPlain(this.state);
  }

  /**
   * State persisted to localStorage (Jetz rememberOf), namespaced by class name.
   *   this.theme = this.remember('theme', 'light');
   */
  remember(key, initial) {
    return rememberOf(`${this.constructor.name}.${key}`, initial);
  }

  /** A reactive list (ListState) for use with each(). */
  list(...items) {
    return listOf(...items);
  }

  /** A single reactive value of any type. */
  cell(initial) {
    return cell(initial);
  }

  /**
   * Controlled/uncontrolled value. If the parent passed a State for `name` it is
   * used directly (two-way, controlled); otherwise a local cell is created from
   * the prop value or `initial`.
   */
  model(name, initial) {
    const given = this.props[name];
    if (isState(given)) return given;
    return cell(given !== undefined ? given : initial);
  }

  /* ======================================================================
   * Compute
   * ====================================================================== */

  /**
   * Derived State. Re-evaluates when any State read inside changes.
   * Note: Jetz's computed() has no disposer, so prefer deriving from this
   * component's own state/props; subscriptions to long-lived global states stay
   * alive. For global sources use effect()/watch(), which are auto-disposed.
   */
  computed(fn) {
    return computed(fn);
  }

  /**
   * Side effect that re-runs when tracked State changes. Disposed on destroy.
   * `fn` may return a cleanup function (do not read State inside the cleanup).
   * Returns a manual disposer.
   */
  effect(fn) {
    let cleanup;
    const stop = effect(() => {
      if (typeof cleanup === 'function') cleanup();
      const result = fn();
      cleanup = typeof result === 'function' ? result : undefined;
    });
    const dispose = () => {
      if (typeof cleanup === 'function') {
        const c = cleanup;
        cleanup = undefined;
        c();
      }
      stop();
    };
    this.onCleanup(dispose);
    return dispose;
  }

  /**
   * Observe a State (or a getter function) and run `handler(next, previous)` on
   * change. The handler is NOT tracked, so it can freely read other State.
   * Returns an unsubscribe function.
   */
  watch(source, handler, { immediate = false } = {}) {
    const target = typeof source === 'function' && !isState(source) ? computed(source) : source;
    if (!isState(target)) throw new TypeError('BaseUI.watch(source): expected a State or a function');
    const listener = (next, previous) => {
      if (!Object.is(next, previous)) handler.call(this, next, previous);
    };
    target.subscribe(listener);
    const off = () => target.unsubscribe(listener);
    this.onCleanup(off);
    if (immediate) handler.call(this, target.peek ? target.peek() : target.value, undefined);
    return off;
  }

  /* ======================================================================
   * Interaction
   * ====================================================================== */

  /**
   * Wrap an event handler: `this` stays the component and all State writes
   * inside are batched into one render pass.
   *   button({ onclick: this.action(() => this.state.count.value++) }, '+')
   */
  action(fn) {
    return (...args) => batch(() => fn.apply(this, args));
  }

  /**
   * Notify the outside world:
   *  1. calls the `on<Name>` callback prop (emit('change') → props.onChange)
   *  2. dispatches a bubbling DOM CustomEvent `${eventPrefix}${name}` on the root
   * Returns false when a DOM listener called preventDefault().
   */
  emit(name, detail, { bubbles = true, cancelable = false } = {}) {
    const callback = this.props[`on${capitalize(name)}`];
    if (typeof callback === 'function') callback.call(this, detail, this);

    const dom = this.dom;
    if (!dom) return true;
    const event = new CustomEvent(`${this.constructor.eventPrefix}${name}`, { detail, bubbles, cancelable });
    dom.dispatchEvent(event);
    return !event.defaultPrevented;
  }

  /**
   * addEventListener with automatic removal on destroy.
   * `target` can be an EventTarget, a CSS selector, 'window' or 'document'.
   */
  on(target, type, handler, options) {
    const t =
      target === 'window' ? window :
      target === 'document' ? document :
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!t || typeof t.addEventListener !== 'function') {
      console.warn(`Jetz BaseUI: on() could not resolve target`, target);
      return () => {};
    }
    const bound = (event) => handler.call(this, event);
    t.addEventListener(type, bound, options);
    const off = () => t.removeEventListener(type, bound, options);
    this.onCleanup(off);
    return off;
  }

  /** Publish on the app-wide bus. */
  publish(topic, payload) {
    return bus.dispatch(topic, payload);
  }

  /** Subscribe to a bus topic; auto-unsubscribed on destroy. */
  subscribe(topic, handler) {
    const off = bus.subscribe((action, payload) => {
      if (action === topic) handler.call(this, payload);
    });
    this.onCleanup(off);
    return off;
  }

  /** Navigate with jetz-router (requires Jetz.use(router)). */
  navigate(to, params) {
    const router = Jetz.$route;
    if (!router) {
      console.warn('Jetz BaseUI: navigate() needs Jetz.use(router) first.');
      return;
    }
    router.to(to, params);
  }

  /** The jetz-router instance, if installed. */
  get router() {
    return Jetz.$route;
  }

  /** The jetz-session proxy, if installed. */
  get session() {
    return Jetz.$session;
  }

  /* ======================================================================
   * Async, timers
   * ====================================================================== */

  /**
   * Track an async function as reactive state.
   *   const user = this.task(id => fetch(`/u/${id}`).then(r => r.json()));
   *   user.run(7);   // user.loading / user.data / user.error are States
   * Stale results (superseded or after destroy) are ignored.
   */
  task(fn, { immediate = false, initial = null } = {}) {
    const data = cell(initial);
    const error = cell(null);
    const loading = cell(false);
    let ticket = 0;

    const run = async (...args) => {
      const mine = ++ticket;
      batch(() => {
        loading.setState(true);
        error.setState(null);
      });
      try {
        const result = await fn.apply(this, args);
        if (mine === ticket && !this.#destroyed) {
          batch(() => {
            data.setState(result);
            loading.setState(false);
          });
        }
        return result;
      } catch (err) {
        if (mine === ticket && !this.#destroyed) {
          batch(() => {
            error.setState(err);
            loading.setState(false);
          });
        }
        return undefined;
      }
    };
    const cancel = () => {
      ticket += 1;
      loading.setState(false);
    };

    this.onCleanup(() => (ticket += 1));
    if (immediate) run();
    return { data, error, loading, run, cancel };
  }

  /** setTimeout cleared on destroy. Returns a canceller. */
  timeout(fn, ms) {
    const id = setTimeout(() => !this.#destroyed && fn.call(this), ms);
    const cancel = () => clearTimeout(id);
    this.onCleanup(cancel);
    return cancel;
  }

  /** setInterval cleared on destroy. Returns a canceller. */
  interval(fn, ms) {
    const id = setInterval(() => !this.#destroyed && fn.call(this), ms);
    const cancel = () => clearInterval(id);
    this.onCleanup(cancel);
    return cancel;
  }

  /* ======================================================================
   * Lifecycle registration (use inside setup())
   * ====================================================================== */

  /** Register cleanup to run on destroy (or before a re-render). */
  onCleanup(fn) {
    if (typeof fn === 'function') this.#cleanups.push(fn);
    return this;
  }

  /** Run `fn` after mount; if it returns a function it becomes a cleanup. */
  onMounted(fn) {
    if (typeof fn === 'function') this.#mountFns.push(fn);
    return this;
  }

  /** Run `fn` on every update pass while mounted. */
  onUpdated(fn) {
    if (typeof fn === 'function') this.#updateFns.push(fn);
    return this;
  }

  get isDestroyed() {
    return this.#destroyed;
  }

  /* ======================================================================
   * DOM access
   * ====================================================================== */

  /** Root HTMLElement (null before render). */
  get dom() {
    return this.el?.getElement?.() ?? null;
  }

  /** querySelector inside this component. */
  query(selector) {
    return this.dom?.querySelector(selector) ?? null;
  }

  /** querySelectorAll inside this component, as an array. */
  queryAll(selector) {
    return this.dom ? [...this.dom.querySelectorAll(selector)] : [];
  }

  /**
   * A named Ref. Usage: input({ ref: this.ref('field') });
   * Later: this.refs.field.current / this.refs.field.focus()
   */
  ref(name) {
    return (this.refs[name] ??= new Ref());
  }

  focus() {
    this.el?.focus();
    return this;
  }

  /* ======================================================================
   * Template helpers
   * ====================================================================== */

  /**
   * Attribute objects for the root element. Spread into your root:
   *   div(this.rootAttrs({ role: 'button' }), ...)
   * Combines static baseClass, `variants`, props.class, props.id, props.attrs.
   * (Jetz merges class values from several attribute objects automatically.)
   */
  rootAttrs(...extra) {
    const C = this.constructor;
    const variantClasses = C.variants
      ? Object.entries(C.variants).map(([prop, map]) => () => map[this.val(prop)] ?? '')
      : [];
    const parts = [
      { class: cx(C.baseClass, variantClasses, this.props.class) },
      this.props.id !== undefined ? { id: this.props.id } : null,
      isPlain(this.props.attrs) ? this.props.attrs : null,
      ...extra,
    ];
    return parts.filter(Boolean);
  }

  /** `{ class: [...] }` from cx() — convenient for inner elements. */
  classes(...parts) {
    return { class: cx(...parts) };
  }

  /** Conditional rendering: this.when(() => state.open.value, () => panel, () => null) */
  when(condition, whenTrue, whenFalse = null) {
    return ifElse(condition, whenTrue, whenFalse);
  }

  /**
   * List rendering (keyed when two functions are given):
   *   this.each(this.state.todos, t => t.id, t => li(t.title))
   */
  each(list, ...rest) {
    return loop(list, ...rest);
  }

  /* ======================================================================
   * Static helpers
   * ====================================================================== */

  /**
   * Build a route entry for jetz-router:
   *   new Router(Home.route('/'), UserPage.route('/users/:id'), ...)
   * Route params arrive as `this.props` (via $params). Uses the class's static
   * `middlewares` and `head` unless overridden.
   */
  static route(path, { middlewares = this.middlewares, head = this.head } = {}) {
    return { path, component: this, middlewares, head };
  }

  /**
   * Render this component into a DOM target:
   *   App.mount('#app', { title: 'Hi' })
   * Returns the component instance.
   */
  static mount(target, props = {}, ...children) {
    const instance = new this(props, ...children);
    Jetz.mount(() => renderComponent(instance), target);
    return instance;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * defineComponent — object-style definition (no `class` syntax)
 * ──────────────────────────────────────────────────────────────────────────
 *   const Badge = defineComponent({
 *     name: 'Badge',
 *     baseClass: 'badge',
 *     propTypes: { text: String, tone: { type: String, default: 'info' } },
 *     variants: { tone: { info: 'badge-info', warn: 'badge-warn' } },
 *     build() { return span(this.rootAttrs(), this.props.text); },
 *   });
 * Functions become prototype methods (setup, build, initState, mounted, ...);
 * baseClass / propTypes / variants / middlewares / head / eventPrefix become statics.
 */
export function defineComponent(definition = {}) {
  const { name = 'Component', ...rest } = definition;
  const Component_ = { [name]: class extends BaseUI {} }[name];
  const statics = ['baseClass', 'propTypes', 'variants', 'middlewares', 'head', 'eventPrefix', 'displayName'];

  for (const [key, value] of Object.entries(rest)) {
    if (statics.includes(key)) {
      Component_[key] = value;
    } else if (typeof value === 'function') {
      Object.defineProperty(Component_.prototype, key, { value, writable: true, configurable: true });
    } else {
      console.warn(`Jetz defineComponent(${name}): ignored non-function member "${key}".`);
    }
  }
  if (typeof Component_.prototype.build !== 'function' || Component_.prototype.build === BaseUI.prototype.build) {
    console.warn(`Jetz defineComponent(${name}): no build() provided.`);
  }
  return Component_;
}

export default BaseUI;