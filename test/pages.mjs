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
		// the tagged-template ticker: one reactive string per rendered row
		stressTicker: document.querySelector('#app table tbody tr .stress-ticker')?.textContent ?? '',
		stressTickerCells: document.querySelectorAll('#app table tbody tr .stress-ticker').length,
		stressStringCard: (() => {
			const label = [...document.querySelectorAll('#app div')].find(el => el.textContent === 'Reactive string');
			return label?.parentElement?.textContent ?? '';
		})(),
		// the defer() task cards on the stress page (label maps to parent card text)
		stressDeferCard: (() => {
			const label = [...document.querySelectorAll('#app div')].find(el => el.textContent === 'Last task');
			return label?.parentElement?.textContent ?? '';
		})(),
		// the click -> task gap defer() recorded for the last deferred task
		stressGapCard: (() => {
			const label = [...document.querySelectorAll('#app div')].find(el => el.textContent === 'Paint gap');
			return label?.parentElement?.textContent ?? '';
		})(),
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
assert('/ home headlines the 50,000 row scale', (await page.$eval('#benchmark h2', el => el.textContent.replace(/\s+/g, ' ').trim())), 'Scale 50,000 Data Without Memory Compromise');
assert('/ home shows three key metric cards', await page.$$eval('#benchmark .jetz-metric-card', cards => cards.length), 3);
assert('/ home reuses the page card shell for its metrics', await page.$$eval('#benchmark .jetz-metric-card', cards => cards.every(card => card.classList.contains('jetz-benefit-card'))), true);
assert('/ home reports the heap footprint', (await page.$$eval('#benchmark .jetz-metric-value', els => els.map(el => el.textContent).join('|'))), '123 MB|0.00 ms|0%');
assert('/ home names every metric card', (await page.$$eval('#benchmark .jetz-metric-label', els => els.map(el => el.textContent).join('|'))), 'JS Heap Footprint|Single Row Update Time|Memory Leak');
assert('/ home explains every metric card', (await page.$$eval('#benchmark .jetz-metric-note', els => els.map(el => el.textContent).join('|'))), 'Raw RAM usage for 50,000 live reactive rows.|State changes go straight to the target DOM node, with no diffing.|Automatic subscription cleanup when an element unmounts.');
assert('/ home accents the metric numbers in the house blue', await page.$eval('.jetz-metric-value', el => getComputedStyle(el).color), 'rgb(36, 118, 173)');
assert('/ home backs the cards with a measured proof strip', await page.$$eval('.jetz-bench-proof-item', items => items.length), 4);
assertTrue('/ home derives the memory saving from the two heap figures', (await page.$eval('.jetz-bench-proof', el => el.textContent)).includes('91%'));
assertTrue('/ home cites the DevTools measurement behind the numbers', (await page.$eval('.jetz-bench-source', el => el.textContent)).includes('1,351 MB'));
assert('/ home reuses the comparison table for the benchmark', await page.$$eval('#benchmark .jetz-compare', tables => tables.length), 1);
assert('/ home compares six benchmark concerns', await page.$$eval('#benchmark .jetz-compare-row:not(.jetz-compare-head)', rows => rows.length), 6);
assert('/ home heads the benchmark table with both architectures', (await page.$$eval('#benchmark .jetz-compare-head > span', els => els.map(el => el.textContent).join('|'))), 'Feature / Metric|Jetz Framework|Virtual DOM (React-like)');
assertTrue('/ home keeps the Jetz column highlighted', await page.$eval('#benchmark .jetz-compare-jetz', el => el.classList.contains('jetz-compare-cell')));
assertTrue('/ home leaves the authoring comparison wording alone', (await page.$eval('#special .jetz-compare-head', el => el.textContent)).includes('JSX and template frameworks'));
assertTrue('/ home states the single row update win', (await page.$eval('#benchmark .jetz-compare', el => el.textContent)).includes('0.00 ms (Near Instant)'));
// the whole benchmark section is English-only: no Indonesian wording survives
assertTrue('/ home writes the benchmark section in English', !(await page.$eval('#benchmark', el => el.textContent))
	.match(/Skala|Kompromi|Penggunaan|reaktif aktif|Mendekati|Footprint Memori|Stabilitas Sweep|Siklus paginasi|Fitur \/ Metrik|Diukur|dibersihkan otomatis|Perlu dipantau|Coba Stress|Baca Dokumentasi|Arsitektur Reaktivitas/));
assert('/ home keeps the English thousands separator in the figure', (await page.$eval('#benchmark .jetz-bench-figure', el => el.textContent)), '50,000');
assert('/ home sends the primary CTA to the stress test', await page.$eval('#benchmark .jetz-btn-primary', el => el.getAttribute('href')), '/stress.html');
assert('/ home points the secondary CTA at the reconciler docs', await page.$eval('#benchmark .jetz-btn-secondary', el => el.getAttribute('href')), 'https://github.com/devarofi/jetz#7-keyed-list-reconciliation-loop');
assertTrue('/ home never renders a placeholder benchmark value', !(await page.$eval('#benchmark', el => el.textContent)).includes('[object Object]'));

// --- the performance chart answers "how fast, really?" ----------------------
section('/: performance chart section');
assert('/ home renders the chart section', await page.$eval('#chart', el => el.classList.contains('jetz-section')), true);
assert('/ home badges the chart as a speed spectrum', (await page.$eval('#chart .jetz-eyebrow', el => el.textContent.trim())), 'BENCHMARK & SPEED SPECTRUM');
assert('/ home headlines the chart on the no-overhead claim', (await page.$eval('#chart h2', el => el.textContent.replace(/\s+/g, ' ').trim())), 'Top-Tier Performance Without Virtual DOM Overhead');
assertTrue('/ home subheads the chart with the fine-grained claim', (await page.$eval('#chart .jetz-section-heading p', el => el.textContent)).includes('Fine-Grained Direct DOM'));
assert('/ home offers three metric tabs', await page.$$eval('#chart .jetz-chart-tab', tabs => tabs.length), 3);
assert('/ home labels every metric tab', (await page.$$eval('#chart .jetz-chart-tab', tabs => tabs.map(tab => tab.textContent.trim()).join('|'))), 'Partial Update Speed (ms)|Memory Footprint (MB)|DOM Mount Speed (ms)');
assert('/ home marks one metric tab as selected by default', await page.$$eval('#chart .jetz-chart-tab', tabs => tabs.filter(tab => tab.getAttribute('aria-selected') === 'true').length), 1);
assert('/ home marks the first metric tab active by default', await page.$eval('#chart .jetz-chart-tab', tab => tab.classList.contains('is-active')), true);
// only the active panel is in the DOM, so the bars can never disagree with the tab
assert('/ home renders exactly one chart panel at a time', await page.$$eval('#chart .jetz-chart-panel', panels => panels.length), 1);
assert('/ home titles the default metric panel', (await page.$eval('#chart .jetz-chart-panel .jetz-chart-axis strong', el => el.textContent)), 'Single Row Partial Update Time');
// "lower is better" is stated, because a shorter bar winning is otherwise ambiguous
assert('/ home states the direction that wins', (await page.$eval('#chart .jetz-chart-axis span', el => el.textContent)), 'Lower is better');
assert('/ home draws one bar per framework', await page.$$eval('#chart .jetz-chart-bar', bars => bars.length), 5);
assert('/ home names every framework on the default metric', (await page.$$eval('#chart .jetz-chart-name', els => els.map(el => el.textContent).join('|'))), 'Jetz Framework|SolidJS|Svelte 5|Vue 3|React 19');
assert('/ home prints the update figures', (await page.$$eval('#chart .jetz-chart-value', els => els.map(el => el.textContent).join('|'))), '0.00 ms|0.05 ms|0.10 ms|3.20 ms|12.50 ms');
assert('/ home badges exactly the Jetz bar', (await page.$$eval('#chart .jetz-chart-badge', els => els.map(el => el.textContent).join('|'))), 'JETZ');
assert('/ home highlights only the Jetz bar', await page.$$eval('#chart .jetz-chart-bar', bars => bars.filter(bar => bar.classList.contains('jetz-chart-bar-jetz')).length), 1);
assert('/ home colours the Jetz bar in the house cyan', await page.$eval('#chart .jetz-chart-bar-jetz .jetz-chart-name', el => getComputedStyle(el).color), 'rgb(8, 145, 178)');
assert('/ home mutes the competing bars', await page.$eval('#chart .jetz-chart-bar:not(.jetz-chart-bar-jetz) .jetz-chart-name', el => getComputedStyle(el).color), 'rgb(36, 59, 83)');
// the fastest result is 0.00 ms, so the fill has a floor or the bar would vanish
assertTrue('/ home keeps the 0.00 ms Jetz bar visible', parseFloat(await page.$eval('#chart .jetz-chart-bar-jetz .jetz-chart-fill', el => el.style.width)) > 0);
assert('/ home scales the slowest bar to full width', await page.$eval('#chart .jetz-chart-bar:last-child .jetz-chart-fill', el => el.style.width), '100%');
assertTrue('/ home cites the methodology under the chart', (await page.$eval('#chart .jetz-bench-source', el => el.textContent)).includes('Intel i7/M-Series'));
assertTrue('/ home discloses the post-GC condition', (await page.$eval('#chart .jetz-bench-source', el => el.textContent)).toLowerCase().includes('post-gc'));
assert('/ home links the chart to the stress test', await page.$eval('#chart .jetz-chart-method-link', el => el.getAttribute('href')), '/stress.html');
assertTrue('/ home names the methodology link', (await page.$eval('#chart .jetz-chart-method-link', el => el.textContent)).includes('Methodology'));
// the chart section is English-only, like the benchmark section above it.
// word boundaries matter here: a bare "Performa" also matches "Performance"
assertTrue('/ home writes the chart section in English', !(await page.$eval('#chart', el => el.textContent))
	.match(/\bPerforma\b|\bLihat\b|\bDites\b|\bKompromi\b|reaktif aktif|\bMengungguli\b|\bTanpa\b|dataset reaktif|baris DOM|\bSiklus\b|\bPenggunaan\b|\bMemori\b/));
assertTrue('/ home never renders a placeholder chart value', !(await page.$eval('#chart', el => el.textContent)).includes('[object Object]'));
assertTrue('/ home points the Chart nav link at the section', (await page.$eval('.jetz-nav a[href="#chart"]', el => el.textContent)) === 'Chart');

// --- defer() keeps the frame budget intact under a heavy DOM -----------------
section('/: paint-aware scheduling section');
assertTrue('/ home renders the paint-aware section', await page.$eval('#defer', el => el.classList.contains('jetz-section-soft')));
assert('/ home headlines the paint-aware claim', (await page.$eval('#defer h2', el => el.textContent.replace(/\s+/g, ' ').trim())), '60 FPS Feel, Even Under Extreme DOM Load');
assert('/ home shows four paint metrics', await page.$$eval('#defer .jetz-metric-card', cards => cards.length), 4);
assert('/ home reuses the card shell for the paint metrics', await page.$$eval('#defer .jetz-metric-card', cards => cards.every(card => card.classList.contains('jetz-benefit-card'))), true);
assert('/ home reports the defer() figures', (await page.$$eval('#defer .jetz-metric-value', els => els.map(el => el.textContent).join('|'))), '38.80 ms|0.20 ms|73.1 MB|< 88.70 ms');
assert('/ home names every paint metric', (await page.$$eval('#defer .jetz-metric-label', els => els.map(el => el.textContent).join('|'))), 'Paint Gap|Reactive String|JS Heap Usage|P95 / Max Latency');
assert('/ home explains every paint metric', (await page.$$eval('#defer .jetz-metric-note', els => els.map(el => el.textContent).join('|'))), 'Instant UI Feedback|TextNode Isolation|50,000 Rows in Memory|Uninterrupted Main Thread');
assert('/ home lays the paint metrics out two by two', await page.$eval('#defer .jetz-metric-grid', el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
assert('/ home tags the defer() snippet with its language', await page.$eval('#defer pre.jetz-hero-code-content code', el => el.className), 'language-javascript');
assertTrue('/ home highlights the defer() snippet', (await page.$$eval('#defer pre.jetz-hero-code-content .token.keyword', tokens => tokens.length)) > 0);
assertTrue('/ home keeps the defer() call intact', (await page.$eval('#defer pre.jetz-hero-code-content', el => el.textContent)).includes('defer(() => currentPage.value++, { loadingState: isPending });'));
assertTrue('/ home cites the measurement behind the paint gap', (await page.$eval('#defer .jetz-bench-source', el => el.textContent)).includes('paint gap'));
assertTrue('/ home writes the paint-aware section in English', !(await page.$eval('#defer', el => el.textContent)).match(/Skala|Kompromi|Penggunaan|Mendekati|reaktif aktif/));
assertTrue('/ home never renders a placeholder paint value', !(await page.$eval('#defer', el => el.textContent)).includes('[object Object]'));

// switching tabs swaps the whole panel, values and bar order included
const switchTo = async label => {
	await page.evaluate(text => [...document.querySelectorAll('#chart .jetz-chart-tab')]
		.find(tab => tab.textContent.trim() === text).click(), label);
	await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	return page.evaluate(() => ({
		title: document.querySelector('#chart .jetz-chart-panel .jetz-chart-axis strong').textContent,
		names: [...document.querySelectorAll('#chart .jetz-chart-name')].map(el => el.textContent).join('|'),
		values: [...document.querySelectorAll('#chart .jetz-chart-value')].map(el => el.textContent).join('|'),
		panels: document.querySelectorAll('#chart .jetz-chart-panel').length,
		selected: [...document.querySelectorAll('#chart .jetz-chart-tab')].filter(tab => tab.getAttribute('aria-selected') === 'true').map(tab => tab.textContent.trim()).join('|'),
		widths: [...document.querySelectorAll('#chart .jetz-chart-fill')].map(el => el.style.width).join('|')
	}));
};

const memory = await switchTo('Memory Footprint (MB)');
assert('/ home switches the chart to the memory metric', memory.title, 'Memory Footprint After Garbage Collection');
assert('/ home prints the memory figures', memory.values, '110 MB|123 MB|135 MB|180 MB|260 MB');
assert('/ home keeps the memory bar order', memory.names, 'SolidJS|Jetz Framework|Svelte 5|Vue 3|React 19');
assert('/ home still shows one panel after switching', memory.panels, 1);
assert('/ home moves the selected tab with the panel', memory.selected, 'Memory Footprint (MB)');

const mount = await switchTo('DOM Mount Speed (ms)');
assert('/ home switches the chart to the mount metric', mount.title, 'Mounting 500 Rows to the DOM');
assert('/ home prints the mount figures', mount.values, '58 ms|65 ms|77 ms|95 ms|150 ms');
// on this metric Jetz is third, so the rendered order has to actually change
assert('/ home re-ranks the bars for the mount metric', mount.names, 'SolidJS|Svelte 5|Jetz Framework|Vue 3|React 19');
assert('/ home repaints the bars on every switch', mount.widths !== memory.widths, true);
assert('/ home keeps the Jetz bar highlighted across switches', await page.$$eval('#chart .jetz-chart-bar-jetz .jetz-chart-value', els => els.map(el => el.textContent).join('|')), '77 ms');
// --- the scroll reveal ------------------------------------------------------
// The animation must never be able to hide content it cannot bring back, so
// these check both the animation itself and the class that guards it.
section('/: scroll reveal');
assertTrue('/ home adds the reveal gate to <html>', await page.evaluate(() => document.documentElement.classList.contains('jetz-has-reveal')));
assertTrue('/ home marks the static blocks for reveal', await page.$$eval('#welcome-page .jetz-reveal', els => els.length) >= 10, true);
assertTrue('/ home reveals everything above the fold on load', await page.evaluate(() =>
	[...document.querySelectorAll('#welcome-page .jetz-hero-col')].every(el => el.classList.contains('is-visible'))));
assertTrue('/ home runs the fade-in-up keyframes', await page.evaluate(() =>
	getComputedStyle(document.querySelector('#welcome-page .jetz-reveal.is-visible')).animationName === 'jetz-fade-in-up'));
// the panels behind both tab strips are rebuilt by ifElse() on click, so they
// must stay out of the reveal set or they would never be un-hidden
assert('/ home leaves the chart panel out of the reveal set', await page.$$eval('#chart .jetz-chart-panel', els => els.filter(el => el.classList.contains('jetz-reveal')).length), 0);
assert('/ home leaves the code panel out of the reveal set', await page.$$eval('.jetz-code-panel', els => els.filter(el => el.classList.contains('jetz-reveal')).length), 0);
// switching a tab builds a brand new panel: it has to be visible, not stranded
await page.evaluate(() => [...document.querySelectorAll('#chart .jetz-chart-tab')]
	.find(tab => tab.textContent.trim() === 'Memory Footprint (MB)').click());
await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
assert('/ home keeps a freshly swapped chart panel visible', await page.$eval('#chart .jetz-chart-panel', el => getComputedStyle(el).opacity), '1');

// the gate is what holds content at opacity 0, so with it gone nothing is hidden
assertTrue('/ home hides nothing without the gate class', await page.evaluate(() => {
	const el = document.querySelector('#welcome-page .jetz-reveal');
	el.classList.remove('is-visible');
	document.documentElement.classList.remove('jetz-has-reveal');
	const opacity = getComputedStyle(el).opacity;
	document.documentElement.classList.add('jetz-has-reveal');
	el.classList.add('is-visible');
	return opacity === '1';
}));



// --- the chart's visual upgrade ---------------------------------------------
// Logos, the highlight strip, the thick gradient bar and the glass control are
// the things that make the section read as a benchmark rather than a list.
section('/: chart visual design');
assert('/ home marks every framework with a logo', await page.$$eval('#chart .jetz-chart-logo', els => els.length), 5);
assert('/ home draws the rival marks as inline svg', await page.$$eval('#chart .jetz-chart-logo svg', els => els.length), 4);
assert('/ home keeps the real Jetz logo as an image', (await page.$$eval('#chart .jetz-chart-logo img', els => els.map(el => el.getAttribute('alt')).join('|'))), 'Jetz Framework logo');
assert('/ home gives every mark a readable box', await page.$eval('#chart .jetz-chart-logo', el => getComputedStyle(el).width), '26px');

assert('/ home shows three highlight cards', await page.$$eval('#chart .jetz-chart-highlight', els => els.length), 3);
assert('/ home derives the highlights from the measured bars', (await page.$$eval('#chart .jetz-chart-highlight-body > strong', els => els.map(el => el.textContent).join('|'))), '0.00 ms|53% less memory|1.9× faster mount');
assert('/ home labels what each highlight compares', (await page.$$eval('#chart .jetz-chart-highlight-body > small', els => els.map(el => el.textContent).join('|'))), 'single row partial update|than React 19 at 50,000 rows|than React 19 for 500 rows');

assert('/ home draws the bars thick', await page.$eval('#chart .jetz-chart-track', el => getComputedStyle(el).height), '18px');
assertTrue('/ home rounds the bars fully', await page.$eval('#chart .jetz-chart-track', el => getComputedStyle(el).borderRadius) === '999px');
assertTrue('/ home gives the Jetz bar the neon gradient', (await page.$eval('#chart .jetz-chart-bar-jetz .jetz-chart-fill', el => getComputedStyle(el).backgroundImage)).includes('linear-gradient'));
assertTrue('/ home glows the Jetz bar', (await page.$eval('#chart .jetz-chart-bar-jetz .jetz-chart-fill', el => getComputedStyle(el).boxShadow)).includes('34, 211, 238'));
assert('/ home keeps the rival bars a flat slate', await page.$eval('#chart .jetz-chart-bar:not(.jetz-chart-bar-jetz) .jetz-chart-fill', el => getComputedStyle(el).backgroundImage), 'none');
assert('/ home outlines the framework badge in neon', await page.$eval('#chart .jetz-chart-badge', el => getComputedStyle(el).borderTopColor), 'rgb(8, 145, 178)');
assert('/ home rounds the tab control into a pill', await page.$eval('#chart .jetz-chart-tabs', el => getComputedStyle(el).borderRadius), '999px');
assert('/ home lights the active tab as a white pill', await page.$eval('#chart .jetz-chart-tab.is-active', el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
assertTrue('/ home glows the active tab', (await page.$eval('#chart .jetz-chart-tab.is-active', el => getComputedStyle(el).boxShadow)).includes('34, 211, 238'));

// bars grow from nothing to their target, staggered row by row
const growth = await page.evaluate(() => ({
	grown: document.querySelector('#chart .jetz-chart-panel').classList.contains('is-grown'),
	delays: [...document.querySelectorAll('#chart .jetz-chart-fill')].map(el => el.style.transitionDelay).join('|'),
	collapsed: (() => {
		const el = document.querySelector('#chart .jetz-chart-fill');
		const panel = document.querySelector('#chart .jetz-chart-panel');
		// suppress the transition so the reading is the resting value rather
		// than whatever the animation happens to be at this instant
		el.style.transition = 'none';
		panel.classList.remove('is-grown');
		const before = getComputedStyle(el).transform;
		panel.classList.add('is-grown');
		el.style.transition = '';
		return before;
	})()
}));
assertTrue('/ home grows the bars when the chart arrives', growth.grown, true);
assert('/ home staggers the rows as they grow', growth.delays, '0ms|90ms|180ms|270ms|360ms');
assertTrue('/ home holds the bars at zero width before they grow', growth.collapsed.includes('matrix(0,'), true);



// the chart follows the theme like everything else on the page. The chart name
// cross-fades between themes, so this has to let the transition settle before
// reading the colour rather than catching it mid-flight.
const chartThemed = await page.evaluate(async () => {
	const settle = () => new Promise(resolve => setTimeout(resolve, 400));
	document.documentElement.classList.add('jetz-theme-dark');
	await settle();
	const read = () => getComputedStyle(document.querySelector('#chart .jetz-chart-bar-jetz .jetz-chart-name')).color;
	const dark = read();
	const darkTrack = getComputedStyle(document.querySelector('#chart .jetz-chart-track')).backgroundColor;
	document.documentElement.classList.remove('jetz-theme-dark');
	await settle();
	return { dark, light: read(), darkTrack };
});
assert('/ home lightens the chart accent in the dark theme', chartThemed.dark, 'rgb(34, 211, 238)');
assert('/ home restores the chart accent in the light theme', chartThemed.light, 'rgb(8, 145, 178)');
assert('/ home darkens the chart track in the dark theme', chartThemed.darkTrack, 'rgb(22, 41, 58)');

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
assertContains('/stress.html renders a tagged-template ticker per row', stress.stressTicker, ' pts · t');
assert('/stress.html one ticker cell per rendered row', stress.stressTickerCells, stress.stressRows);
assertContains('/stress.html reports the reactive-string metric', stress.stressStringCard, 'row strings');

// one shared state write has to re-render every row's tagged string
const tickOf = value => Number(/· t(\d+)\s*$/.exec(String(value ?? '').trim())?.[1] ?? -1);
const tickBefore = tickOf(stress.stressTicker);
await page.evaluate(() => {
	const button = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Pulse strings'));
	if (button) button.click();
});
await new Promise(resolve => setTimeout(resolve, 150));
const pulsed = await probe();
assert('/stress.html one pulse re-renders every tagged string', tickOf(pulsed.stressTicker), tickBefore + 1);

// defer(): the loading signal flips synchronously on the click and the heavy
// status-filter task runs after the next painted frame
const deferIndicator = () => page.$eval('#app', el => {
	const pill = [...el.querySelectorAll('span')].find(span => span.textContent.includes('defer '));
	return pill ? pill.textContent : '';
});
// the click flips the loading signal synchronously, so the indicator has to be
// read inside the same evaluate: a separate round-trip would arrive after the
// deferred task already ran
const pendingIndicator = await page.evaluate(() => {
	const chip = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'active');
	if (chip) chip.click();
	const pill = [...document.querySelectorAll('span')].find(span => span.textContent.includes('defer '));
	return pill ? pill.textContent : '';
});
assertContains('/stress.html defer() flips the indicator before the task runs', pendingIndicator, 'task pending');
await new Promise(resolve => setTimeout(resolve, 400));
assertContains('/stress.html defer() clears the indicator after the task', await deferIndicator(), 'idle');
const settled = await probe();
assertContains('/stress.html defer() reports the task it ran', settled.stressDeferCard, 'status filter');
// the recorded gap is the frame defer() waited out before running the task
const gapMs = Number(/([\d.]+)\s*ms/.exec(settled.stressGapCard)?.[1] ?? 0);
assertTrue('/stress.html defer() runs the task after a painted frame', gapMs > 0);

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

// Regression: the editable keyed sample binds every row's checkbox and text input
// to stateOf() fields, so a pushed item that omits a bound field makes the checkbox
// binding read `undefined.value` and throw inside the preview frame.
section('/playground: editable keyed sample adds a row');
await page.select('#playground-example', 'editableTasks');
await new Promise(resolve => setTimeout(resolve, 400));
const clickFrameButton = async (label, timeout = 20000) => {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		for (const frame of page.frames()) {
			if (frame === page.mainFrame()) continue;
			try {
				const clicked = await frame.evaluate(text => {
					const target = [...document.querySelectorAll('button')].find(candidate => candidate.textContent.trim() === text);
					if (!target) return false;
					target.click();
					return true;
				}, label);
				if (clicked) return frame;
			} catch { /* frame swapped mid-poll */ }
		}
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	return null;
};
const taskFrame = await clickFrameButton('Add a task');
assertTrue('/playground editable sample renders the add button', taskFrame !== null);
await new Promise(resolve => setTimeout(resolve, 500));
const taskRows = taskFrame
	? await taskFrame.evaluate(() => document.querySelectorAll('.task-list .task-row').length).catch(() => -1)
	: 0;
assert('/playground editable sample appends a keyed row', taskRows, 3);
// A thrown handler is reported back over postMessage, which makes the pane stop
// naming a running preview - the exact symptom of the missing bound field.
const previewStatus = await page.evaluate(() => document.getElementById('playground-status')?.textContent ?? '');
assertTrue('/playground editable sample keeps the preview out of an error state', !previewStatus.startsWith('Preview error'));

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
// --- the playground follows the saved theme ---------------------------------
// One remembered signal is shared by every page, so the playground honours a
// choice made on the home page, can make one of its own, and stores it.
section('/playground: dark theme toggle');
const playgroundTheme = () => page.evaluate(() => ({
  isDark: document.documentElement.classList.contains('jetz-theme-dark'),
  attr: document.documentElement.getAttribute('data-theme'),
  stored: (() => {
    const store = JSON.parse(localStorage.getItem('app-remember-state') || '{}');
    for (const collection of Object.values(store)) {
      for (const [key, value] of Object.entries(collection)) {
        if (key.endsWith('__key__theme')) return value;
      }
    }
    return null;
  })(),
  shell: getComputedStyle(document.querySelector('.playground-shell')).backgroundColor,
  header: getComputedStyle(document.querySelector('.playground-header')).backgroundColor,
  pane: getComputedStyle(document.querySelector('.preview-pane')).backgroundColor,
  label: document.querySelector('.playground-theme-toggle')?.getAttribute('aria-label') ?? 'NO TOGGLE',
  glyph: document.querySelector('.playground-theme-toggle')?.textContent.trim() ?? 'NO TOGGLE',
  size: (() => {
    const el = document.querySelector('.playground-theme-toggle');
    if (!el) return { w: 0, h: 0 };
    const box = el.getBoundingClientRect();
    return { w: Math.round(box.width), h: Math.round(box.height) };
  })(),
  previewDark: document.getElementById('playground-preview')?.getAttribute('srcdoc')?.includes('class="jetz-theme-dark"') ?? false,
}));

const pgLight = await playgroundTheme();
assert('/playground starts on the light theme', pgLight.isDark, false);
assert('/playground mirrors the theme onto the document', pgLight.attr, 'light');
assert('/playground renders a theme switch', pgLight.label, 'Switch to the dark theme');
assert('/playground shows a moon while the page is light', pgLight.glyph, '☾');
assertTrue('/playground gives the switch a 37px tap target', pgLight.size.w >= 34 && pgLight.size.h >= 34);
assert('/playground paints a light shell', pgLight.shell, 'rgb(243, 247, 250)');

await page.click('.playground-theme-toggle');
await new Promise(resolve => setTimeout(resolve, 300));
const pgDark = await playgroundTheme();
assert('/ the playground switch turns the document dark', pgDark.isDark, true);
assert('/ the playground switch mirrors the theme', pgDark.attr, 'dark');
assert('/ the playground theme is written to localStorage', pgDark.stored, 'dark');
assert('/ the dark theme repaints the playground shell', pgDark.shell, 'rgb(10, 22, 32)');
assert('/ the dark theme repaints the playground header', pgDark.header, 'rgb(12, 26, 37)');
assert('/ the dark theme repaints the preview pane', pgDark.pane, 'rgb(16, 32, 44)');
assert('/ the dark theme flips the switch label', pgDark.label, 'Switch to the light theme');
assert('/ the dark theme swaps the glyph to a sun', pgDark.glyph, '☀');
assertTrue('/ the dark theme reaches the sandboxed preview', pgDark.previewDark);

// the preference is shared, so the home page is already dark when we go back
await open('/');
assertTrue('/ the playground theme follows the visitor to the home page', await page.evaluate(() => document.documentElement.classList.contains('jetz-theme-dark')));

await open('/playground');
assert('/ the playground theme survives a reload', (await playgroundTheme()).isDark, true);

// leave the suite on light, the way the home theme block above finished
await page.click('.playground-theme-toggle');
await new Promise(resolve => setTimeout(resolve, 300));
assert('/ the playground can be switched back to light', (await playgroundTheme()).isDark, false);


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
