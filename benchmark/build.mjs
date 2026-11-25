import { build, context } from 'esbuild';
import { watch } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';

const release = process.argv.includes('--release');
// --probe builds only the reconciler: a standalone measurement of ListState +
// loop(), not the four-arm comparison page. --serve builds and serves, which is
// what `npm run dev` does.
const probeOnly = process.argv.includes('--probe');
const serve = process.argv.includes('--serve');
const port = Number((process.argv.find(arg => arg.startsWith('--port=')) ?? '').split('=')[1]) || 8091;

await mkdir('dist', { recursive: true });

const shared = {
    bundle: true,
    format: 'iife',
    target: 'es2022',
    platform: 'browser',
    minify: release,
    sourcemap: release ? false : 'linked',
    // Framework code is ALWAYS the production build: React and Vue in development
    // mode carry warnings, prop checks and double-invoked renders, which would
    // make the numbers meaningless. `--release` only adds minification.
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'info'
};

const pages = [
    { src: 'src/index.html', out: 'dist/index.html', entry: 'src/main.js', bundle: 'dist/app.bundle.js' },
    { src: 'src/reorder.html', out: 'dist/reorder.html', entry: 'src/reorder.js', bundle: 'dist/reorder.bundle.js' }
].filter(page => !probeOnly || page.entry === 'src/reorder.js');

const optionsFor = page => ({ ...shared, entryPoints: [page.entry], outfile: page.bundle });

if (release || (probeOnly && !serve)) {
    for (const page of pages) {
        await copyFile(page.src, page.out);
        await build(optionsFor(page));
    }
} else {
    // esbuild only watches the module graph, and the HTML shells are not imported
    // by anything, so edits to them would otherwise need a server restart.
    for (const page of pages) {
        watch(page.src, async () => {
            try {
                await copyFile(page.src, page.out);
            } catch (error) {
                console.error(`${page.out} copy failed: ${error.message}`);
            }
        });
        await copyFile(page.src, page.out);
    }

    const contexts = [];
    for (const page of pages) contexts.push(await context(optionsFor(page)));
    for (const ctx of contexts) await ctx.watch();

    if (!serve) {
        console.log('\n  built (watch only) — add --serve to hand out dist/\n');
        process.exit(0);
    }

    // One server hands out dist/ for both pages; serve() only ever binds a port
    // once, so the remaining contexts contribute watch rebuilds only.
    const bound = await contexts[0].serve({ servedir: 'dist', port });
    console.log(`\n  benchmark ▸ http://localhost:${bound.port}/index.html`);
    console.log(`  reconciler probe ▸ http://localhost:${bound.port}/reorder.html\n`);
}
