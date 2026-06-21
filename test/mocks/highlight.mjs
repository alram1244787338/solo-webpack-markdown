// Mock for the `highlight.js` package.
// highlightCodeBlocks wraps code with the `hljs` class and calls hljs.highlightElement;
// we no-op the (DOM-dependent) highlighting and just record that it was called,
// keeping the test focused on our own wrapper logic.

const calls = [];

function highlightElement(block) {
  calls.push(block);
}

const hljs = { highlightElement, calls };

export default hljs;
export { highlightElement, calls };
