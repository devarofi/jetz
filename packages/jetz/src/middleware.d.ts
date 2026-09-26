/**
 * Base class for route navigation middlewares in Jetz.
 * Override `next(data, _continue)` and return `true` to allow navigation,
 * or call `this.deny(reason)` to block it.
 */
export declare class Middleware {
    /** Reason for the last navigation denial, inspected by the router or consumers. */
    error: string | null;

    /**
     * Called during navigation.
     * @param data - Route parameters or payload
     * @param _continue - Fallback continue callback
     * @returns `true` to proceed, or `false` to block navigation
     */
    next(data: any, _continue: () => boolean): boolean;

    /**
     * Blocks navigation and records the reason.
     * @param reason - Descriptive failure message
     * @returns always `false`
     */
    deny(reason?: string): false;
}

/**
 * Attaches one or more middlewares to route definitions.
 *
 * @param middlewares - Middleware class, instance, or array of middlewares
 * @param routes - Route definition objects created by `route()`
 * @returns Array of enhanced route definition objects
 */
export declare function middleware(
    middlewares: typeof Middleware | Middleware | (typeof Middleware | Middleware)[],
    ...routes: any[]
): any[];
