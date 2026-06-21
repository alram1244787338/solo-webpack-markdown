import '../styles/preview.scss';
import '../styles/markdown-body.scss';

import { parseMarkdown } from '../utils/markdown.js';
import {
  getCurrentDocId,
  getDocumentById,
  getTheme,
  setTheme,
} from '../utils/storage.js';

class MarkdownPreviewApp {
  constructor() {
    this.previewBody = null;
    this.previewTitle = null;
    this.themeSelect = null;
    this.backBtn = null;
    this.currentTheme = 'light';

    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.currentTheme = getTheme() || 'light';
    this.applyTheme(this.currentTheme);
    this.renderDocument();
  }

  cacheElements() {
    this.previewBody = document.querySelector('#previewBody');
    this.previewTitle = document.querySelector('#previewTitle');
    this.themeSelect = document.querySelector('#previewThemeSelect');
    this.backBtn = document.querySelector('#backToEditor');
  }

  bindEvents() {
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        this.currentTheme = e.target.value;
        setTheme(this.currentTheme);
        this.applyTheme(this.currentTheme);
      });
    }
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      });
    }
    window.addEventListener('focus', () => this.renderDocument());
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.indexOf('markdown_editor') === 0) {
        this.renderDocument();
      }
    });
  }

  renderDocument() {
    const currentId = getCurrentDocId();
    let doc = null;
    if (currentId) {
      doc = getDocumentById(currentId);
    }
    if (!doc) {
      this.renderEmpty();
      return;
    }

    if (this.previewTitle) {
      this.previewTitle.textContent = doc.title || 'Markdown 预览';
    }
    document.title = `${doc.title || 'Markdown 预览'} - 预览`;

    const html = parseMarkdown(doc.content);
    if (this.previewBody) {
      this.previewBody.innerHTML = html;
    }
  }

  renderEmpty() {
    if (this.previewTitle) {
      this.previewTitle.textContent = 'Markdown 预览';
    }
    if (this.previewBody) {
      this.previewBody.innerHTML = `
        <div class="preview-empty">
          <div class="preview-empty-icon">📭</div>
          <p>没有可预览的文档</p>
          <p class="preview-empty-hint">请先在编辑器中打开或新建一个文档</p>
        </div>
      `;
    }
  }

  applyTheme(theme) {
    const app = document.querySelector('#previewApp') || document.body;
    app.classList.remove('theme-light', 'theme-dark', 'theme-eye');
    app.classList.add(`theme-${theme}`);
    if (this.themeSelect) {
      this.themeSelect.value = theme;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MarkdownPreviewApp();
});
