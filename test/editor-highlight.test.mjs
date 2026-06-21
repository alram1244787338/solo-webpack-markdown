import { highlightMarkdown } from '../src/utils/editorHighlight.js';

describe('editorHighlight.js — highlightMarkdown basic cases', () => {
  it('returns empty string for falsy input', () => {
    expect(highlightMarkdown('')).toBe('');
    expect(highlightMarkdown(null)).toBe('');
    expect(highlightMarkdown(undefined)).toBe('');
  });

  it('escapes HTML special characters', () => {
    expect(highlightMarkdown('a <b> & c')).toBe('a &lt;b&gt; &amp; c');
  });

  it('wraps headings', () => {
    expect(highlightMarkdown('# 标题')).toBe('<span class="md-heading"># 标题</span>');
    expect(highlightMarkdown('## 二级')).toContain('<span class="md-heading">## 二级</span>');
  });

  it('wraps bold', () => {
    expect(highlightMarkdown('**粗体**')).toBe('<span class="md-bold">**粗体**</span>');
    expect(highlightMarkdown('__下划线粗__')).toBe('<span class="md-bold">__下划线粗__</span>');
  });

  it('wraps italic', () => {
    expect(highlightMarkdown('这是 *斜体* 文本')).toBe(
      '这是<span class="md-italic"> *斜体*</span> 文本'
    );
  });

  it('wraps strikethrough', () => {
    expect(highlightMarkdown('~~删除~~')).toBe(
      '<span class="md-strikethrough">~~删除~~</span>'
    );
  });

  it('wraps inline code', () => {
    expect(highlightMarkdown('用 `code` 输出')).toBe(
      '用 <span class="md-code-inline">`code`</span> 输出'
    );
  });

  it('wraps links', () => {
    expect(highlightMarkdown('[官网](https://e.com)')).toBe(
      '<span class="md-link">[官网](https://e.com)</span>'
    );
  });

  it('wraps images', () => {
    expect(highlightMarkdown('![图](https://i.png)')).toBe(
      '<span class="md-image">![图](https://i.png)</span>'
    );
  });

  it('wraps list bullets', () => {
    expect(highlightMarkdown('- 列表项')).toBe('<span class="md-list">- </span>列表项');
    expect(highlightMarkdown('1. 有序')).toBe('<span class="md-list">1. </span>有序');
  });

  it('wraps quotes', () => {
    const out = highlightMarkdown('> 引用');
    expect(out).toContain('<span class="md-quote">');
    expect(out).toContain('引用');
    expect(out).toContain('&gt;');
  });

  it('wraps horizontal rules', () => {
    expect(highlightMarkdown('---')).toBe('<span class="md-hr">---</span>');
  });

  it('wraps task list items', () => {
    expect(highlightMarkdown('- [x] 完成')).toBe('<span class="md-task">- [x] 完成</span>');
    expect(highlightMarkdown('- [ ] 未完成')).toBe('<span class="md-task">- [ ] 未完成</span>');
  });

  it('wraps table rows', () => {
    const out = highlightMarkdown('| A | B |\n|---|---|');
    expect(out).toContain('<span class="md-table">| A | B |</span>');
    expect(out).toContain('<span class="md-table">|---|---|</span>');
  });
});

describe('editorHighlight.js — overlap / precedence rules', () => {
  it('does not corrupt fenced code blocks with inline-code spans', () => {
    const out = highlightMarkdown('```js\nconst a = 1;\n```\n');
    expect(out).toContain('<span class="md-code-block">');
    expect(out).toContain('```js');
    expect(out).toContain('const a = 1;');
    expect(out).not.toContain('md-code-inline');
  });

  it('does not double-wrap images with link spans', () => {
    const out = highlightMarkdown('![图](https://i.png)');
    expect(out).toBe('<span class="md-image">![图](https://i.png)</span>');
    expect(out).not.toContain('md-link');
  });

  it('does not corrupt task items with list spans', () => {
    const out = highlightMarkdown('- [x] 完成');
    expect(out).toBe('<span class="md-task">- [x] 完成</span>');
    expect(out).not.toContain('md-list');
  });

  it('keeps inline formatting in normal list items', () => {
    const out = highlightMarkdown('- **粗**');
    expect(out).toContain('<span class="md-list">- </span>');
    expect(out).toContain('<span class="md-bold">**粗**</span>');
  });

  it('renders a mixed document without producing broken tags', () => {
    const md = '# 标题\n\n**粗** 和 `code`\n\n- 项一\n\n> 引用\n';
    const out = highlightMarkdown(md);
    expect(out).toContain('md-heading');
    expect(out).toContain('md-bold');
    expect(out).toContain('md-code-inline');
    expect(out).toContain('md-list');
    expect(out).toContain('md-quote');
    const opens = (out.match(/<span\b/g) || []).length;
    const closes = (out.match(/<\/span>/g) || []).length;
    expect(opens).toBe(closes);
    expect(out).not.toContain('class="md-</span>');
  });
});
