import '../styles/editor.scss';
import '../styles/markdown-body.scss';
import 'highlight.js/styles/github.css';

import { Sidebar } from '../components/Sidebar.js';
import { Toolbar } from '../components/Toolbar.js';
import { Editor } from '../components/Editor.js';
import { Preview } from '../components/Preview.js';

import {
  loadDocuments,
  updateDocument,
  getCurrentDocId,
  setCurrentDocId,
  getTheme,
  setTheme,
  getDocumentById,
} from '../utils/storage.js';

import { downloadMarkdown, downloadHtml } from '../utils/download.js';
import { generateHtmlDocument } from '../utils/markdown.js';
import { setupScrollSync } from '../utils/scrollSync.js';

class MarkdownEditorApp {
  constructor() {
    this.docs = [];
    this.currentDoc = null;
    this.sidebar = null;
    this.toolbar = null;
    this.editor = null;
    this.preview = null;
    this.scrollSync = null;
    this.saveTimer = null;
    this.isSidebarVisible = true;
    
    this.init();
  }

  init() {
    this.loadData();
    this.initComponents();
    this.bindGlobalEvents();
    this.applyTheme(this.currentTheme);
    this.loadCurrentDoc();
  }

  loadData() {
    this.docs = loadDocuments();
    this.currentTheme = getTheme();
    const currentDocId = getCurrentDocId();
    
    if (currentDocId) {
      const doc = getDocumentById(currentDocId);
      if (doc) {
        this.currentDoc = doc;
      }
    }
    
    if (!this.currentDoc && this.docs.length > 0) {
      this.currentDoc = this.docs[0];
      setCurrentDocId(this.currentDoc.id);
    }
  }

  initComponents() {
    const sidebarEl = document.querySelector('#sidebar');
    const toolbarEl = document.querySelector('.toolbar');
    const editorPaneEl = document.querySelector('.editor-pane');
    const previewPaneEl = document.querySelector('.preview-pane');
    
    this.sidebar = new Sidebar(sidebarEl, {
      onDocSelect: (doc) => this.handleDocSelect(doc),
      onDocCreate: (doc) => this.handleDocCreate(doc),
      onDocDelete: (docId) => this.handleDocDelete(docId),
      onDocRename: (doc) => this.handleDocRename(doc),
    });
    
    this.toolbar = new Toolbar(toolbarEl, {
      onFormat: (action) => this.handleFormat(action),
      onThemeChange: (theme) => this.handleThemeChange(theme),
      onExportMd: () => this.handleExportMd(),
      onExportHtml: () => this.handleExportHtml(),
      onOpenPreview: () => this.handleOpenPreview(),
      onToggleSidebar: () => this.handleToggleSidebar(),
    });
    
    this.editor = new Editor(editorPaneEl, {
      onChange: (content) => this.handleEditorChange(content),
      onScroll: () => this.handleEditorScroll(),
    });
    
    this.preview = new Preview(previewPaneEl, {
      onScroll: () => this.handlePreviewScroll(),
    });
    
    this.scrollSync = setupScrollSync(
      editorPaneEl.querySelector('#editor'),
      previewPaneEl.querySelector('#preview')
    );
  }

  bindGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveCurrentDoc();
      }
    });
  }

  loadCurrentDoc() {
    if (!this.currentDoc) return;
    
    this.sidebar.setDocs(this.docs);
    this.sidebar.setCurrentDocId(this.currentDoc.id);
    this.toolbar.setTitle(this.currentDoc.title);
    this.editor.setValue(this.currentDoc.content);
    this.preview.render(this.currentDoc.content);
  }

  handleDocSelect(doc) {
    this.saveCurrentDoc();
    this.currentDoc = doc;
    setCurrentDocId(doc.id);
    this.toolbar.setTitle(doc.title);
    this.editor.setValue(doc.content);
    this.preview.render(doc.content);
  }

  handleDocCreate(doc) {
    this.currentDoc = doc;
    setCurrentDocId(doc.id);
    this.sidebar.setCurrentDocId(doc.id);
    this.toolbar.setTitle(doc.title);
    this.editor.setValue(doc.content);
    this.preview.render(doc.content);
    this.editor.focus();
  }

  handleDocDelete(docId) {
    if (this.currentDoc && this.currentDoc.id === docId) {
      const remaining = this.docs.filter(d => d.id !== docId);
      if (remaining.length > 0) {
        this.currentDoc = remaining[0];
        setCurrentDocId(this.currentDoc.id);
        this.sidebar.setCurrentDocId(this.currentDoc.id);
        this.toolbar.setTitle(this.currentDoc.title);
        this.editor.setValue(this.currentDoc.content);
        this.preview.render(this.currentDoc.content);
      }
    }
  }

  handleDocRename(doc) {
    if (this.currentDoc && this.currentDoc.id === doc.id) {
      this.currentDoc.title = doc.title;
      this.toolbar.setTitle(doc.title);
    }
  }

  handleEditorChange(content) {
    this.preview.render(content);
    
    if (this.currentDoc) {
      this.currentDoc.content = content;
      this.scheduleSave();
    }
  }

  scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveCurrentDoc();
    }, 500);
  }

  saveCurrentDoc() {
    if (!this.currentDoc) return;
    
    const title = this.toolbar.getTitle() || '无标题文档';
    if (title !== this.currentDoc.title) {
      this.currentDoc.title = title;
    }
    
    updateDocument(this.currentDoc.id, {
      title: this.currentDoc.title,
      content: this.currentDoc.content,
    });
    
    this.updateSaveStatus('已保存');
  }

  updateSaveStatus(status) {
    const statusEl = document.querySelector('#saveStatus');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  handleFormat(action) {
    this.editor.applyFormat(action);
    this.editor.focus();
  }

  handleThemeChange(theme) {
    this.currentTheme = theme;
    setTheme(theme);
    this.applyTheme(theme);
  }

  applyTheme(theme) {
    const app = document.querySelector('#app');
    if (!app) return;
    
    app.classList.remove('theme-light', 'theme-dark', 'theme-eye');
    app.classList.add(`theme-${theme}`);
    
    this.toolbar.setTheme(theme);
  }

  handleExportMd() {
    if (!this.currentDoc) return;
    downloadMarkdown(this.currentDoc.content, this.currentDoc.title);
  }

  handleExportHtml() {
    if (!this.currentDoc) return;
    const htmlContent = generateHtmlDocument(
      this.currentDoc.content,
      this.currentDoc.title,
      this.currentTheme
    );
    downloadHtml(htmlContent, this.currentDoc.title);
  }

  handleOpenPreview() {
    const previewUrl = 'preview.html';
    window.open(previewUrl, '_blank');
  }

  handleToggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    const sidebar = document.querySelector('#sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (this.isSidebarVisible) {
      sidebar.style.display = '';
    } else {
      sidebar.style.display = 'none';
    }
  }

  handleEditorScroll() {
  }

  handlePreviewScroll() {
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MarkdownEditorApp();
});
