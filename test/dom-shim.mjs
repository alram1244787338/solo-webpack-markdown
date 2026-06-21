// Minimal DOM shim sufficient for testing DOM-dependent pure logic
// (markdown.js parseMarkdown, editorHighlight.js escapeHtml, ThemeManager.apply).
// NOT a full DOM — only what these functions touch.

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeHtmlText(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function dashToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function camelToDash(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

class ClassList {
  constructor(el) { this.el = el; }
  _list() {
    const c = this.el.getAttribute('class');
    return c ? c.split(/\s+/).filter(Boolean) : [];
  }
  _set(list) {
    if (list.length) this.el.setAttribute('class', list.join(' '));
    else this.el.removeAttribute('class');
  }
  add(...tokens) {
    const list = this._list();
    for (const t of tokens) if (!list.includes(t)) list.push(t);
    this._set(list);
  }
  remove(...tokens) {
    this._set(this._list().filter((x) => !tokens.includes(x)));
  }
  contains(t) { return this._list().includes(t); }
}

class Element {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this._classList = null;
    this._dataset = null;
  }

  get classList() {
    if (!this._classList) this._classList = new ClassList(this);
    return this._classList;
  }

  get dataset() {
    if (!this._dataset) {
      const target = {};
      for (const [k, v] of this.attributes) {
        if (k.startsWith('data-')) target[dashToCamel(k.slice(5))] = v;
      }
      this._dataset = new Proxy(target, {
        set: (obj, prop, value) => {
          this.setAttribute('data-' + camelToDash(String(prop)), String(value));
          obj[prop] = value;
          return true;
        },
      });
    }
    return this._dataset;
  }

  setAttribute(name, value) { this.attributes.set(String(name), String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  set textContent(text) {
    this.children = [{ text: escapeHtmlText(text) }];
  }
  get textContent() {
    return this.children
      .map((c) => (c instanceof Element ? c.textContent : unescapeHtmlText(c.text)))
      .join('');
  }

  set innerHTML(html) {
    this.children = parseHTML(String(html));
  }
  get innerHTML() {
    return this.children.map((c) => (c instanceof Element ? c.outerHTML : c.text)).join('');
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = [...this.attributes].map(([k, v]) => ` ${k}="${v}"`).join('');
    if (VOID_TAGS.has(tag)) return `<${tag}${attrs}>`;
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  querySelectorAll(selector) {
    const parts = String(selector).trim().split(/\s+/);
    let current = [this];
    for (const part of parts) {
      const next = [];
      for (const node of current) {
        walk(node, (child) => {
          if (matchesSelector(child, part)) next.push(child);
        });
      }
      current = next;
    }
    return current;
  }

  querySelector(selector) {
    const r = this.querySelectorAll(selector);
    return r.length ? r[0] : null;
  }
}

function walk(el, cb) {
  for (const child of el.children) {
    if (child instanceof Element) {
      cb(child);
      walk(child, cb);
    }
  }
}

function matchesSelector(el, selector) {
  if (selector.startsWith('#')) return el.getAttribute('id') === selector.slice(1);
  if (selector.startsWith('.')) return el.classList.contains(selector.slice(1));
  return el.tagName.toLowerCase() === selector.toLowerCase();
}

function parseAttrs(el, attrStr) {
  const re = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*"([^"]*)"|'([^']*)'|([^\s>]+))?/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1];
    const value = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : '';
    el.setAttribute(name, value);
  }
}

function parseHTML(html) {
  const root = { children: [] };
  const stack = [root];
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    if (m.index > last) {
      stack[stack.length - 1].children.push({ text: html.slice(last, m.index) });
    }
    const [, closing, tagRaw, attrStr] = m;
    const tag = tagRaw.toLowerCase();
    if (closing === '/') {
      if (stack.length > 1) stack.pop();
    } else {
      const el = new Element(tag);
      parseAttrs(el, attrStr);
      stack[stack.length - 1].children.push(el);
      const selfClose = /\/\s*$/.test(attrStr) || VOID_TAGS.has(tag);
      if (!selfClose) stack.push(el);
    }
    last = tagRe.lastIndex;
  }
  if (last < html.length) {
    stack[stack.length - 1].children.push({ text: html.slice(last) });
  }
  return root.children;
}

class DocumentShim {
  constructor() {
    this.documentElement = new Element('html');
  }
  createElement(tag) { return new Element(tag); }
  createTextNode(text) { return { text: escapeHtmlText(text) }; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getElementById() { return null; }
}

const documentShim = new DocumentShim();
const windowShim = { document: documentShim };

export { Element, DocumentShim, documentShim as document, windowShim as window };
