// Reports brace depth at every top-level function declaration and the first
// place depth goes negative. Handles strings, template literals (with ${}),
// and comments.
const fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8");

let i = 0;
let line = 1;
let depth = 0;
const modeStack = ["code"];

function bump() {
    if (src[i] === "\n") line++;
    i++;
}

while (i < src.length) {
    const mode = modeStack[modeStack.length - 1];

    if (mode === "sq" || mode === "dq") {
        const q = mode === "sq" ? "'" : '"';
        if (src[i] === "\\") { bump(); if (i < src.length) bump(); continue; }
        if (src[i] === q) { modeStack.pop(); bump(); continue; }
        if (src[i] === undefined) break;
        bump(); continue;
    }

    if (mode === "tmpl") {
        if (src[i] === "\\") { bump(); if (i < src.length) bump(); continue; }
        if (src[i] === "`") { modeStack.pop(); bump(); continue; }
        if (src[i] === "$" && src[i + 1] === "{") { depth++; modeStack.push("tmpl-expr"); bump(); bump(); continue; }
        bump(); continue;
    }

    if (mode === "tmpl-expr") {
        // fall through to code handling below, but `}` pops back to tmpl
    }

    // code mode (also used inside ${})
    if (src[i] === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (src[i] === "/" && src[i + 1] === "*") { bump(); bump(); while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) bump(); bump(); bump(); continue; }
    if (src[i] === "'") { modeStack.push("sq"); bump(); continue; }
    if (src[i] === '"') { modeStack.push("dq"); bump(); continue; }
    if (src[i] === "`") { modeStack.push("tmpl"); bump(); continue; }

    const before = src.lastIndexOf("\n", i - 1) + 1;
    const atLineStart = src.slice(before, i).trim() === "";

    if (atLineStart && /^(export\s+)?function\s/.test(src.slice(i))) {
        const m = src.slice(i).match(/^(export\s+)?function\s+([A-Za-z0-9_$]+)/);
        if (m) console.log(`line ${line}: depth=${depth}  ${m[0]}`);
    }

    if (src[i] === "{") { depth++; bump(); continue; }
    if (src[i] === "}") {
        depth--; bump();
        if (depth < 0) { console.log(`NEGATIVE depth at line ${line}`); process.exit(1); }
        if (mode === "tmpl-expr") { modeStack.pop(); }
        continue;
    }
    bump();
}

console.log(`end depth=${depth}`);
