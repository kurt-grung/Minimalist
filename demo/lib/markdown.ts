/**
 * Markdown conversion utilities
 * Functions for converting between HTML and Markdown
 */

/**
 * HTML to Markdown converter
 * Works in both browser and Node.js environments (with jsdom)
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  
  // Create a temporary div to parse HTML
  // In browser: uses document.createElement
  // In Node.js with jsdom: uses global document from jsdom
  const doc = typeof document !== 'undefined' ? document : (global as any).document
  if (!doc) {
    throw new Error('DOM API not available. Please use jsdom in Node.js environment.')
  }
  
  const temp = doc.createElement('div')
  temp.innerHTML = html

  const convert = (node: Node, inList: boolean = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as Element
    const tagName = el.tagName.toLowerCase()
    
    // Handle list items specially
    if (tagName === 'li') {
      const content = Array.from(el.childNodes)
        .map(child => convert(child, true))
        .join('')
        .trim()
      return content
    }
    
    const children = Array.from(el.childNodes).map(child => convert(child, inList || tagName === 'ul' || tagName === 'ol')).join('')

    switch (tagName) {
      case 'h1': return `# ${children}\n\n`
      case 'h2': return `## ${children}\n\n`
      case 'h3': return `### ${children}\n\n`
      case 'h4': return `#### ${children}\n\n`
      case 'h5': return `##### ${children}\n\n`
      case 'h6': return `###### ${children}\n\n`
      case 'p': 
        if (inList) return children
        return `${children}\n\n`
      case 'strong':
      case 'b': return `**${children}**`
      case 'em':
      case 'i': return `*${children}*`
      case 'code': {
        const parent = el.parentElement
        if (parent?.tagName.toLowerCase() === 'pre') {
          const lang = el.className.match(/language-(\w+)/)?.[1] || ''
          const codeContent = el.textContent || ''
          return `\`\`\`${lang}\n${codeContent}\n\`\`\`\n\n`
        }
        // Don't escape inside code tags - use textContent directly
        return `\`${el.textContent || ''}\``
      }
      case 'pre': {
        // Pre is handled by code case, but handle standalone pre
        const codeEl = el.querySelector('code')
        if (codeEl) {
          const lang = codeEl.className.match(/language-(\w+)/)?.[1] || ''
          const codeContent = codeEl.textContent || ''
          return `\`\`\`${lang}\n${codeContent}\n\`\`\`\n\n`
        }
        return `\`\`\`\n${el.textContent || ''}\n\`\`\`\n\n`
      }
      case 'blockquote': {
        const lines = children.split('\n').filter(l => l.trim())
        return lines.map(line => `> ${line}`).join('\n') + '\n\n'
      }
      case 'ul': {
        const items = Array.from(el.querySelectorAll('li'))
        return items.map(item => `- ${convert(item, true)}`).join('\n') + '\n\n'
      }
      case 'ol': {
        const items = Array.from(el.querySelectorAll('li'))
        return items.map((item, i) => `${i + 1}. ${convert(item, true)}`).join('\n') + '\n\n'
      }
      case 'a': {
        const href = el.getAttribute('href') || ''
        const linkText = children || href
        return `[${linkText}](${href})`
      }
      case 'img': {
        const src = el.getAttribute('src') || ''
        const alt = el.getAttribute('alt') || ''
        return `![${alt}](${src})`
      }
      case 'br': return '\n'
      case 'div': return children + (inList ? '' : '\n')
      default: return children
    }
  }

  const result = convert(temp).trim()
  // Clean up excessive newlines
  return result.replace(/\n{3,}/g, '\n\n')
}

/**
 * Markdown to HTML converter
 * Pure string-based conversion, works in any environment
 */
export function markdownToHtml(md: string): string {
  if (!md) return '<p></p>'
  
  // Split into lines for better processing
  const lines = md.split('\n')
  const blocks: string[] = []
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockContent: string[] = []
  let inList = false
  let listType: 'ul' | 'ol' | null = null
  let listItems: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle code blocks
    if (line.match(/^```(\w+)?$/)) {
      if (inCodeBlock) {
        // Close code block
        blocks.push(`<pre><code class="language-${codeBlockLang || 'text'}">${codeBlockContent.join('\n')}</code></pre>`)
        codeBlockContent = []
        codeBlockLang = ''
        inCodeBlock = false
      } else {
        // Open code block
        codeBlockLang = line.match(/^```(\w+)?$/)?.[1] || ''
        inCodeBlock = true
      }
      continue
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }
    
    // Close list if needed
    if (inList && !line.match(/^[\d-]\.?\s/) && line.trim() !== '') {
      const listTag = listType === 'ol' ? 'ol' : 'ul'
      blocks.push(`<${listTag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listTag}>`)
      listItems = []
      inList = false
      listType = null
    }
    
    // Headings
    if (line.match(/^######\s/)) {
      blocks.push(`<h6>${line.replace(/^######\s/, '')}</h6>`)
      continue
    }
    if (line.match(/^#####\s/)) {
      blocks.push(`<h5>${line.replace(/^#####\s/, '')}</h5>`)
      continue
    }
    if (line.match(/^####\s/)) {
      blocks.push(`<h4>${line.replace(/^####\s/, '')}</h4>`)
      continue
    }
    if (line.match(/^###\s/)) {
      blocks.push(`<h3>${line.replace(/^###\s/, '')}</h3>`)
      continue
    }
    if (line.match(/^##\s/)) {
      blocks.push(`<h2>${line.replace(/^##\s/, '')}</h2>`)
      continue
    }
    if (line.match(/^#\s/)) {
      blocks.push(`<h1>${line.replace(/^#\s/, '')}</h1>`)
      continue
    }
    
    // Blockquotes
    if (line.match(/^>\s/)) {
      blocks.push(`<blockquote>${line.replace(/^>\s/, '')}</blockquote>`)
      continue
    }
    
    // Ordered lists
    if (line.match(/^\d+\.\s/)) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          const listTag = listType === 'ol' ? 'ol' : 'ul'
          blocks.push(`<${listTag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listTag}>`)
          listItems = []
        }
        inList = true
        listType = 'ol'
      }
      listItems.push(line.replace(/^\d+\.\s/, ''))
      continue
    }
    
    // Unordered lists
    if (line.match(/^-\s/) || line.match(/^\*\s/)) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          const listTag = listType === 'ol' ? 'ol' : 'ul'
          blocks.push(`<${listTag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listTag}>`)
          listItems = []
        }
        inList = true
        listType = 'ul'
      }
      listItems.push(line.replace(/^[-*]\s/, ''))
      continue
    }
    
    // Images (markdown syntax: ![alt](url))
    if (line.match(/!\[.*?\]\(.*?\)/)) {
      blocks.push(line)
      continue
    }
    
    // Regular paragraph
    if (line.trim() !== '') {
      blocks.push(`<p>${line}</p>`)
    } else if (blocks.length > 0) {
      // Empty line - add paragraph break
      blocks.push('<br>')
    }
  }
  
  // Close any open code block
  if (inCodeBlock) {
    blocks.push(`<pre><code class="language-${codeBlockLang || 'text'}">${codeBlockContent.join('\n')}</code></pre>`)
  }
  
  // Close any open list
  if (inList && listType) {
    const listTag = listType === 'ol' ? 'ol' : 'ul'
    blocks.push(`<${listTag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listTag}>`)
  }
  
  let html = blocks.join('')
  
  // Process inline formatting (must be done after block-level processing)
  // Images (must come before links to avoid conflicts)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
  
  // Inline code (avoid matching code blocks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Bold (must come before italic to avoid conflicts)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // Italic (only if not already bold)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  
  // Clean up empty paragraphs and breaks
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<blockquote>)/g, '$1')
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ol>)/g, '$1')
  html = html.replace(/(<\/ol>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<br><br>/g, '<br>')
  
  return html || '<p></p>'
}

/**
 * Decode HTML entities that browser encodes in innerHTML
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return html
  const textarea = typeof document !== 'undefined' 
    ? document.createElement('textarea')
    : (global as any).document?.createElement('textarea')
  
  if (!textarea) {
    // Fallback for environments without DOM
    return html
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
  }
  
  textarea.innerHTML = html
  return textarea.value
}

/**
 * Fix double-encoded HTML entities
 */
export function fixDoubleEncodedEntities(html: string): string {
  if (!html) return html
  // Fix double-encoded entities (must be done in order - &amp; first)
  return html
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&amp;nbsp;/g, '&nbsp;')
    .replace(/&amp;lt;/g, '&lt;')
    .replace(/&amp;gt;/g, '&gt;')
    .replace(/&amp;quot;/g, '&quot;')
    .replace(/&amp;#39;/g, '&#39;')
    .replace(/&amp;#x27;/g, '&#x27;')
    .replace(/&amp;#x2F;/g, '&#x2F;')
}

