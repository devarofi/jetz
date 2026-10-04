import type { Router } from './jetz-router.js';
import type { JetzSession } from './jetz-session.js';

export interface StateHandler<T> {
    get(state: State<T>): T | undefined;
    set(state: State<T>, value: T): boolean | void;
}

export type JetzDevtoolsEvent =
    | { type: 'create'; element: JetzElement; tag: string; key?: unknown; index?: number }
    | { type: 'attach'; element: JetzElement; parent: JetzElement | null }
    | { type: 'render'; element: JetzElement }
    | { type: 'component'; element: JetzElement; name: string }
    | { type: 'lifecycle'; stage: 'create' | 'mount' | 'update' | 'destroy'; element: JetzElement | null }
    | { type: 'dispose'; element: JetzElement };

/** The recursively reactive shape produced by stateOf() and ListState.toState(). */
export type Reactive<T> = T extends State<infer V>
    ? State<V>
    : T extends readonly unknown[]
    ? { [K in keyof T]: Reactive<T[K]> } & { toObject(): unknown }
    : T extends object
    ? { [K in keyof T]: Reactive<T[K]> } & { toObject(): T }
    : State<T>;

/** The shape of an item stored in a remembered list. */
export type RememberedListItem<T> = T extends object ? Reactive<T> : T;

/** The shape returned by rememberOf(), recursively wrapping leaf values. */
export type Remembered<T> = T extends readonly (infer Item)[]
    ? ListState<RememberedListItem<Item>, Item>
    : T extends object
    ? { [K in keyof T]: Remembered<T[K]> }
    : RememberState<T>;

/**
 * Core reactive State container.
 * Calling `stateOf(value)` returns an instance of `State<T>`.
 */
export declare class State<T = any> {
    constructor(value: T, handler?: StateHandler<T>);

    /** DOM nodes and subscribers attached to this state. */
    container: any[];

    /** The reactive value. Reading tracks dependencies in `computed` and `effect`; writing notifies subscribers. */
    value: T;

    /** Read current value directly without invoking getter traps. */
    getValue(): T;

    /** Untracked read: returns the value without registering in computed/effect. */
    peek(): T;

    /** Update the state value and trigger fine-grained DOM and subscriber updates. */
    setState(newValue: T): void;

    /** Subscribe to state changes: `listener(newValue, oldValue)`. */
    subscribe(listener: (newValue: T, oldValue: T) => void): this;

    /** Unsubscribe a previously registered listener. */
    unsubscribe(listener: (newValue: T, oldValue: T) => void): this;

    /** Internal: attach a DOM container (Text, Attr, Element, StyleState). */
    addContainer(container: any): void;

    /** Detaches a container previously attached with `addContainer`/`generateMutable`. */
    removeContainer(container: any): this;

    /**
     * Detaches every container bound to `node` or to a node inside `root`.
     * Used by the reconciler so a removed row leaves no node referenced here.
     */
    removeContainers(node: Node | null, root?: Node | null): this;

    /** Generates a mutable DOM Text or Element node for element interpolation. */
    generateMutable(): Text | HTMLElement;

    toString(): string;
    valueOf(): T;
}

/**
 * State that automatically synchronizes with `localStorage` across page reloads.
 */
export declare class RememberState<T = any> extends State<T> {
    id: string;
    pathId: string;

    constructor(value: T, handler?: StateHandler<T>, key?: string);
}

/**
 * Reactive list collection supporting fine-grained and keyed reconciliation.
 */
export declare class ListState<T = any, TInput = T> extends Array<T> {
    values: T[];
    parentElement: JetzElement[];
    views: any[][];
    uniqueValue: boolean;
    isRemember: boolean;
    objRemember: RememberState<string> | undefined;

    constructor(isRemember?: boolean, ...values: T[]);

    /** Number of items currently in the list. */
    readonly size: number;

    /** Appends items to the end of the collection and updates DOM. */
    push(...items: Array<T | TInput>): number;

    /** Converts string and number items to identity-preserving unique values. */
    asUnique(): this;

    /** Converts plain objects in the list into recursively reactive objects. */
    toState(): ListState<Reactive<T>, TInput | T>;

    /** Persists this list and rehydrates plain object records as reactive objects. */
    asRemember(key?: string): ListState<RememberedListItem<T>, TInput | T>;

    /** Returns the item at an index from the collection's values. */
    at(index: number): T | undefined;

    /** Replaces all items with a new array. */
    set(items: Array<T | TInput>): this;

    /** Replaces one item and updates rendered views and remembered data. */
    replaceAt(index: number, item: T | TInput): this;

    /** Replaces one item using its current value and index. */
    updateAt(index: number, updater: (item: T, index: number) => T | TInput): this;

    /** Retrieve an item by index. */
    get(index: number | string): any;

    /** Returns a new array of mapped values without changing this list. */
    map<U>(callback: (item: T, index: number, values: T[]) => U): U[];

    /** Replaces each item with the callback result and updates rendered views. */
    transform<U>(callback: (item: T, index: number, values: T[]) => U): ListState<U, U>;

    /** Inserts one or more items at the given index. */
    insertAt(index: number, ...items: Array<T | TInput>): this;

    /** Removes an item by value equality. */
    remove(item: T): void;

    /** Removes an item at the specified index. */
    removeAt(index: number): void;

    /** Sorts items in place and triggers re-render (chainable). */
    sort(compareFn?: (a: T, b: T) => number): this;

    /** Returns a plain filtered JavaScript array without mutating the ListState. */
    filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];

    /** Finds index of the given item. */
    indexOf(item: T): number;

    /** Checks whether an item exists in the collection. */
    includes(item: T): boolean;

    /** Returns the first item in the collection. */
    first(): T | undefined;

    /** Returns the last item in the collection. */
    last(): T | undefined;

    /** Clears all items from the collection. */
    clear(): void;

    /** Empties the list and updates its rendered views. */
    empty(): this;

    /** Applies the callback to each item and returns every matching item. */
    find(predicate?: (item: T, index: number) => boolean): any;

    /** Returns up to the first `count` values. */
    take(count: number): T[];

    /** Returns an iterator over the collection values. */
    [Symbol.iterator](): IterableIterator<T>;

    /** Internal list rendering and view management methods. */
    renderView(refresh?: boolean): void;
    assignParent(parent: JetzElement): void;
    setViews(views: any[][]): void;
    createItemView(parent: JetzElement, item: T, index: number): JetzElement;
    newView(parentIndex: number, view: any[], content: T, itemIndex: number): void;
}

/**
 * Represents a lightweight virtual wrapper around an HTMLElement.
 */
export declare class JetzElement {
    /** The underlying real DOM HTMLElement once rendered. */
    o: HTMLElement;

    tagName: string;

    /**
     * Pending attributes collected before render.
     * Keys are normalized on the way in: the `className` alias maps onto
     * `class`, and `data_`/`aria_` prefixes convert `_` to `-`
     * (e.g. `data_counter` reaches the DOM as `data-counter`).
     */
    attributes: Record<string, any>;
    children: any[];
    parent: JetzElement | null;
    previousElement?: JetzElement;
    position?: number;
    childPosition: number;
    renderPosition: number;
    collectionConditionalChild: any[];

    constructor(tag: string, attributes?: Record<string, any>, ...children: any[]);

    /** Renders the element and its children into the given DOM parent. */
    render(parent?: any, renderPosition?: number): void;

    /** Evaluates registered conditional children. */
    triggerCondition(): void;

    /** Sets the previous sibling used for insertion ordering. */
    setPrevious(previous: JetzElement): void;

    /** Returns the rendered HTMLElement. */
    getElement(): HTMLElement | undefined;

    /** Hook invoked immediately after the element is rendered and mounted. */
    onRendered(callback?: (() => void) | null): this;

    /** Hook invoked right before the element is rendered. */
    onStart(callback?: () => void): this;

    /** Reads an attribute value (pass the hyphenated form for `data-*`/`aria-*`). */
    attr(name: string): any;

    /**
     * Adds or updates an attribute. The name is normalized first: `className`
     * maps onto `class` and `data_`/`aria_` underscores become hyphens, so
     * `addAttr('data_counter', 1)` writes `data-counter="1"`.
     */
    addAttr(name: string, value: any): this;

    /** Removes an attribute (pass the hyphenated form for `data-*`/`aria-*`). */
    removeAttr(name: string): this;

    /** Reads a `data-*` attribute. */
    data(key: string): any;

    /** Applies inline CSS styles. */
    setStyle(styles: Record<string, any>): this;

    /** Reads an inline style value. */
    getStyle(prop: string): string;

    /** Adds one or more CSS class names. */
    addClass(value: string | string[]): this;

    /** Removes one or more CSS class names. */
    removeClass(...names: string[]): this;

    /** Toggles a CSS class name. */
    toggleClass(name: string): void;

    /** Replaces a CSS class matching a string or regex. */
    replaceClass(target: string | RegExp, replacement: string): this;

    /** Sets the element's text content. */
    text(content: string): this;

    /** Gets or sets the input element's value. */
    value(val?: any): any;

    /** Clears all child nodes. */
    empty(): this;

    /** Removes this element from the DOM. */
    remove(): void;

    /** Fires destruction lifecycle hooks for this element and descendants. */
    destroyLifecycle(): void;

    /**
     * Releases every reactive binding created for this element and its subtree:
     * state subscriptions, computed/effect scope, DOM listeners and state
     * containers. Called automatically when `loop()` drops a view, by `empty()`
     * and by `Jetz.unmount()`. Idempotent.
     */
    disposeBindings(): this;

    /** Disables the element. */
    disable(): this;

    /** Enables the element. */
    enable(): this;

    /** Sets focus to the element. */
    focus(): this;

    /** Removes focus from the element. */
    blur(): this;

    /** Attaches an event listener. */
    on(event: string, handler: (e: any) => void): this;

    /** Detaches an event listener. */
    off(event: string, handler: (e: any) => void): this;

    /** Returns the parent JetzElement if available. */
    getParent(): JetzElement | null;

    /** Finds a rendered element by id and returns its JetzElement wrapper. */
    findId(id: string): JetzElement | undefined;

    /** Gets or sets the element id. */
    id(val: string): this;

    /** Appends children to this element. */
    append(child: any, ...children: any[]): this;
}

/**
 * Base class for class-based components.
 */
export declare class Component {
    $params: any;
    static new(...args: any[]): any;

    /** The component render function returning a JetzElement or UI node. */
    render(): any;

    /** Runs once before the component's render() is invoked. */
    onCreate?(): void;

    /** Runs once after the component's element is attached to the document. */
    onMount?(): void;

    /** Runs on every state change while the component is active in DOM. */
    onUpdate?(): void;

    /** Runs once when the component's element is removed from the document. */
    onDestroy?(): void;

    /** @deprecated Use onMount() instead. */
    onRendered?(): void;
}

/**
 * Lightweight Flux-style action dispatcher for unidirectional data flow.
 * One action fans out to every registered handler (registration order).
 */
export declare class Dispatcher {
    /** Optional reporter: `(error, action, token) => void`. Defaults to `console.error`. */
    onError: ((error: unknown, action: any, token: any) => void) | null;
    constructor(callback?: (action: any, ...args: any[]) => any);
    /** Number of registered handlers. */
    readonly size: number;
    /** Registers a handler; returns an unsubscribe function. */
    subscribe(handler: (action: any, ...args: any[]) => any, token?: any): () => void;
    /** Removes a handler passed to the constructor or `subscribe()`. */
    unsubscribe(handler: (action: any, ...args: any[]) => any): this;
    /** Runs a prerequisite handler to completion before the caller continues. */
    waitFor(tokens: any | any[]): this;
    /** Fans `action` out to every registered handler; returns the first result. */
    dispatch(action: any, ...args: any[]): any;
}

/**
 * Base argument class for dynamic Jetz directives.
 */
export declare class JetzArgument {
    element: any;
    setElement(element: any): void;
    onAssigned(): void;
}

/**
 * Raw HTML wrapper.
 */
export declare class Raw {
    content: string;
    constructor(content: string);
}

// ---------------------------------------------------------------------------
// Core Functional API
// ---------------------------------------------------------------------------

/**
 * Creates a reactive state initialized with `value`.
 *
 * @example
 * const count = stateOf(0);
 * count.value++;
 */
export declare function stateOf<T>(value: T, handler?: StateHandler<T>): Reactive<T>;

/**
 * Creates a reactive state synchronized with `localStorage`. Supplying a key
 * gives the state a stable storage identity independent of creation order.
 *
 * @example
 * const theme = rememberOf('theme', 'light');
 */
export declare function rememberOf<T>(key: string, value: T): Remembered<T>;
export declare function rememberOf<T>(value: T): Remembered<T>;

/**
 * Creates a row-level reactive record (shallow): the object stays a plain
 * POJO with ONE version signal instead of one State per property.
 *
 * @example
 * const row = rowOf({ id: 1, score: 10 });
 * row.score; // tracked read
 */
export declare function shallowStateOf<T extends object>(value: T): T & {
    touch(): void;
    set(patch: Partial<T>): void;
    peek<K extends keyof T>(key: K): T[K];
    toObject(): T;
};

/** Alias tuned for table/grid records: `rowOf({...})` === `shallowStateOf({...})`. */
export declare function rowOf<T extends object>(value: T): T & {
    touch(): void;
    set(patch: Partial<T>): void;
    peek<K extends keyof T>(key: K): T[K];
    toObject(): T;
};

/** Untracked access to a shallow row's plain data (for filter/sort pipelines). */
export declare function rawOf<T>(row: T): T;

/** Manually bump a shallow row's version (row-level refresh). */
export declare function touchRow(row: any): void;

/**
 * Creates a derived reactive state that automatically tracks dependencies.
 *
 * @example
 * const fullName = computed(() => `${first.value} ${last.value}`);
 */
export declare function computed<T>(computeFn: () => T): State<T>;

/**
 * Runs a side-effect function that automatically re-runs when its state dependencies change.
 * Returns a `dispose` function to stop the effect.
 *
 * @example
 * const dispose = effect(() => {
 *   document.title = `Count: ${counter.value}`;
 * });
 */
export declare function effect(effectFn: () => void): () => void;

/** Updates state immediately, then flushes subscribers, computed values, effects, and DOM once. */
export declare function batch<T>(callback: () => T): T;

/**
 * Creates a lazy signal that only evaluates its initializer on first `.value` read.
 * Like SolidJS's `lazy()` — defers expensive computation until actually needed.
 *
 * @example
 * const heavy = lazy(() => expensiveComputation());
 * // heavy.value triggers computation on first read only
 */
export declare function lazy<T>(initializer: () => T): State<T>;

/**
 * Runs `taskFn` after the browser has had a chance to paint pending UI
 * changes, optionally wrapping it in a loading indicator.
 *
 * `options.loadingState` flips to `true` synchronously (the loading UI paints
 * on the next frame), `taskFn` runs one animation frame plus one macrotask
 * later, and the signal returns to `false` on the frame after the task
 * finished. The flag is cleared even when `taskFn` throws.
 *
 * @example
 * const isNavigating = stateOf(false);
 * defer(() => currentPage.value++, { loadingState: isNavigating });
 */
export declare function defer(taskFn: () => void, options?: { loadingState?: State<boolean> }): void;

/**
 * Creates a reactive collection (ListState).
 *
 * @example
 * const items = listOf('Item 1', 'Item 2');
 */
export declare function listOf<T>(...items: T[]): ListState<T>;

/**
 * Creates a sequence collection for items with identity.
 */
export declare function sequenceOf<T>(...items: T[]): ListState<T>;

/**
 * Renders a reactive collection with optional keyed reconciliation.
 *
 * @example
 * loop(users, user => user.id, user => UserCard(user))
 */
export declare function loop<T>(
    list: ListState<T> | T[],
    keyOrRender: ((item: T, index?: number) => any) | ((item: T) => any),
    renderFn?: (item: T, index?: number) => any
): any;

/** Conditional branch: renders element if callback returns true. */
export declare function _if(condition: () => boolean): any;

/** Alternate conditional branch for `_if`. */
export declare function _elseif(condition: () => boolean): any;

/** Fallback branch for `_if` / `_elseif`. */
export declare const _else: any;

/** Alias of `_if`. */
export declare function _show(condition: () => boolean): any;

/**
 * Inline conditional evaluator. Swaps branches in place without wrapper elements.
 */
export declare function ifElse(
    condition: () => any,
    trueBranch: () => any,
    falseBranch?: () => any
): any;

/**
 * Registers an inline reactive listener callback attached to an element.
 */
export declare function listen(callback: (parent: JetzElement) => void): any;

/** Registers an onCreate hook for function components. */
export declare function onCreate(callback: () => void): void;

/** Registers an onMount hook for function components. */
export declare function onMount(callback: () => void): void;

/** Registers an onUpdate hook for function components. */
export declare function onUpdate(callback: () => void): void;

/** Registers an onDestroy hook for function components. */
export declare function onDestroy(callback: () => void): void;

/** @internal Resolves a routed component with the regular component lifecycle. */
export declare function renderComponent(component: any, params?: any): any;

/** Creates a JetzElement. */
export declare function createElement(tag: string, ...args: any[]): JetzElement;

/** Wraps raw HTML string to inject into an element tree. */
export declare function html(rawContent: string): Raw;

/** Injects an external script dynamically. */
export declare function addScript(src: string, options?: { async?: boolean; onload?: () => void }): void;

/** Generates an array of numbers from start to to. */
export declare function range(start: number, to: number): number[];

/** Flattens nested arrays. */
export declare function flatMap(arr: any[]): any[];

/** Creates an array of n items by calling a factory function. */
export declare function createList<T>(count: number, factory: (index: number) => T): T[];

/**
 * Thrown when a `bind` target is not a reactive state. The message names the
 * element, what was received and - inside `loop()` - the item and the template
 * the developer has to fix.
 */
export declare class JetzBindingError extends TypeError {
    name: string;
}

/**
 * Core Jetz Application singleton.
 */
export declare const Jetz: {
    version: string;
    readonly isMounting: boolean;

    /**
     * When true, elements remember the stack that created them so a binding
     * error can point at the offending line. Off by default: it captures a
     * stack per element, which is measurable on large lists.
     */
    devtools: boolean;

    remountByAttr: JetzElement[];
    $route?: Router;
    $session?: JetzSession;

    /** Mounts a JetzElement or Component into a DOM container. */
    mount(app: any, container: HTMLElement | string, options?: { onStart?: () => void; onLoad?: () => void }): void;

    /** Unmounts a container and runs onDestroy lifecycles. */
    unmount(container: HTMLElement | string): void;

    /** Injects a style tag with CSS rules into `<head>`. */
    style(cssString: string): void;

    /** Installs a plugin (e.g. Router, JetzSession). */
    use(plugin: any): void;
    /** Subscribe to opt-in element and component events for development tools. */
    observeDevtools(listener: (event: JetzDevtoolsEvent) => void): () => boolean;

    /** Runs before mounted elements are rendered. */
    onStart(callback?: () => void): void;

    /** Runs after the first page render or after DOMContentLoaded. */
    onLoad(callback?: () => void): void;

    /** Triggers conditional updates and live component lifecycle sweeps. */
    triggerByState(): void;

    /** Registers a callback to run after the page's first render. */
    addRenderedEffect(callback: () => void): void;

    /** Runs callbacks registered during rendering after the initial mount. */
    onFirstRenderPage(): void;

    /** Returns whether an element can register a conditional remount. */
    isAllowToRemount(element: JetzElement): boolean;

    [key: string]: unknown;
};

declare global {
    interface Array<T> {
        last(): T | undefined;
        take(count: number): T[];
    }

    interface NodeListOf<TNode extends Node> {
        last(): TNode | undefined;
    }

    interface Number {
        range(to: number): number[];
    }
}
