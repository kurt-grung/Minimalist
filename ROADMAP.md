# Minimalist CMS Roadmap

This document outlines the planned features, improvements, and enhancements for the Minimalist CMS project.

## Current Status ✅ 

- ✅ Admin panel with authentication
- ✅ Create, edit, and delete posts
- ✅ File-based content storage (JSON and Markdown)
- ✅ Static site generation
- ✅ Settings management (site title, subtitle, route prefixes, locales)
- ✅ Sitemap generation with multi-locale support
- ✅ Basic authentication (JWT)
- ✅ Multi-locale support (i18n) - Full implementation
- ✅ Rich text editor with WYSIWYG and Markdown modes
- ✅ Locale-based routing and content management
- ✅ API routes with locale support
- ✅ Image management - Upload, media library, and editor integration
- ✅ Responsive grid layout with image previews
- ✅ Full-text search - Search API, results page, and admin panel integration

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

**Estimated effort:** 2 days

---

## Phase 2: Content Organization (Medium-term)

### Priority: Medium-High

#### 2.1 Categories and Tags
- [ ] Category system (hierarchical)
- [ ] Tag system (flat)
- [ ] Category/tag management in admin
- [ ] Category pages (`/category/[slug]`)
- [ ] Tag pages (`/tag/[slug]`)
- [ ] Filter posts by category/tag on homepage
- [ ] Category/tag counts

**Estimated effort:** 3-4 days

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

#### 3.2 RSS Feed
- [ ] RSS feed generation (`/feed.xml`)
- [ ] RSS feed for categories
- [ ] RSS feed configuration
- [ ] Atom feed support

**Estimated effort:** 1 day

#### 3.3 Pagination
- [ ] Pagination on homepage (posts list)
- [ ] Pagination on category/tag pages
- [ ] Configurable posts per page
- [ ] Previous/Next navigation

**Estimated effort:** 1-2 days

#### 3.4 UI/UX Improvements
- [x] Confirmation dialogs (ConfirmModal component)
- [x] Error modals with user-friendly messages
- [x] Responsive grid layout for posts
- [x] Image previews in post cards
- [x] Uniform card sizes with consistent text positioning
- [x] Full background images with gradient overlays
- [x] White background fallback for cards without images
- [x] Adaptive text colors (white on images, dark on white backgrounds)
- [ ] Better loading states
- [ ] Error boundaries
- [ ] Toast notifications (success/error messages)
- [ ] Keyboard shortcuts in admin
- [ ] Dark mode support

**Status:** ✅ Partially complete - Confirmation dialogs, error handling, responsive grid, image previews, and modern card design with uniform sizing implemented

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
- [ ] Schema validation for posts/pages
- [ ] Slug uniqueness validation
- [ ] Required field validation

**Status:** ✅ Basic sanitization complete - HTML content is sanitized before rendering

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

#### 6.1 Testing
- [ ] Unit tests for content operations
- [ ] Integration tests for API routes
- [ ] E2E tests for admin workflows
- [ ] Test coverage reporting
- [ ] CI/CD integration

**Estimated effort:** 5-7 days

#### 6.2 Documentation ✅ PARTIALLY COMPLETE
- [x] API documentation (Package README)
- [x] Installation guide
- [x] Demo project documentation
- [x] Multi-locale documentation
- [ ] Deployment guides (Vercel guide exists in docs)
- [ ] Customization examples
- [ ] Theme development guide
- [ ] Plugin/extension system docs

**Status:** ✅ Core documentation complete - README files and installation guides added

#### 6.3 Developer Tools
- [ ] CLI tools for content management
- [ ] Migration scripts
- [ ] Content generators
- [ ] Development helpers

**Estimated effort:** 3-4 days

---

## Phase 7: Infrastructure & Deployment

### Priority: Medium

#### 7.1 Deployment Improvements
- [ ] Vercel deployment guide
- [ ] Netlify deployment guide
- [ ] GitHub Actions workflows
- [ ] Docker support
- [ ] Environment variable management

**Estimated effort:** 2-3 days

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
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add keyboard navigation
- [ ] Add copy-to-clipboard for slugs
- [ ] Add post preview button
- [ ] Add "last edited" timestamp
- [ ] Add post word count
- [ ] Add reading time estimate
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
- **v1.4.0** (Current) - Modern card design with uniform sizing, full background images, and gradient overlays
- **v1.5.0** (Planned) - SEO enhancements
- **v2.0.0** (Planned) - Categories, tags, draft workflow
- **v2.1.0** (Planned) - RSS feed, pagination
- **v3.0.0** (Planned) - Multi-user, OAuth, production features

---

*Last updated: January 2025*

## Recent Updates

### v1.4.0 - Modern Card Design (January 2025)
- ✅ Uniform card sizes (280px height) for consistent layout
- ✅ Full background images covering entire card area
- ✅ Light gradient overlay for text readability on images
- ✅ White background fallback when no image is present
- ✅ Adaptive text colors (white on images, dark on white backgrounds)
- ✅ Consistent text positioning at bottom of all cards

