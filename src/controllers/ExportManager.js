import { downloadMarkdown, downloadHtml } from '../utils/download.js';
import { generateHtmlDocument } from '../utils/markdown.js';

export class ExportManager {
  constructor(getCurrentDoc, getTheme) {
    this.getCurrentDoc = getCurrentDoc;
    this.getTheme = getTheme;
  }

  exportMarkdown() {
    const doc = this.getCurrentDoc();
    if (!doc) return;
    downloadMarkdown(doc.content, doc.title);
  }

  exportHtml() {
    const doc = this.getCurrentDoc();
    if (!doc) return;
    const html = generateHtmlDocument(doc.content, doc.title, this.getTheme());
    downloadHtml(html, doc.title);
  }

  openPreview() {
    window.open('preview.html', '_blank');
  }
}
