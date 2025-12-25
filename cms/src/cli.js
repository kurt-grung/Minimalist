#!/usr/bin/env node

// This is a CommonJS wrapper for the CLI
const { init } = require('./cli/index.js')
const args = process.argv.slice(2)
const command = args[0] || 'init'

if (command === 'init') {
  init().catch(console.error)
} else {
  console.log(`
Usage: minimalist init

This will set up the minimalist CMS in your Next.js project.
`)
}
