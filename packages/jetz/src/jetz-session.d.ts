/**
 * Session-scoped key/value store backed by browser `sessionStorage`.
 * Install it with `Jetz.use(session)` to expose it as `Jetz.$session`,
 * or create a standalone proxy with `sessionOf(data)`.
 */
export declare class JetzSession {
    session_id: string;
    dataProxy: JetzSession & Record<string, unknown>;
    savedData: Record<string, unknown> | null;

    constructor(data?: Record<string, any>);

    /** Read a key from session storage, falling back to a default value. */
    get<T = unknown>(key: string, def?: T): T;

    /** Check if a key exists in session storage. */
    has(key: string): boolean;

    /** Set a value and immediately persist it to sessionStorage. */
    set(key: string, value: unknown): boolean;

    /** Initialize session data with a default payload if nothing is stored. */
    setInitialData(data: Record<string, unknown>): void;

    /** Clear storage and reset session data. */
    destroy(): void;

    /** Save current data dictionary to sessionStorage. */
    save(): void;

    /** Installs the session plugin into Jetz context. */
    install(context: Record<string, any>): void;

    [key: string]: unknown;
}

/**
 * Creates a standalone reactive session storage proxy object.
 * Any property assignment on the returned proxy automatically syncs to sessionStorage.
 *
 * @param data - Initial data object
 */
export declare function sessionOf<T extends Record<string, unknown> = Record<string, unknown>>(data?: T): JetzSession & T;
