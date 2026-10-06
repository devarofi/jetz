import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "../src");

const files = (await readdir(srcDir))
    .filter(name => name.endsWith(".js") && !name.endsWith(".min.js"))
    .sort();

if (files.length === 0) {
    console.log("minify: no .js sources found in", srcDir);
    process.exit(0);
}

let totalBefore = 0;
let totalAfter = 0;

for (const name of files) {
    const input = path.join(srcDir, name);
    const output = path.join(srcDir, name.replace(/\.js$/, ".min.js"));
    const code = await readFile(input, "utf8");
    const result = await minify(code, {
        module: true,
        compress: { passes: 2 },
        mangle: true,
        format: { comments: false },
        sourceMap: {
            filename: path.basename(output),
            url: path.basename(output) + ".map",
        },
    });
    if (result.error) throw result.error;
    await writeFile(output, result.code, "utf8");
    await writeFile(output + ".map", result.map, "utf8");
    const before = (await stat(input)).size;
    const after = (await stat(output)).size;
    totalBefore += before;
    totalAfter += after;
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(`minify: ${name} -> ${path.basename(output)} (${before} -> ${after} bytes, -${saved}%)`);
}

console.log(`minify: total ${totalBefore} -> ${totalAfter} bytes (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
