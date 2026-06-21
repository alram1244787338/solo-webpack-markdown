import {
  loadDocuments,
  saveDocuments,
  createDocument as storageCreateDoc,
  updateDocument as storageUpdateDoc,
  deleteDocument as storageDeleteDoc,
  renameDocument as storageRenameDoc,
  getCurrentDocId,
  setCurrentDocId,
  searchDocuments,
  getDocumentById,
} from '../utils/storage.js';

const SAVE_DEBOUNCE_MS = 500;

export class DocumentManager {
  constructor() {
    this.docs = [];
    this.currentDoc = null;
    this.saveTimer = null;
    this.onDocsChange = () => {};
    this.onCurrentChange = () => {};
    this.onSaveStatusChange = () => {};
  }

  init() {
    this.docs = loadDocuments();
    const currentId = getCurrentDocId();
    if (currentId) {
      const doc = getDocumentById(currentId);
      if (doc) this.currentDoc = doc;
    }
    if (!this.currentDoc && this.docs.length > 0) {
      this.currentDoc = this.docs[0];
      setCurrentDocId(this.currentDoc.id);
    }
    return this;
  }

  getDocs() {
    return this.docs;
  }

  getCurrentDoc() {
    return this.currentDoc;
  }

  hasDocs() {
    return this.docs.length > 0;
  }

  selectDoc(id) {
    const doc = this.docs.find(d => d.id === id);
    if (!doc || doc.id === (this.currentDoc && this.currentDoc.id)) return;
    this.saveNow();
    this.currentDoc = doc;
    setCurrentDocId(doc.id);
    this.onCurrentChange(doc);
  }

  createDoc(title = '无标题文档') {
    const newDoc = storageCreateDoc(title);
    this.docs = loadDocuments();
    this.currentDoc = newDoc;
    setCurrentDocId(newDoc.id);
    this.onDocsChange(this.docs);
    this.onCurrentChange(newDoc);
    return newDoc;
  }

  deleteDoc(id) {
    storageDeleteDoc(id);
    this.docs = this.docs.filter(d => d.id !== id);

    const wasCurrent = this.currentDoc && this.currentDoc.id === id;
    if (wasCurrent) {
      this.currentDoc = this.docs.length > 0 ? this.docs[0] : null;
      if (this.currentDoc) {
        setCurrentDocId(this.currentDoc.id);
      } else {
        setCurrentDocId('');
      }
    }

    this.onDocsChange(this.docs);
    if (wasCurrent) {
      this.onCurrentChange(this.currentDoc);
    }
    return wasCurrent;
  }

  renameDoc(id, newTitle) {
    const updated = storageRenameDoc(id, newTitle);
    if (updated) {
      const index = this.docs.findIndex(d => d.id === id);
      if (index !== -1) this.docs[index] = updated;
      if (this.currentDoc && this.currentDoc.id === id) {
        this.currentDoc = updated;
        this.onCurrentChange(updated);
      }
      this.onDocsChange(this.docs);
    }
    return updated;
  }

  setContent(content) {
    if (!this.currentDoc) return;
    this.currentDoc.content = content;
    this.scheduleSave();
  }

  setTitle(title) {
    if (!this.currentDoc) return;
    this.currentDoc.title = title || '无标题文档';
    this.scheduleSave();
  }

  scheduleSave() {
    this.onSaveStatusChange('保存中...');
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveNow();
    }, SAVE_DEBOUNCE_MS);
  }

  saveNow() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (!this.currentDoc) return;
    storageUpdateDoc(this.currentDoc.id, {
      title: this.currentDoc.title,
      content: this.currentDoc.content,
    });
    this.onSaveStatusChange('已保存');
  }

  search(query) {
    return searchDocuments(query);
  }

  persistAll() {
    saveDocuments(this.docs);
  }
}
