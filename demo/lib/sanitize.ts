/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */

// Allowed HTML tags for content
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
  'div', 'span', 'hr'
]

// Allowed attributes per tag
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'div': ['style', 'class', 'className'],
  'span': ['style', 'class', 'className'],
  'p': ['style', 'class', 'className'],
  'h1': ['style', 'class', 'className'],
  'h2': ['style', 'class', 'className'],
  'h3': ['style', 'class', 'className'],
  'h4': ['style', 'class', 'className'],
  'h5': ['style', 'class', 'className'],
  'h6': ['style', 'class', 'className'],
  'code': ['style', 'class', 'className'],
  'pre': ['style', 'class', 'className'],
  'blockquote': ['style', 'class', 'className'],
  'ul': ['style', 'class', 'className'],
  'ol': ['style', 'class', 'className'],
  'li': ['style', 'class', 'className'],
}

// Allowed URL protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Sanitize HTML string by removing dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html

  // First, decode double-encoded entities
  let sanitized = html
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&amp;nbsp;/g, '&nbsp;')
    .replace(/&amp;lt;/g, '&lt;')
    .replace(/&amp;gt;/g, '&gt;')
    .replace(/&amp;quot;/g, '&quot;')
    .replace(/&amp;#39;/g, '&#39;')
    .replace(/&amp;#x27;/g, '&#x27;')
    .replace(/&amp;#x2F;/g, '&#x2F;')

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: URLs from img src (can be used for XSS)
  sanitized = sanitized.replace(/<img[^>]+src\s*=\s*["']data:/gi, '<img src=""')

  // Basic tag filtering - remove tags not in allowed list
  // This is a simplified version; for production, consider using a proper HTML parser
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    const lowerTag = tagName.toLowerCase()
    
    // Allow closing tags for allowed tags
    if (match.startsWith('</')) {
      return ALLOWED_TAGS.includes(lowerTag) ? match : ''
    }
    
    // For opening tags, check if tag is allowed
    if (!ALLOWED_TAGS.includes(lowerTag)) {
      return ''
    }

    // Extract and sanitize attributes
    const attrPattern = /(\w+)\s*=\s*["']([^"']*)["']/gi
    let cleanAttrs: string[] = []
    let attrMatch

    while ((attrMatch = attrPattern.exec(match)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      let attrValue = attrMatch[2]

      // Check if attribute is allowed for this tag
      const allowedAttrs = ALLOWED_ATTRIBUTES[lowerTag] || []
      if (allowedAttrs.includes(attrName)) {
        // Sanitize href/src URLs
        if ((attrName === 'href' || attrName === 'src') && attrValue) {
          try {
            const url = new URL(attrValue, 'http://example.com')
            if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
              continue // Skip this attribute
            }
            // For relative URLs, keep as is
            if (attrValue.startsWith('/') || attrValue.startsWith('./') || attrValue.startsWith('../')) {
              cleanAttrs.push(`${attrName}="${attrValue}"`)
            } else if (url.protocol === 'http:' || url.protocol === 'https:') {
              cleanAttrs.push(`${attrName}="${attrValue}"`)
            }
          } catch {
            // Invalid URL, skip
            continue
          }
        } else {
          // For other attributes, escape quotes and add
          attrValue = attrValue.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
          cleanAttrs.push(`${attrName}="${attrValue}"`)
        }
      }
    }

    return `<${lowerTag}${cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : ''}>`
  })

  return sanitized
}

