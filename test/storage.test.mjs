import {
  loadDocuments,
  saveDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  renameDocument,
  getCurrentDocId,
  setCurrentDocId,
  searchDocuments,
  getDocumentById,
  getTheme,
  setTheme,
} from '../src/utils/storage.js';

describe('storage.js — loadDocuments', () => {
  beforeEach(() => localStorage.clear());

  it('initializes with one default doc when storage is empty', () => {
    const docs = loadDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe('欢迎文档');
    expect(docs[0].content).toContain('欢迎使用 Markdown 编辑器');
    expect(docs[0].id).toBeTruthy();
  });

  it('persists the default doc to localStorage on first init', () => {
    loadDocuments();
    const raw = localStorage.getItem('markdown_editor_docs');
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw);
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('欢迎文档');
  });

  it('returns stored docs instead of re-initializing', () => {
    loadDocuments();
    const created = createDocument('我的文档');
    const docs = loadDocuments();
    expect(docs).toHaveLength(2);
    const titles = docs.map((d) => d.title);
    expect(titles).toContain('我的文档');
    expect(titles).toContain('欢迎文档');
  });

  it('returns empty array when storage holds []', () => {
    saveDocuments([]);
    const docs = loadDocuments();
    expect(docs).toHaveLength(0);
  });
});

describe('storage.js — createDocument', () => {
  beforeEach(() => localStorage.clear());

  it('creates a doc with default title', () => {
    const doc = createDocument();
    expect(doc.title).toBe('无标题文档');
    expect(doc.content).toBe('');
    expect(doc.id).toBeTruthy();
    expect(typeof doc.createdAt).toBe('number');
    expect(typeof doc.updatedAt).toBe('number');
  });

  it('prepends the new doc to the list', () => {
    loadDocuments();
    const first = createDocument('第一个');
    const second = createDocument('第二个');
    const docs = loadDocuments();
    expect(docs[0].id).toBe(second.id);
    expect(docs[1].id).toBe(first.id);
  });

  it('each created doc has a unique id', () => {
    const a = createDocument('a');
    const b = createDocument('b');
    expect(a.id).not.toBe(b.id);
  });
});

describe('storage.js — updateDocument', () => {
  beforeEach(() => localStorage.clear());

  it('merges updates and refreshes updatedAt', async () => {
    const doc = createDocument('原标题');
    const before = doc.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const updated = updateDocument(doc.id, { title: '新标题', content: '内容' });
    expect(updated.title).toBe('新标题');
    expect(updated.content).toBe('内容');
    expect(updated.updatedAt).toBeGreaterThan(before);
  });

  it('does not wipe unspecified fields', () => {
    const doc = createDocument('保留');
    const updated = updateDocument(doc.id, { content: '新内容' });
    expect(updated.title).toBe('保留');
    expect(updated.content).toBe('新内容');
  });

  it('returns null for unknown id', () => {
    expect(updateDocument('does-not-exist', { title: 'x' })).toBeNull();
  });

  it('renameDocument delegates to updateDocument', () => {
    const doc = createDocument('原名');
    const renamed = renameDocument(doc.id, '改名后');
    expect(renamed.title).toBe('改名后');
  });
});

describe('storage.js — deleteDocument', () => {
  beforeEach(() => localStorage.clear());

  it('removes only the targeted doc', () => {
    loadDocuments();
    const a = createDocument('A');
    const b = createDocument('B');
    const remaining = deleteDocument(a.id);
    const ids = remaining.map((d) => d.id);
    expect(ids).not.toContain(a.id);
    expect(ids).toContain(b.id);
  });

  it('allows deleting the last doc (returns empty list)', () => {
    saveDocuments([{ id: 'only', title: '唯一', content: '', createdAt: 1, updatedAt: 1 }]);
    const remaining = deleteDocument('only');
    expect(remaining).toHaveLength(0);
    expect(loadDocuments()).toHaveLength(0);
  });

  it('is a no-op for unknown id', () => {
    const a = createDocument('A');
    const remaining = deleteDocument('unknown');
    expect(remaining.map((d) => d.id)).toContain(a.id);
  });
});

describe('storage.js — searchDocuments', () => {
  beforeEach(() => {
    localStorage.clear();
    saveDocuments([
      { id: 'a', title: 'JavaScript Guide', content: 'about js', createdAt: 1, updatedAt: 1 },
      { id: 'b', title: 'Python Notes', content: 'about py', createdAt: 1, updatedAt: 1 },
      { id: 'c', title: 'Empty', content: '', createdAt: 1, updatedAt: 1 },
    ]);
  });

  it('returns all docs for a blank query', () => {
    expect(searchDocuments('')).toHaveLength(3);
    expect(searchDocuments('   ')).toHaveLength(3);
  });

  it('matches by title (case-insensitive)', () => {
    const results = searchDocuments('javascript');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript Guide');
  });

  it('matches by content', () => {
    const results = searchDocuments('py');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Python Notes');
  });

  it('returns empty array when nothing matches', () => {
    expect(searchDocuments('不存在的关键词')).toHaveLength(0);
  });
});

describe('storage.js — current doc id', () => {
  beforeEach(() => localStorage.clear());

  it('getCurrentDocId returns null by default', () => {
    expect(getCurrentDocId()).toBeNull();
  });

  it('setCurrentDocId / getCurrentDocId round-trip', () => {
    setCurrentDocId('abc123');
    expect(getCurrentDocId()).toBe('abc123');
  });
});

describe('storage.js — getDocumentById', () => {
  beforeEach(() => localStorage.clear());

  it('finds a doc by id', () => {
    const doc = createDocument('查找我');
    const found = getDocumentById(doc.id);
    expect(found).not.toBeNull();
    expect(found.title).toBe('查找我');
  });

  it('returns null for unknown id', () => {
    expect(getDocumentById('nope')).toBeNull();
  });
});

describe('storage.js — theme', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to light', () => {
    expect(getTheme()).toBe('light');
  });

  it('setTheme/getTheme round-trip', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
  });
});
