'use client'

import { useState, useEffect, useRef } from 'react'
import { highlightCodeBlocks } from './syntaxHighlighter'
import ImageSelector from './ImageSelector'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdateRef = useRef(false)
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    heading: null as number | null,
    list: null as 'ul' | 'ol' | null,
    blockquote: false,
    code: false,
    link: false,
  })

  // Decode HTML entities that might be double-encoded in content
  const decodeContentForEditor = (html: string): string => {
    if (!html) return html
    // Fix double-encoded entities before setting to innerHTML
    return html
      .replace(/&amp;amp;/g, '&amp;')
      .replace(/&amp;nbsp;/g, '&nbsp;')
      .replace(/&amp;lt;/g, '&lt;')
      .replace(/&amp;gt;/g, '&gt;')
      .replace(/&amp;quot;/g, '&quot;')
      .replace(/&amp;#39;/g, '&#39;')
  }

  // Decode HTML entities that browser encodes in innerHTML
  const decodeHtmlEntities = (html: string): string => {
    if (!html) return html
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
  }

  // Initialize editor content - only update when content changes externally
  useEffect(() => {
    // Skip update if this change came from the editor itself
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }
    
    if (editorRef.current && !isMarkdownMode) {
      const decoded = decodeContentForEditor(content)
      const normalized = normalizeContent(decoded)
      const currentHtml = editorRef.current.innerHTML
      
      // Only update if content actually changed (avoid unnecessary updates)
      // Compare normalized versions to avoid false positives
      const currentNormalized = normalizeContent(decodeHtmlEntities(currentHtml))
      
      if (currentNormalized !== normalized) {
        // Save cursor position using text-based approach
        const selection = window.getSelection()
        let cursorPosition = 0
        
        if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0)
          const preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(editorRef.current)
          preCaretRange.setEnd(range.startContainer, range.startOffset)
          cursorPosition = preCaretRange.toString().length
        }
        
        // Update HTML
        editorRef.current.innerHTML = normalized || ''
        
        // Restore cursor position using text offset
        if (cursorPosition > 0 && selection) {
          try {
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            )
            
            let currentPos = 0
            let targetNode: Node | null = null
            let targetOffset = 0
            
            let node
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent?.length || 0
              if (currentPos + nodeLength >= cursorPosition) {
                targetNode = node
                targetOffset = cursorPosition - currentPos
                break
              }
              currentPos += nodeLength
            }
            
            if (targetNode) {
              const newRange = document.createRange()
              const maxOffset = targetNode.textContent?.length || 0
              newRange.setStart(targetNode, Math.min(targetOffset, maxOffset))
              newRange.setEnd(targetNode, Math.min(targetOffset, maxOffset))
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          } catch (e) {
            // If restoration fails, just focus the editor
            editorRef.current.focus()
          }
        }
      }
    }
  }, [content, isMarkdownMode])

  // Update active formats based on selection
  useEffect(() => {
    if (!isMarkdownMode && editorRef.current) {
      const updateActiveFormats = () => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)
        const node = range.commonAncestorContainer

        // Check if we're in a specific format
        let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
        
        const formats = {
          bold: false,
          italic: false,
          heading: null as number | null,
          list: null as 'ul' | 'ol' | null,
          blockquote: false,
          code: false,
          link: false,
        }

        while (current && current !== editorRef.current) {
          const tagName = current.tagName?.toLowerCase()
          
          if (tagName === 'strong' || tagName === 'b') formats.bold = true
          if (tagName === 'em' || tagName === 'i') formats.italic = true
          if (tagName?.match(/^h[1-6]$/)) {
            formats.heading = parseInt(tagName[1])
          }
          if (tagName === 'ul') formats.list = 'ul'
          if (tagName === 'ol') formats.list = 'ol'
          if (tagName === 'blockquote') formats.blockquote = true
          if (tagName === 'code' && current.parentElement?.tagName?.toLowerCase() !== 'pre') formats.code = true
          if (tagName === 'a') formats.link = true
          
          current = current.parentElement
        }

        setActiveFormats(formats)
      }

      const handleSelectionChange = () => {
        if (document.activeElement === editorRef.current) {
          updateActiveFormats()
        }
      }

      document.addEventListener('selectionchange', handleSelectionChange)
      editorRef.current.addEventListener('input', updateActiveFormats)
      editorRef.current.addEventListener('click', updateActiveFormats)

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange)
        editorRef.current?.removeEventListener('input', updateActiveFormats)
        editorRef.current?.removeEventListener('click', updateActiveFormats)
      }
    }
  }, [isMarkdownMode])

  // Highlight code blocks
  useEffect(() => {
    if (!isMarkdownMode && editorRef.current) {
      const html = editorRef.current.innerHTML
      const highlighted = highlightCodeBlocks(html)
      if (html !== highlighted) {
        // Save cursor position
        const selection = window.getSelection()
        let range: Range | null = null
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0).cloneRange()
        }
        
        // Update HTML
        editorRef.current.innerHTML = highlighted
        
        // Restore cursor position if possible
        if (range && selection) {
          try {
            selection.removeAllRanges()
            selection.addRange(range)
          } catch (e) {
            // Ignore if range is invalid
          }
        }
      }
    }
  }, [content, isMarkdownMode])

  // Detect if content is plain text
  const isPlainText = (text: string) => {
    if (!text) return true
    const htmlTagRegex = /<[^>]+>/g
    return !htmlTagRegex.test(text)
  }

  // Convert plain text to HTML paragraphs
  const normalizeContent = (text: string) => {
    if (!text) return ''
    if (isPlainText(text)) {
      return text.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')
    }
    return text
  }

  // Formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleContentChange()
  }

  const formatBold = () => execCommand('bold')
  const formatItalic = () => execCommand('italic')
  const formatHeading = (level: number) => execCommand('formatBlock', `h${level}`)
  const formatParagraph = () => execCommand('formatBlock', 'p')
  const formatBlockquote = () => execCommand('formatBlock', 'blockquote')
  const formatCode = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      if (selectedText) {
        document.execCommand('insertHTML', false, `<code>${selectedText}</code>`)
      } else {
        document.execCommand('insertHTML', false, '<code></code>')
      }
    }
    handleContentChange()
  }

  const formatCodeBlock = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      if (selectedText) {
        document.execCommand('insertHTML', false, `<pre><code class="language-javascript">${selectedText}</code></pre>`)
      } else {
        document.execCommand('insertHTML', false, '<pre><code class="language-javascript"></code></pre>')
      }
      // Highlight will be applied automatically by the useEffect
    }
    handleContentChange()
  }

  const formatList = (type: 'ul' | 'ol') => {
    if (activeFormats.list === type) {
      execCommand('removeFormat')
      execCommand('formatBlock', 'p')
    } else {
      execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList')
    }
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        const linkText = selectedText || url
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
      }
    }
    handleContentChange()
  }

  const insertImage = (url: string) => {
    if (isMarkdownMode) {
      // Insert markdown image syntax
      const alt = window.prompt('Enter alt text (optional):') || ''
      const markdownImage = `![${alt}](${url})`
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart || 0
        const end = textarea.selectionEnd || start
        const currentContent = markdownContent
        const newContent = currentContent.slice(0, start) + markdownImage + currentContent.slice(end)
        handleMarkdownChange(newContent)
        // Restore cursor position after content update
        setTimeout(() => {
          if (textarea) {
            const newPos = start + markdownImage.length
            textarea.setSelectionRange(newPos, newPos)
            textarea.focus()
          }
        }, 0)
      } else {
        // Fallback if textarea not found
        handleMarkdownChange(markdownContent + markdownImage)
      }
    } else {
      // Insert HTML image
      const alt = window.prompt('Enter alt text (optional):') || ''
      document.execCommand('insertHTML', false, `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;" />`)
      handleContentChange()
    }
  }

  const handleContentChange = () => {
    if (editorRef.current && !isMarkdownMode) {
      const html = editorRef.current.innerHTML
      // Decode entities that browser automatically encodes (like &nbsp; -> &amp;nbsp;)
      const decoded = decodeHtmlEntities(html)
      // Mark that this is an internal update to prevent cursor jump
      isInternalUpdateRef.current = true
      onChange(decoded)
    }
  }

  // HTML to Markdown converter
  const htmlToMarkdown = (html: string): string => {
    if (!html) return ''
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div')
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

  // Markdown to HTML converter
  const markdownToHtml = (md: string): string => {
    if (!md) return ''
    
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

  // Toggle markdown mode
  const toggleMarkdown = () => {
    if (isMarkdownMode) {
      // Switching from markdown to HTML
      const html = markdownToHtml(markdownContent)
      if (editorRef.current) {
        const normalized = normalizeContent(html)
        editorRef.current.innerHTML = normalized
        handleContentChange()
      }
      setIsMarkdownMode(false)
    } else {
      // Switching from HTML to markdown
      if (editorRef.current) {
        const html = editorRef.current.innerHTML
        // Decode HTML entities before converting
        const decoded = decodeHtmlEntities(html)
        const md = htmlToMarkdown(decoded)
        setMarkdownContent(md)
        setIsMarkdownMode(true)
      }
    }
  }
  
  // Initialize markdown content when switching to markdown mode with existing content
  useEffect(() => {
    if (isMarkdownMode && content) {
      // Convert current HTML content to markdown only if markdownContent is empty
      // This prevents overwriting user's markdown edits
      if (!markdownContent && editorRef.current) {
        const html = editorRef.current.innerHTML
        const decoded = decodeHtmlEntities(html)
        const md = htmlToMarkdown(decoded)
        setMarkdownContent(md)
      } else if (!markdownContent) {
        // If editor not ready, convert from content prop
        const decoded = decodeContentForEditor(content)
        const md = htmlToMarkdown(decoded)
        setMarkdownContent(md)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarkdownMode])

  const handleMarkdownChange = (value: string) => {
    setMarkdownContent(value)
    const html = markdownToHtml(value)
    onChange(html)
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap gap-1 items-center">
        {!isMarkdownMode && (
          <>
            {/* Text Formatting */}
            <div className="flex gap-1 pr-2 border-r border-gray-300">
              <button
                type="button"
                onClick={formatBold}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm font-bold transition-colors ${
                  activeFormats.bold 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={formatItalic}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm italic transition-colors ${
                  activeFormats.italic 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Italic"
              >
                I
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 pr-2 border-r border-gray-300">
              <button
                type="button"
                onClick={() => formatHeading(1)}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm font-bold transition-colors ${
                  activeFormats.heading === 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => formatHeading(2)}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm font-bold transition-colors ${
                  activeFormats.heading === 2 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => formatHeading(3)}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm font-bold transition-colors ${
                  activeFormats.heading === 3 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Heading 3"
              >
                H3
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 pr-2 border-r border-gray-300">
              <button
                type="button"
                onClick={() => formatList('ul')}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm transition-colors ${
                  activeFormats.list === 'ul' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Bullet List"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => formatList('ol')}
                className={`p-2 rounded border border-gray-300 cursor-pointer text-sm transition-colors ${
                  activeFormats.list === 'ol' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title="Numbered List"
              >
                1.
              </button>
            </div>

            {/* Block Quote */}
            <button
              type="button"
              onClick={formatBlockquote}
              className={`p-2 mr-2 pr-3 border-r border-gray-300 rounded border border-gray-300 cursor-pointer text-sm transition-colors ${
                activeFormats.blockquote 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Block Quote"
            >
              "
            </button>

            {/* Code */}
            <button
              type="button"
              onClick={formatCode}
              className={`p-2 mr-2 pr-3 border-r border-gray-300 rounded border border-gray-300 cursor-pointer text-sm font-mono transition-colors ${
                activeFormats.code 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Inline Code"
            >
              {'</>'}
            </button>

            {/* Code Block */}
            <button
              type="button"
              onClick={formatCodeBlock}
              className="p-2 mr-2 pr-3 border-r border-gray-300 rounded border border-gray-300 cursor-pointer text-sm font-mono bg-white text-gray-800 hover:bg-gray-100 transition-colors"
              title="Code Block"
            >
              {'{ }'}
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={insertLink}
              className={`p-2 mr-2 pr-3 border-r border-gray-300 rounded border border-gray-300 cursor-pointer text-sm transition-colors ${
                activeFormats.link 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
              title="Insert Link"
            >
              🔗
            </button>

            {/* Image */}
            <button
              type="button"
              onClick={() => setShowImageSelector(true)}
              className="p-2 mr-2 pr-3 border-r border-gray-300 rounded border border-gray-300 cursor-pointer text-sm bg-white text-gray-800 hover:bg-gray-100 transition-colors"
              title="Insert Image"
            >
              🖼️
            </button>
          </>
        )}

        {/* Markdown Toggle */}
        <button
          type="button"
          onClick={toggleMarkdown}
          className={`px-3 py-2 rounded border border-gray-300 cursor-pointer text-sm font-medium transition-colors ${
            isMarkdownMode 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-gray-800 hover:bg-gray-100'
          }`}
          title={isMarkdownMode ? 'Switch to WYSIWYG' : 'Switch to Markdown'}
        >
          {isMarkdownMode ? 'WYSIWYG' : 'Markdown'}
        </button>
      </div>

      {/* Editor Content */}
      {isMarkdownMode ? (
        <textarea
          value={markdownContent}
          onChange={(e) => handleMarkdownChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] p-4 border-0 text-base font-mono resize-y outline-none bg-gray-50"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onBlur={handleContentChange}
          suppressContentEditableWarning
          className="min-h-[300px] p-4 outline-none text-base leading-relaxed text-gray-800 cms-editor"
          data-placeholder={placeholder}
        />
      )}

      {/* Editor content styles */}
      <style jsx>{`
        .cms-editor[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          pointer-events: none;
        }
        .cms-editor pre {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        .cms-editor pre code {
          background: transparent;
          padding: 0;
        }
        .cms-editor code {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .cms-editor blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: #666;
        }
        .cms-editor a {
          color: #0070f3;
          text-decoration: underline;
        }
        .cms-editor ul, .cms-editor ol {
          margin: 0.5rem 0;
          padding-left: 2rem;
        }
        .cms-editor h1, .cms-editor h2, .cms-editor h3 {
          margin: 1rem 0 0.5rem 0;
          font-weight: bold;
        }
        .cms-editor h1 {
          font-size: 2em;
        }
        .cms-editor h2 {
          font-size: 1.5em;
        }
        .cms-editor h3 {
          font-size: 1.25em;
        }
        .cms-editor p {
          margin: 0.5rem 0;
        }
      `}</style>

      {/* Image Selector Modal */}
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={insertImage}
      />
    </div>
  )
}
