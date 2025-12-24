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
  } else {
    console.log(`
Usage: headless-cms init

This will set up the headless CMS in your Next.js project.
`)
  }
}

async function initProject() {
  const cwd = process.cwd()
  
  console.log('🚀 Initializing headless CMS...\n')

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
  // When installed via npm, templates are in node_modules/headless-cms/templates
  // When running from source, they're in packages/headless-cms/templates
  // When compiled, __dirname is dist/cli, so we go up to package root
  let templateDir = path.join(__dirname, '../../templates/nextjs')
  
  // If not found, try node_modules location (when installed via npm)
  if (!fs.existsSync(templateDir)) {
    templateDir = path.join(cwd, 'node_modules/headless-cms/templates/nextjs')
  }
  
  // If still not found, try relative to current working directory (for local dev)
  if (!fs.existsSync(templateDir)) {
    const localTemplateDir = path.join(cwd, 'packages/headless-cms/templates/nextjs')
    if (fs.existsSync(localTemplateDir)) {
      templateDir = localTemplateDir
    }
  }
  
  if (!fs.existsSync(templateDir)) {
    console.warn('⚠️  Warning: Template directory not found. Some files may not be copied.')
    console.warn(`   Tried: ${path.join(__dirname, '../../templates/nextjs')}`)
    console.warn(`   Tried: ${path.join(cwd, 'node_modules/headless-cms/templates/nextjs')}`)
  }
  
  // Copy API routes
  const apiDir = path.join(cwd, 'app/api')
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }

  // Copy API route templates
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
  
  if (copyTemplate('app/api/auth/login/route.ts', 'app/api/auth/login/route.ts')) {
    copiedRoutes.push('app/api/auth/login/route.ts')
  }
  if (copyTemplate('app/api/posts/route.ts', 'app/api/posts/route.ts')) {
    copiedRoutes.push('app/api/posts/route.ts')
  }
  if (copyTemplate('app/api/posts/[slug]/route.ts', 'app/api/posts/[slug]/route.ts')) {
    copiedRoutes.push('app/api/posts/[slug]/route.ts')
  }
  if (copyTemplate('app/api/settings/route.ts', 'app/api/settings/route.ts')) {
    copiedRoutes.push('app/api/settings/route.ts')
  }

  if (copiedRoutes.length > 0) {
    console.log(`✅ Created ${copiedRoutes.length} API route(s)`)
  }

  // Copy admin pages
  const copiedAdmin: string[] = []
  if (copyTemplate('app/admin/page.tsx', 'app/admin/page.tsx')) {
    copiedAdmin.push('app/admin/page.tsx')
  }
  if (copyTemplate('app/admin/dashboard/page.tsx', 'app/admin/dashboard/page.tsx')) {
    copiedAdmin.push('app/admin/dashboard/page.tsx')
  }
  if (copiedAdmin.length > 0) {
    console.log(`✅ Created ${copiedAdmin.length} admin page(s)`)
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
    gitignore += '\n# Headless CMS\n# users.json should be committed for production\n# content/ directory can be committed or ignored\n'
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
  
  // Check if headless-cms is already in package.json (local dev or already installed)
  const hasPackage = packageJson.dependencies?.['headless-cms'] || packageJson.devDependencies?.['headless-cms']
  
  console.log('\n✨ Setup complete!')
  console.log('\n📦 Next steps:')
  if (!hasPackage) {
    console.log('1. Install the package: npm install headless-cms')
  }
  console.log(`${!hasPackage ? '2' : '1'}. Install core dependencies:`)
  console.log('   npm install bcryptjs jsonwebtoken')
  console.log('   npm install --save-dev @types/bcryptjs @types/jsonwebtoken')
  console.log(`${!hasPackage ? '3' : '2'}. Install Tailwind CSS (for styling):`)
  console.log('   npm install -D tailwindcss postcss autoprefixer')
  console.log('   npx tailwindcss init -p')
  console.log(`${!hasPackage ? '4' : '3'}. Start your dev server: npm run dev`)
  console.log(`${!hasPackage ? '5' : '4'}. Visit /admin to access the admin panel`)
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

export { init }

