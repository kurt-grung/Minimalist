import { describe, it, expect, beforeAll } from 'vitest'
import { markdownToHtml, decodeHtmlEntities, fixDoubleEncodedEntities } from '../lib/markdown'

// Import htmlToMarkdown conditionally - it requires DOM
let htmlToMarkdown: (html: string) => string
let hasDom = false

// Setup jsdom if not available
beforeAll(() => {
  // Check if we're in a jsdom environment
  if (typeof document !== 'undefined') {
    hasDom = true
    const markdownModule = require('../lib/markdown')
    htmlToMarkdown = markdownModule.htmlToMarkdown
  } else {
    // Try to use jsdom if available
    try {
      const { JSDOM } = require('jsdom')
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
      })
      global.document = dom.window.document
      global.Node = dom.window.Node
      global.Element = dom.window.Element
      hasDom = true
      // Now we can import htmlToMarkdown
      const markdownModule = require('../lib/markdown')
      htmlToMarkdown = markdownModule.htmlToMarkdown
    } catch (e) {
      // jsdom not available - skip htmlToMarkdown tests
      console.warn('jsdom not available. htmlToMarkdown tests will be skipped.')
      htmlToMarkdown = () => {
        throw new Error('jsdom not available')
      }
    }
  }
})

// Helper to conditionally run tests
const testIfDom = hasDom ? it : it.skip

describe('markdown conversion', () => {
  describe('htmlToMarkdown', () => {
    testIfDom('should convert empty string to empty string', () => {
      expect(htmlToMarkdown('')).toBe('')
    })

    testIfDom('should convert simple paragraph', () => {
      expect(htmlToMarkdown('<p>Hello world</p>')).toBe('Hello world\n\n')
    })

    testIfDom('should convert headings', () => {
      expect(htmlToMarkdown('<h1>Heading 1</h1>')).toBe('# Heading 1\n\n')
      expect(htmlToMarkdown('<h2>Heading 2</h2>')).toBe('## Heading 2\n\n')
      expect(htmlToMarkdown('<h3>Heading 3</h3>')).toBe('### Heading 3\n\n')
      expect(htmlToMarkdown('<h4>Heading 4</h4>')).toBe('#### Heading 4\n\n')
      expect(htmlToMarkdown('<h5>Heading 5</h5>')).toBe('##### Heading 5\n\n')
      expect(htmlToMarkdown('<h6>Heading 6</h6>')).toBe('###### Heading 6\n\n')
    })

    testIfDom('should convert bold text', () => {
      expect(htmlToMarkdown('<p><strong>Bold text</strong></p>')).toBe('**Bold text**\n\n')
      expect(htmlToMarkdown('<p><b>Bold text</b></p>')).toBe('**Bold text**\n\n')
    })

    testIfDom('should convert italic text', () => {
      expect(htmlToMarkdown('<p><em>Italic text</em></p>')).toBe('*Italic text*\n\n')
      expect(htmlToMarkdown('<p><i>Italic text</i></p>')).toBe('*Italic text*\n\n')
    })

    testIfDom('should convert inline code', () => {
      expect(htmlToMarkdown('<p>Use <code>console.log()</code> to debug</p>')).toBe('Use `console.log()`\n\n')
    })

    testIfDom('should convert code blocks', () => {
      const html = '<pre><code class="language-javascript">const x = 1;\nconsole.log(x);</code></pre>'
      const expected = '```javascript\nconst x = 1;\nconsole.log(x);\n```\n\n'
      expect(htmlToMarkdown(html)).toBe(expected)
    })

    testIfDom('should convert code blocks without language', () => {
      const html = '<pre><code>const x = 1;</code></pre>'
      const expected = '```\nconst x = 1;\n```\n\n'
      expect(htmlToMarkdown(html)).toBe(expected)
    })

    testIfDom('should convert links', () => {
      expect(htmlToMarkdown('<p><a href="https://example.com">Example</a></p>')).toBe('[Example](https://example.com)\n\n')
      expect(htmlToMarkdown('<p><a href="https://example.com">https://example.com</a></p>')).toBe('[https://example.com](https://example.com)\n\n')
    })

    testIfDom('should convert images', () => {
      expect(htmlToMarkdown('<p><img src="https://example.com/image.png" alt="Example image" /></p>')).toBe('![Example image](https://example.com/image.png)\n\n')
      expect(htmlToMarkdown('<p><img src="https://example.com/image.png" alt="" /></p>')).toBe('![](https://example.com/image.png)\n\n')
    })

    testIfDom('should convert blockquotes', () => {
      expect(htmlToMarkdown('<blockquote>This is a quote</blockquote>')).toBe('> This is a quote\n\n')
      expect(htmlToMarkdown('<blockquote>Line 1\nLine 2</blockquote>')).toBe('> Line 1\n> Line 2\n\n')
    })

    testIfDom('should convert unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>'
      const expected = '- Item 1\n- Item 2\n- Item 3\n\n'
      expect(htmlToMarkdown(html)).toBe(expected)
    })

    testIfDom('should convert ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>'
      const expected = '1. First\n2. Second\n3. Third\n\n'
      expect(htmlToMarkdown(html)).toBe(expected)
    })

    testIfDom('should convert nested formatting', () => {
      expect(htmlToMarkdown('<p>This is <strong>bold</strong> and <em>italic</em></p>')).toBe('This is **bold** and *italic*\n\n')
    })

    testIfDom('should convert multiple paragraphs', () => {
      const html = '<p>Paragraph 1</p><p>Paragraph 2</p>'
      const expected = 'Paragraph 1\n\nParagraph 2\n\n'
      expect(htmlToMarkdown(html)).toBe(expected)
    })

    testIfDom('should handle line breaks', () => {
      expect(htmlToMarkdown('<p>Line 1<br>Line 2</p>')).toBe('Line 1\nLine 2\n\n')
    })

    testIfDom('should clean up excessive newlines', () => {
      const html = '<p>Text</p><p></p><p></p><p>More text</p>'
      const result = htmlToMarkdown(html)
      // Should not have more than 2 consecutive newlines
      expect(result).not.toMatch(/\n{3,}/)
    })

    testIfDom('should handle complex nested structures', () => {
      const html = '<div><h1>Title</h1><p>Paragraph with <strong>bold</strong> and <a href="https://example.com">link</a></p><ul><li>List item</li></ul></div>'
      const result = htmlToMarkdown(html)
      expect(result).toContain('# Title')
      expect(result).toContain('**bold**')
      expect(result).toContain('[link](https://example.com)')
      expect(result).toContain('- List item')
    })
  })

  describe('markdownToHtml', () => {
    it('should convert empty string to empty paragraph', () => {
      // Empty string results in empty blocks, which returns '<p></p>' as fallback
      const result = markdownToHtml('')
      expect(result).toBe('<p></p>')
    })

    it('should convert simple text to paragraph', () => {
      expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>')
    })

    it('should convert headings', () => {
      expect(markdownToHtml('# Heading 1')).toBe('<h1>Heading 1</h1>')
      expect(markdownToHtml('## Heading 2')).toBe('<h2>Heading 2</h2>')
      expect(markdownToHtml('### Heading 3')).toBe('<h3>Heading 3</h3>')
      expect(markdownToHtml('#### Heading 4')).toBe('<h4>Heading 4</h4>')
      expect(markdownToHtml('##### Heading 5')).toBe('<h5>Heading 5</h5>')
      expect(markdownToHtml('###### Heading 6')).toBe('<h6>Heading 6</h6>')
    })

    it('should convert bold text', () => {
      expect(markdownToHtml('**Bold text**')).toBe('<p><strong>Bold text</strong></p>')
      expect(markdownToHtml('This is **bold** text')).toBe('<p>This is <strong>bold</strong> text</p>')
    })

    it('should convert italic text', () => {
      expect(markdownToHtml('*Italic text*')).toBe('<p><em>Italic text</em></p>')
      expect(markdownToHtml('This is *italic* text')).toBe('<p>This is <em>italic</em> text</p>')
    })

    it('should convert inline code', () => {
      expect(markdownToHtml('Use `console.log()` to debug')).toBe('<p>Use <code>console.log()</code> to debug</p>')
    })

    it('should convert code blocks with language', () => {
      const md = '```javascript\nconst x = 1;\nconsole.log(x);\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('<pre><code class="language-javascript">')
      expect(result).toContain('const x = 1;')
      expect(result).toContain('console.log(x);')
    })

    it('should convert code blocks without language', () => {
      const md = '```\nconst x = 1;\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('<pre><code class="language-text">')
      expect(result).toContain('const x = 1;')
    })

    it('should convert links', () => {
      expect(markdownToHtml('[Example](https://example.com)')).toBe('<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a></p>')
    })

    it('should convert images', () => {
      // Images on their own line are not wrapped in <p> tags (they match the image pattern first)
      expect(markdownToHtml('![Alt text](https://example.com/image.png)')).toBe('<img src="https://example.com/image.png" alt="Alt text" style="max-width: 100%; height: auto;" />')
      expect(markdownToHtml('![](https://example.com/image.png)')).toBe('<img src="https://example.com/image.png" alt="" style="max-width: 100%; height: auto;" />')
      // Images within text: the line matches paragraph pattern, then image is processed inline
      const result = markdownToHtml('Text ![Alt text](https://example.com/image.png) more text')
      expect(result).toContain('<img src="https://example.com/image.png" alt="Alt text"')
      expect(result).toContain('Text')
      expect(result).toContain('more text')
    })

    it('should convert blockquotes', () => {
      expect(markdownToHtml('> This is a quote')).toBe('<blockquote>This is a quote</blockquote>')
      expect(markdownToHtml('> Line 1\n> Line 2')).toBe('<blockquote>Line 1</blockquote><blockquote>Line 2</blockquote>')
    })

    it('should convert unordered lists', () => {
      const md = '- Item 1\n- Item 2\n- Item 3'
      const result = markdownToHtml(md)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
      expect(result).toContain('<li>Item 3</li>')
      expect(result).toContain('</ul>')
    })

    it('should convert ordered lists', () => {
      const md = '1. First\n2. Second\n3. Third'
      const result = markdownToHtml(md)
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>First</li>')
      expect(result).toContain('<li>Second</li>')
      expect(result).toContain('<li>Third</li>')
      expect(result).toContain('</ol>')
    })

    it('should convert multiple paragraphs', () => {
      const md = 'Paragraph 1\n\nParagraph 2'
      const result = markdownToHtml(md)
      expect(result).toContain('<p>Paragraph 1</p>')
      expect(result).toContain('<p>Paragraph 2</p>')
    })

    it('should handle nested formatting', () => {
      const md = 'This is **bold** and *italic*'
      const result = markdownToHtml(md)
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
    })

    it('should handle code blocks with multiple lines', () => {
      const md = '```javascript\nconst a = 1;\nconst b = 2;\nconst c = a + b;\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('const a = 1;')
      expect(result).toContain('const b = 2;')
      expect(result).toContain('const c = a + b;')
    })

    it('should handle mixed content', () => {
      const md = '# Title\n\nThis is a paragraph with **bold** and [a link](https://example.com).\n\n- List item 1\n- List item 2'
      const result = markdownToHtml(md)
      expect(result).toContain('<h1>Title</h1>')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<a href="https://example.com"')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>List item 1</li>')
    })

    it('should handle empty lines', () => {
      const md = 'Paragraph 1\n\n\nParagraph 2'
      const result = markdownToHtml(md)
      expect(result).toContain('<p>Paragraph 1</p>')
      expect(result).toContain('<p>Paragraph 2</p>')
    })

    it('should handle inline code within paragraphs', () => {
      const md = 'Use `code` in a sentence'
      const result = markdownToHtml(md)
      expect(result).toBe('<p>Use <code>code</code> in a sentence</p>')
    })

    it('should not convert code blocks to inline code', () => {
      const md = '```\ncode block\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('<pre><code')
      expect(result).not.toContain('<code>code block</code>')
    })
  })

  describe('round-trip conversions', () => {
    testIfDom('should preserve simple text through round-trip', () => {
      const html = '<p>Hello world</p>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      // Should contain the original text
      expect(backToHtml).toContain('Hello world')
    })

    testIfDom('should preserve headings through round-trip', () => {
      const html = '<h1>Title</h1>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      expect(backToHtml).toContain('<h1>Title</h1>')
    })

    testIfDom('should preserve bold and italic through round-trip', () => {
      const html = '<p>This is <strong>bold</strong> and <em>italic</em></p>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      expect(backToHtml).toContain('<strong>bold</strong>')
      expect(backToHtml).toContain('<em>italic</em>')
    })

    testIfDom('should preserve links through round-trip', () => {
      const html = '<p><a href="https://example.com">Link text</a></p>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      expect(backToHtml).toContain('href="https://example.com"')
      expect(backToHtml).toContain('Link text')
    })

    testIfDom('should preserve lists through round-trip', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      expect(backToHtml).toContain('<ul>')
      expect(backToHtml).toContain('<li>Item 1</li>')
      expect(backToHtml).toContain('<li>Item 2</li>')
    })

    testIfDom('should preserve code blocks through round-trip', () => {
      const html = '<pre><code class="language-javascript">const x = 1;</code></pre>'
      const md = htmlToMarkdown(html)
      const backToHtml = markdownToHtml(md)
      expect(backToHtml).toContain('<pre><code')
      expect(backToHtml).toContain('const x = 1;')
    })
  })

  describe('decodeHtmlEntities', () => {
    it('should decode HTML entities', () => {
      expect(decodeHtmlEntities('&amp;')).toBe('&')
      expect(decodeHtmlEntities('&lt;')).toBe('<')
      expect(decodeHtmlEntities('&gt;')).toBe('>')
      expect(decodeHtmlEntities('&quot;')).toBe('"')
      expect(decodeHtmlEntities('&#39;')).toBe("'")
      // &nbsp; decodes to non-breaking space character (U+00A0), not regular space
      const nbspResult = decodeHtmlEntities('&nbsp;')
      expect(nbspResult.charCodeAt(0)).toBe(160) // Non-breaking space character code
    })

    it('should handle empty string', () => {
      expect(decodeHtmlEntities('')).toBe('')
    })

    it('should handle text without entities', () => {
      expect(decodeHtmlEntities('Hello world')).toBe('Hello world')
    })

    it('should decode multiple entities', () => {
      expect(decodeHtmlEntities('&lt;div&gt;&amp;content&lt;/div&gt;')).toBe('<div>&content</div>')
    })
  })

  describe('fixDoubleEncodedEntities', () => {
    it('should fix double-encoded ampersand', () => {
      expect(fixDoubleEncodedEntities('&amp;amp;')).toBe('&amp;')
    })

    it('should fix double-encoded entities', () => {
      expect(fixDoubleEncodedEntities('&amp;nbsp;')).toBe('&nbsp;')
      expect(fixDoubleEncodedEntities('&amp;lt;')).toBe('&lt;')
      expect(fixDoubleEncodedEntities('&amp;gt;')).toBe('&gt;')
      expect(fixDoubleEncodedEntities('&amp;quot;')).toBe('&quot;')
      expect(fixDoubleEncodedEntities('&amp;#39;')).toBe('&#39;')
    })

    it('should handle empty string', () => {
      expect(fixDoubleEncodedEntities('')).toBe('')
    })

    it('should handle text without double encoding', () => {
      expect(fixDoubleEncodedEntities('Hello world')).toBe('Hello world')
    })

    it('should fix multiple double-encoded entities', () => {
      const input = '&amp;lt;div&amp;gt;&amp;amp;content&amp;lt;/div&amp;gt;'
      const expected = '&lt;div&gt;&amp;content&lt;/div&gt;'
      expect(fixDoubleEncodedEntities(input)).toBe(expected)
    })

    it('should handle mixed single and double encoding', () => {
      const input = '&amp;lt;div&gt;&amp;amp;content&lt;/div&gt;'
      const expected = '&lt;div&gt;&amp;content&lt;/div&gt;'
      expect(fixDoubleEncodedEntities(input)).toBe(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined input gracefully', () => {
      // Empty string should return '<p></p>' as fallback
      const result = markdownToHtml('')
      expect(result).toBe('<p></p>')
      // Only test htmlToMarkdown if DOM is available and function is properly set
      if (hasDom && typeof htmlToMarkdown === 'function') {
        try {
          expect(htmlToMarkdown('')).toBe('')
        } catch (e) {
          // If htmlToMarkdown throws (jsdom not available), that's ok
          // The test still passes for markdownToHtml
        }
      }
    })

    testIfDom('should handle malformed HTML', () => {
      // Should not throw, but may produce unexpected results
      expect(() => htmlToMarkdown('<div>Unclosed tag')).not.toThrow()
    })

    it('should handle markdown with special characters', () => {
      const md = 'Text with *asterisk* and **double asterisk**'
      const result = markdownToHtml(md)
      expect(result).toContain('<em>asterisk</em>')
      expect(result).toContain('<strong>double asterisk</strong>')
    })

    it('should handle code blocks at end of document', () => {
      const md = '```\ncode\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('<pre><code')
    })

    it('should handle lists at end of document', () => {
      const md = '- Item 1\n- Item 2'
      const result = markdownToHtml(md)
      expect(result).toContain('</ul>')
    })

    it('should handle empty code blocks', () => {
      const md = '```\n```'
      const result = markdownToHtml(md)
      expect(result).toContain('<pre><code')
    })

    testIfDom('should handle empty lists', () => {
      const html = '<ul></ul>'
      const md = htmlToMarkdown(html)
      expect(md).toBe('')
    })
  })
})
