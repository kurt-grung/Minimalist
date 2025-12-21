// Custom syntax highlighter - no external dependencies

export interface Token {
  type: string
  value: string
}

// Common keywords for different languages
const KEYWORDS: Record<string, string[]> = {
  javascript: [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'let', 'static', 'enum', 'implements', 'interface', 'package', 'private',
    'protected', 'public', 'abstract', 'boolean', 'byte', 'char', 'double',
    'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized',
    'throws', 'transient', 'volatile', 'async', 'await', 'from', 'as'
  ],
  typescript: [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'let', 'static', 'enum', 'implements', 'interface', 'package', 'private',
    'protected', 'public', 'abstract', 'boolean', 'byte', 'char', 'double',
    'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized',
    'throws', 'transient', 'volatile', 'async', 'await', 'from', 'as',
    'type', 'namespace', 'declare', 'module', 'interface', 'implements', 'extends'
  ],
  html: [
    'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'div',
    'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol',
    'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'textarea',
    'select', 'option', 'br', 'hr', 'strong', 'em', 'code', 'pre', 'blockquote'
  ],
  css: [
    'color', 'background', 'margin', 'padding', 'border', 'width', 'height',
    'display', 'position', 'top', 'left', 'right', 'bottom', 'flex', 'grid',
    'font', 'text', 'line', 'overflow', 'z-index', 'opacity', 'transform',
    'transition', 'animation', 'media', 'import', 'url', 'var', 'calc'
  ],
  json: ['true', 'false', 'null']
}

// Common operators and punctuation
const OPERATORS = ['=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '&&', '||', '!', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '=>', '...', '++', '--', '+=', '-=', '*=', '/=']

// Number regex
const NUMBER_REGEX = /\b\d+\.?\d*\b/

// String regex (handles both single and double quotes)
const STRING_REGEX = /(['"`])(?:(?=(\\?))\2.)*?\1/

// Comment regex
const COMMENT_REGEX = {
  javascript: /\/\/.*|\/\*[\s\S]*?\*\//g,
  typescript: /\/\/.*|\/\*[\s\S]*?\*\//g,
  html: /<!--[\s\S]*?-->/g,
  css: /\/\*[\s\S]*?\*\//g,
  json: /\/\/.*|\/\*[\s\S]*?\*\//g
}

// Function/class name regex
const FUNCTION_REGEX = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g

export function highlightCode(code: string, language: string = 'javascript'): string {
  if (!code) return ''
  
  const lang = language.toLowerCase().replace('language-', '')
  let highlighted = code

  // Handle comments first (they should not be processed further)
  const commentMatches: Array<{ start: number; end: number; content: string }> = []
  const commentRegex = COMMENT_REGEX[lang as keyof typeof COMMENT_REGEX] || COMMENT_REGEX.javascript
  
  let commentMatch
  while ((commentMatch = commentRegex.exec(code)) !== null) {
    commentMatches.push({
      start: commentMatch.index,
      end: commentMatch.index + commentMatch[0].length,
      content: commentMatch[0]
    })
  }

  // Replace comments with placeholders
  const placeholders: string[] = []
  commentMatches.forEach((match, index) => {
    const placeholder = `__COMMENT_${index}__`
    placeholders.push(match.content)
    highlighted = highlighted.substring(0, match.start) + placeholder + highlighted.substring(match.end)
    // Adjust subsequent matches
    for (let i = index + 1; i < commentMatches.length; i++) {
      commentMatches[i].start -= match.content.length - placeholder.length
      commentMatches[i].end -= match.content.length - placeholder.length
    }
  })

  // Tokenize the code
  const tokens: Array<{ type: string; value: string; start: number }> = []
  let pos = 0

  while (pos < highlighted.length) {
    // Check for strings
    const stringMatch = highlighted.substring(pos).match(STRING_REGEX)
    if (stringMatch && stringMatch.index === 0) {
      tokens.push({ type: 'string', value: stringMatch[0], start: pos })
      pos += stringMatch[0].length
      continue
    }

    // Check for numbers
    const numberMatch = highlighted.substring(pos).match(NUMBER_REGEX)
    if (numberMatch && numberMatch.index === 0) {
      tokens.push({ type: 'number', value: numberMatch[0], start: pos })
      pos += numberMatch[0].length
      continue
    }

    // Check for operators
    let matched = false
    for (const op of OPERATORS.sort((a, b) => b.length - a.length)) {
      if (highlighted.substring(pos).startsWith(op)) {
        tokens.push({ type: 'operator', value: op, start: pos })
        pos += op.length
        matched = true
        break
      }
    }
    if (matched) continue

    // Check for whitespace
    if (/\s/.test(highlighted[pos])) {
      let whitespace = ''
      while (pos < highlighted.length && /\s/.test(highlighted[pos])) {
        whitespace += highlighted[pos]
        pos++
      }
      tokens.push({ type: 'whitespace', value: whitespace, start: pos - whitespace.length })
      continue
    }

    // Check for identifiers/keywords
    const identifierMatch = highlighted.substring(pos).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
    if (identifierMatch) {
      const value = identifierMatch[0]
      const keywords = KEYWORDS[lang] || KEYWORDS.javascript
      const type = keywords.includes(value) ? 'keyword' : 'identifier'
      tokens.push({ type, value, start: pos })
      pos += value.length
      continue
    }

    // Default: single character
    tokens.push({ type: 'text', value: highlighted[pos], start: pos })
    pos++
  }

  // Build HTML with syntax highlighting
  let html = ''
  let placeholderIndex = 0

  tokens.forEach((token) => {
    if (token.value.startsWith('__COMMENT_')) {
      // Restore comment
      const commentIndex = parseInt(token.value.match(/\d+/)![0])
      html += `<span class="cms-syntax-comment">${placeholders[commentIndex]}</span>`
    } else {
      const className = `cms-syntax-${token.type}`
      const escaped = escapeHtml(token.value)
      html += `<span class="${className}">${escaped}</span>`
    }
  })

  // Restore any remaining placeholders
  placeholders.forEach((placeholder, index) => {
    html = html.replace(`__COMMENT_${index}__`, `<span class="cms-syntax-comment">${escapeHtml(placeholder)}</span>`)
  })

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Highlight code blocks in HTML
export function highlightCodeBlocks(html: string): string {
  // Find all <pre><code> blocks
  const codeBlockRegex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g
  
  return html.replace(codeBlockRegex, (match, language, code) => {
    const lang = language || 'javascript'
    const highlighted = highlightCode(code, lang)
    return `<pre class="cms-syntax"><code class="language-${lang}">${highlighted}</code></pre>`
  })
}

