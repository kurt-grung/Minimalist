#!/usr/bin/env ts-node
/**
 * Migration tool: Convert JSON posts to Markdown with frontmatter
 * 
 * Usage: 
 *   npx ts-node scripts/migrate-to-markdown.ts [locale]
 * 
 * If locale is provided, only migrates posts for that locale.
 * Otherwise, migrates all posts from all locales.
 */

import fs from 'fs'
import path from 'path'
import { parseFrontmatter, stringifyFrontmatter } from '../lib/frontmatter'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  date: string
  author?: string
}

// Node.js compatible HTML to Markdown converter
function htmlToMarkdown(html: string): string {
  if (!html) return ''
  
  // Simple regex-based conversion for Node.js environment
  let md = html
  
  // Remove script and style tags
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
  
  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*class="language-(\w+)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1\n$2\n```\n\n')
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n')
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  
  // Bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
  
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  
  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.trim().split('\n')
    return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n'
  })
  
  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    return items.map((item: string) => {
      const text = item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
      return `- ${text}`
    }).join('\n') + '\n\n'
  })
  
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    return items.map((item: string, i: number) => {
      const text = item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
      return `${i + 1}. ${text}`
    }).join('\n') + '\n\n'
  })
  
  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  
  // Line breaks
  md = md.replace(/<br[^>]*\/?>/gi, '\n')
  
  // Divs
  md = md.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
  
  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '')
  
  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ')
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/&quot;/g, '"')
  md = md.replace(/&#39;/g, "'")
  
  // Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n')
  
  return md.trim()
}

async function migratePosts(locale?: string) {
  const cwd = process.cwd()
  const contentDir = path.join(cwd, 'content', 'posts')
  
  if (!fs.existsSync(contentDir)) {
    console.error('❌ Error: content/posts directory not found')
    process.exit(1)
  }
  
  let locales: string[] = []
  
  if (locale) {
    // Migrate specific locale
    const localeDir = path.join(contentDir, locale)
    if (!fs.existsSync(localeDir)) {
      console.error(`❌ Error: content/posts/${locale} directory not found`)
      process.exit(1)
    }
    locales = [locale]
  } else {
    // Migrate all locales
    const entries = fs.readdirSync(contentDir, { withFileTypes: true })
    locales = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
    
    // Also check for legacy format (posts directly in content/posts)
    const legacyFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace('.json', ''))
    
    if (legacyFiles.length > 0) {
      console.log('⚠️  Found legacy format posts (not in locale folders)')
      console.log('   These will be skipped. Please organize them into locale folders first.')
    }
  }
  
  let totalMigrated = 0
  let totalSkipped = 0
  let totalErrors = 0
  
  for (const loc of locales) {
    const localeDir = path.join(contentDir, loc)
    const files = fs.readdirSync(localeDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))
    
    console.log(`\n📁 Processing locale: ${loc}`)
    console.log(`   Found ${jsonFiles.length} JSON file(s)`)
    
    for (const file of jsonFiles) {
      const jsonPath = path.join(localeDir, file)
      const slug = file.replace('.json', '')
      const mdPath = path.join(localeDir, `${slug}.md`)
      
      // Skip if markdown file already exists
      if (fs.existsSync(mdPath)) {
        console.log(`   ⏭️  Skipping ${file} (markdown file already exists)`)
        totalSkipped++
        continue
      }
      
      try {
        // Read JSON post
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
        const post: Post = JSON.parse(jsonContent)
        
        // Convert HTML content to Markdown
        const markdownContent = htmlToMarkdown(post.content)
        
        // Create frontmatter
        const frontmatter: any = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          date: post.date,
        }
        if (post.excerpt) frontmatter.excerpt = post.excerpt
        if (post.author) frontmatter.author = post.author
        
        // Write markdown file with frontmatter
        const markdown = stringifyFrontmatter(frontmatter, markdownContent)
        fs.writeFileSync(mdPath, markdown, 'utf-8')
        
        console.log(`   ✅ Migrated ${file} → ${slug}.md`)
        totalMigrated++
      } catch (error) {
        console.error(`   ❌ Error migrating ${file}:`, error instanceof Error ? error.message : error)
        totalErrors++
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`   ✅ Migrated: ${totalMigrated}`)
  console.log(`   ⏭️  Skipped: ${totalSkipped}`)
  console.log(`   ❌ Errors: ${totalErrors}`)
  console.log('='.repeat(50))
  
  if (totalMigrated > 0) {
    console.log('\n💡 Note: JSON files have been preserved.')
    console.log('   You can delete them after verifying the markdown files are correct.')
  }
}

// Run migration
const locale = process.argv[2]
migratePosts(locale).catch(error => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})

