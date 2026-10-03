export interface JetzDevtoolsOptions {
    /** Capture uncaught window errors and unhandled promise rejections. Defaults to true. */
    captureErrors?: boolean;
    /** Log captured errors to the console without suppressing browser reporting. Defaults to true. */
    consoleErrors?: boolean;
    /** Maximum number of captured errors retained in the panel. Defaults to 50. */
    maxErrors?: number;
}

/** Opt-in, Shadow DOM based component-tree and error inspector. */
export declare class JetzDevtools {
    constructor(options?: JetzDevtoolsOptions);
    install(Jetz?: unknown): this;
    uninstall(): this;
}

export default JetzDevtools;
