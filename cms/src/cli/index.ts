import fs from 'fs'
import path from 'path'

// In CommonJS, __dirname is available at runtime
// TypeScript doesn't know about it, so we'll use a workaround
declare const __dirname: string

async function init() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'init') {
    await initProject()
  } else if (command === 'migrate') {
    await migrateToMarkdown()
  } else {
    console.log(`
Usage: 
  minimalist init          Set up the minimalist CMS in your Next.js project
  minimalist migrate       Convert JSON posts to Markdown format with frontmatter

Examples:
  minimalist init
  minimalist migrate
`)
  }
}

async function initProject() {
  const cwd = process.cwd()
  
  console.log('🚀 Initializing minimalist CMS...\n')

  // Check if this is a Next.js project
  const packageJsonPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: package.json not found. Please run this in a Next.js project directory.')
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    console.error('❌ Error: This does not appear to be a Next.js project.')
    process.exit(1)
  }

  // Get template directory (relative to package root)
  // When installed via npm, templates are in node_modules/minimalist/templates
  // When running from source, they're in packages/minimalist/templates
  // When compiled, __dirname is dist/cli, so we go up to package root
  let templateDir = path.join(__dirname, '../../templates/nextjs')
  
  // If not found, try node_modules location (when installed via npm)
  if (!fs.existsSync(templateDir)) {
    templateDir = path.join(cwd, 'node_modules/minimalist/templates/nextjs')
  }
  
  // If still not found, try relative to current working directory (for local dev)
  if (!fs.existsSync(templateDir)) {
    const localTemplateDir = path.join(cwd, 'packages/minimalist/templates/nextjs')
    if (fs.existsSync(localTemplateDir)) {
      templateDir = localTemplateDir
    }
  }
  
  if (!fs.existsSync(templateDir)) {
    console.warn('⚠️  Warning: Template directory not found. Some files may not be copied.')
    console.warn(`   Tried: ${path.join(__dirname, '../../templates/nextjs')}`)
    console.warn(`   Tried: ${path.join(cwd, 'node_modules/minimalist/templates/nextjs')}`)
  }
  
  // Copy CMS routes (all under /cms)
  const cmsDir = path.join(cwd, 'app/cms')
  if (!fs.existsSync(cmsDir)) {
    fs.mkdirSync(cmsDir, { recursive: true })
  }

  // Copy template files
  const copyTemplate = (templatePath: string, targetPath: string) => {
    const fullTemplatePath = path.join(templateDir, templatePath)
    const fullTargetPath = path.join(cwd, targetPath)
    const targetDir = path.dirname(fullTargetPath)
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    if (!fs.existsSync(fullTargetPath)) {
      fs.copyFileSync(fullTemplatePath, fullTargetPath)
      return true
    }
    return false
  }

  const copiedRoutes: string[] = []
  
  // Copy CMS API routes
  if (copyTemplate('app/cms/api/route.ts', 'app/cms/api/route.ts')) {
    copiedRoutes.push('app/cms/api/route.ts')
  }
  if (copyTemplate('app/cms/api/auth/login/route.ts', 'app/cms/api/auth/login/route.ts')) {
    copiedRoutes.push('app/cms/api/auth/login/route.ts')
  }
  if (copyTemplate('app/cms/api/posts/route.ts', 'app/cms/api/posts/route.ts')) {
    copiedRoutes.push('app/cms/api/posts/route.ts')
  }
  if (copyTemplate('app/cms/api/posts/[slug]/route.ts', 'app/cms/api/posts/[slug]/route.ts')) {
    copiedRoutes.push('app/cms/api/posts/[slug]/route.ts')
  }
  if (copyTemplate('app/cms/api/settings/route.ts', 'app/cms/api/settings/route.ts')) {
    copiedRoutes.push('app/cms/api/settings/route.ts')
  }

  if (copiedRoutes.length > 0) {
    console.log(`✅ Created ${copiedRoutes.length} CMS API route(s)`)
  }

  // Copy CMS pages
  const copiedCms: string[] = []
  if (copyTemplate('app/cms/page.tsx', 'app/cms/page.tsx')) {
    copiedCms.push('app/cms/page.tsx')
  }
  if (copyTemplate('app/cms/dashboard/page.tsx', 'app/cms/dashboard/page.tsx')) {
    copiedCms.push('app/cms/dashboard/page.tsx')
  }
  if (copiedCms.length > 0) {
    console.log(`✅ Created ${copiedCms.length} CMS page(s)`)
  }

  // Copy lib files (required for CMS functionality)
  const libDir = path.join(cwd, 'lib')
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true })
  }
  const copiedLib: string[] = []
  if (copyTemplate('lib/auth.ts', 'lib/auth.ts')) {
    copiedLib.push('lib/auth.ts')
  }
  if (copyTemplate('lib/config.ts', 'lib/config.ts')) {
    copiedLib.push('lib/config.ts')
  }
  if (copyTemplate('lib/content.ts', 'lib/content.ts')) {
    copiedLib.push('lib/content.ts')
  }
  if (copyTemplate('lib/storage.ts', 'lib/storage.ts')) {
    copiedLib.push('lib/storage.ts')
  }
  if (copiedLib.length > 0) {
    console.log(`✅ Created ${copiedLib.length} library file(s)`)
  }

  // Copy components
  const componentsDir = path.join(cwd, 'components')
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true })
  }
  const copiedComponents: string[] = []
  if (copyTemplate('components/RichTextEditor.tsx', 'components/RichTextEditor.tsx')) {
    copiedComponents.push('components/RichTextEditor.tsx')
  }
  if (copyTemplate('components/syntaxHighlighter.ts', 'components/syntaxHighlighter.ts')) {
    copiedComponents.push('components/syntaxHighlighter.ts')
  }
  if (copyTemplate('components/Footer.tsx', 'components/Footer.tsx')) {
    copiedComponents.push('components/Footer.tsx')
  }
  if (copiedComponents.length > 0) {
    console.log(`✅ Created ${copiedComponents.length} component(s)`)
  }

  // Copy frontend pages (only if they don't exist)
  const copiedPages: string[] = []
  if (copyTemplate('app/page.tsx', 'app/page.tsx')) {
    copiedPages.push('app/page.tsx')
  }
  if (copyTemplate('app/[...slug]/page.tsx', 'app/[...slug]/page.tsx')) {
    copiedPages.push('app/[...slug]/page.tsx')
  }
  if (copyTemplate('app/sitemap.ts', 'app/sitemap.ts')) {
    copiedPages.push('app/sitemap.ts')
  }
  if (copiedPages.length > 0) {
    console.log(`✅ Created ${copiedPages.length} frontend page(s)`)
  }

  // Copy or merge globals.css
  const globalsCssPath = path.join(cwd, 'app/globals.css')
  const templateCssPath = path.join(templateDir, 'app/globals.css')
  if (fs.existsSync(templateCssPath)) {
    if (!fs.existsSync(globalsCssPath)) {
      const cssTemplate = fs.readFileSync(templateCssPath, 'utf-8')
      fs.writeFileSync(globalsCssPath, cssTemplate)
      console.log('✅ Created app/globals.css')
    } else {
      // Merge CSS - append rich text editor styles if not present
      const existingCss = fs.readFileSync(globalsCssPath, 'utf-8')
      const templateCss = fs.readFileSync(templateCssPath, 'utf-8')
      if (!existingCss.includes('Rich text content styles') && !existingCss.includes('Custom syntax highlighting')) {
        // Check if Tailwind is already set up
        if (!existingCss.includes('@tailwind')) {
          // Add Tailwind directives if not present
          const tailwindDirectives = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n'
          fs.writeFileSync(globalsCssPath, tailwindDirectives + existingCss)
        }
        fs.appendFileSync(globalsCssPath, '\n\n' + templateCss.split('/* Rich text content styles */')[1] || '')
        console.log('✅ Updated app/globals.css with rich text editor styles')
      }
    }
  }

  // Copy Tailwind config files
  const copiedConfig: string[] = []
  if (copyTemplate('tailwind.config.js', 'tailwind.config.js')) {
    copiedConfig.push('tailwind.config.js')
  }
  if (copyTemplate('postcss.config.js', 'postcss.config.js')) {
    copiedConfig.push('postcss.config.js')
  }
  if (copiedConfig.length > 0) {
    console.log(`✅ Created ${copiedConfig.length} config file(s)`)
  }

  // Create content directory
  const contentDir = path.join(cwd, 'content')
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true })
    fs.mkdirSync(path.join(contentDir, 'posts'), { recursive: true })
    fs.mkdirSync(path.join(contentDir, 'pages'), { recursive: true })
    console.log('✅ Created content directory structure')
  }

  // Create users.json if it doesn't exist
  const usersPath = path.join(cwd, 'users.json')
  if (!fs.existsSync(usersPath)) {
    const usersTemplate = {
      users: [
        {
          username: 'admin',
          passwordHash: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO' // This will be replaced by the auth library
        }
      ]
    }
    fs.writeFileSync(usersPath, JSON.stringify(usersTemplate, null, 2))
    console.log('✅ Created users.json (default admin user)')
  }

  // Create config.json if it doesn't exist
  const configPath = path.join(cwd, 'config.json')
  if (!fs.existsSync(configPath)) {
    const configTemplate = {
      siteTitle: 'My Blog',
      siteSubtitle: 'Welcome to our simple file-based CMS',
      postRoute: 'posts',
      pageRoute: ''
    }
    fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2))
    console.log('✅ Created config.json')
  }

  // Update .gitignore
  const gitignorePath = path.join(cwd, '.gitignore')
  let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : ''
  
  if (!gitignore.includes('users.json')) {
    gitignore += '\n# Minimalist CMS\n# users.json should be committed for production\n# content/ directory can be committed or ignored\n'
    fs.writeFileSync(gitignorePath, gitignore)
    console.log('✅ Updated .gitignore')
  }

  // Check/update tsconfig.json for path alias
  const tsconfigPath = path.join(cwd, 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
      const needsUpdate = !tsconfig.compilerOptions?.paths?.['@/*']
      
      if (needsUpdate) {
        if (!tsconfig.compilerOptions) {
          tsconfig.compilerOptions = {}
        }
        if (!tsconfig.compilerOptions.paths) {
          tsconfig.compilerOptions.paths = {}
        }
        tsconfig.compilerOptions.paths['@/*'] = ['./*']
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2))
        console.log('✅ Updated tsconfig.json with path alias (@/*)')
      }
    } catch (error) {
      // tsconfig.json might be invalid JSON or missing, that's okay
      console.warn('⚠️  Could not update tsconfig.json. Make sure you have @/* path alias configured.')
    }
  } else {
    // Create a basic tsconfig.json if it doesn't exist
    const basicTsconfig = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        paths: {
          '@/*': ['./*']
        }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }
    fs.writeFileSync(tsconfigPath, JSON.stringify(basicTsconfig, null, 2))
    console.log('✅ Created tsconfig.json with path alias configuration')
  }

  console.log('\n✨ Setup complete!')
  
  // Check if minimalist is already in package.json (local dev or already installed)
  const hasPackage = packageJson.dependencies?.['minimalist'] || packageJson.devDependencies?.['minimalist']
  
  console.log('\n✨ Setup complete!')
  console.log('\n📦 Next steps:')
  if (!hasPackage) {
    console.log('1. Install the package: npm install minimalist')
  }
  console.log(`${!hasPackage ? '2' : '1'}. Install core dependencies:`)
  console.log('   npm install bcryptjs jsonwebtoken')
  console.log('   npm install --save-dev @types/bcryptjs @types/jsonwebtoken')
  console.log(`${!hasPackage ? '3' : '2'}. Install Tailwind CSS (for styling):`)
  console.log('   npm install -D tailwindcss postcss autoprefixer')
  console.log('   npx tailwindcss init -p')
  console.log(`${!hasPackage ? '4' : '3'}. Start your dev server: npm run dev`)
  console.log(`${!hasPackage ? '5' : '4'}. Visit /cms to access the CMS`)
  console.log(`   Default credentials: admin / admin123`)
  console.log('\n⚠️  Remember to change the default password in production!')
  console.log('\n💡 Features included:')
  console.log('   ✅ Complete admin panel with authentication')
  console.log('   ✅ Custom rich text editor (WYSIWYG + Markdown, zero dependencies)')
  console.log('   ✅ Custom syntax highlighting with Tailwind CSS')
  console.log('   ✅ Post management (create, edit, delete)')
  console.log('   ✅ Settings management')
  console.log('   ✅ File-based content storage')
  console.log('   ✅ Ready for production deployment')
}

async function migrateToMarkdown() {
  const cwd = process.cwd()
  
  console.log('🔄 Migrating JSON posts to Markdown format...\n')
  
  const contentDir = path.join(cwd, 'content')
  if (!fs.existsSync(contentDir)) {
    console.error('❌ Error: content/ directory not found.')
    console.error('   Make sure you run this command in your Next.js project root.')
    process.exit(1)
  }
  
  const postsDir = path.join(contentDir, 'posts')
  if (!fs.existsSync(postsDir)) {
    console.error('❌ Error: content/posts/ directory not found.')
    process.exit(1)
  }
  
  // Simple frontmatter generator
  const generateFrontmatter = (post: any): string => {
    const frontmatter: Record<string, string> = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      date: post.date,
    }
    
    if (post.excerpt) {
      frontmatter.excerpt = post.excerpt
    }
    
    if (post.author) {
      frontmatter.author = post.author
    }
    
    const lines = Object.entries(frontmatter).map(([key, value]) => {
      const escapedValue = String(value).replace(/"/g, '\\"')
      return `${key}: "${escapedValue}"`
    })
    
    return `---\n${lines.join('\n')}\n---\n\n`
  }
  
  // Process posts directory (handle locale subdirectories)
  const processDirectory = async (dir: string, relativePath: string = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Recursively process subdirectories (locales)
        const subResults = await processDirectory(fullPath, path.join(relativePath, entry.name))
        migratedCount += subResults.migrated
        skippedCount += subResults.skipped
        errorCount += subResults.errors
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const jsonContent = fs.readFileSync(fullPath, 'utf-8')
          const post = JSON.parse(jsonContent)
          
          // Check if markdown version already exists
          const mdPath = fullPath.replace('.json', '.md')
          if (fs.existsSync(mdPath)) {
            console.log(`⏭️  Skipping ${path.join(relativePath, entry.name)} (markdown already exists)`)
            skippedCount++
            continue
          }
          
          // Convert HTML content to markdown
          // Note: This is a simplified converter using regex
          // For better results, consider using a library like turndown
          let markdownContent = post.content || ''
          
          // Basic HTML to markdown conversion using regex
          if (markdownContent.includes('<')) {
            // Handle code blocks first (before other processing)
            markdownContent = markdownContent.replace(
              /<pre><code[^>]*class="language-(\w+)"[^>]*>(.*?)<\/code><\/pre>/gis,
              (match, lang, code) => {
                return `\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`
              }
            )
            
            // Handle headings
            markdownContent = markdownContent
              .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n')
              .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n')
              .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n')
              .replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n\n')
              .replace(/<h5[^>]*>(.*?)<\/h5>/gis, '##### $1\n\n')
              .replace(/<h6[^>]*>(.*?)<\/h6>/gis, '###### $1\n\n')
            
            // Handle blockquotes
            markdownContent = markdownContent.replace(
              /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
              (match, content) => {
                const lines = content.split('\n').filter((l: string) => l.trim())
                return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n'
              }
            )
            
            // Handle lists
            markdownContent = markdownContent.replace(
              /<ul[^>]*>(.*?)<\/ul>/gis,
              (match, content) => {
                const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || []
                return items.map((item: string) => {
                  const text = item.replace(/<li[^>]*>(.*?)<\/li>/gis, '$1').trim()
                  return `- ${text}`
                }).join('\n') + '\n\n'
              }
            )
            
            markdownContent = markdownContent.replace(
              /<ol[^>]*>(.*?)<\/ol>/gis,
              (match, content) => {
                const items = content.match(/<li[^>]*>(.*?)<\/li>/gis) || []
                return items.map((item: string, i: number) => {
                  const text = item.replace(/<li[^>]*>(.*?)<\/li>/gis, '$1').trim()
                  return `${i + 1}. ${text}`
                }).join('\n') + '\n\n'
              }
            )
            
            // Handle paragraphs
            markdownContent = markdownContent.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
            
            // Handle inline formatting
            markdownContent = markdownContent
              .replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**')
              .replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**')
              .replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*')
              .replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*')
            
            // Handle inline code (but not code blocks)
            markdownContent = markdownContent.replace(
              /<code[^>]*>(.*?)<\/code>/gis,
              (match, code) => {
                // Skip if it's inside a pre tag (already handled)
                return `\`${code}\``
              }
            )
            
            // Handle links
            markdownContent = markdownContent.replace(
              /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis,
              '[$2]($1)'
            )
            
            // Handle line breaks
            markdownContent = markdownContent.replace(/<br\s*\/?>/gi, '\n')
            
            // Remove remaining HTML tags
            markdownContent = markdownContent.replace(/<[^>]+>/g, '')
            
            // Decode HTML entities
            markdownContent = markdownContent
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&apos;/g, "'")
            
            // Clean up excessive newlines
            markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim()
          }
          
          // Generate markdown file with frontmatter
          const frontmatter = generateFrontmatter(post)
          const markdownFile = frontmatter + markdownContent
          
          // Write markdown file
          fs.writeFileSync(mdPath, markdownFile, 'utf-8')
          
          console.log(`✅ Migrated ${path.join(relativePath, entry.name)} → ${path.join(relativePath, entry.name.replace('.json', '.md'))}`)
          migratedCount++
        } catch (error) {
          console.error(`❌ Error migrating ${path.join(relativePath, entry.name)}:`, error)
          errorCount++
        }
      }
    }
    
    return { migrated: migratedCount, skipped: skippedCount, errors: errorCount }
  }
  
  const results = await processDirectory(postsDir)
  
  console.log('\n✨ Migration complete!')
  console.log(`   ✅ Migrated: ${results.migrated} post(s)`)
  if (results.skipped > 0) {
    console.log(`   ⏭️  Skipped: ${results.skipped} post(s) (markdown already exists)`)
  }
  if (results.errors > 0) {
    console.log(`   ❌ Errors: ${results.errors} post(s)`)
  }
  
  if (results.migrated > 0) {
    console.log('\n💡 Note: JSON files have been kept for backup.')
    console.log('   You can delete them after verifying the markdown files are correct.')
  }
}

export { init }

