#!/usr/bin/env node
// Husky install script that skips in CI environments
import { execSync } from 'child_process';
import fs from 'fs';

// Skip husky install in CI environments
if (process.env.CI) {
  console.log('Skipping husky install in CI environment');
  process.exit(0);
}

// Only install if .git directory exists
if (!fs.existsSync('.git')) {
  console.log('Skipping husky install (not a git repository)');
  process.exit(0);
}

// Try to install husky
try {
  execSync('husky install', { stdio: 'inherit' });
} catch (error) {
  // Silently fail if husky is not available (e.g., in CI before dependencies are installed)
  console.log('Husky install skipped (not available)');
  process.exit(0);
}

