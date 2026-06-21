// Mock for the `dompurify` package.
// We test our own logic (marked parsing + html structure), not DOMPurify's sanitization,
// so sanitize is an identity pass-through that also records calls for assertions.

const calls = [];

function sanitize(html) {
  calls.push(html);
  return html;
}

const dompurify = { sanitize, calls };

export default dompurify;
export { sanitize, calls };
