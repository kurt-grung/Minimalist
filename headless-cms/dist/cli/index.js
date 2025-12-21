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
    // Copy middleware
    const middlewarePath = path_1.default.join(cwd, 'middleware.ts');
    if (!fs_1.default.existsSync(middlewarePath)) {
        const middlewareTemplate = fs_1.default.readFileSync(path_1.default.join(templateDir, 'middleware.ts'), 'utf-8');
        fs_1.default.writeFileSync(middlewarePath, middlewareTemplate);
        console.log('✅ Created middleware.ts');
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
    console.log('\n✨ Setup complete!');
    // Check if headless-cms is already in package.json (local dev or already installed)
    const hasPackage = packageJson.dependencies?.['headless-cms'] || packageJson.devDependencies?.['headless-cms'];
    console.log('\nNext steps:');
    if (!hasPackage) {
        console.log('1. Install dependencies: npm install headless-cms');
        console.log('2. Start your dev server: npm run dev');
    }
    else {
        console.log('1. Start your dev server: npm run dev');
    }
    console.log('2. Visit /admin to access the admin panel');
    console.log('3. Default credentials: admin / admin123');
    console.log('\n⚠️  Remember to change the default password in production!');
}
