# Markdown 编辑器

左右分栏实时预览的 Markdown 编辑器，纯前端实现，无需后端。

## 快速开始

```bash
npm install
npm run dev
```

然后在浏览器打开：<http://localhost:8080/editor.html>

## 功能

- **Markdown 实时预览** — 左栏编辑右栏即时渲染，代码块语法高亮
- **工具栏 12 种格式操作** — 加粗、斜体、删除线、H1/H2/H3 标题、链接、图片、行内代码、代码块、引用、表格、无序列表、有序列表、任务列表
- **多文档管理** — 新建、切换、重命名、删除（带二次确认），支持搜索
- **三套主题** — 浅色、深色、护眼，代码块配色跟随主题自动切换
- **自动保存** — 编辑内容自动存 localStorage，刷新不丢失
- **导出** — 一键导出 `.md` 和带样式的 `.html` 文件
- **独立预览页** — 点「预览」按钮在新标签页打开 `preview.html` 查看纯净渲染效果
- **滚动同步** — 编辑区滚动时预览区同步滚动

## 技术栈

- **构建**：Webpack 5（多入口、热更新、生产构建代码分割 / CSS 提取 / hash 命名）
- **语言**：Vanilla JavaScript（原生 ES Module）
- **样式**：SCSS（CSS 变量驱动主题切换）
- **Markdown 解析**：marked
- **代码高亮**：highlight.js（主题感知配色）
- **HTML 净化**：DOMPurify

## 目录结构

```
src/
├── components/            # 组件层（职责单一，仅处理自身 UI 和事件）
│   ├── Sidebar.js         # 文档列表、搜索、新建、重命名、删除、空状态
│   ├── Toolbar.js         # 顶部工具栏按钮 + 主题切换 + 导出
│   ├── Editor.js          # Markdown 编辑区 + 语法高亮层
│   ├── Preview.js         # 预览渲染区
│   └── Modal.js           # 通用弹窗（确认 / 输入）
├── controllers/           # 控制器层（纯逻辑，不依赖 DOM）
│   ├── DocumentManager.js # 文档增删改查、当前文档、防抖自动保存
│   ├── ThemeManager.js    # 主题归一化、切换、持久化
│   └── ExportManager.js   # .md / .html 导出
├── utils/                 # 工具层（纯函数）
│   ├── storage.js         # localStorage 封装
│   ├── markdown.js        # Markdown 解析、纯文本提取、完整 HTML 生成
│   └── editorHighlight.js # 编辑器区语法高亮正则匹配
├── styles/                # 样式
│   ├── _variables.scss    # 全局 SCSS 变量
│   ├── _highlight.scss    # 代码块主题感知配色
│   ├── _reset.scss        # 样式重置
│   ├── markdown-body.scss # Markdown 渲染区样式
│   ├── editor.scss        # 编辑器页样式
│   └── preview.scss       # 预览页样式
├── js/
│   ├── editor.js          # 编辑器页入口（轻量编排器）
│   └── preview.js         # 预览页入口
└── html/
    ├── editor.html        # 编辑器页模板
    └── preview.html       # 预览页模板

test/                      # 测试
├── runner.mjs             # 手写轻量测试运行器（describe/it/expect）
├── setup.mjs              # 全局变量注入（localStorage/DOM shim）
├── dom-shim.mjs           # 极简 DOM 实现（够跑纯逻辑）
├── loader.mjs             # 自定义 ESM loader（mock 重定向 + .js → ESM）
├── register-loader.mjs    # loader 注册入口
├── mocks/
│   ├── dompurify.mjs      # dompurify mock
│   └── highlight.mjs      # highlight.js mock
└── *.test.mjs             # 5 个测试套件，共 97 个用例
```

## 测试

```bash
npm test
```

97 个用例，覆盖以下模块的纯逻辑（不测 DOM 和 UI）：

- `storage.js` — loadDocuments 空数据初始化、createDocument、deleteDocument、updateDocument、searchDocuments 等
- `ThemeManager` — normalize 主题验证（合法 / 非法 / 空 / null / 大小写）、getTheme / setTheme 状态流转
- `markdown.js` — parseMarkdown 基本渲染、getPlainText 提取、generateHtmlDocument 完整 HTML 生成
- `editorHighlight.js` — highlightMarkdown 对常见语法的正则匹配、重叠优先级规则（代码块 / 图片 / 任务项 / 引用）
- `DocumentManager` — 不依赖 DOM 的纯逻辑（init / createDoc / selectDoc / deleteDoc / renameDoc / saveNow / scheduleSave / search / persistAll）

测试手写轻量 runner 实现，**零新增依赖**。

## 生产构建

```bash
npm run build
```

产物输出到 `dist/` 目录，包含代码压缩、CSS 提取、hash 命名、代码分割。

## 纯前端说明

本项目为纯前端应用，所有数据存储在浏览器 localStorage 中，无需任何后端服务即可运行。
