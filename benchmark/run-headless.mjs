/**
 * Headless runner for the benchmark page.
 *
 * The page measures itself in the browser; this only launches a headless
 * Chromium, tells it to start the suite (`?autorun=1`), waits for the page to
 * publish its result global, and prints it. Useful when no browser window is
 * available, and reproducible for CI.
 *
 *   node run-headless.mjs [--samples=6] [--out=results.json] [--url=http://127.0.0.1:8091/]
 *                         [--page=index.html] [--flag=__JETZ_BENCH__]
 *
 * `npm run dev` must be serving the page (the runner does not build).
 */
import { spawn } from 'node:child_process';
import { accessSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Paths resolve against this folder, not the shell's cwd.
const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2).reduce((args, item) => {
    const [key, value] = item.replace(/^--/, '').split('=');
    if (value !== undefined) args[key] = value;
    return args;
}, {});

const url = argv.url ?? 'http://127.0.0.1:8091/';
const samples = argv.samples ?? '6';
const page = argv.page ?? 'index.html';
const flag = argv.flag ?? '__JETZ_BENCH__';
const outFile = argv.out ?? join(here, 'dist', flag === '__JETZ_BENCH__' ? 'results.json' : 'reorder.json');
const debugPort = argv.port ?? '9333';
const timeoutMs = Number(argv.timeout ?? 20 * 60 * 1000);

const candidates = [
    argv.browser,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

const binary = candidates.find(path => { try { accessSync(path); return true; } catch { return false; } });
if (!binary) {
    console.error(`No Chromium browser found. Tried:\n${candidates.join('\n')}\nPass --browser="C:\\path\\chrome.exe"`);
    process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'jetz-bench-'));
const chrome = spawn(binary, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    // without this, performance.memory reports bucketed values
    '--enable-precise-memory-info',
    `${url}${page}?autorun=1&samples=${samples}`
], { stdio: 'ignore' });

chrome.on('error', error => { console.error(`browser failed to start: ${error.message}`); process.exit(1); });

const waitForTarget = async () => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        try {
            const list = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r => r.json());
            const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
            if (page) return page;
        } catch { /* the port is not listening yet */ }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw new Error('headless browser did not expose a DevTools target');
};

/** Minimal Chrome DevTools Protocol client over the global WebSocket. */
const connect = async target => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = () => reject(new Error('DevTools socket failed'));
    });
    let nextId = 1;
    const pending = new Map();
    socket.onmessage = event => {
        const message = JSON.parse(event.data);
        const wait = pending.get(message.id);
        if (wait) {
            pending.delete(message.id);
            message.error ? wait.reject(new Error(message.error.message)) : wait.resolve(message.result);
        }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
    return {
        async evaluate(expression) {
            const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
            return response.result.value;
        },
        close: () => socket.close()
    };
};

const statusOf = '(() => document.querySelector(".status")?.textContent ?? "")()';
const finished = `(() => Boolean(window.${flag}))()`;
const dump = `JSON.stringify(window.${flag} || null)`;
const standingsView = '(() => { const t = document.querySelector(".standings"); return t ? t.innerText : null; })()';
const layoutView = '(() => { const c = document.querySelector(".standings tbody td:nth-child(2)"); return c ? getComputedStyle(c).textAlign : null; })()';

let browser = null;
try {
    const target = await waitForTarget();
    browser = await connect(target);

    const deadline = Date.now() + timeoutMs;
    let lastStatus = '';
    while (Date.now() < deadline) {
        const done = await browser.evaluate(finished);
        const status = await browser.evaluate(statusOf);
        if (status !== lastStatus) { lastStatus = status; console.log(status); }
        if (done) break;
        if (/^Failed:/.test(status)) throw new Error(status);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const raw = await browser.evaluate(dump);
    if (!raw) throw new Error(`run did not finish within ${timeoutMs / 1000}s`);
    const results = JSON.parse(raw);
    writeFileSync(outFile, JSON.stringify(results, null, 2));

    if (results.meta) {
        const standings = await browser.evaluate(standingsView);
        const align = await browser.evaluate(layoutView);
        const ids = results.meta.map(arm => arm.id);
        const header = ['operation', ...results.meta.map(arm => arm.label)];
        const rows = Object.entries(results.ops).map(([id, op]) => [
            op.label,
            ...ids.map(id2 => {
                const r = op[id2];
                if (!r) return '—';
                const base = op[ids[0]]?.dom || 0;
                const ratio = id2 !== ids[0] && base ? ` (${(r.dom / base).toFixed(2)}x)` : '';
                return `${r.dom.toFixed(2)} ms${ratio}${r.passed ? '' : ' FAIL'}`;
            })
        ]);
        printTable(header, rows);
        console.log(`\nRanking (framework column ${align ?? 'n/a'}):\n${standings ?? 'not rendered'}`);
    } else {
        // a reconciler probe: one row per scenario, columns taken from the row keys
        const header = Object.keys(results.rows[0] ?? {});
        printTable(header, results.rows.map(row => header.map(key => formatCell(row[key]))));
    }
    console.log(`\nFull results written to ${outFile}`);
} catch (error) {
    console.error(`\nrun failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    browser?.close();
    chrome.kill();
}

/** A cell is a number, a boolean flag, or already a string. */
function formatCell(value) {
    if (typeof value === 'boolean') return value ? 'ok' : 'BAD';
    return String(value ?? '—');
}

function printTable(header, rows) {
    const widths = header.map((_, column) => Math.max(
        (header[column] ?? '').length,
        ...rows.map(row => (row[column] ?? '').length)
    ));
    const line = cells => cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ');
    console.log(`\n${line(header)}\n${line(widths.map(w => '-'.repeat(w)))}`);
    for (const row of rows) console.log(line(row));
}
