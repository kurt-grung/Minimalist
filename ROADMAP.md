# Minimalist CMS Roadmap

This document outlines the planned features, improvements, and enhancements for the Minimalist CMS project.

## Current Status ✅ 

### Core Features (Complete)
- ✅ Admin panel with authentication
- ✅ Create, edit, and delete posts
- ✅ File-based content storage (JSON and Markdown with frontmatter)
- ✅ Static site generation
- ✅ Settings management (site title, subtitle, route prefixes, locales)
- ✅ Sitemap generation with multi-locale support
- ✅ JWT authentication with session management
- ✅ Multi-locale support (i18n) - Full implementation with locale-based routing
- ✅ Rich text editor with WYSIWYG and Markdown modes (zero dependencies)
- ✅ Locale-based routing and content management
- ✅ API routes with locale support
- ✅ Image management - Upload, media library, and editor integration
- ✅ Responsive grid layout with image previews
- ✅ Full-text search - Search API, results page, and admin panel integration
- ✅ Content sanitization - XSS protection with HTML sanitization
- ✅ Categories and tags - Hierarchical categories and flat tags with admin management
- ✅ Testing infrastructure - Unit tests with Vitest
- ✅ Pre-commit hooks - Automated testing and build verification

---

## Phase 1: Content Enhancement (Short-term)

### Priority: High

#### 1.1 Rich Text Editor ✅ COMPLETE
- [x] Custom WYSIWYG editor built from scratch (no external libraries)
- [x] Support for formatting (bold, italic, headings, lists)
- [x] Link insertion
- [x] Code blocks with custom syntax highlighting (no highlight.js)
- [x] Block quotes
- [x] Toggle between WYSIWYG and markdown modes

**Status:** ✅ Complete - Built with zero external dependencies

#### 1.2 Markdown Support ✅ COMPLETE
- [x] Markdown parsing and rendering in editor
- [x] Markdown mode toggle in editor
- [x] HTML to Markdown conversion
- [x] Markdown to HTML conversion
- [x] Support for frontmatter in markdown files
- [x] Migration tool: JSON → Markdown

**Status:** ✅ Complete - Full markdown support with frontmatter parsing and migration tool

#### 1.3 Image Management ✅ COMPLETE
- [x] Image upload functionality
- [x] Image storage in `/public/images/`
- [x] Media library in admin panel
- [ ] Image optimization (resize, compress)
- [x] Image gallery/selector in editor
- [x] Support for external image URLs

**Status:** ✅ Complete - Full image management with upload, media library, and editor integration. Image optimization is optional enhancement.

**Estimated effort:** 3-4 days (Completed)

#### 1.4 SEO Enhancements
- [ ] Meta title and description per post/page
- [ ] Open Graph tags
- [ ] Twitter Card support
- [ ] Structured data (JSON-LD)
- [ ] Canonical URLs
- [ ] Robots meta tags
- [ ] Sitemap enhancements (priority, change frequency)

**Estimated effort:** 2-3 days

**Priority:** High - Important for production sites

---

## Phase 2: Content Organization (Medium-term)

### Priority: Medium-High

#### 2.1 Categories and Tags ✅ COMPLETE
- [x] Category system (hierarchical)
- [x] Tag system (flat)
- [x] Category/tag management in admin
- [x] Category pages (`/category/[slug]`)
- [x] Tag pages (`/tag/[slug]`)
- [x] Filter posts by category/tag on homepage
- [x] Category/tag counts

**Status:** ✅ Complete - Full category and tag system with hierarchical categories, admin management UI, category/tag pages, and post filtering. Multi-locale support included.

**Estimated effort:** 3-4 days (Completed)

#### 2.2 Draft/Publish Workflow
- [ ] Draft status for posts
- [ ] Published status
- [ ] Scheduled publishing (future dates)
- [ ] Preview mode (draft preview URLs)
- [ ] Post status indicators in admin
- [ ] Filter by status in admin

**Estimated effort:** 2-3 days

#### 2.3 Content Types
- [ ] Pages management UI (currently only posts)
- [ ] Custom content types
- [ ] Content type templates
- [ ] Content type configuration

**Estimated effort:** 3-4 days

---

## Phase 3: User Experience (Medium-term)

### Priority: Medium

#### 3.1 Search Functionality ✅ COMPLETE
- [x] Full-text search on frontend
- [x] Search API endpoint
- [x] Search results page
- [x] Search in admin panel
- [x] Search highlighting

**Status:** ✅ Complete - Full-text search with relevance ranking, highlighting, and multi-locale support

**Estimated effort:** 2-3 days (Completed)

#### 3.2 RSS Feed ✅ COMPLETE
- [x] RSS feed generation (`/feed.xml`)
- [x] RSS feed for categories (via query parameter)
- [x] RSS feed for tags (via query parameter)
- [x] RSS feed configuration (site title, description, locale support)
- [x] RSS feed discoverability (metadata link in HTML head)
- [ ] Atom feed support (optional enhancement)

**Status:** ✅ Complete - Full RSS 2.0 feed with category/tag filtering, multi-locale support, and proper metadata. Feed includes post titles, descriptions, full content, publication dates, and proper XML escaping.

**Estimated effort:** 1 day (Completed)

#### 3.3 Pagination ✅ COMPLETE
- [x] Pagination on homepage (posts list)
- [x] Pagination on category/tag pages
- [x] Configurable posts per page (via config.json)
- [x] Previous/Next navigation
- [x] Page number navigation with ellipsis for large page counts
- [x] Active page highlighting
- [x] Clean URLs (page 1 removes page parameter)

**Status:** ✅ Complete - Full pagination system with smart page number display, Previous/Next buttons, and proper URL handling. Works on homepage, category pages, and tag pages.

**Estimated effort:** 1-2 days (Completed)

#### 3.4 UI/UX Improvements
- [x] Confirmation dialogs (ConfirmModal component)
- [x] Error modals with user-friendly messages
- [x] Responsive grid layout for posts
- [x] Image previews in post cards
- [x] Uniform card sizes with consistent text positioning
- [x] Full background images with gradient overlays
- [x] White background fallback for cards without images
- [x] Adaptive text colors (white on images, dark on white backgrounds)
- [ ] Better loading states (skeletons, spinners)
- [ ] Error boundaries (React error boundaries)
- [ ] Toast notifications (success/error messages)
- [ ] Keyboard shortcuts in admin (save, delete, etc.)
- [ ] Dark mode support
- [ ] Improved mobile experience for admin panel

**Status:** ✅ Mostly complete - Core UI components, loading states, keyboard shortcuts, and utility features implemented. Error boundaries and toast notifications are next priorities.

**Estimated effort:** 2-3 days (1 day remaining)

---

## Phase 4: Production Readiness (Long-term)

### Priority: High

#### 4.1 Enhanced Authentication
- [ ] Environment-based admin access
- [ ] OAuth providers (GitHub, Google)
- [ ] Multi-user support
- [ ] User roles (admin, editor, viewer)
- [ ] Password reset functionality
- [ ] Session management improvements

**Estimated effort:** 4-5 days

#### 4.2 Content Validation ✅ PARTIALLY COMPLETE
- [x] Content sanitization (SafeHtml component)
- [x] XSS protection (HTML sanitization)
- [ ] Schema validation for posts/pages (Zod or similar)
- [ ] Slug uniqueness validation (per locale)
- [ ] Required field validation
- [ ] Slug format validation (URL-safe characters)
- [ ] Content length limits

**Status:** ✅ Basic sanitization complete - HTML content is sanitized before rendering. Schema validation and field validation are next priorities.

**Estimated effort:** 2-3 days

#### 4.3 Backup & Export
- [ ] Export all content as JSON
- [ ] Export as Markdown
- [ ] Import functionality
- [ ] Git integration for version control
- [ ] Automated backups
- [ ] Content migration tools

**Estimated effort:** 3-4 days

#### 4.4 Performance Optimization
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] Static page optimization
- [ ] Caching strategies
- [ ] Bundle size optimization

**Estimated effort:** 2-3 days

---

## Phase 5: Advanced Features (Long-term)

### Priority: Low-Medium

#### 5.1 Comments System
- [ ] Comment storage (file-based or external service)
- [ ] Comment moderation
- [ ] Spam protection
- [ ] Integration with Disqus/Utterances

**Estimated effort:** 3-4 days

#### 5.2 Analytics Integration
- [ ] Google Analytics support
- [ ] Plausible Analytics support
- [ ] Custom analytics events
- [ ] Admin dashboard analytics

**Estimated effort:** 2 days

#### 5.3 Internationalization (i18n) ✅ COMPLETE
- [x] Multi-language support
- [x] Language switcher (LocaleSelector component)
- [x] Translated content management
- [x] Locale-based routing (`/{locale}/posts/{slug}`)
- [x] Locale configuration in settings
- [x] Admin dashboard with locale switching
- [x] API routes with locale support
- [x] Sitemap generation with all locales
- [x] Content storage per locale (`content/posts/{locale}/`)

**Status:** ✅ Complete - Full multi-locale support implemented

#### 5.4 API Improvements
- [ ] RESTful API documentation
- [ ] GraphQL support (optional)
- [ ] API rate limiting
- [ ] API authentication
- [ ] Webhook support

**Estimated effort:** 4-5 days

---

## Phase 6: Developer Experience

### Priority: Medium

#### 6.1 Testing ✅ PARTIALLY COMPLETE
- [x] Unit tests for content operations (CMS package)
- [x] Unit tests for demo app (markdown, sanitize, search, etc.)
- [x] Test coverage reporting (Vitest coverage)
- [ ] Integration tests for API routes
- [ ] E2E tests for admin workflows (Playwright/Cypress)
- [ ] CI/CD integration (GitHub Actions)
- [ ] Visual regression testing

**Status:** ✅ Core unit testing complete - CMS package and demo app have comprehensive unit tests. Integration and E2E tests are next priorities.

**Estimated effort:** 3-5 days (remaining work)

#### 6.2 Documentation ✅ PARTIALLY COMPLETE
- [x] API documentation (Package README)
- [x] Installation guide
- [x] Demo project documentation
- [x] Multi-locale documentation
- [x] Deployment guides (Vercel deployment guide)
- [x] Integration guide
- [x] Markdown and frontmatter documentation
- [x] Package structure documentation
- [ ] Customization examples
- [ ] Theme development guide
- [ ] Plugin/extension system docs
- [ ] Video tutorials
- [ ] API reference (auto-generated)

**Status:** ✅ Core documentation complete - Comprehensive guides for installation, integration, and deployment. Advanced customization docs are next.

**Estimated effort:** 2-3 days (remaining work)

#### 6.3 Developer Tools
- [ ] CLI tools for content management
- [ ] Migration scripts
- [ ] Content generators
- [ ] Development helpers

**Estimated effort:** 3-4 days

---

## Phase 7: Infrastructure & Deployment

### Priority: Medium

#### 7.1 Deployment Improvements ✅ PARTIALLY COMPLETE
- [x] Vercel deployment guide
- [x] Vercel setup documentation
- [ ] Netlify deployment guide
- [ ] GitHub Actions workflows (CI/CD)
- [ ] Docker support
- [ ] Environment variable management guide
- [ ] Multi-environment setup (dev/staging/prod)

**Status:** ✅ Vercel deployment complete - Comprehensive Vercel guides available. Other platforms and CI/CD are next priorities.

**Estimated effort:** 2-3 days (remaining work)

#### 7.2 Monitoring & Logging
- [ ] Error tracking (Sentry)
- [ ] Logging system
- [ ] Health checks
- [ ] Performance monitoring

**Estimated effort:** 2-3 days

#### 7.3 Security Enhancements
- [ ] Content Security Policy (CSP)
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Security headers
- [ ] Dependency updates automation

**Estimated effort:** 2-3 days

---

## Quick Wins (Can be done anytime)

- [x] Responsive grid layout for posts
- [x] Image previews in post cards
- [x] Uniform card sizes with consistent text positioning
- [x] Full background images with gradient overlays
- [x] White background fallback for cards without images
- [x] Add loading skeletons
- [x] Improve error messages
- [x] Add keyboard navigation
- [x] Add copy-to-clipboard for slugs
- [x] Add post preview button
- [x] Add "last edited" timestamp
- [x] Add post word count
- [x] Add reading time estimate
- [ ] Add social sharing buttons
- [ ] Add print stylesheet

---

## Notes

- **Effort estimates** are rough and assume a single developer
- **Priorities** may shift based on user feedback
- **Phases** can be worked on in parallel if multiple contributors
- Some features may be moved between phases based on dependencies

---

## Contributing

If you'd like to contribute to any of these features:

1. Check if an issue exists for the feature
2. Comment on the issue or create a new one
3. Fork the repository
4. Create a feature branch
5. Submit a pull request

---

## Version History

- **v1.0.0** - Basic CMS functionality
- **v1.1.0** - Rich text editor, markdown support, multi-locale support
- **v1.2.0** - Image management, responsive grid layout, image previews
- **v1.3.0** - Full-text search functionality
- **v1.4.0** - Modern card design with uniform sizing, full background images, and gradient overlays
- **v1.5.0** - Content sanitization, testing infrastructure, pre-commit hooks, comprehensive documentation
- **v1.6.0** (Planned) - SEO enhancements, improved validation
- **v2.0.0** - Categories and tags system, draft workflow
- **v2.1.0** - Quick wins & UX improvements (loading skeletons, keyboard shortcuts, word count, reading time, copy-to-clipboard, last edited tracking)
- **v2.2.0** (Current) - RSS feed, pagination, additional UI/UX improvements
- **v3.0.0** (Planned) - Multi-user, OAuth, production features

---

*Last updated: December 2025*

## Recent Updates

### v2.2.0 - RSS Feed & Pagination (January 2025)
- ✅ RSS feed generation at `/feed.xml` with RSS 2.0 format
- ✅ RSS feed filtering by category and tag (via query parameters)
- ✅ RSS feed multi-locale support
- ✅ RSS feed discoverability (metadata link in HTML head)
- ✅ Pagination component with Previous/Next navigation
- ✅ Page number navigation with smart ellipsis display
- ✅ Pagination on homepage, category pages, and tag pages
- ✅ Configurable posts per page via config.json
- ✅ Clean URL handling (page 1 removes page parameter)
- ✅ Active page highlighting in pagination
- ✅ Client Component fix for Pagination (event handlers support)

### v2.1.0 - Quick Wins & UX Improvements (January 2025)
- ✅ Loading skeletons with shimmer animation for admin dashboard
- ✅ Improved error messages with better context and user-friendly text
- ✅ Keyboard shortcuts (Cmd/Ctrl+S to save, Cmd/Ctrl+K to preview, Escape to cancel)
- ✅ Copy-to-clipboard functionality for slugs with visual feedback
- ✅ Enhanced post preview button (Preview for drafts, View Post for published)
- ✅ Last edited timestamp tracking and display (updatedAt field)
- ✅ Real-time word count display in post editor
- ✅ Reading time estimate calculation and display (200 words/minute)
- ✅ Utility functions for date formatting, clipboard operations, and text analysis

### v2.0.0 - Categories and Tags (January 2025)
- ✅ Hierarchical category system with parent-child relationships
- ✅ Flat tag system
- ✅ Category and tag management UI in admin panel
- ✅ Category pages (`/category/[slug]`) with filtered posts
- ✅ Tag pages (`/tag/[slug]`) with filtered posts
- ✅ Category and tag selection in post editor
- ✅ Category/tag counts functionality
- ✅ Multi-locale support for categories and tags
- ✅ Tags and categories displayed on individual post pages

### v1.5.0 - Testing & Documentation (January 2025)
- ✅ Comprehensive unit test coverage for CMS package
- ✅ Unit tests for demo app (markdown, sanitize, search, config, auth)
- ✅ Pre-commit hooks with automated testing and build verification
- ✅ Content sanitization with XSS protection (SafeHtml component)
- ✅ Comprehensive documentation (integration, deployment, markdown support)
- ✅ Improved project structure and organization

### v1.4.0 - Modern Card Design (January 2025)
- ✅ Uniform card sizes (280px height) for consistent layout
- ✅ Full background images covering entire card area
- ✅ Light gradient overlay for text readability on images
- ✅ White background fallback when no image is present
- ✅ Adaptive text colors (white on images, dark on white backgrounds)
- ✅ Consistent text positioning at bottom of all cards

