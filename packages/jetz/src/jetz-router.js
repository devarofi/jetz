import { Component, Jetz, JetzArgument, JetzElement, stateOf } from "./jetz.js";
import { Middleware } from "./middleware.js";

export class Router {
	#varname = '$route';
	#stateTarget;
	#routes;
	#navigationObserver;

	constructor(...route) {
		if ('navigation' in window) {
			this.#navigationObserver = window.navigation;
		}
		// rest param is always an array; flatten nested route arrays too
		this.#routes = route.flat(Infinity);
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
	}
	#fallbackNavigateListener(url) {
		const { pathname } = new URL(url);
		const pathDestination = pathname;
		const routeDestination = this.#fixRoutename(pathDestination);
		const savedParams = this.#getSavedParams(routeDestination);
		this.#navigate(routeDestination, savedParams);
	}
	#fixRoutename(route) {
		if (typeof route !== 'string') return route;
		if (route[0] === '/' && route.length > 1)
			route = route.substring(1);
		// normalize trailing slashes ('about/' -> 'about')
		route = route.replace(/\/+$/, '');
		if (route == '')
			return '/';
		return route;
	}
	#getCurrentUri() {
		return this.#fixRoutename(window.location.pathname);
	}
	#setDefaultPage() {
		let currentPath = this.#getCurrentUri();
		let getSavedParams = this.#getSavedParams(currentPath);
		let defaultPathComponent = this.#getPath(currentPath, getSavedParams);
		this.#stateTarget = stateOf(defaultPathComponent)
	}
	to(route_name, params) {
		route_name = this.#fixRoutename(route_name);
		this.#saveParams(route_name, params);
		window.history.pushState('', '', route_name);
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
		for (let i = 0; i < this.#routes.length; i++) {
			const route = this.#routes[i];

			if (route.path === routename) {
				let _next = true;
				if (route.middlewares && route.middlewares.length != 0) {
					_next = this.verifyMiddlewares(route.middlewares, params);
				}
				if (_next === true) {
					this.#saveParams(routename, params);
					return toElement(route.component, params)
				} else {
					return _next;
				}
			}
		}
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

export function route(path, component, middlewares = []) {
	return {
		path: path,
		component: component,
		middlewares
	}
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
