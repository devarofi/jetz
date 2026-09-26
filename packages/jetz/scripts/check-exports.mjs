import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

const modules = {
	'index': { target: 'jetz.js', reExport: './jetz.js' },
	'jetz': { target: 'jetz.js' },
	'jetz-ui': { target: 'jetz-ui.js' },
	'jetz-router': { target: 'jetz-router.js' },
	'jetz-session': { target: 'jetz-session.js' },
	'middleware': { target: 'middleware.js' },
	'jetz-test': { target: 'jetz-test.js' },
};

const runtimeFiles = ['jetz.js', 'jetz-ui.js', 'jetz-router.js', 'jetz-session.js', 'middleware.js', 'jetz-test.js'];

/** Collects the exported symbol names of a runtime module without executing its DOM code. */
function collectExports(file) {
	const source = readFileSync(join(srcDir, file), 'utf8');
	const names = new Set();
	for (const match of source.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+class\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	const block = source.match(/^export\s*\{([^}]+)\}\s*;?\s*$/m);
	if (block) {
		for (const part of block[1].split(',')) {
			const name = part.trim().split(/\s+as\s+/).pop().trim();
			if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
		}
	}
	const hasDefault = /export\s+default\s+/m.test(source);
	return { names: [...names].sort(), hasDefault };
}

/** Collects the exported symbol names of a TypeScript declaration (.d.ts) file. */
function collectDtsExports(file) {
	const source = readFileSync(join(srcDir, file), 'utf8');
	const names = new Set();
	for (const match of source.matchAll(/^export\s+declare\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+declare\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+declare\s+class\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	for (const match of source.matchAll(/^export\s+class\s+([A-Za-z_$][\w$]*)/gm)) names.add(match[1]);
	const blockMatches = source.matchAll(/^export\s*\{([^}]+)\}\s*;?\s*$/gm);
	for (const block of blockMatches) {
		for (const part of block[1].split(',')) {
			const name = part.trim().split(/\s+as\s+/).pop().trim();
			if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
		}
	}
	const hasDefault = /export\s+default\s+/m.test(source);
	const hasReExport = /export\s*\*\s*from\s*['"][^'"]+['"]/m.test(source);
	return { names, hasDefault, hasReExport };
}

let failed = false;

// 1. every subpath target exists; every runtime file is exported
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const targets = new Set(Object.values(pkg.exports).flatMap(entry =>
	typeof entry === 'string' ? [entry] : Object.values(entry).filter(v => typeof v === 'string' && v.endsWith('.js'))
));
for (const target of targets) {
	if (!existsSync(join(root, target))) {
		console.error(`missing export target: ${target}`);
		failed = true;
	}
}
for (const file of runtimeFiles) {
	if (![...targets].some(target => target.endsWith('/' + file))) {
		console.error(`runtime file not exported: src/${file}`);
		failed = true;
	}
}

// 2. internal relative imports carry the .js extension (Node ESM ready)
for (const file of runtimeFiles) {
	const source = readFileSync(join(srcDir, file), 'utf8');
	for (const match of source.matchAll(/from\s*(['"])([^'"]+)\1/g)) {
		const spec = match[2];
		if (spec.startsWith('./') && !spec.endsWith('.js')) {
			console.error(`${file}: extensionless import ${JSON.stringify(spec)}`);
			failed = true;
		}
	}
}

// 3. validate index.d.ts + per-module .d.ts coverage against real export names
for (const [name, { target, reExport }] of Object.entries(modules)) {
	const dtsFile = `${name}.d.ts`;
	const dtsPath = join(srcDir, dtsFile);
	if (!existsSync(dtsPath)) {
		console.error(`missing types file: ${dtsFile}`);
		failed = true;
		continue;
	}
	const { names: runtimeNames, hasDefault: runtimeDefault } = collectExports(target);
	const dts = collectDtsExports(dtsFile);

	if (reExport && dts.hasReExport) {
		console.log(`${dtsFile}: re-exports from ${reExport}`);
		continue;
	}

	const missing = runtimeNames.filter(sym => !dts.names.has(sym));
	if (missing.length > 0) {
		console.error(`${dtsFile}: missing type declarations for: ${missing.join(', ')}`);
		failed = true;
	} else {
		console.log(`${dtsFile}: ${runtimeNames.length} symbols verified`);
	}
	if (runtimeDefault && !dts.hasDefault) {
		console.error(`${dtsFile}: missing export default declaration`);
		failed = true;
	}
}

// 4. every .d.ts referenced by package.json exports exists
for (const target of targets) {
	if (!target.endsWith('.js')) {
		if (!existsSync(join(root, target))) {
			console.error(`missing types file: ${target}`);
			failed = true;
		}
	}
}

if (failed) {
	console.error('check-exports: FAILED');
	process.exit(1);
}
console.log('check-exports: OK');
