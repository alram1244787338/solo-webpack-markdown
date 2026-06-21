import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

function highlightCodeBlocks(container) {
  container.querySelectorAll('pre code').forEach((block) => {
    if (block.dataset.highlighted) return;
    block.classList.add('hljs');
    try {
      hljs.highlightElement(block);
    } catch (err) {
      console.error('Highlight error:', err);
    }
    block.dataset.highlighted = 'yes';
  });
  return container;
}

export function parseMarkdown(markdown) {
  if (!markdown) return '';
  const html = marked.parse(markdown);
  const sanitized = DOMPurify.sanitize(html);

  const container = document.createElement('div');
  container.innerHTML = sanitized;
  highlightCodeBlocks(container);

  return container.innerHTML;
}

export function getPlainText(markdown) {
  if (!markdown) return '';
  return markdown;
}

export function generateHtmlDocument(markdown, title = 'Markdown Document', theme = 'light') {
  const content = parseMarkdown(markdown);
  const themeStyles = getThemeStyles(theme);
  const hljsTheme = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${themeStyles}
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${hljsTheme}">
</head>
<body class="theme-${theme}">
  <div class="markdown-body">
    ${content}
  </div>
</body>
</html>`;
}

function getThemeStyles(theme) {
  const styles = {
    light: `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #ffffff;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .markdown-body h1, .markdown-body h2, .markdown-body h3,
      .markdown-body h4, .markdown-body h5, .markdown-body h6 {
        margin: 24px 0 16px;
        font-weight: 600;
        line-height: 1.25;
      }
      .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
      .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
      .markdown-body h3 { font-size: 1.25em; }
      .markdown-body p { margin: 16px 0; }
      .markdown-body code {
        background: #f6f8fa;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
      }
      .markdown-body pre {
        background: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 16px 0;
      }
      .markdown-body pre code {
        background: transparent;
        padding: 0;
      }
      .markdown-body blockquote {
        border-left: 4px solid #dfe2e5;
        padding: 0 1em;
        color: #6a737d;
        margin: 16px 0;
      }
      .markdown-body table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      .markdown-body th, .markdown-body td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
      }
      .markdown-body th { background: #f6f8fa; font-weight: 600; }
      .markdown-body tr:nth-child(2n) { background: #f6f8fa; }
      .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 16px 0; }
      .markdown-body img { max-width: 100%; }
      .markdown-body a { color: #0366d6; text-decoration: none; }
      .markdown-body a:hover { text-decoration: underline; }
      .markdown-body hr { border: 0; border-top: 1px solid #eaecef; margin: 24px 0; }
    `,
    dark: `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #e1e4e8;
        background-color: #0d1117;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .markdown-body h1, .markdown-body h2, .markdown-body h3,
      .markdown-body h4, .markdown-body h5, .markdown-body h6 {
        margin: 24px 0 16px;
        font-weight: 600;
        line-height: 1.25;
        color: #e1e4e8;
      }
      .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
      .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
      .markdown-body h3 { font-size: 1.25em; }
      .markdown-body p { margin: 16px 0; }
      .markdown-body code {
        background: #21262d;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
        color: #e1e4e8;
      }
      .markdown-body pre {
        background: #161b22;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 16px 0;
      }
      .markdown-body pre code { background: transparent; padding: 0; }
      .markdown-body blockquote {
        border-left: 4px solid #3b4048;
        padding: 0 1em;
        color: #8b949e;
        margin: 16px 0;
      }
      .markdown-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
      .markdown-body th, .markdown-body td { border: 1px solid #30363d; padding: 6px 13px; }
      .markdown-body th { background: #161b22; font-weight: 600; }
      .markdown-body tr:nth-child(2n) { background: #161b22; }
      .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 16px 0; }
      .markdown-body img { max-width: 100%; }
      .markdown-body a { color: #58a6ff; text-decoration: none; }
      .markdown-body a:hover { text-decoration: underline; }
      .markdown-body hr { border: 0; border-top: 1px solid #30363d; margin: 24px 0; }
    `,
    eye: `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #334d33;
        background-color: #c7edcc;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .markdown-body h1, .markdown-body h2, .markdown-body h3,
      .markdown-body h4, .markdown-body h5, .markdown-body h6 {
        margin: 24px 0 16px;
        font-weight: 600;
        line-height: 1.25;
        color: #2d4a2d;
      }
      .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #a8d5b0; padding-bottom: 0.3em; }
      .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #a8d5b0; padding-bottom: 0.3em; }
      .markdown-body h3 { font-size: 1.25em; }
      .markdown-body p { margin: 16px 0; }
      .markdown-body code {
        background: #b8e0bf;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
        color: #2d4a2d;
      }
      .markdown-body pre {
        background: #b8e0bf;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 16px 0;
      }
      .markdown-body pre code { background: transparent; padding: 0; }
      .markdown-body blockquote {
        border-left: 4px solid #8fc498;
        padding: 0 1em;
        color: #4a6b4a;
        margin: 16px 0;
      }
      .markdown-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
      .markdown-body th, .markdown-body td { border: 1px solid #a8d5b0; padding: 6px 13px; }
      .markdown-body th { background: #b8e0bf; font-weight: 600; }
      .markdown-body tr:nth-child(2n) { background: #b8e0bf; }
      .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 16px 0; }
      .markdown-body img { max-width: 100%; }
      .markdown-body a { color: #2d7a2d; text-decoration: none; }
      .markdown-body a:hover { text-decoration: underline; }
      .markdown-body hr { border: 0; border-top: 1px solid #a8d5b0; margin: 24px 0; }
    `,
  };
  return styles[theme] || styles.light;
}
