export class Toolbar {
  constructor(container, options = {}) {
    this.container = container;
    this.onFormat = options.onFormat || (() => {});
    this.onTitleChange = options.onTitleChange || (() => {});
    this.onThemeChange = options.onThemeChange || (() => {});
    this.onExportMd = options.onExportMd || (() => {});
    this.onExportHtml = options.onExportHtml || (() => {});
    this.onOpenPreview = options.onOpenPreview || (() => {});
    this.onToggleSidebar = options.onToggleSidebar || (() => {});
    this.currentTheme = 'light';
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.toggleSidebarBtn = this.container.querySelector('#toggleSidebar');
    this.docTitleInput = this.container.querySelector('#docTitle');
    this.themeSelect = this.container.querySelector('#themeSelect');
    this.exportMdBtn = this.container.querySelector('#exportMd');
    this.exportHtmlBtn = this.container.querySelector('#exportHtml');
    this.openPreviewBtn = this.container.querySelector('#openPreview');
    this.formatButtons = this.container.querySelectorAll('.btn-format');
  }

  bindEvents() {
    this.toggleSidebarBtn.addEventListener('click', () => this.onToggleSidebar());
    
    this.docTitleInput.addEventListener('input', (e) => {
      this.onTitleChange(e.target.value);
    });
    
    this.formatButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.onFormat(action);
      });
    });
    
    this.themeSelect.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
      this.onThemeChange(e.target.value);
    });
    
    this.exportMdBtn.addEventListener('click', () => this.onExportMd());
    this.exportHtmlBtn.addEventListener('click', () => this.onExportHtml());
    this.openPreviewBtn.addEventListener('click', () => this.onOpenPreview());
    
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.onFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            this.onFormat('italic');
            break;
          case 's':
            e.preventDefault();
            this.onFormat('strikethrough');
            break;
        }
      }
    });
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.themeSelect.value = theme;
  }

  setTitle(title) {
    this.docTitleInput.value = title;
  }

  getTitle() {
    return this.docTitleInput.value;
  }
}
