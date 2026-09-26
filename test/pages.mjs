import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer';

// ---------------------------------------------------------------------------
// Page test for the *built* app (dist/).
//
// The suite in test/smoke/ renders components into a bare sandbox page, so it
// cannot catch conflicts with the app shell (public/css/style.css + index.html).
// This script loads the real pages and asserts the shell rules still apply to
// the legacy demo pages while the landing page keeps its own template styling.
// Run with: pnpm test:pages  (builds dist first)
// ---------------------------------------------------------------------------

const dist = path.join(process.cwd(), 'dist');
if (!existsSync(path.join(dist, 'index.html'))) {
	console.error('test:pages needs a build first: run "pnpm build"');
	process.exit(1);
}

const results = [];
const assert = (name, actual, expected) => {
	const pass = actual === expected;
	results.push(`${pass ? 'PASS' : 'FAIL'} :: ${name} | actual: ${JSON.stringify(actual)} | expected: ${JSON.stringify(expected)}`);
};
const assertTrue = (name, actual) => assert(name, !!actual, true);
const section = name => results.push(`# ${name}`);

const server = http.createServer(async (req, res) => {
	try {
		const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
		const rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
		let file = path.join(dist, rel);
		// the router owns the paths: unknown extension-less paths serve index.html
		if (!existsSync(file) && !path.extname(rel)) file = path.join(dist, 'index.html');
		if (!existsSync(file)) { res.statusCode = 404; res.end('not found'); return; }
		const ext = path.extname(file);
		res.setHeader('Content-Type', ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : 'application/octet-stream');
		res.end(await readFile(file));
	} catch (error) {
		res.statusCode = 500;
		res.end('error: ' + error.message);
	}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await puppeteer.launch({
	executablePath: [
		process.env.CHROME_PATH,
		'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
		'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
	].filter(Boolean).find(candidate => existsSync(candidate))
});
const pageErrors = [];
const page = await browser.newPage();
page.on('pageerror', error => pageErrors.push(`pageerror: ${error.message}`));
page.on('console', message => {
	// the demo pages request /favicon.ico, which the static server does not serve
	if (message.type() === 'error' && !/favicon/.test(message.text())) pageErrors.push('console.error: ' + message.text());
});

await page.setViewport({ width: 1280, height: 900 });

const probe = () => page.evaluate(() => {
	const boxOf = selector => {
		const el = document.querySelector(selector);
		if (!el) return null;
		const rect = el.getBoundingClientRect();
		return { top: Math.round(rect.top), height: Math.round(rect.height) };
	};
	const styleOf = (selector, property) => {
		const el = document.querySelector(selector);
		return el ? getComputedStyle(el)[property] : 'MISSING';
	};
	return {
		appDisplay: styleOf('#app', 'display'),
		bodyFont: styleOf('body', 'fontFamily'),
		h1Font: styleOf('h1', 'fontFamily'),
		h1Text: document.querySelector('h1')?.textContent ?? 'NO H1',
		hero: boxOf('#landing-page > header'),
		productCards: document.querySelectorAll('#product-grid > div').length,
		landingFooterPosition: styleOf('#landing-page > footer', 'position'),
		demoFooterHidden: styleOf('#app > main > footer', 'display') === 'none',
	};
});

const open = async pathname => {
	await page.goto(`http://127.0.0.1:${port}${pathname}`, { waitUntil: 'load', timeout: 20000 });
	await new Promise(resolve => setTimeout(resolve, 600)); // let the router mount
	return probe();
};

// --- the landing page keeps the template styling ---------------------------
section('/landing: full-page template layout');
const landing = await open('/landing');
assertTrue('/landing renders the landing page', landing.h1Text !== 'NO H1');
assertTrue('/landing hero heading matches the template', landing.h1Text.includes('premium digital assets'));
assert('/landing shell is not the centered flex container', landing.appDisplay, 'block');
assertTrue('/landing hero starts at the top of the document', landing.hero != null && landing.hero.top === 0);
assertTrue('/landing hero is tall enough to be visible', landing.hero != null && landing.hero.height > 400);
assert('/landing uses the Inter font', landing.h1Font, 'Inter, sans-serif');
assert('/landing renders all 6 product cards', landing.productCards, 6);
assert('/landing footer flows with the page', landing.landingFooterPosition, 'static');
assertTrue('/landing hides the demo shell footer', landing.demoFooterHidden);

// --- the legacy demo pages keep the shell styling --------------------------
section('/: centered demo shell');
const home = await open('/');
assert('/ home shell is the centered flex container', home.appDisplay, 'flex');
assert('/ home keeps the shell font', home.bodyFont, '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif');
assertTrue('/ home renders its heading', home.h1Text !== 'NO H1');

section('/counter: centered demo shell');
const counter = await open('/counter');
assert('/counter shell is the centered flex container', counter.appDisplay, 'flex');
assert('/counter keeps the shell font', counter.bodyFont, '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif');

// --- the calculator page keeps full-page layout and evaluates calculations --
section('/calculator: full-page calculator layout & interactivity');
const calcProbe = await open('/calculator');
assert('/calculator shell is not the centered flex container', calcProbe.appDisplay, 'block');
assertTrue('/calculator renders the calculator heading', calcProbe.h1Text.includes('Calculator'));
assertTrue('/calculator hides the demo shell footer', calcProbe.demoFooterHidden);

// test calculator button clicks & operations
const calcInitialDisplay = await page.$eval('#calc-display', el => el.textContent);
assert('/calculator initial display is 0', calcInitialDisplay, '0');

// Click 7 + 8 =
await page.click('#btn-7');
await page.click('#btn-add');
await page.click('#btn-8');
await page.click('#btn-eq');
const calcAddResult = await page.$eval('#calc-display', el => el.textContent);
assert('/calculator evaluates 7 + 8 = 15', calcAddResult, '15');
// Click 6 × 7 = (multiplication test)
await page.click('#btn-6');
await page.click('#btn-mul');
await page.click('#btn-7');
await page.click('#btn-eq');
const calcMulResult = await page.$eval('#calc-display', el => el.textContent);
assert('/calculator evaluates 6 × 7 = 42', calcMulResult, '42');

// Check history recorded the expression
const historyCount = await page.$$eval('#calc-history-list > div', els => els.length);
assert('/calculator records calculation in history', historyCount, 2);
const historyLastText = await page.$eval('#calc-history-list > div:nth-child(2)', el => el.textContent);
assertTrue('/calculator history contains expression and result', historyLastText.includes('6 × 7') && historyLastText.includes('42'));

await browser.close();
server.close();

console.log(results.join('\n'));
const failed = results.filter(line => line.startsWith('FAIL ::'));
console.log(`\n${results.filter(line => line.startsWith('PASS ::')).length} passed, ${failed.length} failed`);
if (pageErrors.length > 0) {
	console.log('\nPAGE ERRORS:\n' + pageErrors.join('\n'));
}
