import { parseMarkdown } from '../utils/markdown.js';

export class Preview {
  constructor(container, options = {}) {
    this.container = container;
    this.previewElement = null;
    this.content = '';

    this.init();
  }

  init() {
    this.previewElement = this.container.querySelector('#preview');
    if (!this.previewElement) {
      this.previewElement = document.createElement('div');
      this.previewElement.id = 'preview';
      this.container.appendChild(this.previewElement);
    }
    this.previewElement.classList.add('preview');
    this.previewElement.classList.add('markdown-body');
  }

  render(markdown) {
    this.content = markdown;
    const html = parseMarkdown(markdown);
    this.previewElement.innerHTML = html;
  }

  getScrollPercentage() {
    const scrollHeight = this.previewElement.scrollHeight - this.previewElement.clientHeight;
    if (scrollHeight === 0) return 0;
    return this.previewElement.scrollTop / scrollHeight;
  }

  setScrollPercentage(percentage) {
    const scrollHeight = this.previewElement.scrollHeight - this.previewElement.clientHeight;
    this.previewElement.scrollTop = percentage * scrollHeight;
  }

  getElement() {
    return this.previewElement;
  }
}
