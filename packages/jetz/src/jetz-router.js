import { Component, Jetz, JetzArgument, JetzElement, stateOf } from "./jetz.js";
import { Middleware } from "./middleware.js";

function middlewareList(middlewares) {
	if (middlewares == null) return [];
	return Array.isArray(middlewares) ? middlewares.flat(Infinity) : [middlewares];
}

function joinRoutePath(prefix, path) {
	const segments = [prefix, path]
		.flatMap(value => typeof value === 'string' ? value.replace(/^#+/, '').split('/') : [])
		.filter(Boolean);
	return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

function flattenRoutes(routes, prefix = '', inheritedMiddlewares = []) {
	return routes.flat(Infinity).flatMap(entry => {
		if (entry == null || typeof entry !== 'object') return [];
		const path = joinRoutePath(prefix, entry.path);
		const middlewares = [...inheritedMiddlewares, ...middlewareList(entry.middlewares)];
		if (entry.kind === 'group') {
			return flattenRoutes(entry.routes ?? [], path, middlewares);
		}
		return [{ ...entry, path, middlewares }];
	});
}

export class Router {
	#varname = '$route';
	#stateTarget;
	#routes;
	#navigationObserver;
	#routeHeadNodes = [];
	#lastListenerUrl = null;

	constructor(...route) {
		if ('navigation' in window) {
			this.#navigationObserver = window.navigation;
		}
		this.#routes = flattenRoutes(route);
	}
	#initialNavigateListener() {
		if ('navigation' in window) {
			this.#navigationObserver.addEventListener("navigate", (event) => {
				this.#fallbackNavigateListener(event.destination.url);
			});
		} else {
			window.addEventListener('popstate', (e) => {
				this.#fallbackNavigateListener(window.location.href);
			});
		}
		// Hash routing (`#/...`) works without any opt-in: a fragment shaped
		// like a route always wins over the pathname, so static hosts without
		// server rewrites stay navigable. Plain anchors (`#section`) fall
		// through to the pathname route.
		window.addEventListener('hashchange', () => {
			this.#fallbackNavigateListener(window.location.href);
		});
	}
	/**
	 * Reads a route out of a URL fragment. Only fragments shaped like a
	 * route (`#/product`, `#/`) qualify; anything else (e.g. `#section`)
	 * returns null so in-page anchors never hijack routing.
	 */
	#routeFromHash(hash) {
		if (typeof hash === 'string' && hash.length > 1 && hash[1] === '/')
			return this.#fixRoutename(hash.slice(1));
		return null;
	}
	#fallbackNavigateListener(url) {
		// popstate/navigate and hashchange can both fire for one hash
		// navigation; the second delivery carries the same URL and is skipped.
		if (url === this.#lastListenerUrl) return;
		this.#lastListenerUrl = url;
		const parsed = new URL(url);
		const routeDestination = this.#routeFromHash(parsed.hash)
			?? this.#fixRoutename(parsed.pathname);
		const savedParams = this.#getSavedParams(routeDestination);
		this.#navigate(routeDestination, savedParams);
	}
	#fixRoutename(route) {
		if (typeof route !== 'string') return route;
		route = route.trim();
		if (route[0] === '#')
			route = route.replace(/^#+/, '');
		if (route[0] === '/' && route.length > 1)
			route = route.substring(1);
		// normalize trailing slashes ('about/' -> 'about')
		route = route.replace(/\/+$/, '');
		if (route == '')
			return '/';
		return route;
	}
	#getCurrentUri() {
		// A route-shaped fragment always wins over the pathname, so loading
		// `index.html#/product` (or typing it) boots straight into the route.
		return this.#routeFromHash(window.location.hash)
			?? this.#fixRoutename(window.location.pathname);
	}
	#setDefaultPage() {
		let currentPath = this.#getCurrentUri();
		let getSavedParams = this.#getSavedParams(currentPath);
		let defaultPathComponent = this.#getPath(currentPath, getSavedParams);
		this.#stateTarget = stateOf(defaultPathComponent)
	}
	to(route_name, params) {
		// An explicit hash target (`to('#/product')`) opts that navigation
		// into hash mode, so static hosts without server rewrites stay
		// navigable. Plain targets keep the existing pathname behaviour.
		const hashTarget = typeof route_name === 'string' && route_name.trim()[0] === '#';
		route_name = this.#fixRoutename(route_name);
		this.#saveParams(route_name, params);
		if (hashTarget)
			window.history.pushState('', '', route_name === '/' ? '#/' : `#/${route_name}`);
		else
			window.history.pushState('', '', route_name === '/' ? '/' : `/${route_name}`);
		// scroll to top page
		window.scroll(0, 0);
		this.#fallbackNavigationSupport();
	}
	#fallbackNavigationSupport() {
		if (this.#navigationObserver == null) {
			this.#fallbackNavigateListener(window.location.href);
		}
	}
	back() {
		// popstate / navigation events fire asynchronously and trigger the
		// listener; resolving the url here would navigate to the OLD page
		window.history.back();
	}
	#saveParams(routename, params) {
		if (params != null) {
			try {
				sessionStorage.setItem(routename, JSON.stringify(params));
			} catch (e) { /* storage unavailable or full */ }
		}
	}
	#getSavedParams(routename) {
		let data = sessionStorage.getItem(routename);
		if (data == null) return null;
		sessionStorage.removeItem(routename);
		try {
			return JSON.parse(data);
		} catch (e) {
			return null;
		}
	}
	browser() {
		return this.#stateTarget;
	}
	#getPath(routename, params) {
		const exactRoute = this.#routes.find(route => this.#fixRoutename(route.path) === routename);
		const candidates = exactRoute
			? [exactRoute, ...this.#routes.filter(route => route !== exactRoute)]
			: this.#routes;
		for (let i = 0; i < candidates.length; i++) {
			const route = candidates[i];
			const pathParams = this.#matchPath(route.path, routename);

			if (pathParams !== null) {
				const resolvedParams = Object.keys(pathParams).length > 0
					? { ...(params && typeof params === 'object' ? params : {}), ...pathParams }
					: params;
				let _next = true;
				if (route.middlewares && route.middlewares.length != 0) {
					_next = this.verifyMiddlewares(route.middlewares, resolvedParams);
				}
				if (_next === true) {
					this.#saveParams(routename, resolvedParams);
					this.#applyRouteHead(route, resolvedParams);
					return toElement(route.component, resolvedParams)
				} else {
					return _next;
				}
			}
		}
	}
	#matchPath(routePath, targetPath) {
		const routeSegments = this.#fixRoutename(routePath).split('/').filter(Boolean);
		const targetSegments = this.#fixRoutename(targetPath).split('/').filter(Boolean);
		if (routeSegments.length !== targetSegments.length) return null;

		const params = {};
		for (let index = 0; index < routeSegments.length; index++) {
			const routeSegment = routeSegments[index];
			const targetSegment = targetSegments[index];
			if (routeSegment.startsWith(':') && routeSegment.length > 1) {
				try {
					params[routeSegment.slice(1)] = decodeURIComponent(targetSegment);
				} catch {
					return null;
				}
			} else if (routeSegment !== targetSegment) {
				return null;
			}
		}
		return params;
	}
	#applyRouteHead(route, params) {
		this.#routeHeadNodes.forEach(node => node.remove());
		this.#routeHeadNodes = [];
		if (typeof route.head !== 'function') return;

		const headContent = route.head(params);
		const entries = (Array.isArray(headContent) ? headContent.flat(Infinity) : [headContent])
			.filter(entry => entry instanceof JetzElement || entry instanceof HTMLElement);
		entries.forEach(entry => {
			let node = entry;
			if (entry instanceof JetzElement) {
				entry.render();
				node = entry.getElement();
			}
			document.head.append(node);
			this.#routeHeadNodes.push(node);
		});
	}
	verifyMiddlewares(middlewares, params) {
		let _next = false;
		for (const middleware of middlewares) {
			const isClass = typeof middleware === 'function' && middleware.prototype instanceof Middleware;
			const instance = isClass ? new middleware() : (middleware instanceof Middleware ? middleware : null);
			if (instance == null) continue;
			_next = instance.next(params, function () {
				return true;
			});
			// stop at the first middleware that denies navigation
			if (_next !== true) {
				return false;
			}
		}
		return _next;
	}
	#navigate(routename, params) {
		routename = this.#fixRoutename(routename);
		let targetComponent = this.#getPath(routename, params);
		if (targetComponent) {
			this.#stateTarget.value = targetComponent;
		} else {
			console.warn(`Jetz Router: route "${routename}" not resolved (not found or blocked by middleware)`);
		}
	}
	// REQUIRED
	install(context) {
		context[this.#varname] = this;
		this.#setDefaultPage();
		this.#initialNavigateListener();
	}
}
function toElement(component, params = null) {
	if (component instanceof JetzElement) {
		return component
	} else if (component.prototype instanceof Component) {
		let _component = new component();
		_component.$params = params;
		let element = _component.render();
		// if Component was implement onRender, call onRender
		if (element != null) {
			if (_component.constructor.prototype.hasOwnProperty('onRendered')) {
				element.onRendered(_component.onRendered.bind(_component));
			} else {
			}
		}
		return element;
	} else if (component instanceof Component) {
		component.$params = params;
		const element = component.render();
		if (element != null && component.constructor.prototype.hasOwnProperty('onRendered')) {
			element.onRendered(component.onRendered.bind(component));
		}
		return element;
	} else if (typeof component === 'function') {
		if (params == null)
			return component();
		else
			return component(params);
	}
}


export function route(path, componentOrOptions, middlewares = []) {
	if (componentOrOptions != null && typeof componentOrOptions === 'object' &&
		Object.prototype.hasOwnProperty.call(componentOrOptions, 'component')) {
		return {
			path,
			component: componentOrOptions.component,
			middlewares: componentOrOptions.middlewares ?? [],
			head: componentOrOptions.head
		};
	}
	return {
		path,
		component: componentOrOptions,
		middlewares
	}
}

/** Groups child routes under a path prefix and inherited middleware. */
export function group(path, { middlewares = [], routes = [] } = {}) {
	return { kind: 'group', path, middlewares, routes };
}

export function link(routename, element, params = null) {
	return element.on('click', e => {
		e.preventDefault();
		Jetz.$route.to(routename, params)
	})
}

class Link extends JetzArgument {
	routename;
	params = null;
	constructor(routename, params = null) {
		super();
		this.routename = routename;
		this.params = params;
	}
	onAssigned() {
		if (this.element != null)
			this.element.on('click', e => {
				e.preventDefault();
				Jetz.$route.to(this.routename, this.params);
			});
	}
}

export function asLink(routeName, params = null) {
	return new Link(routeName, params);
}

export let asBackLink = {
	onclick(e) {
		e.preventDefault();
		Jetz.$route.back();
	}
}
export function redirect(url) {
	window.location.href = url;
}
