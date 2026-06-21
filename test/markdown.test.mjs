import { parseMarkdown, getPlainText, generateHtmlDocument } from '../src/utils/markdown.js';

describe('markdown.js — parseMarkdown basic rendering', () => {
  it('returns empty string for falsy input', () => {
    expect(parseMarkdown('')).toBe('');
    expect(parseMarkdown(null)).toBe('');
    expect(parseMarkdown(undefined)).toBe('');
  });

  it('renders headings', () => {
    expect(parseMarkdown('# 标题一')).toContain('<h1>标题一</h1>');
    expect(parseMarkdown('## 标题二')).toContain('<h2');
    expect(parseMarkdown('### 标题三')).toContain('<h3');
  });

  it('renders inline formatting', () => {
    const out = parseMarkdown('**粗体** 和 *斜体*');
    expect(out).toContain('<strong>粗体</strong>');
    expect(out).toContain('<em>斜体</em>');
  });

  it('renders links and images', () => {
    const out = parseMarkdown('[官网](https://example.com) ![图](https://img.png)');
    expect(out).toContain('<a href="https://example.com">官网</a>');
    expect(out).toContain('<img src="https://img.png" alt="图"');
  });

  it('renders lists', () => {
    const out = parseMarkdown('- 第一\n- 第二\n');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>第一</li>');
    expect(out).toContain('<li>第二</li>');
  });

  it('renders ordered lists', () => {
    const out = parseMarkdown('1. 第一\n2. 第二\n');
    expect(out).toContain('<ol>');
    expect(out).toContain('<li>第一</li>');
  });

  it('renders blockquotes', () => {
    const out = parseMarkdown('> 引用内容');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('引用内容');
  });

  it('renders tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |\n';
    const out = parseMarkdown(md);
    expect(out).toContain('<table>');
    expect(out).toContain('<th>A</th>');
    expect(out).toContain('<td>1</td>');
  });

  it('renders horizontal rules', () => {
    expect(parseMarkdown('---\n')).toContain('<hr');
  });
});

describe('markdown.js — parseMarkdown code highlighting wrapper', () => {
  it('adds hljs class + data-highlighted to fenced code blocks', () => {
    const out = parseMarkdown('```javascript\nconst x = 1;\n```\n');
    expect(out).toContain('<pre>');
    expect(out).toContain('<code');
    expect(out).toMatch(/class="[^"]*hljs[^"]*"/);
    expect(out).toContain('data-highlighted="yes"');
  });

  it('renders inline code', () => {
    expect(parseMarkdown('用 `console.log()` 输出')).toContain('<code>console.log()</code>');
  });

  it('does not double-highlight already-highlighted blocks', () => {
    const out = parseMarkdown('```js\nconst a = 1;\n```\n');
    const count = (out.match(/data-highlighted="yes"/g) || []).length;
    expect(count).toBe(1);
  });
});

describe('markdown.js — getPlainText', () => {
  it('returns empty string for falsy input', () => {
    expect(getPlainText('')).toBe('');
    expect(getPlainText(null)).toBe('');
    expect(getPlainText(undefined)).toBe('');
  });

  it('returns the source markdown unchanged (current passthrough behavior)', () => {
    const md = '# Title\n\nSome **bold** text.';
    expect(getPlainText(md)).toBe(md);
  });
});

describe('markdown.js — generateHtmlDocument', () => {
  it('produces a complete HTML document shell', () => {
    const doc = generateHtmlDocument('# Hi', '我的标题', 'light');
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<html');
    expect(doc).toContain('<title>我的标题</title>');
    expect(doc).toContain('<body class="theme-light">');
    expect(doc).toContain('</html>');
  });

  it('embeds the rendered markdown content', () => {
    const doc = generateHtmlDocument('# 标题\n\n正文', 'Doc', 'light');
    expect(doc).toContain('<h1>标题</h1>');
    expect(doc).toContain('正文');
  });

  it('uses the light hljs theme for light/eye themes', () => {
    expect(generateHtmlDocument('x', 't', 'light')).toContain('styles/github.min.css');
    expect(generateHtmlDocument('x', 't', 'eye')).toContain('styles/github.min.css');
  });

  it('uses the dark hljs theme for dark theme', () => {
    expect(generateHtmlDocument('x', 't', 'dark')).toContain('styles/github-dark.min.css');
    expect(generateHtmlDocument('x', 't', 'dark')).toContain('<body class="theme-dark">');
  });

  it('defaults title and theme when omitted', () => {
    const doc = generateHtmlDocument('# Hi');
    expect(doc).toContain('<title>Markdown Document</title>');
    expect(doc).toContain('<body class="theme-light">');
  });

  it('includes theme style block', () => {
    const doc = generateHtmlDocument('# Hi', 'T', 'dark');
    expect(doc).toContain('<style>');
    expect(doc).toContain('background-color');
  });
});
