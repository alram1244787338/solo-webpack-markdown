// Custom ESM loader for tests.
// 1) Redirects bare `dompurify` / `highlight.js` imports to local mocks
//    (these packages need a real DOM in Node; we mock them to test our own logic).
// 2) Forces project `.js` files under src/ to be parsed as ESM
//    (package.json has no "type": "module", so .js defaults to CommonJS).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC_MARKER = '/src/';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'dompurify') {
    return { url: new URL('./mocks/dompurify.mjs', import.meta.url).href, shortCircuit: true };
  }
  if (specifier === 'highlight.js') {
    return { url: new URL('./mocks/highlight.mjs', import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.includes(SRC_MARKER) && url.endsWith('.js')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
