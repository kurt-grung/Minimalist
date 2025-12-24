"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function init() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (command === 'init') {
        await initProject();
    }
    else {
        console.log(`
Usage: headless-cms init

This will set up the headless CMS in your Next.js project.
`);
    }
}
async function initProject() {
    const cwd = process.cwd();
    console.log('🚀 Initializing headless CMS...\n');
    // Check if this is a Next.js project
    const packageJsonPath = path_1.default.join(cwd, 'package.json');
    if (!fs_1.default.existsSync(packageJsonPath)) {
        console.error('❌ Error: package.json not found. Please run this in a Next.js project directory.');
        process.exit(1);
    }
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
    if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
        console.error('❌ Error: This does not appear to be a Next.js project.');
        process.exit(1);
    }
    // Get template directory (relative to package root)
    // When installed via npm, templates are in node_modules/headless-cms/templates
    // When running from source, they're in packages/headless-cms/templates
    // When compiled, __dirname is dist/cli, so we go up to package root
    let templateDir = path_1.default.join(__dirname, '../../templates/nextjs');
    // If not found, try node_modules location (when installed via npm)
    if (!fs_1.default.existsSync(templateDir)) {
        templateDir = path_1.default.join(cwd, 'node_modules/headless-cms/templates/nextjs');
    }
    // If still not found, try relative to current working directory (for local dev)
    if (!fs_1.default.existsSync(templateDir)) {
        const localTemplateDir = path_1.default.join(cwd, 'packages/headless-cms/templates/nextjs');
        if (fs_1.default.existsSync(localTemplateDir)) {
            templateDir = localTemplateDir;
        }
    }
    if (!fs_1.default.existsSync(templateDir)) {
        console.warn('⚠️  Warning: Template directory not found. Some files may not be copied.');
        console.warn(`   Tried: ${path_1.default.join(__dirname, '../../templates/nextjs')}`);
        console.warn(`   Tried: ${path_1.default.join(cwd, 'node_modules/headless-cms/templates/nextjs')}`);
    }
    // Copy API routes
    const apiDir = path_1.default.join(cwd, 'app/api');
    if (!fs_1.default.existsSync(apiDir)) {
        fs_1.default.mkdirSync(apiDir, { recursive: true });
    }
    // Copy API route templates
    const copyTemplate = (templatePath, targetPath) => {
        const fullTemplatePath = path_1.default.join(templateDir, templatePath);
        const fullTargetPath = path_1.default.join(cwd, targetPath);
        const targetDir = path_1.default.dirname(fullTargetPath);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(fullTargetPath)) {
            fs_1.default.copyFileSync(fullTemplatePath, fullTargetPath);
            return true;
        }
        return false;
    };
    const copiedRoutes = [];
    if (copyTemplate('app/api/auth/login/route.ts', 'app/api/auth/login/route.ts')) {
        copiedRoutes.push('app/api/auth/login/route.ts');
    }
    if (copyTemplate('app/api/posts/route.ts', 'app/api/posts/route.ts')) {
        copiedRoutes.push('app/api/posts/route.ts');
    }
    if (copyTemplate('app/api/posts/[slug]/route.ts', 'app/api/posts/[slug]/route.ts')) {
        copiedRoutes.push('app/api/posts/[slug]/route.ts');
    }
    if (copyTemplate('app/api/settings/route.ts', 'app/api/settings/route.ts')) {
        copiedRoutes.push('app/api/settings/route.ts');
    }
    if (copiedRoutes.length > 0) {
        console.log(`✅ Created ${copiedRoutes.length} API route(s)`);
    }
    // Copy admin pages
    const copiedAdmin = [];
    if (copyTemplate('app/admin/page.tsx', 'app/admin/page.tsx')) {
        copiedAdmin.push('app/admin/page.tsx');
    }
    if (copyTemplate('app/admin/dashboard/page.tsx', 'app/admin/dashboard/page.tsx')) {
        copiedAdmin.push('app/admin/dashboard/page.tsx');
    }
    if (copiedAdmin.length > 0) {
        console.log(`✅ Created ${copiedAdmin.length} admin page(s)`);
    }
    // Copy lib files (required for CMS functionality)
    const libDir = path_1.default.join(cwd, 'lib');
    if (!fs_1.default.existsSync(libDir)) {
        fs_1.default.mkdirSync(libDir, { recursive: true });
    }
    const copiedLib = [];
    if (copyTemplate('lib/auth.ts', 'lib/auth.ts')) {
        copiedLib.push('lib/auth.ts');
    }
    if (copyTemplate('lib/config.ts', 'lib/config.ts')) {
        copiedLib.push('lib/config.ts');
    }
    if (copyTemplate('lib/content.ts', 'lib/content.ts')) {
        copiedLib.push('lib/content.ts');
    }
    if (copyTemplate('lib/storage.ts', 'lib/storage.ts')) {
        copiedLib.push('lib/storage.ts');
    }
    if (copiedLib.length > 0) {
        console.log(`✅ Created ${copiedLib.length} library file(s)`);
    }
    // Copy components
    const componentsDir = path_1.default.join(cwd, 'components');
    if (!fs_1.default.existsSync(componentsDir)) {
        fs_1.default.mkdirSync(componentsDir, { recursive: true });
    }
    const copiedComponents = [];
    if (copyTemplate('components/RichTextEditor.tsx', 'components/RichTextEditor.tsx')) {
        copiedComponents.push('components/RichTextEditor.tsx');
    }
    if (copyTemplate('components/syntaxHighlighter.ts', 'components/syntaxHighlighter.ts')) {
        copiedComponents.push('components/syntaxHighlighter.ts');
    }
    if (copyTemplate('components/Footer.tsx', 'components/Footer.tsx')) {
        copiedComponents.push('components/Footer.tsx');
    }
    if (copiedComponents.length > 0) {
        console.log(`✅ Created ${copiedComponents.length} component(s)`);
    }
    // Copy frontend pages (only if they don't exist)
    const copiedPages = [];
    if (copyTemplate('app/page.tsx', 'app/page.tsx')) {
        copiedPages.push('app/page.tsx');
    }
    if (copyTemplate('app/[...slug]/page.tsx', 'app/[...slug]/page.tsx')) {
        copiedPages.push('app/[...slug]/page.tsx');
    }
    if (copyTemplate('app/sitemap.ts', 'app/sitemap.ts')) {
        copiedPages.push('app/sitemap.ts');
    }
    if (copiedPages.length > 0) {
        console.log(`✅ Created ${copiedPages.length} frontend page(s)`);
    }
    // Copy or merge globals.css
    const globalsCssPath = path_1.default.join(cwd, 'app/globals.css');
    const templateCssPath = path_1.default.join(templateDir, 'app/globals.css');
    if (fs_1.default.existsSync(templateCssPath)) {
        if (!fs_1.default.existsSync(globalsCssPath)) {
            const cssTemplate = fs_1.default.readFileSync(templateCssPath, 'utf-8');
            fs_1.default.writeFileSync(globalsCssPath, cssTemplate);
            console.log('✅ Created app/globals.css');
        }
        else {
            // Merge CSS - append rich text editor styles if not present
            const existingCss = fs_1.default.readFileSync(globalsCssPath, 'utf-8');
            const templateCss = fs_1.default.readFileSync(templateCssPath, 'utf-8');
            if (!existingCss.includes('Rich text content styles') && !existingCss.includes('Custom syntax highlighting')) {
                // Check if Tailwind is already set up
                if (!existingCss.includes('@tailwind')) {
                    // Add Tailwind directives if not present
                    const tailwindDirectives = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n';
                    fs_1.default.writeFileSync(globalsCssPath, tailwindDirectives + existingCss);
                }
                fs_1.default.appendFileSync(globalsCssPath, '\n\n' + templateCss.split('/* Rich text content styles */')[1] || '');
                console.log('✅ Updated app/globals.css with rich text editor styles');
            }
        }
    }
    // Copy Tailwind config files
    const copiedConfig = [];
    if (copyTemplate('tailwind.config.js', 'tailwind.config.js')) {
        copiedConfig.push('tailwind.config.js');
    }
    if (copyTemplate('postcss.config.js', 'postcss.config.js')) {
        copiedConfig.push('postcss.config.js');
    }
    if (copiedConfig.length > 0) {
        console.log(`✅ Created ${copiedConfig.length} config file(s)`);
    }
    // Create content directory
    const contentDir = path_1.default.join(cwd, 'content');
    if (!fs_1.default.existsSync(contentDir)) {
        fs_1.default.mkdirSync(contentDir, { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(contentDir, 'posts'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(contentDir, 'pages'), { recursive: true });
        console.log('✅ Created content directory structure');
    }
    // Create users.json if it doesn't exist
    const usersPath = path_1.default.join(cwd, 'users.json');
    if (!fs_1.default.existsSync(usersPath)) {
        const usersTemplate = {
            users: [
                {
                    username: 'admin',
                    passwordHash: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO' // This will be replaced by the auth library
                }
            ]
        };
        fs_1.default.writeFileSync(usersPath, JSON.stringify(usersTemplate, null, 2));
        console.log('✅ Created users.json (default admin user)');
    }
    // Create config.json if it doesn't exist
    const configPath = path_1.default.join(cwd, 'config.json');
    if (!fs_1.default.existsSync(configPath)) {
        const configTemplate = {
            siteTitle: 'My Blog',
            siteSubtitle: 'Welcome to our simple file-based CMS',
            postRoute: 'posts',
            pageRoute: ''
        };
        fs_1.default.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));
        console.log('✅ Created config.json');
    }
    // Update .gitignore
    const gitignorePath = path_1.default.join(cwd, '.gitignore');
    let gitignore = fs_1.default.existsSync(gitignorePath) ? fs_1.default.readFileSync(gitignorePath, 'utf-8') : '';
    if (!gitignore.includes('users.json')) {
        gitignore += '\n# Headless CMS\n# users.json should be committed for production\n# content/ directory can be committed or ignored\n';
        fs_1.default.writeFileSync(gitignorePath, gitignore);
        console.log('✅ Updated .gitignore');
    }
    // Check/update tsconfig.json for path alias
    const tsconfigPath = path_1.default.join(cwd, 'tsconfig.json');
    if (fs_1.default.existsSync(tsconfigPath)) {
        try {
            const tsconfig = JSON.parse(fs_1.default.readFileSync(tsconfigPath, 'utf-8'));
            const needsUpdate = !tsconfig.compilerOptions?.paths?.['@/*'];
            if (needsUpdate) {
                if (!tsconfig.compilerOptions) {
                    tsconfig.compilerOptions = {};
                }
                if (!tsconfig.compilerOptions.paths) {
                    tsconfig.compilerOptions.paths = {};
                }
                tsconfig.compilerOptions.paths['@/*'] = ['./*'];
                fs_1.default.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
                console.log('✅ Updated tsconfig.json with path alias (@/*)');
            }
        }
        catch (error) {
            // tsconfig.json might be invalid JSON or missing, that's okay
            console.warn('⚠️  Could not update tsconfig.json. Make sure you have @/* path alias configured.');
        }
    }
    else {
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
        };
        fs_1.default.writeFileSync(tsconfigPath, JSON.stringify(basicTsconfig, null, 2));
        console.log('✅ Created tsconfig.json with path alias configuration');
    }
    console.log('\n✨ Setup complete!');
    // Check if headless-cms is already in package.json (local dev or already installed)
    const hasPackage = packageJson.dependencies?.['headless-cms'] || packageJson.devDependencies?.['headless-cms'];
    console.log('\n✨ Setup complete!');
    console.log('\n📦 Next steps:');
    if (!hasPackage) {
        console.log('1. Install the package: npm install headless-cms');
    }
    console.log(`${!hasPackage ? '2' : '1'}. Install core dependencies:`);
    console.log('   npm install bcryptjs jsonwebtoken');
    console.log('   npm install --save-dev @types/bcryptjs @types/jsonwebtoken');
    console.log(`${!hasPackage ? '3' : '2'}. Install Tailwind CSS (for styling):`);
    console.log('   npm install -D tailwindcss postcss autoprefixer');
    console.log('   npx tailwindcss init -p');
    console.log(`${!hasPackage ? '4' : '3'}. Start your dev server: npm run dev`);
    console.log(`${!hasPackage ? '5' : '4'}. Visit /admin to access the admin panel`);
    console.log(`   Default credentials: admin / admin123`);
    console.log('\n⚠️  Remember to change the default password in production!');
    console.log('\n💡 Features included:');
    console.log('   ✅ Complete admin panel with authentication');
    console.log('   ✅ Custom rich text editor (WYSIWYG + Markdown, zero dependencies)');
    console.log('   ✅ Custom syntax highlighting with Tailwind CSS');
    console.log('   ✅ Post management (create, edit, delete)');
    console.log('   ✅ Settings management');
    console.log('   ✅ File-based content storage');
    console.log('   ✅ Ready for production deployment');
}
