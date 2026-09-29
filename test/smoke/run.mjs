import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = path.dirname(fileURLToPath(import.meta.url));
// bundle output first, then the test assets (external.js) - served over HTTP so
// localStorage / sessionStorage are available on a real origin
const staticRoots = [path.join(here, 'out'), here];

const contentTypes = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json'
};

const server = http.createServer(async (request, response) => {
	const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
	const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
	try {
		const filePath = staticRoots
			.map(root => ({ root, candidate: path.join(root, relative) }))
			.find(({ root, candidate }) => candidate.startsWith(root) && existsSync(candidate));
		if (!filePath) {
			// SPA fallback: history.pushState() URLs (e.g. /landing) have no file;
			// serve the bundle's index.html so reloads keep working
			if (path.extname(relative) === '') {
				const fallback = path.join(staticRoots[0], 'index.html');
				if (existsSync(fallback)) {
					response.setHeader('Content-Type', 'text/html');
					response.end(await readFile(fallback));
					return;
				}
			}
			throw new Error('not found');
		}
		response.setHeader('Content-Type', contentTypes[path.extname(filePath.candidate)] ?? 'application/octet-stream');
		response.end(await readFile(filePath.candidate));
	} catch (error) {
		response.statusCode = 404;
		response.end(`not found: ${relative}`);
	}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

// puppeteer's bundled Chromium is not always downloaded - fall back to a local browser
const localBrowsers = [
	process.env.CHROME_PATH,
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
	'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

const browser = await puppeteer.launch({
	executablePath: localBrowsers.find(candidate => existsSync(candidate))
});

const page = await browser.newPage();
const pageErrors = [];
// Jetz drops lifecycle hooks registered outside a render pass. The component then
// silently never wires itself up, so it fails the suite instead of only warning.
const lifecycleWarnings = [];
const LIFECYCLE_WARNING = /called outside of a component render/;
page.on('pageerror', error => pageErrors.push(`pageerror: ${error.message}${error.stack ? '\n' + error.stack : ''}`));
page.on('console', message => {
	if (LIFECYCLE_WARNING.test(message.text())) {
		lifecycleWarnings.push(message.text());
		return;
	}
	if (message.type() === 'error') pageErrors.push('console.error: ' + message.text());
});

const waitForSuite = () => page.waitForFunction(() => window.__SMOKE_DONE__ === true, { timeout: 20000 });

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
let suiteError = null;
try {
	await waitForSuite();
} catch (error) {
	suiteError = error.message;
}

// the suite reloads the page once to verify persisted state (rememberOf)
const needsReload = suiteError == null && await page.evaluate(() => window.__SMOKE_RELOAD__ === true);
if (needsReload) {
	await page.reload({ waitUntil: 'load' });
	try {
		await waitForSuite();
	} catch (error) {
		suiteError = error.message;
	}
}

const report = suiteError == null
	? await page.evaluate(() => document.getElementById('results')?.textContent ?? '(no results element found)')
	: `(suite did not finish: ${suiteError})`;
await browser.close();
server.close();

console.log(report);
if (pageErrors.length > 0) {
	console.log('\nPAGE ERRORS:\n' + pageErrors.join('\n'));
}
if (lifecycleWarnings.length > 0) {
	console.log('\nDROPPED LIFECYCLE HOOKS:\n' + lifecycleWarnings.join('\n'));
}
if (suiteError != null) {
	console.log('\nSUITE DID NOT FINISH: ' + suiteError);
}

const lines = report.split('\n');
const passed = lines.filter(line => line.startsWith('PASS ::')).length;
const failed = lines.filter(line => line.startsWith('FAIL ::'));
const ok = failed.length === 0 && suiteError == null && lifecycleWarnings.length === 0 && !report.includes('(no results');

console.log(`\n${passed} passed, ${failed.length} failed${needsReload ? ' (2 page loads: reload phase for rememberOf)' : ''}`);
console.log(ok ? 'ALL PASS' : 'FAILED');
process.exit(ok ? 0 : 1);
