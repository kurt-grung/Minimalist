#!/usr/bin/env ts-node
/**
 * Manual test script for frontmatter functionality
 * 
 * Usage: npx ts-node scripts/test-frontmatter.ts
 */

import { parseFrontmatter, stringifyFrontmatter } from '../lib/frontmatter'

console.log('🧪 Testing Frontmatter Functionality\n')

// Test 1: Parse frontmatter
console.log('Test 1: Parse frontmatter from markdown')
const markdown = `---
id: post-123
title: My Test Post
slug: my-test-post
date: 2024-01-01T00:00:00.000Z
excerpt: A test excerpt
author: Test Author
---

# My Test Post

This is the **content** of the post.

- Item 1
- Item 2
`

const { frontmatter, content } = parseFrontmatter(markdown)
console.log('✅ Frontmatter parsed:')
console.log(JSON.stringify(frontmatter, null, 2))
console.log('\n✅ Content extracted:')
console.log(content)
console.log('\n')

// Test 2: Stringify frontmatter
console.log('Test 2: Create markdown with frontmatter')
const newFrontmatter = {
  id: 'post-456',
  title: 'New Post',
  slug: 'new-post',
  date: '2024-01-02T00:00:00.000Z',
  excerpt: 'Another excerpt',
  author: 'Another Author'
}
const newContent = '# New Post\n\nThis is new content.'
const result = stringifyFrontmatter(newFrontmatter, newContent)
console.log('✅ Generated markdown:')
console.log(result)
console.log('\n')

// Test 3: Round trip
console.log('Test 3: Round trip (parse -> stringify -> parse)')
const roundTrip = parseFrontmatter(result)
console.log('✅ Round trip successful:')
console.log('Frontmatter matches:', JSON.stringify(roundTrip.frontmatter) === JSON.stringify(newFrontmatter))
console.log('Content matches:', roundTrip.content.trim() === newContent.trim())
console.log('\n')

console.log('✨ All tests completed!')

