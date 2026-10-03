import { Jetz as CoreJetz } from './jetz.js';

const INTERNAL_FRAME = /(?:jetz(?:-devtools)?\.js|packages\/jetz\/src\/jetz(?:-devtools)?\.js)/i;

function errorDetails(reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const stack = error.stack || error.message;
    const userStack = stack.split('\n').filter(line => !INTERNAL_FRAME.test(line)).join('\n');
    return { error, message: error.message, stack: userStack || stack };
}

function elementLabel(element) {
    const id = element.attributes?.id;
    const className = element.attributes?.class;
    const classes = typeof className === 'string'
        ? className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
        : '';
    return `<${element.tagName}${id ? `#${id}` : ''}${classes ? `.${classes}` : ''}>`;
}

export class JetzDevtools {
    constructor(options = {}) {
        this.options = {
            captureErrors: options.captureErrors !== false,
            consoleErrors: options.consoleErrors !== false,
            maxErrors: Math.max(1, options.maxErrors ?? 50)
        };
        this.previousDevtools = false;
        this.nodes = new Map();
        this.roots = [];
        this.expanded = new Set();
        this.errors = [];
        this.selected = null;
        this.host = null;
        this.shadow = null;
        this.treeElement = null;
        this.countElement = null;
        this.errorList = null;
        this.unsubscribe = null;
        this.installed = false;
        this.renderPending = false;
        this.previousOutline = new WeakMap();
        this.onWindowError = event => this.recordError(event.error || event.message);
        this.onUnhandledRejection = event => this.recordError(event.reason);
    }

    install(Jetz = CoreJetz) {
        if (this.installed) return this;
        if (typeof window === 'undefined'
            || !new URLSearchParams(window.location.search).has('jetz-devtools')) {
            return this;
        }
        if (!Jetz || typeof Jetz.observeDevtools !== 'function') {
            throw new TypeError('JetzDevtools requires a Jetz runtime with devtools observation support');
        }
        if (typeof document === 'undefined' || !document.body) {
            throw new Error('JetzDevtools must be installed after document.body is available');
        }
        this.installed = true;
        this.Jetz = Jetz;
        this.previousDevtools = Jetz.devtools;
        Jetz.devtools = true;
        this.unsubscribe = Jetz.observeDevtools(event => this.handleEvent(event));
        this.createPanel();
        if (this.options.captureErrors && typeof window !== 'undefined') {
            window.addEventListener('error', this.onWindowError);
            window.addEventListener('unhandledrejection', this.onUnhandledRejection);
        }
        return this;
    }

    uninstall() {
        if (!this.installed) return this;
        this.unsubscribe?.();
        this.unsubscribe = null;
        if (this.Jetz.devtools === true) this.Jetz.devtools = this.previousDevtools;
        if (this.options.captureErrors && typeof window !== 'undefined') {
            window.removeEventListener('error', this.onWindowError);
            window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
        }
        this.restoreHighlight();
        this.host?.remove();
        this.host = null;
        this.shadow = null;
        this.treeElement = null;
        this.countElement = null;
        this.errorList = null;
        this.nodes.clear();
        this.roots = [];
        this.expanded.clear();
        this.selected = null;
        this.installed = false;
        return this;
    }

    handleEvent(event) {
        if (!event || !event.element) return;
        let node = this.nodes.get(event.element);
        if (event.type === 'create') {
            if (!node) {
                node = {
                    element: event.element,
                    children: [],
                    parent: null,
                    componentName: null,
                    key: event.key,
                    index: event.index,
                    lifecycle: null,
                    disposed: false
                };
                this.nodes.set(event.element, node);
            }
        } else if (event.type === 'component') {
            node ??= this.createNode(event.element);
            node.componentName = event.name;
        } else if (event.type === 'attach') {
            node ??= this.createNode(event.element);
            if (event.parent) {
                const parent = this.nodes.get(event.parent) ?? this.createNode(event.parent);
                if (node.parent && node.parent !== parent) {
                    node.parent.children = node.parent.children.filter(child => child !== node);
                } else if (!node.parent) {
                    this.roots = this.roots.filter(root => root !== node);
                }
                node.parent = parent;
                if (!parent.children.includes(node)) parent.children.push(node);
            } else if (!node.parent && !this.roots.includes(node)) {
                this.roots.push(node);
                this.expanded.add(node);
            }
        } else if (event.type === 'render') {
            node ??= this.createNode(event.element);
            node.dom = event.element.o;
        } else if (event.type === 'lifecycle') {
            node ??= this.createNode(event.element);
            node.lifecycle = event.stage;
        } else if (event.type === 'dispose') {
            if (node) this.removeNode(node);
        } else {
            return;
        }
        this.scheduleRender();
    }

    createNode(element) {
        let node = this.nodes.get(element);
        if (!node) {
            node = {
                element,
                children: [],
                parent: null,
                componentName: null,
                key: undefined,
                index: undefined,
                lifecycle: null,
                disposed: false
            };
            this.nodes.set(element, node);
        }
        return node;
    }

    removeNode(node) {
        node.disposed = true;
        const siblingIndex = node.parent?.children.indexOf(node) ?? -1;
        if (siblingIndex >= 0) node.parent.children.splice(siblingIndex, 1);
        this.roots = this.roots.filter(root => root !== node);
        const removeDescendants = current => {
            current.children.forEach(child => removeDescendants(child));
            this.nodes.delete(current.element);
            this.expanded.delete(current);
        };
        removeDescendants(node);
        if (this.selected === node) this.restoreHighlight();
    }

    createPanel() {
        const host = document.createElement('div');
        host.setAttribute('data-jetz-devtools', '');
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
            :host { all: initial; color-scheme: dark; font: 13px/1.45 system-ui, sans-serif; }
            * { box-sizing: border-box; }
            .toggle { position: fixed; z-index: 2147483000; right: 16px; bottom: 16px; border: 1px solid #334155; border-radius: 999px; padding: 9px 14px; color: #e2e8f0; background: #0f172a; box-shadow: 0 4px 18px #0008; cursor: pointer; font: inherit; }
            .panel { position: fixed; z-index: 2147483000; right: 16px; bottom: 62px; width: min(430px, calc(100vw - 32px)); height: min(72vh, 680px); min-height: 260px; display: flex; flex-direction: column; overflow: hidden; color: #e2e8f0; background: #0b1220; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 12px 40px #0009; }
            .panel[hidden] { display: none; }
            header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #263244; }
            h2 { flex: 1; margin: 0; font-size: 14px; }
            button { font: inherit; }
            .toolbar button, .tree button, .error-head button { color: inherit; background: transparent; border: 0; cursor: pointer; }
            .toolbar button { padding: 3px 7px; border-radius: 5px; }
            .toolbar button:hover, .tree button:hover, .error-head button:hover { background: #1e293b; }
            .count { color: #94a3b8; font-size: 11px; }
            .content { min-height: 0; flex: 1; overflow: auto; padding: 8px; }
            .section-title { margin: 5px 4px 7px; color: #94a3b8; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
            .tree { margin: 0 0 12px; }
            .tree-row { display: flex; min-width: 0; align-items: center; gap: 3px; }
            .tree button { min-width: 0; padding: 3px 5px; text-align: left; border-radius: 4px; }
            .tree .twisty { width: 20px; flex: none; text-align: center; color: #94a3b8; }
            .tree .node-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .tree .component { color: #7dd3fc; }
            .tree .meta { flex: none; color: #64748b; font-size: 10px; }
            .empty { padding: 5px; color: #64748b; }
            .errors { border-top: 1px solid #263244; padding-top: 8px; }
            .error { margin: 5px 0; padding: 7px; white-space: pre-wrap; overflow-wrap: anywhere; color: #fecaca; background: #451a1a55; border: 1px solid #7f1d1d; border-radius: 6px; }
            .error strong { display: block; color: #fca5a5; }
            .error pre { margin: 5px 0 0; color: #cbd5e1; font: 10px/1.4 ui-monospace, monospace; white-space: pre-wrap; }
        `;
        const toggle = document.createElement('button');
        toggle.className = 'toggle';
        toggle.type = 'button';
        toggle.textContent = 'Jetz';
        toggle.setAttribute('aria-label', 'Open Jetz DevTools');
        const panel = document.createElement('section');
        panel.className = 'panel';
        panel.hidden = true;
        panel.setAttribute('aria-label', 'Jetz DevTools');
        const header = document.createElement('header');
        const title = document.createElement('h2');
        title.textContent = 'Jetz DevTools';
        const count = document.createElement('span');
        count.className = 'count';
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        const clearErrors = document.createElement('button');
        clearErrors.type = 'button';
        clearErrors.textContent = 'Clear errors';
        clearErrors.addEventListener('click', () => {
            this.errors = [];
            this.renderErrors();
        });
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'Close';
        close.addEventListener('click', () => { panel.hidden = true; });
        toolbar.append(clearErrors, close);
        header.append(title, count, toolbar);
        const content = document.createElement('div');
        content.className = 'content';
        const treeTitle = document.createElement('div');
        treeTitle.className = 'section-title';
        treeTitle.textContent = 'Component tree';
        const tree = document.createElement('div');
        tree.className = 'tree';
        const errorSection = document.createElement('div');
        errorSection.className = 'errors';
        const errorTitle = document.createElement('div');
        errorTitle.className = 'section-title';
        errorTitle.textContent = 'Errors';
        const errorList = document.createElement('div');
        errorSection.append(errorTitle, errorList);
        content.append(treeTitle, tree, errorSection);
        panel.append(header, content);
        shadow.append(style, toggle, panel);
        toggle.addEventListener('click', () => {
            panel.hidden = !panel.hidden;
            toggle.setAttribute('aria-label', panel.hidden ? 'Open Jetz DevTools' : 'Close Jetz DevTools');
            if (!panel.hidden) this.renderTree();
        });
        document.body.append(host);
        this.host = host;
        this.shadow = shadow;
        this.treeElement = tree;
        this.countElement = count;
        this.errorList = errorList;
        this.renderErrors();
    }

    scheduleRender() {
        if (this.renderPending) return;
        this.renderPending = true;
        const schedule = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : callback => setTimeout(callback, 0);
        schedule(() => {
            this.renderPending = false;
            if (this.host?.isConnected) {
                this.countElement.textContent = `${this.nodes.size} elements`;
                if (!this.shadow.querySelector('.panel').hidden) this.renderTree();
            }
        });
    }

    renderTree() {
        const fragment = document.createDocumentFragment();
        if (this.roots.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = 'No Jetz elements observed yet.';
            fragment.append(empty);
        } else {
            this.roots.forEach(node => fragment.append(this.renderNode(node, 0)));
        }
        this.treeElement.replaceChildren(fragment);
        this.countElement.textContent = `${this.nodes.size} elements`;
    }

    renderNode(node, depth) {
        const wrapper = document.createElement('div');
        const row = document.createElement('div');
        row.className = 'tree-row';
        row.style.paddingLeft = `${depth * 12}px`;
        const hasChildren = node.children.some(child => !child.disposed);
        const twisty = document.createElement('button');
        twisty.type = 'button';
        twisty.className = 'twisty';
        twisty.textContent = hasChildren ? (this.expanded.has(node) ? '▾' : '▸') : '·';
        twisty.setAttribute('aria-label', this.expanded.has(node) ? 'Collapse element' : 'Expand element');
        twisty.addEventListener('click', () => {
            if (this.expanded.has(node)) this.expanded.delete(node);
            else this.expanded.add(node);
            this.renderTree();
        });
        const label = document.createElement('button');
        label.type = 'button';
        label.className = `node-label${node.componentName ? ' component' : ''}`;
        label.textContent = node.componentName
            ? `${node.componentName} ${elementLabel(node.element)}`
            : elementLabel(node.element);
        label.title = label.textContent;
        label.addEventListener('click', () => this.highlight(node));
        row.append(twisty, label);
        if (node.key !== undefined) {
            const meta = document.createElement('span');
            meta.className = 'meta';
            meta.textContent = `key ${String(node.key)}`;
            row.append(meta);
        }
        if (node.lifecycle) {
            const meta = document.createElement('span');
            meta.className = 'meta';
            meta.textContent = node.lifecycle;
            row.append(meta);
        }
        wrapper.append(row);
        if (this.expanded.has(node)) {
            node.children.filter(child => !child.disposed)
                .forEach(child => wrapper.append(this.renderNode(child, depth + 1)));
        }
        return wrapper;
    }

    highlight(node) {
        this.restoreHighlight();
        const element = node.dom || node.element.o;
        if (!element?.isConnected) return;
        this.previousOutline.set(element, {
            outline: element.style.outline,
            outlineOffset: element.style.outlineOffset
        });
        element.style.outline = '2px solid #38bdf8';
        element.style.outlineOffset = '2px';
        this.selected = node;
    }

    restoreHighlight() {
        if (!this.selected) return;
        const element = this.selected.dom || this.selected.element.o;
        const previous = element && this.previousOutline.get(element);
        if (element && previous) {
            element.style.outline = previous.outline;
            element.style.outlineOffset = previous.outlineOffset;
            this.previousOutline.delete(element);
        }
        this.selected = null;
    }

    recordError(reason) {
        const details = errorDetails(reason);
        this.errors.unshift(details);
        this.errors.length = Math.min(this.errors.length, this.options.maxErrors);
        if (this.options.consoleErrors) {
            console.error(`[Jetz DevTools] ${details.message}\n${details.stack}`, details.error);
        }
        this.renderErrors();
    }

    renderErrors() {
        if (!this.errorList) return;
        const fragment = document.createDocumentFragment();
        if (this.errors.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = 'No errors captured.';
            fragment.append(empty);
        } else {
            this.errors.forEach(({ message, stack }) => {
                const entry = document.createElement('div');
                entry.className = 'error';
                const title = document.createElement('strong');
                title.textContent = message;
                const trace = document.createElement('pre');
                trace.textContent = stack;
                entry.append(title, trace);
                fragment.append(entry);
            });
        }
        this.errorList.replaceChildren(fragment);
    }
}

export default JetzDevtools;
