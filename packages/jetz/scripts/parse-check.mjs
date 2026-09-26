import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
const target = process.argv[2] || 'src/components/landing/landing.js';
const code = readFileSync(target, 'utf8');
try {
  // Use acorn via espree-like check: node can parse module source via `import()`
  new Function(code.replace(/export\s+/g, ''));
  console.log('PARSE OK:', target);
} catch (e) {
  console.log('PARSE ERR:', target, '-', e.message.slice(0, 400));
}
