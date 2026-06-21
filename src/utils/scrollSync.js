export function setupScrollSync(editor, preview) {
  let isSyncing = false;
  let lastScrollTop = 0;
  let direction = 0;

  function getScrollPercentage(element) {
    const scrollHeight = element.scrollHeight - element.clientHeight;
    if (scrollHeight === 0) return 0;
    return element.scrollTop / scrollHeight;
  }

  function setScrollPercentage(element, percentage) {
    const scrollHeight = element.scrollHeight - element.clientHeight;
    element.scrollTop = percentage * scrollHeight;
  }

  function syncFromEditor() {
    if (isSyncing) return;
    isSyncing = true;

    const currentScrollTop = editor.scrollTop;
    direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : 0;
    lastScrollTop = currentScrollTop;

    const percentage = getScrollPercentage(editor);
    setScrollPercentage(preview, percentage);

    requestAnimationFrame(() => {
      isSyncing = false;
    });
  }

  function syncFromPreview() {
    if (isSyncing) return;
    isSyncing = true;

    const percentage = getScrollPercentage(preview);
    setScrollPercentage(editor, percentage);

    requestAnimationFrame(() => {
      isSyncing = false;
    });
  }

  editor.addEventListener('scroll', syncFromEditor);
  preview.addEventListener('scroll', syncFromPreview);

  function destroy() {
    editor.removeEventListener('scroll', syncFromEditor);
    preview.removeEventListener('scroll', syncFromPreview);
  }

  function sync() {
    syncFromEditor();
  }

  return {
    sync,
    destroy,
    getDirection: () => direction,
  };
}

export function setupLineScrollSync(editor, preview, getLineMap) {
  let isSyncing = false;

  function getEditorLine() {
    const caretPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, caretPos);
    return textBefore.split('\n').length;
  }

  function syncScroll() {
    if (isSyncing) return;
    isSyncing = true;

    const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);

    requestAnimationFrame(() => {
      isSyncing = false;
    });
  }

  editor.addEventListener('scroll', syncScroll);
  editor.addEventListener('keyup', syncScroll);
  editor.addEventListener('click', syncScroll);

  function destroy() {
    editor.removeEventListener('scroll', syncScroll);
    editor.removeEventListener('keyup', syncScroll);
    editor.removeEventListener('click', syncScroll);
  }

  return {
    sync: syncScroll,
    destroy,
  };
}
