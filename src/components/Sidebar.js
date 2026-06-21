import { searchDocuments, createDocument, deleteDocument, renameDocument } from '../utils/storage.js';

export class Sidebar {
  constructor(container, options = {}) {
    this.container = container;
    this.docs = [];
    this.currentDocId = null;
    this.onDocSelect = options.onDocSelect || (() => {});
    this.onDocCreate = options.onDocCreate || (() => {});
    this.onDocDelete = options.onDocDelete || (() => {});
    this.onDocRename = options.onDocRename || (() => {});
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.newDocBtn = this.container.querySelector('#newDocBtn');
    this.searchInput = this.container.querySelector('#searchInput');
    this.docList = this.container.querySelector('#docList');
  }

  bindEvents() {
    this.newDocBtn.addEventListener('click', () => this.handleNewDoc());
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    this.docList.addEventListener('click', (e) => {
      const docItem = e.target.closest('.doc-item');
      if (!docItem) return;
      
      const docId = docItem.dataset.id;
      
      if (e.target.closest('.doc-delete')) {
        e.stopPropagation();
        this.handleDeleteDoc(docId);
      } else if (e.target.closest('.doc-rename')) {
        e.stopPropagation();
        this.handleRenameDoc(docId);
      } else {
        this.selectDoc(docId);
      }
    });
  }

  setDocs(docs) {
    this.docs = docs;
    this.render();
  }

  setCurrentDocId(id) {
    this.currentDocId = id;
    this.render();
  }

  handleNewDoc() {
    const newDoc = createDocument('无标题文档');
    this.docs.unshift(newDoc);
    this.render();
    this.onDocCreate(newDoc);
  }

  handleSearch(query) {
    const results = searchDocuments(query);
    this.docs = results;
    this.render();
  }

  handleDeleteDoc(docId) {
    const doc = this.docs.find(d => d.id === docId);
    if (!doc) return;
    
    if (this.docs.length <= 1) {
      alert('至少保留一篇文档');
      return;
    }
    
    if (confirm(`确定要删除 "${doc.title}" 吗？`)) {
      deleteDocument(docId);
      this.docs = this.docs.filter(d => d.id !== docId);
      this.render();
      this.onDocDelete(docId);
    }
  }

  handleRenameDoc(docId) {
    const doc = this.docs.find(d => d.id === docId);
    if (!doc) return;
    
    const newTitle = prompt('请输入新名称：', doc.title);
    if (newTitle && newTitle.trim() && newTitle !== doc.title) {
      const updated = renameDocument(docId, newTitle.trim());
      if (updated) {
        const index = this.docs.findIndex(d => d.id === docId);
        if (index !== -1) {
          this.docs[index] = updated;
        }
        this.render();
        this.onDocRename(updated);
      }
    }
  }

  selectDoc(docId) {
    if (docId === this.currentDocId) return;
    this.currentDocId = docId;
    this.render();
    const doc = this.docs.find(d => d.id === docId);
    if (doc) {
      this.onDocSelect(doc);
    }
  }

  render() {
    if (!this.docs.length) {
      this.docList.innerHTML = '<div class="doc-empty">暂无文档</div>';
      return;
    }
    
    const html = this.docs.map(doc => `
      <div class="doc-item ${doc.id === this.currentDocId ? 'active' : ''}" data-id="${doc.id}">
        <div class="doc-info">
          <span class="doc-icon">📄</span>
          <span class="doc-title">${this.escapeHtml(doc.title)}</span>
        </div>
        <div class="doc-actions">
          <button class="doc-rename" title="重命名">✏️</button>
          <button class="doc-delete" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');
    
    this.docList.innerHTML = html;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
