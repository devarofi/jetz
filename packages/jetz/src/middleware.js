/**
 * Base class for route middlewares consumed by the Router.
 *
 * Contract: override `next(data, _continue)` and return `true` to allow
 * navigation. Returning anything else blocks the route. Use `deny(reason)`
 * to block while exposing a readable `error` for debugging.
 *
 * Example:
 *   class Auth extends Middleware {
 *       next(data, _continue) {
 *           if (!data?.user) return this.deny('user is not authenticated');
 *           return true;
 *       }
 *   }
 */
export class Middleware {
    /** Reason of the last denial, inspected by the router/consumers. */
    error = null;

    next(data, _continue) {
        return true;
    }

    /**
     * Blocks navigation and records the reason.
     * @param {string} [reason]
     * @returns {false} always `false`, so middleware can `return this.deny(...)`
     */
    deny(reason = 'navigation denied by middleware') {
        this.error = reason;
        return false;
    }
}

/**
 * Attaches middlewares to one or more route definitions (as created by `route()`).
 * Middlewares are appended to any existing ones (deduplicated), so applying
 * this helper multiple times composes instead of overwriting.
 *
 * @param {Middleware|Function|Array} middlewares - a middleware class/instance or an array of them
 * @param  {...object} routes - route objects to attach to
 * @returns {Array} the same route objects, for chaining
 */
export function middleware(middlewares, ...routes) {
    const list = [middlewares].flat(Infinity).filter(m => m != null);
    routes.forEach(route => {
        if (route == null || typeof route !== 'object') {
            console.warn('Jetz middleware: skipped non-object route entry', route);
            return;
        }
        const existing = route.middlewares == null
            ? []
            : Array.isArray(route.middlewares)
                ? route.middlewares.flat(Infinity)
                : [route.middlewares];
        route.middlewares = [...existing, ...list.filter(m => !existing.includes(m))];
    });
    return routes;
}