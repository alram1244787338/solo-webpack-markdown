export class Editor {
  constructor(container, options = {}) {
    this.container = container;
    this.textarea = null;
    this.highlightLayer = null;
    this.onChange = options.onChange || (() => {});
    this.onScroll = options.onScroll || (() => {});
    this.debounceTimer = null;
    this.debounceDelay = options.debounceDelay || 100;
    
    this.init();
  }

  init() {
    this.textarea = this.container.querySelector('#editor');
    this.highlightLayer = this.container.querySelector('.editor-highlight');
    
    if (!this.highlightLayer) {
      this.highlightLayer = document.createElement('div');
      this.highlightLayer.className = 'editor-highlight';
      this.textarea.parentElement.insertBefore(this.highlightLayer, this.textarea);
    }
    
    this.bindEvents();
  }

  bindEvents() {
    this.textarea.addEventListener('input', () => {
      this.handleInput();
    });
    
    this.textarea.addEventListener('scroll', () => {
      this.syncScroll();
      this.onScroll();
    });
  }

  handleInput() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.onChange(this.getValue());
    }, this.debounceDelay);
  }

  syncScroll() {
    if (this.highlightLayer) {
      this.highlightLayer.scrollTop = this.textarea.scrollTop;
      this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    }
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(value) {
    this.textarea.value = value;
    this.onChange(value);
  }

  focus() {
    this.textarea.focus();
  }

  getSelection() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
    };
  }

  setSelection(start, end) {
    this.textarea.setSelectionRange(start, end);
    this.focus();
  }

  insertText(text, wrapSelection = false) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const selectedText = this.textarea.value.substring(start, end);
    
    let newText;
    let newCursorPos;
    
    if (wrapSelection && selectedText) {
      const wrapLen = text.length;
      newText = text + selectedText + text;
      newCursorPos = start + wrapLen + selectedText.length + wrapLen;
    } else {
      newText = text;
      newCursorPos = start + text.length;
    }
    
    const before = this.textarea.value.substring(0, start);
    const after = this.textarea.value.substring(end);
    
    this.textarea.value = before + newText + after;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.focus();
    this.handleInput();
    
    return { start, end: start + newText.length };
  }

  wrapText(before, after = before) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const selectedText = this.textarea.value.substring(start, end);
    
    const beforeText = this.textarea.value.substring(0, start);
    const afterText = this.textarea.value.substring(end);
    
    const newText = before + selectedText + after;
    this.textarea.value = beforeText + newText + afterText;
    
    const newStart = start + before.length;
    const newEnd = newStart + selectedText.length;
    this.textarea.setSelectionRange(newStart, newEnd);
    this.focus();
    this.handleInput();
  }

  insertLine(prefix, addNewline = true) {
    const start = this.textarea.selectionStart;
    const value = this.textarea.value;
    
    let lineStart = start;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    const before = value.substring(0, lineStart);
    const lineContent = value.substring(lineStart, start);
    const after = value.substring(start);
    
    const newLine = prefix + lineContent;
    this.textarea.value = before + newLine + after;
    
    const newCursorPos = lineStart + newLine.length;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.focus();
    this.handleInput();
  }

  applyFormat(action) {
    switch (action) {
      case 'bold':
        this.wrapText('**');
        break;
      case 'italic':
        this.wrapText('*');
        break;
      case 'strikethrough':
        this.wrapText('~~');
        break;
      case 'h1':
        this.insertLine('# ');
        break;
      case 'h2':
        this.insertLine('## ');
        break;
      case 'h3':
        this.insertLine('### ');
        break;
      case 'code':
        this.wrapText('`');
        break;
      case 'codeblock':
        this.insertText('\n```\n\n```\n');
        break;
      case 'quote':
        this.insertLine('> ');
        break;
      case 'table':
        this.insertText('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n');
        break;
      case 'ul':
        this.insertLine('- ');
        break;
      case 'ol':
        this.insertLine('1. ');
        break;
      case 'task':
        this.insertLine('- [ ] ');
        break;
      default:
        break;
    }
  }

  insertLink(text, url) {
    if (!url) return;
    const linkText = text || url;
    const markdown = `[${linkText}](${url})`;
    this.insertText(markdown);
  }

  insertImage(alt, url) {
    if (!url) return;
    const altText = alt || '图片';
    const markdown = `![${altText}](${url})`;
    this.insertText(markdown);
  }

  getScrollPercentage() {
    const scrollHeight = this.textarea.scrollHeight - this.textarea.clientHeight;
    if (scrollHeight === 0) return 0;
    return this.textarea.scrollTop / scrollHeight;
  }

  setScrollPercentage(percentage) {
    const scrollHeight = this.textarea.scrollHeight - this.textarea.clientHeight;
    this.textarea.scrollTop = percentage * scrollHeight;
  }
}
