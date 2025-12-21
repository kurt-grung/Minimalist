'use client'

import { useState, useEffect, useRef } from 'react'
import { highlightCodeBlocks } from './syntaxHighlighter'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    heading: null as number | null,
    list: null as 'ul' | 'ol' | null,
    blockquote: false,
    code: false,
    link: false,
  })

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isMarkdownMode) {
      const normalized = normalizeContent(content)
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized || ''
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

  const handleContentChange = () => {
    if (editorRef.current && !isMarkdownMode) {
      const html = editorRef.current.innerHTML
      onChange(html)
    }
  }

  // HTML to Markdown converter
  const htmlToMarkdown = (html: string): string => {
    if (!html) return ''
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div')
    temp.innerHTML = html

    const convert = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ''
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const el = node as Element
      const tagName = el.tagName.toLowerCase()
      const children = Array.from(el.childNodes).map(convert).join('')

      switch (tagName) {
        case 'h1': return `# ${children}\n\n`
        case 'h2': return `## ${children}\n\n`
        case 'h3': return `### ${children}\n\n`
        case 'h4': return `#### ${children}\n\n`
        case 'h5': return `##### ${children}\n\n`
        case 'h6': return `###### ${children}\n\n`
        case 'p': return `${children}\n\n`
        case 'strong':
        case 'b': return `**${children}**`
        case 'em':
        case 'i': return `*${children}*`
        case 'code': {
          const parent = el.parentElement
          if (parent?.tagName.toLowerCase() === 'pre') {
            const lang = el.className.match(/language-(\w+)/)?.[1] || ''
            return `\`\`\`${lang}\n${children}\n\`\`\`\n\n`
          }
          return `\`${children}\``
        }
        case 'pre': return children // Handled by code case
        case 'blockquote': return `> ${children.replace(/\n/g, '\n> ')}\n\n`
        case 'ul': {
          const items = Array.from(el.querySelectorAll('li'))
          return items.map(item => `- ${convert(item)}`).join('\n') + '\n\n'
        }
        case 'ol': {
          const items = Array.from(el.querySelectorAll('li'))
          return items.map((item, i) => `${i + 1}. ${convert(item)}`).join('\n') + '\n\n'
        }
        case 'li': return Array.from(el.childNodes).map(convert).join('').trim()
        case 'a': {
          const href = el.getAttribute('href') || ''
          return `[${children}](${href})`
        }
        case 'br': return '\n'
        default: return children
      }
    }

    return convert(temp).trim()
  }

  // Markdown to HTML converter
  const markdownToHtml = (md: string): string => {
    if (!md) return ''
    
    let html = md
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`
      })
      // Headings
      .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists (basic)
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
    
    // Wrap consecutive list items in <ul> tags
    html = html.replace(/(<li>[\s\S]*?<\/li>(?:\s*<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>')
    
    // Wrap in paragraphs
    html = `<p>${html}</p>`
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p>(<h[1-6]>)/g, '$1')
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    html = html.replace(/<p>(<blockquote>)/g, '$1')
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
    html = html.replace(/<p>(<ul>)/g, '$1')
    html = html.replace(/(<\/ul>)<\/p>/g, '$1')
    html = html.replace(/<p>(<pre>)/g, '$1')
    html = html.replace(/(<\/pre>)<\/p>/g, '$1')
    
    return html
  }

  // Toggle markdown mode
  const toggleMarkdown = () => {
    if (isMarkdownMode) {
      // Switching from markdown to HTML
      const html = markdownToHtml(markdownContent)
      if (editorRef.current) {
        editorRef.current.innerHTML = html
        handleContentChange()
      }
      setIsMarkdownMode(false)
    } else {
      // Switching from HTML to markdown
      if (editorRef.current) {
        const html = editorRef.current.innerHTML
        const md = htmlToMarkdown(html)
        setMarkdownContent(md)
        setIsMarkdownMode(true)
      }
    }
  }

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
    </div>
  )
}
