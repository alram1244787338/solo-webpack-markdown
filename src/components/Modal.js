export class Modal {
  constructor() {
    this.confirmModal = document.querySelector('#confirmModal');
    this.confirmTitle = document.querySelector('#confirmTitle');
    this.confirmMessage = document.querySelector('#confirmMessage');
    this.confirmOk = document.querySelector('#okConfirm');
    this.confirmCancel = document.querySelector('#cancelConfirm');

    this.promptModal = document.querySelector('#renameModal');
    this.promptTitle = this.promptModal ? this.promptModal.querySelector('h3') : null;
    this.promptInput = document.querySelector('#renameInput');
    this.promptOk = document.querySelector('#confirmRename');
    this.promptCancel = document.querySelector('#cancelRename');

    this.confirmResolver = null;
    this.promptResolver = null;

    this.bindEvents();
  }

  bindEvents() {
    this.confirmOk.addEventListener('click', () => this.resolveConfirm(true));
    this.confirmCancel.addEventListener('click', () => this.resolveConfirm(false));
    this.confirmModal.addEventListener('click', (e) => {
      if (e.target === this.confirmModal) this.resolveConfirm(false);
    });

    this.promptOk.addEventListener('click', () => this.resolvePrompt(this.promptInput.value));
    this.promptCancel.addEventListener('click', () => this.resolvePrompt(null));
    this.promptModal.addEventListener('click', (e) => {
      if (e.target === this.promptModal) this.resolvePrompt(null);
    });

    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.resolvePrompt(this.promptInput.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.resolvePrompt(null);
      }
    });
  }

  resolveConfirm(result) {
    if (!this.confirmResolver) return;
    this.confirmModal.classList.add('hidden');
    const resolver = this.confirmResolver;
    this.confirmResolver = null;
    resolver(result);
  }

  resolvePrompt(value) {
    if (!this.promptResolver) return;
    this.promptModal.classList.add('hidden');
    const resolver = this.promptResolver;
    this.promptResolver = null;
    resolver(value);
  }

  confirm({ title = '确认操作', message = '确定要执行此操作吗？', okText = '确定', okType = 'danger' } = {}) {
    this.confirmTitle.textContent = title;
    this.confirmMessage.textContent = message;
    this.confirmOk.textContent = okText;
    this.confirmOk.className = `btn btn-${okType}`;
    this.confirmModal.classList.remove('hidden');
    return new Promise((resolve) => {
      this.confirmResolver = resolve;
    });
  }

  prompt({ title = '请输入', message = '', defaultValue = '', placeholder = '' } = {}) {
    if (this.promptTitle) this.promptTitle.textContent = title;
    if (this.promptModal) {
      const msgEl = this.promptModal.querySelector('.prompt-message');
      if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.display = message ? '' : 'none';
      }
    }
    this.promptInput.value = defaultValue;
    this.promptInput.placeholder = placeholder;
    this.promptModal.classList.remove('hidden');
    setTimeout(() => {
      this.promptInput.focus();
      this.promptInput.select();
    }, 0);
    return new Promise((resolve) => {
      this.promptResolver = resolve;
    });
  }
}
