import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Jetz, onMount } from '../src/lib/jetz.js';
import { JetzDevtools } from '../src/lib/jetz-devtools.js';
import { button, div, span } from '../src/lib/jetz-ui.js';

let devtools;
let originalUrl;

function setDevtoolsUrl(enabled) {
    const url = new URL(window.location.href);
    if (enabled) url.searchParams.set('jetz-devtools', '');
    else url.searchParams.delete('jetz-devtools');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

beforeEach(() => {
    originalUrl = window.location.href;
    document.body.innerHTML = '';
    Jetz.devtools = false;
    setDevtoolsUrl(true);
});

afterEach(() => {
    devtools?.uninstall();
    devtools = null;
    Jetz.devtools = false;
    const url = new URL(originalUrl);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    vi.restoreAllMocks();
});

describe('JetzDevtools', () => {
    it('does not activate unless the URL has the opt-in parameter', () => {
        setDevtoolsUrl(false);
        devtools = new JetzDevtools();
        Jetz.use(devtools);

        expect(devtools.installed).toBe(false);
        expect(document.querySelector('[data-jetz-devtools]')).toBeNull();
        expect(Jetz.devtools).toBe(false);
    });

    it('installs as a plugin and shows a component and element tree', async () => {
        function SampleCard() {
            return div({ id: 'devtools-target' }, span('sample'));
        }
        devtools = new JetzDevtools({ captureErrors: false, consoleErrors: false });
        Jetz.use(devtools);
        Jetz.mount(div(SampleCard), document.body);

        await new Promise(resolve => setTimeout(resolve, 30));
        const shadow = document.querySelector('[data-jetz-devtools]').shadowRoot;
        shadow.querySelector('.toggle').click();

        expect(shadow.querySelector('.tree').textContent).toContain('SampleCard');
        const target = shadow.querySelectorAll('.node-label');
        const targetLabel = [...target].find(node => node.textContent.includes('#devtools-target'));
        expect(targetLabel).toBeTruthy();
        targetLabel.click();
        expect(document.querySelector('#devtools-target').style.outline).toContain('#38bdf8');
    });

    it('captures component lifecycle and releases disposed tree nodes', async () => {
        const lifecycle = [];
        function MountedSample() {
            onMount(() => lifecycle.push('mount'));
            return div('mounted');
        }
        devtools = new JetzDevtools({ captureErrors: false, consoleErrors: false });
        Jetz.use(devtools);
        const target = document.createElement('div');
        document.body.append(target);
        Jetz.mount(div(MountedSample), target);
        expect(lifecycle).toEqual(['mount']);
        expect(devtools.nodes.size).toBeGreaterThan(1);

        Jetz.unmount(target);
        expect(devtools.nodes.size).toBe(0);
    });

    it('captures errors with application frames and can uninstall cleanly', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        devtools = new JetzDevtools({ captureErrors: false, consoleErrors: false });
        Jetz.use(devtools);
        const error = new Error('sample failure');
        error.stack = 'Error: sample failure\n    at handler (app.js:12:3)\n    at update (jetz.js:80:1)';
        devtools.recordError(error);

        expect(devtools.errorList.textContent).toContain('sample failure');
        expect(devtools.errorList.textContent).toContain('app.js:12:3');
        expect(devtools.errorList.textContent).not.toContain('jetz.js:80:1');
        expect(consoleError).not.toHaveBeenCalled();

        devtools.uninstall();
        expect(document.querySelector('[data-jetz-devtools]')).toBeNull();
        expect(Jetz.devtools).toBe(false);
    });

    it('keeps its panel isolated and interactive controls usable', () => {
        devtools = new JetzDevtools({ captureErrors: false });
        Jetz.use(devtools);
        const action = vi.fn();
        Jetz.mount(div(button({ id: 'app-action', onclick: action }, 'Run')), document.body);

        document.querySelector('#app-action').click();

        expect(action).toHaveBeenCalledOnce();
        expect(document.querySelector('[data-jetz-devtools]').shadowRoot.querySelector('.panel').hidden).toBe(true);
    });
});
