const STORAGE_KEY = 'markdown_editor_docs';
const CURRENT_DOC_KEY = 'markdown_editor_current';
const THEME_KEY = 'markdown_editor_theme';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getDefaultContent() {
  return `# 欢迎使用 Markdown 编辑器

这是一个功能强大的 Markdown 编辑器，支持实时预览、多种主题和文件管理。

## 功能特点

- **实时预览** - 左右分栏，编辑即可看到渲染效果
- **多主题** - 支持浅色、深色和护眼三种主题
- **文件管理** - 新建、重命名、删除文档，自动保存
- **工具栏** - 常用格式一键插入
- **滚动同步** - 编辑区滚动时预览区同步滚动
- **导出功能** - 支持导出 HTML 和 Markdown 文件

## 快速开始

### 文本格式

**粗体文本** 和 *斜体文本*，~~删除线~~

### 列表

1. 第一项
2. 第二项
3. 第三项

- 无序列表项
- 另一项

### 代码

行内代码：\`console.log('Hello World')\`

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet('Markdown'));
\`\`\`

### 引用

> 这是一段引用文本。
> 可以跨越多行。

### 表格

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 粗体 | Ctrl+B | 加粗文本 |
| 斜体 | Ctrl+I | 倾斜文本 |
| 保存 | Ctrl+S | 保存文档 |

### 链接和图片

[访问 GitHub](https://github.com)

![示例图片](https://picsum.photos/600/300)

---

开始编辑你的文档吧！ 🚀
`;
}

export function loadDocuments() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load documents:', e);
  }
  
  const defaultDoc = {
    id: generateId(),
    title: '欢迎文档',
    content: getDefaultContent(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  const docs = [defaultDoc];
  saveDocuments(docs);
  return docs;
}

export function saveDocuments(docs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    return true;
  } catch (e) {
    console.error('Failed to save documents:', e);
    return false;
  }
}

export function createDocument(title = '无标题文档') {
  const docs = loadDocuments();
  const newDoc = {
    id: generateId(),
    title,
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  docs.unshift(newDoc);
  saveDocuments(docs);
  return newDoc;
}

export function updateDocument(id, updates) {
  const docs = loadDocuments();
  const index = docs.findIndex(d => d.id === id);
  if (index !== -1) {
    docs[index] = {
      ...docs[index],
      ...updates,
      updatedAt: Date.now(),
    };
    saveDocuments(docs);
    return docs[index];
  }
  return null;
}

export function deleteDocument(id) {
  const docs = loadDocuments();
  const filtered = docs.filter(d => d.id !== id);
  saveDocuments(filtered);
  return filtered;
}

export function renameDocument(id, newTitle) {
  return updateDocument(id, { title: newTitle });
}

export function getCurrentDocId() {
  return localStorage.getItem(CURRENT_DOC_KEY);
}

export function setCurrentDocId(id) {
  localStorage.setItem(CURRENT_DOC_KEY, id);
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function searchDocuments(query) {
  const docs = loadDocuments();
  if (!query.trim()) return docs;
  
  const lowerQuery = query.toLowerCase();
  return docs.filter(
    d =>
      d.title.toLowerCase().includes(lowerQuery) ||
      d.content.toLowerCase().includes(lowerQuery)
  );
}

export function getDocumentById(id) {
  const docs = loadDocuments();
  return docs.find(d => d.id === id) || null;
}
