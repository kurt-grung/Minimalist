import React from 'react'

interface SafeHtmlProps {
  html: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Safely renders HTML content as React elements without using dangerouslySetInnerHTML
 * Converts HTML to plain text with basic formatting preserved
 */
export default function SafeHtml({ html, className, style }: SafeHtmlProps) {
  if (!html) return null

  // Sanitize HTML first
  const sanitized = sanitizeHtml(html)

  // Convert HTML to React elements
  const content = convertHtmlToReact(sanitized)

  return (
    <div className={className} style={style}>
      {content}
    </div>
  )
}

/**
 * Sanitize HTML by removing dangerous content and decoding entities
 */
function sanitizeHtml(html: string): string {
  if (!html) return html

  // Decode double-encoded entities
  let sanitized = html
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&amp;nbsp;/g, '&nbsp;')
    .replace(/&amp;lt;/g, '&lt;')
    .replace(/&amp;gt;/g, '&gt;')
    .replace(/&amp;quot;/g, '&quot;')
    .replace(/&amp;#39;/g, '&#39;')
    .replace(/&amp;#x27;/g, '&#x27;')
    .replace(/&amp;#x2F;/g, '&#x2F;')

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  return sanitized
}

/**
 * Convert HTML string to React elements
 * This is a simplified parser that handles common HTML tags
 */
function convertHtmlToReact(html: string): React.ReactNode {
  if (!html) return null

  // Split by tags and process each segment
  const parts: React.ReactNode[] = []
  let key = 0

  // Self-closing tags that don't need closing tags
  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']
  
  // Match all HTML tags
  const tagRegex = /<(\/?)([a-z][a-z0-9]*)\b([^>]*?)(\/?)>/gi
  let match
  let lastIndex = 0
  const stack: Array<{ tag: string; props: any; children: React.ReactNode[] }> = []

  while ((match = tagRegex.exec(html)) !== null) {
    const isClosing = match[1] === '/'
    const tagName = match[2].toLowerCase()
    const attributes = match[3]
    const isSelfClosing = match[4] === '/' || selfClosingTags.includes(tagName)
    const matchIndex = match.index

    // Add text before this tag
    if (matchIndex > lastIndex) {
      const text = html.substring(lastIndex, matchIndex)
      if (text.trim()) {
        const textContent = decodeHtmlEntities(text)
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(textContent)
        } else {
          parts.push(textContent)
        }
      }
    }

    if (isClosing) {
      // Closing tag - pop from stack
      if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
        const element = stack.pop()!
        const reactElement = React.createElement(
          tagName,
          { ...element.props, key: key++ },
          ...element.children
        )
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(reactElement)
        } else {
          parts.push(reactElement)
        }
      }
    } else if (isSelfClosing) {
      // Self-closing tag - create element immediately
      const props = parseAttributes(attributes, tagName)
      const reactElement = React.createElement(tagName, { ...props, key: key++ })
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(reactElement)
      } else {
        parts.push(reactElement)
      }
    } else {
      // Opening tag - parse attributes and push to stack
      const props = parseAttributes(attributes, tagName)
      stack.push({ tag: tagName, props, children: [] })
    }

    lastIndex = tagRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < html.length) {
    const text = html.substring(lastIndex)
    if (text.trim()) {
      const textContent = decodeHtmlEntities(text)
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(textContent)
      } else {
        parts.push(textContent)
      }
    }
  }

  // Handle any remaining unclosed tags
  while (stack.length > 0) {
    const element = stack.pop()!
    const reactElement = React.createElement(
      element.tag,
      { ...element.props, key: key++ },
      ...element.children
    )
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(reactElement)
    } else {
      parts.push(reactElement)
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

/**
 * Parse HTML attributes string into React props object
 */
function parseAttributes(attrString: string, tagName: string): any {
  const props: any = {}
  
  // Match attribute="value" or attribute='value'
  const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/g
  let match

  while ((match = attrRegex.exec(attrString)) !== null) {
    const attrName = match[1].toLowerCase()
    let attrValue = match[2]

    // Skip dangerous attributes
    if (attrName.startsWith('on')) continue

    // Handle special attributes
    if (attrName === 'class') {
      props.className = attrValue
    } else if (attrName === 'style') {
      props.style = parseStyleString(attrValue)
    } else if (attrName === 'href' || attrName === 'src') {
      // Validate URLs
      if (isValidUrl(attrValue)) {
        props[attrName] = attrValue
        if (attrName === 'href') {
          props.target = '_blank'
          props.rel = 'noopener noreferrer'
        }
      }
    } else {
      props[attrName] = attrValue
    }
  }

  return props
}

/**
 * Parse CSS style string into React style object
 */
function parseStyleString(styleStr: string): React.CSSProperties {
  const styles: React.CSSProperties = {}
  styleStr.split(';').forEach(rule => {
    const [prop, value] = rule.split(':').map(s => s.trim())
    if (prop && value) {
      const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      // Use type assertion to allow string values for CSS properties
      ;(styles as any)[camelProp] = value
    }
  })
  return styles
}

/**
 * Validate URL to prevent XSS
 */
function isValidUrl(url: string): boolean {
  if (!url) return false
  
  // Allow relative URLs
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true
  }

  try {
    const urlObj = new URL(url, 'http://example.com')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }
  
  // Server-side fallback
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}
