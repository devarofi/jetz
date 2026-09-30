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
const assertContains = (name, actual, expected) => {
	const pass = String(actual).includes(expected);
	results.push(`${pass ? 'PASS' : 'FAIL'} :: ${name} | actual: ${JSON.stringify(actual)} | expected to contain: ${JSON.stringify(expected)}`);
};
const section = name => results.push(`# ${name}`);

// Jetz drops lifecycle hooks (onMount/onDestroy/...) registered outside a render
// pass. That failure is silent - the component simply never wires itself up (a
// stuck editor, a missing canvas, a dead subscription) - so it is treated as a
// test failure instead of a console warning nobody reads.
const LIFECYCLE_WARNING = /called outside of a component render/;
const lifecycleWarnings = [];

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
		// the preview runs in a sandboxed frame, whose opaque origin makes its fetch
		// of the library files in ./lib a cross-origin request
		res.setHeader('Access-Control-Allow-Origin', '*');
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
	if (LIFECYCLE_WARNING.test(message.text())) {
		lifecycleWarnings.push(message.text());
		return;
	}
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
		welcomePage: document.querySelector('#welcome-page') !== null,
		welcomeExamples: document.querySelectorAll('.welcome-example-link').length,
		// the theme is one class on <html>; everything else reads the tokens
		themeClass: document.documentElement.classList.contains('jetz-theme-dark'),
		themeAttr: document.documentElement.getAttribute('data-theme'),
		themeLabel: document.querySelector('.jetz-theme-toggle')?.getAttribute('aria-label') ?? 'NO TOGGLE',
		themeTitle: document.querySelector('.jetz-theme-toggle')?.getAttribute('title') ?? 'NO TOGGLE',
		themeGlyph: document.querySelector('.jetz-theme-toggle')?.textContent.trim() ?? 'NO TOGGLE',
		themeTag: document.querySelector('.jetz-theme-toggle')?.tagName ?? 'NO TOGGLE',
		// the storage key is built from the pathname, so look the entry up by its
		// `__key__theme` suffix instead of hardcoding the mangled path
		themeStored: (() => {
			const store = JSON.parse(localStorage.getItem('app-remember-state') || '{}');
			for (const collection of Object.values(store)) {
				for (const [key, value] of Object.entries(collection)) {
					if (key.endsWith('__key__theme')) return value;
				}
			}
			return null;
		})(),
		themeSurfaces: {
			page: styleOf('body', 'backgroundColor'),
			card: styleOf('.jetz-benefit-card', 'backgroundColor'),
			header: styleOf('.jetz-header', 'backgroundColor'),
			table: styleOf('.jetz-compare', 'backgroundColor'),
			heroWash: styleOf('.jetz-hero', 'backgroundImage'),
			ctaWash: styleOf('.jetz-cta', 'backgroundImage'),
		},
		themeInk: styleOf('body', 'color'),
		themeToggleBox: (() => {
			const el = document.querySelector('.jetz-theme-toggle');
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { w: Math.round(r.width), h: Math.round(r.height) };
		})(),
		todoPage: document.querySelector('#todo-page') !== null,
		todoTasks: document.querySelectorAll('.todo-task').length,
		// the stress test ships as its own document, so it only appears when that
		// page is the one being loaded
		stressTitle: document.title,
		stressTable: document.querySelector('#app table') !== null,
		stressRows: document.querySelectorAll('#app table tbody tr').length,
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

// --- the home page is a full-page welcome layout ---------------------------
section('/: framework welcome page');
const home = await open('/');
assert('/ home uses the full-page shell', home.appDisplay, 'block');
assert('/ home uses its welcome typography', home.bodyFont, '"Avenir Next", "Segoe UI", sans-serif');
assertTrue('/ home renders the welcome page', home.welcomePage);
assertTrue('/ home introduces Jetz', home.h1Text.includes('Build interfaces'));
assert('/ home shows the product tagline', await page.$eval('.jetz-tagline', el => el.textContent.trim()), 'Javascript, Compose.');
assert('/ home offers both interactive examples', home.welcomeExamples, 2);

// --- the "learn by doing" tabs swap their panel content --------------------
section('/: learn-by-doing code explorer');
const panelHeading = () => page.$eval('.jetz-code-content .jetz-code-heading strong', el => el.textContent);
assert('/ home code explorer opens on the State panel', await panelHeading(), 'Reactive state without ceremony');
for (const [index, heading] of [
	[1, 'Components are just functions'],
	[2, 'Simple client-side routing'],
	[3, 'Events stay close to your UI'],
	[0, 'Reactive state without ceremony']
]) {
	await page.click(`.jetz-code-tabs .jetz-code-tab:nth-child(${index + 1})`);
	assert(`/ home tab ${index + 1} renders its own panel`, await panelHeading(), heading);
	assertTrue(`/ home tab ${index + 1} is syntax highlighted`, (await page.$$eval('.jetz-code .token', tokens => tokens.length)) > 0);
}
assert('/ home keeps a single code block in view', await page.$$eval('.jetz-code-content pre.jetz-code', blocks => blocks.length), 1);
assertTrue('/ home never renders a placeholder panel', !(await page.$eval('.jetz-code-content', el => el.textContent)).includes('[object Object]'));

// --- Prism paints the code explorer ---------------------------------------
section('/: learn-by-doing syntax highlighting');
assert('/ home tags the code block with the highlighted language', await page.$eval('.jetz-code-content pre.jetz-code code', el => el.className), 'language-javascript');
assertTrue('/ home turns keywords into Prism tokens', (await page.$$eval('.jetz-code .token.keyword', tokens => tokens.length)) > 0);
assertTrue('/ home turns strings into Prism tokens', (await page.$$eval('.jetz-code .token.string', tokens => tokens.length)) > 0);
assertTrue('/ home turns numbers into Prism tokens', (await page.$$eval('.jetz-code .token.number', tokens => tokens.length)) > 0);
assertTrue('/ home keeps the highlighted source unchanged', (await page.$eval('.jetz-code', el => el.textContent)).includes('import { stateOf } from "@daevsoft/jetz";'));
assert('/ home paints the explorer tokens with the Prism palette', await page.$eval('.jetz-code .token.keyword', el => getComputedStyle(el).color), 'rgb(101, 191, 240)');

// --- Prism paints the hero code window too ---------------------------------
section('/: hero code window syntax highlighting');
assert('/ home tags the hero code block with the highlighted language', await page.$eval('.jetz-hero-code-content code', el => el.className), 'language-javascript');
assertTrue('/ home turns hero keywords into Prism tokens', (await page.$$eval('.jetz-hero-code-content .token.keyword', tokens => tokens.length)) > 0);
assertTrue('/ home turns hero strings into Prism tokens', (await page.$$eval('.jetz-hero-code-content .token.string', tokens => tokens.length)) > 0);
assertTrue('/ home turns hero numbers into Prism tokens', (await page.$$eval('.jetz-hero-code-content .token.number', tokens => tokens.length)) > 0);
assert('/ home paints hero tokens with the same Prism palette', await page.$eval('.jetz-hero-code-content .token.keyword', el => getComputedStyle(el).color), 'rgb(101, 191, 240)');
assertTrue('/ home keeps the highlighted hero source unchanged', (await page.$eval('.jetz-hero-code-content', el => el.textContent)).includes('Jetz.mount(App, "#app");'));

// --- the comparison section answers "why another framework?" -----------------
section('/: comparison section');
assertTrue('/ home points the Compare nav link at the section', (await page.$eval('.jetz-nav a[href="#special"]', el => el.textContent)) === 'Compare');
assert('/ home compares six framework concerns', await page.$$eval('#special .jetz-compare-row:not(.jetz-compare-head)', rows => rows.length), 6);
assertTrue('/ home names Jetz and the alternatives', (await page.$eval('.jetz-compare-head', el => el.textContent)).includes('Jetz'));
assert('/ home shows both the fit and the trade-off cards', await page.$$eval('#special .jetz-fit-card', cards => cards.length), 2);
assertTrue('/ home keeps the comparison anchored on the page', await page.$eval('#special', el => el.classList.contains('jetz-section')));

// --- the benchmark section proves the memory & speed claims ------------------
section('/: benchmark section');
assertTrue('/ home points the Benchmark nav link at the section', (await page.$eval('.jetz-nav a[href="#benchmark"]', el => el.textContent)) === 'Benchmark');
assertTrue('/ home renders the benchmark section', await page.$eval('#benchmark', el => el.classList.contains('jetz-section-soft')));
assert('/ home badges the section as a benchmark', (await page.$eval('#benchmark .jetz-eyebrow', el => el.textContent.trim())), 'BENCHMARK & PERFORMANCE');
assert('/ home headlines the 50.000 row scale', (await page.$eval('#benchmark h2', el => el.textContent.replace(/\s+/g, ' ').trim())), 'Skala 50.000 Data Tanpa Kompromi Memori');
assert('/ home shows three key metric cards', await page.$$eval('#benchmark .jetz-metric-card', cards => cards.length), 3);
assert('/ home reuses the page card shell for its metrics', await page.$$eval('#benchmark .jetz-metric-card', cards => cards.every(card => card.classList.contains('jetz-benefit-card'))), true);
assert('/ home reports the heap footprint', (await page.$$eval('.jetz-metric-value', els => els.map(el => el.textContent).join('|'))), '123 MB|0.00 ms|0%');
assert('/ home names every metric card', (await page.$$eval('.jetz-metric-label', els => els.map(el => el.textContent).join('|'))), 'JS Heap Footprint|Single Row Update Time|Memory Leak');
assert('/ home explains every metric card', (await page.$$eval('.jetz-metric-note', els => els.map(el => el.textContent).join('|'))), 'Penggunaan RAM murni untuk 50.000 data reaktif aktif.|Perubahan state langsung menuju DOM target tanpa diffing.|Automatic subscription cleanup saat unmount elemen.');
assert('/ home accents the metric numbers in the house blue', await page.$eval('.jetz-metric-value', el => getComputedStyle(el).color), 'rgb(36, 118, 173)');
assert('/ home backs the cards with a measured proof strip', await page.$$eval('.jetz-bench-proof-item', items => items.length), 4);
assertTrue('/ home derives the memory saving from the two heap figures', (await page.$eval('.jetz-bench-proof', el => el.textContent)).includes('91%'));
assertTrue('/ home cites the DevTools measurement behind the numbers', (await page.$eval('.jetz-bench-source', el => el.textContent)).includes('1,351 MB'));
assert('/ home reuses the comparison table for the benchmark', await page.$$eval('#benchmark .jetz-compare', tables => tables.length), 1);
assert('/ home compares six benchmark concerns', await page.$$eval('#benchmark .jetz-compare-row:not(.jetz-compare-head)', rows => rows.length), 6);
assert('/ home heads the benchmark table with both architectures', (await page.$$eval('#benchmark .jetz-compare-head > span', els => els.map(el => el.textContent).join('|'))), 'Fitur / Metrik|Jetz Framework|Virtual DOM (React-like)');
assertTrue('/ home keeps the Jetz column highlighted', await page.$eval('#benchmark .jetz-compare-jetz', el => el.classList.contains('jetz-compare-cell')));
assertTrue('/ home leaves the authoring comparison wording alone', (await page.$eval('#special .jetz-compare-head', el => el.textContent)).includes('JSX and template frameworks'));
assertTrue('/ home states the single row update win', (await page.$eval('#benchmark .jetz-compare', el => el.textContent)).includes('0.00 ms (Mendekati Instan)'));
assert('/ home sends the primary CTA to the stress test', await page.$eval('#benchmark .jetz-btn-primary', el => el.getAttribute('href')), '/stress.html');
assert('/ home points the secondary CTA at the reconciler docs', await page.$eval('#benchmark .jetz-btn-secondary', el => el.getAttribute('href')), 'https://github.com/devarofi/jetz#7-keyed-list-reconciliation-loop');
assertTrue('/ home never renders a placeholder benchmark value', !(await page.$eval('#benchmark', el => el.textContent)).includes('[object Object]'));

// --- the dark theme ----------------------------------------------------------
// The whole page is styled from the --jetz-* tokens, so a theme switch is one
// class on <html>. These assert the class flips, the tokens actually repaint
// every surface that used to be a hardcoded white, and the choice is remembered.
section('/: dark theme toggle');
const themeOf = async () => await probe();
const light = await themeOf();
assert('/ home starts on the light theme', light.themeClass, false);
assert('/ home mirrors the theme onto the document', light.themeAttr, 'light');
assert('/ home leaves the theme switch unpressed by default', light.themeStored, null);
assert('/ home paints a white page by default', light.themeSurfaces.page, 'rgb(255, 255, 255)');
assert('/ home paints white cards by default', light.themeSurfaces.card, 'rgb(255, 255, 255)');
assertContains('/ home keeps the hero wash light by default', light.themeSurfaces.heroWash, 'rgb(255, 255, 255)');
assert('/ home keeps the primary button in the house blue', await page.$eval('.jetz-btn-primary', el => getComputedStyle(el).backgroundImage.includes('rgb(52, 152, 219)')), true);

// the switch is a real button, so it is reachable and operable from the keyboard
assert('/ home renders the switch as a button', light.themeTag, 'BUTTON');
assert('/ home labels the switch with the action it performs', light.themeLabel, 'Beralih ke tema gelap');
assert('/ home mirrors the label into a tooltip', light.themeTitle, 'Tema gelap');
assert('/ home shows a moon glyph while the page is light', light.themeGlyph, '☾');
assertTrue('/ home gives the switch a 40px tap target', light.themeToggleBox.h >= 40 && light.themeToggleBox.w >= 40);

await page.click('.jetz-theme-toggle');
await new Promise(resolve => setTimeout(resolve, 300));
const dark = await themeOf();
assert('/ clicking the switch turns the document dark', dark.themeClass, true);
assert('/ clicking the switch mirrors the theme onto the document', dark.themeAttr, 'dark');
assert('/ the dark theme is remembered for the next visit', dark.themeStored, 'dark');
assert('/ the dark theme repaints the page', dark.themeSurfaces.page, 'rgb(10, 22, 32)');
assert('/ the dark theme repaints the cards', dark.themeSurfaces.card, 'rgb(16, 32, 44)');
assert('/ the dark theme repaints the comparison table', dark.themeSurfaces.table, 'rgb(16, 32, 44)');
assert('/ the dark theme repaints the translucent header', dark.themeSurfaces.header, 'rgba(10, 22, 32, 0.88)');
assert('/ the dark theme inverts the text colour', dark.themeInk, 'rgb(230, 240, 247)');
// the hero and the closing call to action were light gradients: the regression
// these two guard is a hardcoded #fff slipping back into either of them
assertContains('/ the dark theme repaints the hero wash', dark.themeSurfaces.heroWash, 'rgb(10, 22, 32)');
assertContains('/ the dark theme repaints the call to action', dark.themeSurfaces.ctaWash, 'rgb(13, 33, 48)');
assertTrue('/ the dark hero wash has no light stop left', !dark.themeSurfaces.heroWash.includes('rgb(255, 255, 255)'));
assertTrue('/ the dark call to action has no light stop left', !dark.themeSurfaces.ctaWash.includes('rgb(255, 255, 255)'));
assert('/ the dark theme keeps the primary button in the house blue', await page.$eval('.jetz-btn-primary', el => getComputedStyle(el).backgroundImage.includes('rgb(52, 152, 219)')), true);
assert('/ the dark theme flips the switch label to the opposite action', dark.themeLabel, 'Beralih ke tema terang');
assert('/ the dark theme flips the tooltip too', dark.themeTitle, 'Tema terang');
assert('/ the dark theme swaps the glyph to a sun', dark.themeGlyph, '☀');

// the theme has to survive a reload, and it is applied before the first paint
await page.reload({ waitUntil: 'load' });
await new Promise(resolve => setTimeout(resolve, 600));
const reloaded = await themeOf();
assert('/ the dark theme survives a reload', reloaded.themeClass, true);
assert('/ the reloaded dark theme still shows the sun', reloaded.themeGlyph, '☀');
assert('/ the reloaded dark theme still repaints the page', reloaded.themeSurfaces.page, 'rgb(10, 22, 32)');

// back to light, driven from the keyboard this time
await page.focus('.jetz-theme-toggle');
await page.keyboard.press('Enter');
await new Promise(resolve => setTimeout(resolve, 300));
const keyboarded = await themeOf();
assert('/ the switch is operable from the keyboard', keyboarded.themeClass, false);
assert('/ switching back restores the light page', keyboarded.themeSurfaces.page, 'rgb(255, 255, 255)');
assert('/ switching back remembers the light choice', keyboarded.themeStored, 'light');
assert('/ switching back shows the moon again', keyboarded.themeGlyph, '☾');
assert('/ switching back restores the house blue accent', await page.$eval('.jetz-metric-value', el => getComputedStyle(el).color), 'rgb(36, 118, 173)');
assert('/ the light theme is byte-for-byte the documented colour', keyboarded.themeInk, 'rgb(16, 32, 47)');

// the stress test ships as its own document because it mounts itself into #app
section('/stress.html: benchmark page');
const stress = await open('/stress.html');
assert('/stress.html serves its own title', stress.stressTitle, 'Jetz Stress Test - 50.000 Reactive Rows');
assertTrue('/stress.html mounts the reactive grid', stress.stressTable);
assertTrue('/stress.html renders a page of rows', stress.stressRows > 0);

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 20000 });
await new Promise(resolve => setTimeout(resolve, 600));
await page.click('.welcome-example-link');
await page.waitForFunction(() => location.pathname === '/open-todo');
assert('/ home task-list link navigates through the router', new URL(page.url()).pathname, '/open-todo');

// --- Todo CRUD and reactive search ----------------------------------------
section('/open-todo: task management');
const todo = await open('/open-todo');
assertTrue('/open-todo renders the task workspace', todo.todoPage);
assert('/open-todo starts with three example tasks', todo.todoTasks, 3);

await page.type('[aria-label="Search tasks"]', 'reactive');
const searchMatches = await page.$$eval('.todo-task', rows => rows.filter(row => getComputedStyle(row).display !== 'none').length);
assert('/open-todo search filters tasks as you type', searchMatches, 1);
await page.$eval('.todo-search', input => {
	input.value = '';
	input.dispatchEvent(new Event('input', { bubbles: true }));
});

await page.type('[aria-label="New task title"]', 'Draft release notes');
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelectorAll('.todo-task').length === 4);
assert('/open-todo creates tasks with Enter', await page.$$eval('.todo-task', rows => rows.length), 4);

await page.click('.todo-task:nth-child(4) .todo-icon-button');
await page.$eval('.todo-task:nth-child(4) .todo-task__editor', input => {
	input.focus();
	input.value = 'Write release notes';
	input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.keyboard.press('Enter');
assert('/open-todo saves inline edits', await page.$eval('.todo-task:nth-child(4) .todo-task__title', title => title.textContent), 'Write release notes');

await page.click('.todo-task:first-child input[type="checkbox"]');
assertTrue('/open-todo marks a task complete', (await page.$eval('.todo-task:first-child', row => row.textContent)).includes('Completed'));
await page.click('.todo-filter:nth-child(3)');
assert('/open-todo filters completed tasks', await page.$$eval('.todo-task', rows => rows.filter(row => getComputedStyle(row).display !== 'none').length), 2);
await page.click('.todo-filter:first-child');
await page.click('.todo-task:nth-child(4) .todo-icon-button--delete');
assert('/open-todo deletes tasks', await page.$$eval('.todo-task', rows => rows.length), 3);
await page.click('.todo-clear-button');
assert('/open-todo clears completed tasks', await page.$$eval('.todo-task', rows => rows.length), 1);
await page.click('.todo-task:first-child .todo-icon-button--delete');
assert('/open-todo shows an empty state after the final delete', await page.$eval('.todo-empty strong', heading => heading.textContent), "You're all caught up.");

// --- the legacy demo pages keep the centered shell styling -----------------
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

// --- the playground boots its editor and previews the sample code -----------
// Regression: onMount used to fire while the tree was still detached, so
// getElementById('playground-editor') returned null and the page was stuck on
// "Loading editor…" forever.
// the preview lives in a sandboxed frame, so its content is only reachable
// through the CDP frame handle - polling is required because every preview run
// replaces the frame
const readPreviewFrame = async (timeout = 20000) => {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		for (const frame of page.frames()) {
			if (frame === page.mainFrame()) continue;
			try {
				const info = await frame.evaluate(() => ({
					text: (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim(),
					error: document.getElementById('preview-error')?.textContent ?? ''
				}));
				// still booting = not a real render yet
				if (info.text && !/^Loading/.test(info.error)) return info;
			} catch { /* frame swapped mid-poll */ }
		}
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	return null;
};

section('/playground: editor boots and loads the sample code');
await open('/playground');
await page.waitForSelector('.playground-textarea', { timeout: 10000 }).catch(() => { });
const playground = await page.evaluate(() => ({
	editorHost: !!document.getElementById('playground-editor'),
	stillLoading: document.body.innerText.includes('Loading editor'),
	textarea: !!document.querySelector('.playground-textarea'),
	hasSampleCode: (document.querySelector('.playground-textarea')?.value ?? '').includes('Jetz.mount'),
	preview: (document.getElementById('playground-preview')?.getAttribute('srcdoc') ?? '').includes('Jetz.mount'),
	exampleCount: document.querySelectorAll('#playground-example option').length,
	concept: document.getElementById('playground-concept')?.textContent ?? ''
}));
assertTrue('/playground renders the editor host', playground.editorHost);
assert('/playground never stays on the loading placeholder', playground.stillLoading, false);
assertTrue('/playground mounts the editor input', playground.textarea);
assertTrue('/playground loads the sample code into the editor', playground.hasSampleCode);
assertTrue('/playground renders the sample in the preview frame', playground.preview);
assert('/playground offers every example', playground.exampleCount, 7);
assertTrue('/playground shows the concept of the selected example', playground.concept.includes('stateOf'));

// setting srcdoc is not enough: the frame must actually run the sample
const renderedPreview = await readPreviewFrame();
assertTrue('/playground preview actually renders (not a blank frame)', renderedPreview !== null);
assertTrue('/playground preview shows the running counter', (renderedPreview?.text ?? '').includes('A counter, no re-render loop'));

// the sample must be served by this build, not resolved from a CDN
const previewWiring = await (async () => {
	const frame = page.frames().find(candidate => candidate !== page.mainFrame());
	const map = frame
		? await frame.evaluate(() => JSON.parse(document.querySelector('script[type=importmap]').textContent).imports)
		: {};
	const loaded = frame
		? await frame.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name))
		: [];
	const served = await page.evaluate(() => fetch('/lib/jetz.js').then(response => response.status).catch(() => 0));
	return { map, loaded, served };
})();
assertTrue('/playground preview resolves the core entry from this build', /\/lib\/jetz\.js$/.test(previewWiring.map['@daevsoft/jetz'] ?? ''));
assertTrue('/playground preview resolves the ui entry from this build', /\/lib\/jetz-ui\.js$/.test(previewWiring.map['@daevsoft/jetz/ui'] ?? ''));
assert('/playground serves the core library file', previewWiring.served, 200);
assertTrue('/playground preview loads the core library from this origin', previewWiring.loaded.some(name => /\/lib\/jetz\.js$/.test(name)));
assertTrue('/playground preview loads no modules from a CDN', !previewWiring.loaded.some(name => /esm\.sh|unpkg|jsdelivr|skypack/.test(name)));

// switching example must update the editor, the label and the preview
await page.select('#playground-example', 'lists');
await new Promise(resolve => setTimeout(resolve, 400));
const switched = await page.evaluate(() => ({
	hasListSample: (document.querySelector('.playground-textarea')?.value ?? '').includes('listOf'),
	concept: document.getElementById('playground-concept')?.textContent ?? ''
}));
assertTrue('/playground swaps the editor code with the example', switched.hasListSample);
assertTrue('/playground swaps the concept label with the example', switched.concept.includes('listOf'));

const switchedPreview = await readPreviewFrame();
assertTrue('/playground preview re-renders for the new example', (switchedPreview?.text ?? '').includes('A list that stays in sync'));

// Which library ran is not a matter of opinion: `data_counter` and `className` are
// working-tree forms, so seeing them in the frame proves the preview executed this
// source tree rather than a released copy.
await page.evaluate(() => {
	document.querySelector('.playground-textarea').value = [
		'import { Jetz, stateOf } from "@daevsoft/jetz";',
		'import { div, span } from "@daevsoft/jetz/ui";',
		'const count = stateOf(7);',
		'Jetz.mount(div({ id: "local-probe", data_counter: count, className: "from-tree" }, span("value")), "#app");'
	].join('\n');
});
await page.evaluate(() => {
	const runButton = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.includes('Run preview'));
	if (runButton) runButton.click();
});
const readLocalProbe = async (timeout = 20000) => {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		for (const frame of page.frames()) {
			if (frame === page.mainFrame()) continue;
			try {
				const probe = await frame.evaluate(() => {
					const element = document.getElementById('local-probe');
					return element ? { counter: element.getAttribute('data-counter'), className: element.className } : null;
				});
				if (probe) return probe;
			} catch { /* frame swapped mid-poll */ }
		}
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	return null;
};
const localProbe = await readLocalProbe();
assert('/playground preview applies the working-tree data_ form', localProbe?.counter, '7');
assert('/playground preview applies the working-tree className alias', localProbe?.className, 'from-tree');

// Regression: leaving and re-entering the route rebuilds the frame, and a pane
// that never starts looks exactly like a blank one. The re-entry below is a real
// same-document router round trip: home -> playground -> home -> playground.
const clickLink = label => page.evaluate(text => {
	const link = [...document.querySelectorAll('a')].find(a => a.textContent.trim() === text);
	if (link) link.click();
}, label);
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
await new Promise(resolve => setTimeout(resolve, 700));
await clickLink('Playground');
await new Promise(resolve => setTimeout(resolve, 700));
await clickLink('Back to home');
await new Promise(resolve => setTimeout(resolve, 500));
await clickLink('Playground');
await new Promise(resolve => setTimeout(resolve, 250));
const reentryDuring = await page.evaluate(() => ({
	path: location.pathname,
	frames: document.querySelectorAll('#playground-preview').length,
	stage: document.querySelector('.preview-stage')?.getAttribute('data-state') ?? 'NO STAGE',
	overlay: !!document.querySelector('.preview-loading')
}));
const reentryPreview = await readPreviewFrame();
const reentryReady = await page.evaluate(() => {
	const stage = document.querySelector('.preview-stage');
	const overlay = document.querySelector('.preview-loading');
	return {
		path: location.pathname,
		stage: stage?.getAttribute('data-state') ?? 'NO STAGE',
		status: document.getElementById('playground-status')?.textContent ?? '',
		overlayDisplay: overlay ? getComputedStyle(overlay).display : 'NO OVERLAY'
	};
});
assert('/playground re-entry actually lands on the playground', reentryDuring.path, '/playground');
assert('/playground re-entry leaves exactly one preview frame', reentryDuring.frames, 1);
assertTrue('/playground re-entry keeps a loading state element', reentryDuring.overlay);
assert('/playground re-entry names the running state', reentryReady.status, 'Running in an isolated preview');
assert('/playground re-entry clears the loading overlay', reentryReady.overlayDisplay, 'none');
assert('/playground re-entry leaves the stage ready', reentryReady.stage, 'ready');
assertTrue('/playground re-entry renders the preview again (not blank)', (reentryPreview?.text ?? '').includes('A counter, no re-render loop'));

// --- no component may silently lose its lifecycle hooks ---------------------
section('runtime hygiene: no dropped lifecycle hooks');
assert('no lifecycle hook was registered outside a render', lifecycleWarnings.length, 0);

await browser.close();
server.close();

console.log(results.join('\n'));
const failed = results.filter(line => line.startsWith('FAIL ::'));
console.log(`\n${results.filter(line => line.startsWith('PASS ::')).length} passed, ${failed.length} failed`);
if (pageErrors.length > 0) {
	console.log('\nPAGE ERRORS:\n' + pageErrors.join('\n'));
}
if (lifecycleWarnings.length > 0) {
	console.log('\nDROPPED LIFECYCLE HOOKS:\n' + lifecycleWarnings.join('\n'));
}
process.exit(failed.length === 0 ? 0 : 1);
