import { DocumentManager } from '../src/controllers/DocumentManager.js';
import {
  getDocumentById,
  getCurrentDocId,
  loadDocuments,
} from '../src/utils/storage.js';

function makeManager() {
  return new DocumentManager();
}

describe('DocumentManager — init / state accessors', () => {
  beforeEach(() => localStorage.clear());

  it('init loads docs and selects the first as current', () => {
    const dm = makeManager();
    dm.init();
    expect(dm.hasDocs()).toBe(true);
    expect(dm.getDocs().length).toBeGreaterThanOrEqual(1);
    expect(dm.getCurrentDoc()).not.toBeNull();
    expect(dm.getCurrentDoc().id).toBe(dm.getDocs()[0].id);
  });

  it('init persists current doc id', () => {
    const dm = makeManager();
    dm.init();
    expect(getCurrentDocId()).toBe(dm.getCurrentDoc().id);
  });

  it('init restores the previously selected doc when id is stored', () => {
    const dm1 = makeManager();
    dm1.init();
    const first = dm1.createDoc('优先文档');
    const id = first.id;

    const dm2 = makeManager();
    dm2.init();
    expect(dm2.getCurrentDoc().id).toBe(id);
  });

  it('hasDocs is false when all docs are deleted', () => {
    const dm = makeManager();
    dm.init();
    const id = dm.getCurrentDoc().id;
    dm.deleteDoc(id);
    expect(dm.hasDocs()).toBe(false);
    expect(dm.getCurrentDoc()).toBeNull();
  });
});

describe('DocumentManager — createDoc', () => {
  beforeEach(() => localStorage.clear());

  it('creates a doc, makes it current, and fires callbacks', () => {
    const dm = makeManager();
    dm.init();
    const docsChanges = [];
    const currentChanges = [];
    dm.onDocsChange = (docs) => docsChanges.push(docs.length);
    dm.onCurrentChange = (doc) => currentChanges.push(doc.id);

    const created = dm.createDoc('新建文档');
    expect(created.title).toBe('新建文档');
    expect(dm.getCurrentDoc().id).toBe(created.id);
    expect(getCurrentDocId()).toBe(created.id);
    expect(docsChanges.length).toBe(1);
    expect(currentChanges.length).toBe(1);
    expect(currentChanges[0]).toBe(created.id);
  });

  it('prepends the new doc to the in-memory list', () => {
    const dm = makeManager();
    dm.init();
    const created = dm.createDoc('新的');
    expect(dm.getDocs()[0].id).toBe(created.id);
  });
});

describe('DocumentManager — selectDoc', () => {
  beforeEach(() => localStorage.clear());

  it('switches current doc and fires onCurrentChange', () => {
    const dm = makeManager();
    dm.init();
    const original = dm.getCurrentDoc();
    const created = dm.createDoc('另一个');
    const currentChanges = [];
    dm.onCurrentChange = (doc) => currentChanges.push(doc.id);

    dm.selectDoc(original.id);
    expect(dm.getCurrentDoc().id).toBe(original.id);
    expect(getCurrentDocId()).toBe(original.id);
    expect(currentChanges).toEqual([original.id]);

    dm.selectDoc(created.id);
    expect(dm.getCurrentDoc().id).toBe(created.id);
    expect(currentChanges).toEqual([original.id, created.id]);
  });

  it('is a no-op for unknown id', () => {
    const dm = makeManager();
    dm.init();
    const before = dm.getCurrentDoc().id;
    let calls = 0;
    dm.onCurrentChange = () => calls += 1;
    dm.selectDoc('does-not-exist');
    expect(dm.getCurrentDoc().id).toBe(before);
    expect(calls).toBe(0);
  });

  it('is a no-op when selecting the already-current doc', () => {
    const dm = makeManager();
    dm.init();
    const id = dm.getCurrentDoc().id;
    let calls = 0;
    dm.onCurrentChange = () => calls += 1;
    dm.selectDoc(id);
    expect(calls).toBe(0);
  });
});

describe('DocumentManager — deleteDoc', () => {
  beforeEach(() => localStorage.clear());

  it('removes the doc from the in-memory list', () => {
    const dm = makeManager();
    dm.init();
    const created = dm.createDoc('待删除');
    const id = created.id;
    dm.deleteDoc(id);
    expect(dm.getDocs().find((d) => d.id === id)).toBeUndefined();
  });

  it('switches current to the first remaining doc when deleting current', () => {
    const dm = makeManager();
    dm.init();
    const defaultDoc = dm.getDocs()[0];
    dm.createDoc('二号');
    const third = dm.createDoc('三号');
    expect(dm.getCurrentDoc().id).toBe(third.id);

    const wasCurrent = dm.deleteDoc(third.id);
    expect(wasCurrent).toBe(true);
    expect(dm.hasDocs()).toBe(true);
    const remaining = dm.getDocs();
    expect(dm.getCurrentDoc().id).toBe(remaining[0].id);
    expect(remaining.find((d) => d.id === third.id)).toBeUndefined();
    expect(remaining.find((d) => d.id === defaultDoc.id)).toBeTruthy();
  });

  it('clears current when deleting the last doc', () => {
    const dm = makeManager();
    dm.init();
    const id = dm.getCurrentDoc().id;
    let lastChange = null;
    dm.onCurrentChange = (doc) => { lastChange = doc; };
    dm.deleteDoc(id);
    expect(dm.getCurrentDoc()).toBeNull();
    expect(getCurrentDocId()).toBe('');
    expect(lastChange).toBeNull();
  });

  it('does not fire onCurrentChange when deleting a non-current doc', () => {
    const dm = makeManager();
    dm.init();
    const first = dm.getDocs()[0];
    const created = dm.createDoc('二号');
    let currentCalls = 0;
    dm.onCurrentChange = () => currentCalls += 1;
    dm.deleteDoc(first.id);
    expect(currentCalls).toBe(0);
  });
});

describe('DocumentManager — renameDoc', () => {
  beforeEach(() => localStorage.clear());

  it('renames in memory and storage', () => {
    const dm = makeManager();
    dm.init();
    const id = dm.getCurrentDoc().id;
    const updated = dm.renameDoc(id, '改名后');
    expect(updated.title).toBe('改名后');
    expect(dm.getCurrentDoc().title).toBe('改名后');
    expect(getDocumentById(id).title).toBe('改名后');
  });

  it('returns null for unknown id', () => {
    const dm = makeManager();
    dm.init();
    expect(dm.renameDoc('nope', 'x')).toBeNull();
  });
});

describe('DocumentManager — content / title + save', () => {
  beforeEach(() => localStorage.clear());

  it('setContent mutates current doc content', () => {
    const dm = makeManager();
    dm.init();
    dm.setContent('新内容');
    expect(dm.getCurrentDoc().content).toBe('新内容');
  });

  it('setTitle defaults to 无标题文档 for falsy title', () => {
    const dm = makeManager();
    dm.init();
    dm.setTitle('');
    expect(dm.getCurrentDoc().title).toBe('无标题文档');
  });

  it('saveNow persists current content and title to storage', () => {
    const dm = makeManager();
    dm.init();
    const id = dm.getCurrentDoc().id;
    dm.setContent('持久化内容');
    dm.setTitle('持久化标题');
    const statuses = [];
    dm.onSaveStatusChange = (s) => statuses.push(s);
    dm.saveNow();
    expect(getDocumentById(id).content).toBe('持久化内容');
    expect(getDocumentById(id).title).toBe('持久化标题');
    expect(statuses).toContain('已保存');
  });

  it('scheduleSave reports 保存中 status', () => {
    const dm = makeManager();
    dm.init();
    dm.setContent('x');
    const statuses = [];
    dm.onSaveStatusChange = (s) => statuses.push(s);
    dm.scheduleSave();
    expect(statuses[0]).toBe('保存中...');
  });

  it('saveNow clears the pending debounce timer', () => {
    const dm = makeManager();
    dm.init();
    dm.setContent('x');
    dm.scheduleSave();
    expect(dm.saveTimer).not.toBeNull();
    dm.saveNow();
    expect(dm.saveTimer).toBeNull();
  });
});

describe('DocumentManager — search / persistAll', () => {
  beforeEach(() => localStorage.clear());

  it('search delegates to searchDocuments', () => {
    const dm = makeManager();
    dm.init();
    dm.createDoc('苹果笔记');
    expect(dm.search('苹果').length).toBe(1);
    expect(dm.search('').length).toBeGreaterThanOrEqual(2);
  });

  it('persistAll writes the in-memory list to storage', () => {
    const dm = makeManager();
    dm.init();
    dm.createDoc('额外');
    dm.persistAll();
    expect(loadDocuments().length).toBeGreaterThanOrEqual(2);
  });
});
