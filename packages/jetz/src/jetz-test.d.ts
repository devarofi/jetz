import { JetzElement } from './jetz.js';

/**
 * Testing utility for mounting and asserting Jetz elements.
 */
export declare class JTest {
    component: JetzElement;
    currentElement: HTMLElement;

    static new(components: any): JTest;
    constructor(component: any);

    find(selector: string): this;
    click(): this;
    text(): string;
    html(): string;
    element(): JetzElement;
}

export default JTest;
export { JTest };
