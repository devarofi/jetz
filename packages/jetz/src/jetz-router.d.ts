import { JetzElement, State } from './jetz.js';
import { Middleware } from './middleware.js';

export interface RouteDefinition {
    path: string;
    component: any;
    middlewares?: (typeof Middleware | Middleware | any)[];
    head?: (params?: Record<string, any> | null) => RouteHeadContent;
}

export type RouteHeadEntry = JetzElement | HTMLElement;
export type RouteHeadContent = RouteHeadEntry | RouteHeadEntry[];

export interface RouteOptions {
    component: any;
    middlewares?: (typeof Middleware | Middleware | any)[];
    head?: (params?: Record<string, any> | null) => RouteHeadContent;
}

/**
 * Client-side SPA Router for Jetz.
 * Handles path resolution, parameters, browser history, and route guards.
 */
export declare class Router {
    constructor(...routes: (RouteDefinition | RouteDefinition[])[]);

    /** Navigate to a named route with optional parameters. */
    to(routeName: string, params?: Record<string, any> | null): void;

    /** Navigate back one step in browser history. */
    back(): void;

    /** Returns the reactive State containing the active routed component element. */
    browser(): State<any>;

    /** Verifies that all registered middlewares pass for navigation. */
    verifyMiddlewares(middlewares: any[], params?: any): boolean;

    /** Installs the router as a plugin into Jetz, exposing Jetz.$route. */
    install(context: Record<string, any>): void;
}

/**
 * Defines a route mapping a URL path to a view component.
 *
 * @param path - URL route path (e.g. '/' or 'settings')
 * @param component - Component class, function, or JetzElement
 * @param middlewares - Array of Middleware classes/instances
 */
export declare function route(path: string, options: RouteOptions): RouteDefinition;
export declare function route(
    path: string,
    component: any,
    middlewares?: (typeof Middleware | Middleware | any)[]
): RouteDefinition;

/**
 * Attaches router navigation to an existing JetzElement on click.
 *
 * @param routename - Target route path
 * @param element - JetzElement to attach click navigation
 * @param params - Optional parameter payload
 */
export declare function link(
    routename: string,
    element: JetzElement,
    params?: Record<string, any> | null
): JetzElement;

/**
 * Creates an event modifier for buttons or links that navigates on click.
 *
 * @param routeName - Target route path
 * @param params - Optional parameter payload
 */
export declare function asLink(
    routeName: string,
    params?: Record<string, any> | null
): any;

/**
 * Event handler object that triggers `history.back()` on click.
 */
export declare const asBackLink: {
    onclick(e: MouseEvent): void;
};

/**
 * Performs a hard browser redirection to the specified URL.
 */
export declare function redirect(url: string): void;
