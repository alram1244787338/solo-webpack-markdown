export class Sidebar {
  constructor(container, options = {}) {
    this.container = container;
    this.docs = [];
    this.currentDocId = null;
    this.modal = options.modal;
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
    this.emptyState = this.container.querySelector('#docEmptyState');
    this.emptyNewBtn = this.container.querySelector('#emptyNewDocBtn');
  }

  bindEvents() {
    if (this.newDocBtn) {
      this.newDocBtn.addEventListener('click', () => this.handleNewDoc());
    }
    if (this.emptyNewBtn) {
      this.emptyNewBtn.addEventListener('click', () => this.handleNewDoc());
    }
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

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
    this.onDocCreate();
  }

  handleSearch(query) {
    this.onSearch = this.onSearch || (() => {});
    this.docs = this.onSearch(query);
    this.render();
  }

  setSearchSource(fn) {
    this.onSearch = fn;
  }

  async handleDeleteDoc(docId) {
    const doc = this.docs.find(d => d.id === docId);
    if (!doc) return;

    const ok = this.modal
      ? await this.modal.confirm({
          title: '删除文档',
          message: `确定要删除 "${doc.title}" 吗？此操作不可撤销。`,
          okText: '删除',
          okType: 'danger',
        })
      : confirm(`确定要删除 "${doc.title}" 吗？`);

    if (!ok) return;

    this.onDocDelete(docId);
  }

  async handleRenameDoc(docId) {
    const doc = this.docs.find(d => d.id === docId);
    if (!doc) return;

    let newTitle;
    if (this.modal) {
      newTitle = await this.modal.prompt({
        title: '重命名文档',
        message: '请输入新的文档名称：',
        defaultValue: doc.title,
        placeholder: '输入新名称...',
      });
    } else {
      newTitle = prompt('请输入新名称：', doc.title);
    }

    if (newTitle === null) return;
    newTitle = String(newTitle).trim();
    if (!newTitle || newTitle === doc.title) return;

    this.onDocRename(docId, newTitle);
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
      this.docList.innerHTML = '';
      if (this.emptyState) {
        this.emptyState.classList.remove('hidden');
      } else {
        this.docList.innerHTML = this.getEmptyStateHtml();
        this.emptyNewBtn = this.container.querySelector('#emptyNewDocBtn');
        if (this.emptyNewBtn) {
          this.emptyNewBtn.addEventListener('click', () => this.handleNewDoc());
        }
      }
      return;
    }

    if (this.emptyState) {
      this.emptyState.classList.add('hidden');
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

  getEmptyStateHtml() {
    return `
      <div class="doc-empty">
        <div class="doc-empty-icon">📭</div>
        <p class="doc-empty-text">还没有文档</p>
        <button class="btn btn-primary doc-empty-btn" id="emptyNewDocBtn">+ 新建文档</button>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
