const tokenTypes = {
  heading: {
    regex: /^(#{1,6})\s+.+$/gm,
    className: 'md-heading',
  },
  bold: {
    regex: /\*\*[^*]+\*\*|__[^_]+__/g,
    className: 'md-bold',
  },
  italic: {
    regex: /(^|[^*])\*[^*\n]+\*(?!\*)|(^|[^_])_[^_\n]+_(?!_)/g,
    className: 'md-italic',
  },
  strikethrough: {
    regex: /~~[^~]+~~/g,
    className: 'md-strikethrough',
  },
  codeInline: {
    regex: /`[^`]+`/g,
    className: 'md-code-inline',
  },
  codeBlock: {
    regex: /```[\s\S]*?```/g,
    className: 'md-code-block',
  },
  link: {
    regex: /\[([^\]]+)\]\(([^)]+)\)/g,
    className: 'md-link',
  },
  image: {
    regex: /!\[([^\]]*)\]\(([^)]+)\)/g,
    className: 'md-image',
  },
  list: {
    regex: /^(\s*[-*+]|\s*\d+\.)\s+/gm,
    className: 'md-list',
  },
  quote: {
    regex: /^>\s+.+$/gm,
    className: 'md-quote',
  },
  hr: {
    regex: /^---+$|^\*\*\*+$/gm,
    className: 'md-hr',
  },
  table: {
    regex: /^\|.*\|$/gm,
    className: 'md-table',
  },
  task: {
    regex: /^\s*-\s*\[[ xX]\]\s+.+$/gm,
    className: 'md-task',
  },
};

export function highlightMarkdown(text) {
  if (!text) return '';
  
  let result = escapeHtml(text);
  
  const replacements = [];
  
  for (const [type, config] of Object.entries(tokenTypes)) {
    let match;
    const regex = new RegExp(config.regex.source, config.regex.flags);
    
    while ((match = regex.exec(result)) !== null) {
      const isInsideCodeBlock = isInside(match.index, 'md-code-block', replacements);
      const isInsideInlineCode = isInside(match.index, 'md-code-inline', replacements);
      
      if (isInsideCodeBlock || isInsideInlineCode) continue;
      
      if (type === 'bold' && isInside(match.index, 'md-code-block', replacements)) continue;
      if (type === 'italic' && (isInside(match.index, 'md-bold', replacements) || isInside(match.index, 'md-code-block', replacements))) continue;
      
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        className: config.className,
        type,
      });
    }
  }
  
  replacements.sort((a, b) => b.start - a.start);
  
  for (const repl of replacements) {
    const before = result.substring(0, repl.start);
    const content = result.substring(repl.start, repl.end);
    const after = result.substring(repl.end);
    
    result = before + `<span class="${repl.className}">${content}</span>` + after;
  }
  
  return result;
}

function isInside(index, className, replacements) {
  for (const repl of replacements) {
    if (repl.className === className && index >= repl.start && index <= repl.end) {
      return true;
    }
  }
  return false;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function setupEditorHighlight(editor, highlightLayer) {
  let isScrolling = false;
  
  function updateHighlight() {
    const content = editor.value;
    highlightLayer.innerHTML = highlightMarkdown(content);
    syncScroll();
  }
  
  function syncScroll() {
    if (isScrolling) return;
    isScrolling = true;
    highlightLayer.scrollTop = editor.scrollTop;
    highlightLayer.scrollLeft = editor.scrollLeft;
    requestAnimationFrame(() => {
      isScrolling = false;
    });
  }
  
  editor.addEventListener('input', updateHighlight);
  editor.addEventListener('scroll', syncScroll);
  editor.addEventListener('change', updateHighlight);
  editor.addEventListener('keyup', updateHighlight);
  
  updateHighlight();
  
  return {
    updateHighlight,
    syncScroll,
  };
}
