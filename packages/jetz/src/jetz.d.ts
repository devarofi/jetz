import type { Router } from './jetz-router.js';
import type { JetzSession } from './jetz-session.js';

/**
 * Core reactive State container.
 * Calling `stateOf(value)` returns an instance of `State<T>`.
 */
export declare class State<T = any> {
    constructor(value: T, handler?: any);

    /** The reactive value. Reading tracks dependencies in `computed` and `effect`; writing notifies subscribers. */
    value: T;

    /** Read current value directly without invoking getter traps. */
    getValue(): T;

    /** Update the state value and trigger fine-grained DOM and subscriber updates. */
    setState(newValue: T): void;

    /** Subscribe to state changes: `listener(newValue, oldValue)`. */
    subscribe(listener: (newValue: T, oldValue: T) => void): this;

    /** Unsubscribe a previously registered listener. */
    unsubscribe(listener: (newValue: T, oldValue: T) => void): this;

    /** Internal: attach a DOM container (Text, Attr, Element, StyleState). */
    addContainer(container: any): void;

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
    asRemember?(): this;
}

/**
 * Reactive list collection supporting fine-grained and keyed reconciliation.
 */
export declare class ListState<T = any> extends Array<T> {
    values: T[];

    /** Number of items currently in the list. */
    readonly size: number;

    /** Appends items to the end of the collection and updates DOM. */
    push(...items: T[]): number;

    /** Replaces all items with a new array. */
    set(items: T[]): this;

    /** Retrieve an item by index. */
    get(index: number | string): any;

    /** Transforms items and updates views (chainable). */
    map<U>(callback: (item: T, index: number) => U): this;

    /** Inserts one or more items at the given index. */
    insertAt(index: number, ...items: T[]): this;

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

    /** Persists this list to localStorage under rememberOf storage driver. */
    asRemember(key?: string): this;
}

/**
 * Represents a lightweight virtual wrapper around an HTMLElement.
 */
export declare class JetzElement {
    /** The underlying real DOM HTMLElement once rendered. */
    o: HTMLElement;

    tagName: string;
    attributes: Record<string, any>;
    children: any[];
    parent: JetzElement | null;

    constructor(tag: string, attributes?: Record<string, any>, ...children: any[]);

    /** Renders the element and its children into the given DOM parent. */
    render(parent?: any, renderPosition?: number): void;

    /** Returns the rendered HTMLElement. */
    getElement(): HTMLElement;

    /** Hook invoked immediately after the element is rendered and mounted. */
    onRendered(callback?: (() => void) | null): this;

    /** Hook invoked right before the element is rendered. */
    onStart(callback?: () => void): this;

    /** Reads an attribute value. */
    attr(name: string): string | null;

    /** Adds or updates an attribute. */
    addAttr(name: string, value: any): this;

    /** Removes an attribute. */
    removeAttr(name: string): this;

    /** Reads a `data-*` attribute. */
    data(key: string): any;

    /** Applies inline CSS styles. */
    setStyle(styles: Record<string, any>): this;

    /** Reads an inline style value. */
    getStyle(prop: string): string;

    /** Adds one or more CSS class names. */
    addClass(...names: string[]): this;

    /** Removes one or more CSS class names. */
    removeClass(...names: string[]): this;

    /** Toggles a CSS class name. */
    toggleClass(name: string): this;

    /** Replaces a CSS class matching a string or regex. */
    replaceClass(target: string | RegExp, replacement: string): this;

    /** Gets or sets the inner text of the element. */
    text(content?: string): string | this;

    /** Gets or sets the input element's value. */
    value(val?: any): any;

    /** Clears all child nodes. */
    empty(): this;

    /** Removes this element from the DOM. */
    remove(): this;

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

    /** Gets or sets the element id. */
    id(val?: string): string | this;

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
 * Lightweight action dispatcher for unidirectional data flow.
 */
export declare class Dispatcher {
    constructor(callback?: (action: string, ...args: any[]) => any);
    dispatch(action: string, ...args: any[]): any;
}

/**
 * Base argument class for dynamic Jetz directives.
 */
export declare class JetzArgument {
    element: any;
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
export declare function stateOf<T>(value: T): State<T>;

/**
 * Creates a reactive state synchronized with `localStorage`. Supplying a key
 * gives the state a stable storage identity independent of creation order.
 *
 * @example
 * const theme = rememberOf('theme', 'light');
 */
export declare function rememberOf<T>(key: string, value: T[]): ListState<T>;
export declare function rememberOf<T>(key: string, value: T): RememberState<T>;
export declare function rememberOf<T>(value: T): T extends any[] ? ListState<T[number]> : RememberState<T>;

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
 * Core Jetz Application singleton.
 */
export declare const Jetz: {
    version: string;
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

    [key: string]: unknown;
};
