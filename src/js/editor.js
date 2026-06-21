import '../styles/editor.scss';
import '../styles/markdown-body.scss';

import { Sidebar } from '../components/Sidebar.js';
import { Toolbar } from '../components/Toolbar.js';
import { Editor } from '../components/Editor.js';
import { Preview } from '../components/Preview.js';
import { Modal } from '../components/Modal.js';

import { DocumentManager } from '../controllers/DocumentManager.js';
import { ThemeManager } from '../controllers/ThemeManager.js';
import { ExportManager } from '../controllers/ExportManager.js';

import { setupScrollSync } from '../utils/scrollSync.js';

class MarkdownEditorApp {
  constructor() {
    this.docManager = new DocumentManager();
    this.themeManager = new ThemeManager();
    this.modal = null;
    this.sidebar = null;
    this.toolbar = null;
    this.editor = null;
    this.preview = null;
    this.scrollSync = null;
    this.isSidebarVisible = true;

    this.init();
  }

  init() {
    this.docManager.init();
    this.themeManager.init();

    this.modal = new Modal();

    this.exportManager = new ExportManager(
      () => this.docManager.getCurrentDoc(),
      () => this.themeManager.getTheme()
    );

    this.initComponents();
    this.wireManagers();
    this.bindGlobalEvents();
    this.loadCurrentDoc();
  }

  initComponents() {
    const sidebarEl = document.querySelector('#sidebar');
    const toolbarEl = document.querySelector('.toolbar');
    const editorPaneEl = document.querySelector('.editor-pane');
    const previewPaneEl = document.querySelector('.preview-pane');

    this.sidebar = new Sidebar(sidebarEl, {
      modal: this.modal,
      onDocSelect: (doc) => this.handleDocSelect(doc),
      onDocCreate: () => this.handleDocCreate(),
      onDocDelete: (docId) => this.handleDocDelete(docId),
      onDocRename: (docId, newTitle) => this.handleDocRename(docId, newTitle),
    });
    this.sidebar.setSearchSource((query) => this.docManager.search(query));

    this.toolbar = new Toolbar(toolbarEl, {
      onFormat: (action) => this.handleFormat(action),
      onTitleChange: (title) => this.handleTitleChange(title),
      onThemeChange: (theme) => this.handleThemeChange(theme),
      onExportMd: () => this.exportManager.exportMarkdown(),
      onExportHtml: () => this.exportManager.exportHtml(),
      onOpenPreview: () => this.handleOpenPreview(),
      onToggleSidebar: () => this.handleToggleSidebar(),
    });

    this.editor = new Editor(editorPaneEl, {
      onChange: (content) => this.handleEditorChange(content),
    });

    this.preview = new Preview(previewPaneEl);

    this.scrollSync = setupScrollSync(
      editorPaneEl.querySelector('#editor'),
      previewPaneEl.querySelector('#preview')
    );
  }

  wireManagers() {
    this.docManager.onDocsChange = (docs) => {
      this.sidebar.setDocs(docs);
    };
    this.docManager.onCurrentChange = (doc) => {
      this.sidebar.setCurrentDocId(doc ? doc.id : null);
      this.toolbar.setTitle(doc ? doc.title : '');
      this.editor.setValue(doc ? doc.content : '');
      this.preview.render(doc ? doc.content : '');
      this.toggleEmptyEditorState(!doc);
    };
    this.docManager.onSaveStatusChange = (status) => this.updateSaveStatus(status);

    this.themeManager.onChange = (theme) => {
      this.toolbar.setTheme(theme);
    };
    this.toolbar.setTheme(this.themeManager.getTheme());
  }

  bindGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.docManager.saveNow();
      }
    });
    window.addEventListener('beforeunload', () => {
      this.docManager.saveNow();
    });
  }

  loadCurrentDoc() {
    this.sidebar.setDocs(this.docManager.getDocs());
    const current = this.docManager.getCurrentDoc();
    this.sidebar.setCurrentDocId(current ? current.id : null);
    this.toolbar.setTitle(current ? current.title : '');
    this.editor.setValue(current ? current.content : '');
    this.preview.render(current ? current.content : '');
    this.toggleEmptyEditorState(!current);
  }

  handleDocSelect(doc) {
    this.docManager.selectDoc(doc.id);
  }

  handleDocCreate() {
    this.docManager.createDoc('无标题文档');
    this.editor.focus();
  }

  handleDocDelete(docId) {
    this.docManager.deleteDoc(docId);
  }

  handleDocRename(docId, newTitle) {
    this.docManager.renameDoc(docId, newTitle);
  }

  handleEditorChange(content) {
    this.preview.render(content);
    this.docManager.setContent(content);
  }

  handleTitleChange(title) {
    this.docManager.setTitle(title);
    const current = this.docManager.getCurrentDoc();
    if (current) {
      this.sidebar.setDocs(this.docManager.getDocs());
      this.sidebar.setCurrentDocId(current.id);
    }
  }

  async handleFormat(action) {
    if (action === 'link') {
      await this.insertLinkViaModal();
      this.editor.focus();
      return;
    }
    if (action === 'image') {
      await this.insertImageViaModal();
      this.editor.focus();
      return;
    }
    this.editor.applyFormat(action);
    this.editor.focus();
  }

  async insertLinkViaModal() {
    const selection = this.editor.getSelection();
    const selectedText = this.editor.getValue().substring(selection.start, selection.end);

    let text;
    if (selectedText) {
      text = selectedText;
    } else {
      const inputText = await this.modal.prompt({
        title: '插入链接',
        message: '请输入链接显示文字：',
        placeholder: '链接文字...',
      });
      if (inputText === null) return;
      text = inputText.trim();
    }

    const url = await this.modal.prompt({
      title: '插入链接',
      message: '请输入链接地址（URL）：',
      placeholder: 'https://...',
    });
    if (url === null) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    this.editor.insertLink(text, trimmedUrl);
  }

  async insertImageViaModal() {
    const url = await this.modal.prompt({
      title: '插入图片',
      message: '请输入图片地址（URL）：',
      placeholder: 'https://...',
    });
    if (url === null) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const alt = await this.modal.prompt({
      title: '插入图片',
      message: '请输入图片描述（可留空）：',
      placeholder: '图片描述...',
    });
    if (alt === null) return;

    this.editor.insertImage(alt.trim(), trimmedUrl);
  }

  handleThemeChange(theme) {
    this.themeManager.setTheme(theme);
  }

  handleOpenPreview() {
    this.docManager.saveNow();
    this.exportManager.openPreview();
  }

  handleToggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    const sidebar = document.querySelector('#sidebar');
    if (sidebar) {
      sidebar.classList.toggle('sidebar-hidden', !this.isSidebarVisible);
    }
  }

  toggleEmptyEditorState(empty) {
    const editor = document.querySelector('#editor');
    const emptyState = document.querySelector('#editorEmptyState');
    if (empty) {
      if (editor) editor.disabled = true;
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (editor) editor.disabled = false;
      if (emptyState) emptyState.classList.add('hidden');
    }
  }

  updateSaveStatus(status) {
    const statusEl = document.querySelector('#saveStatus');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MarkdownEditorApp();
});
