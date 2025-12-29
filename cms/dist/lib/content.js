"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPosts = getAllPosts;
exports.getPostBySlug = getPostBySlug;
exports.savePost = savePost;
exports.deletePost = deletePost;
exports.getAllPages = getAllPages;
exports.getPageBySlug = getPageBySlug;
exports.savePage = savePage;
exports.deletePage = deletePage;
const storage_1 = require("./storage");
const frontmatter_1 = require("./frontmatter");
// Get all posts
// includeDrafts: if true, includes draft posts (for admin panel)
// includeScheduled: if true, includes scheduled posts regardless of date (for admin panel)
async function getAllPosts(locale, includeDrafts = false, includeScheduled = false) {
    try {
        const posts = [];
        const now = new Date();
        if (locale) {
            // Get posts for specific locale
            const keys = await (0, storage_1.storageList)(`content/posts/${locale}/`);
            for (const key of keys) {
                if (key.endsWith('.json') || key.endsWith('.md')) {
                    const slug = key.replace(/\.(json|md)$/, '');
                    const post = await getPostBySlug(slug, locale);
                    if (post) {
                        posts.push(post);
                    }
                }
            }
        }
        else {
            // Get all posts from all locales (legacy support)
            const keys = await (0, storage_1.storageList)('content/posts/');
            for (const key of keys) {
                if ((key.endsWith('.json') || key.endsWith('.md')) && !key.includes('/')) {
                    // Legacy format: content/posts/slug.json or slug.md
                    const slug = key.replace(/\.(json|md)$/, '');
                    const post = await getPostBySlug(slug);
                    if (post) {
                        posts.push(post);
                    }
                }
            }
        }
        // Set default status to 'published' for backward compatibility
        let filteredPosts = posts.map(post => ({
            ...post,
            status: post.status || 'published'
        }));
        // Filter by status if not including drafts
        if (!includeDrafts) {
            filteredPosts = filteredPosts.filter(post => {
                const status = post.status || 'published';
                // Always include published posts
                if (status === 'published') {
                    return true;
                }
                // Include scheduled posts only if date has passed (unless includeScheduled is true)
                if (status === 'scheduled') {
                    if (includeScheduled) {
                        return true;
                    }
                    const scheduledDate = post.scheduledDate || post.date;
                    return new Date(scheduledDate) <= now;
                }
                // Exclude drafts
                return false;
            });
        }
        return filteredPosts.sort((a, b) => {
            // Sort by scheduledDate if scheduled, otherwise by date
            const dateA = a.status === 'scheduled' && a.scheduledDate ? new Date(a.scheduledDate) : new Date(a.date);
            const dateB = b.status === 'scheduled' && b.scheduledDate ? new Date(b.scheduledDate) : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
    }
    catch (error) {
        console.error('Error getting all posts:', error);
        return [];
    }
}
// Get post by slug
async function getPostBySlug(slug, locale) {
    try {
        let content = null;
        let isMarkdown = false;
        if (locale) {
            // Try markdown first, then JSON
            content = await (0, storage_1.storageGet)(`content/posts/${locale}/${slug}.md`);
            if (content) {
                isMarkdown = true;
            }
            else {
                content = await (0, storage_1.storageGet)(`content/posts/${locale}/${slug}.json`);
            }
        }
        // Fallback to legacy format if locale-specific not found
        if (!content) {
            content = await (0, storage_1.storageGet)(`content/posts/${slug}.md`);
            if (content) {
                isMarkdown = true;
            }
            else {
                content = await (0, storage_1.storageGet)(`content/posts/${slug}.json`);
            }
        }
        if (!content) {
            return null;
        }
        let post;
        if (isMarkdown) {
            // Parse markdown with frontmatter
            const { frontmatter, content: markdownContent } = (0, frontmatter_1.parseFrontmatter)(content);
            // Convert frontmatter to Post object
            // Parse categories and tags from frontmatter (can be comma-separated strings or arrays)
            let categories = [];
            if (frontmatter.categories) {
                if (Array.isArray(frontmatter.categories)) {
                    categories = frontmatter.categories;
                }
                else if (typeof frontmatter.categories === 'string') {
                    categories = frontmatter.categories.split(',').map(c => c.trim()).filter(c => c);
                }
            }
            let tags = [];
            if (frontmatter.tags) {
                if (Array.isArray(frontmatter.tags)) {
                    tags = frontmatter.tags;
                }
                else if (typeof frontmatter.tags === 'string') {
                    tags = frontmatter.tags.split(',').map(t => t.trim()).filter(t => t);
                }
            }
            post = {
                id: frontmatter.id || `post-${Date.now()}`,
                title: frontmatter.title || '',
                slug: frontmatter.slug || slug,
                content: markdownContent.trim(),
                excerpt: frontmatter.excerpt,
                date: frontmatter.date || new Date().toISOString(),
                author: frontmatter.author,
                status: frontmatter.status || 'published',
                scheduledDate: frontmatter.scheduledDate,
                categories,
                tags,
                updatedAt: frontmatter.updatedAt
            };
        }
        else {
            // Parse JSON
            post = JSON.parse(content);
            // Set default status for backward compatibility
            if (!post.status) {
                post.status = 'published';
            }
        }
        return post;
    }
    catch (error) {
        console.error('Error getting post:', error);
        return null;
    }
}
// Save post
// Default format is JSON. Set useMarkdown=true to save as Markdown with frontmatter.
async function savePost(post, locale, useMarkdown = false) {
    try {
        // Set updatedAt timestamp
        const postWithTimestamp = {
            ...post,
            updatedAt: new Date().toISOString()
        };
        let content;
        let extension;
        if (useMarkdown) {
            // Create frontmatter from post metadata
            const frontmatter = {
                id: postWithTimestamp.id,
                title: postWithTimestamp.title,
                slug: postWithTimestamp.slug,
                date: postWithTimestamp.date,
            };
            if (postWithTimestamp.excerpt)
                frontmatter.excerpt = postWithTimestamp.excerpt;
            if (postWithTimestamp.author)
                frontmatter.author = postWithTimestamp.author;
            if (postWithTimestamp.status)
                frontmatter.status = postWithTimestamp.status;
            if (postWithTimestamp.scheduledDate)
                frontmatter.scheduledDate = postWithTimestamp.scheduledDate;
            if (postWithTimestamp.categories && postWithTimestamp.categories.length > 0)
                frontmatter.categories = postWithTimestamp.categories;
            if (postWithTimestamp.tags && postWithTimestamp.tags.length > 0)
                frontmatter.tags = postWithTimestamp.tags;
            if (postWithTimestamp.updatedAt)
                frontmatter.updatedAt = postWithTimestamp.updatedAt;
            // Stringify with frontmatter
            content = (0, frontmatter_1.stringifyFrontmatter)(frontmatter, postWithTimestamp.content);
            extension = '.md';
        }
        else {
            // Use JSON format
            content = JSON.stringify(postWithTimestamp, null, 2);
            extension = '.json';
        }
        if (locale) {
            return await (0, storage_1.storageSet)(`content/posts/${locale}/${postWithTimestamp.slug}${extension}`, content);
        }
        else {
            // Legacy format
            return await (0, storage_1.storageSet)(`content/posts/${postWithTimestamp.slug}${extension}`, content);
        }
    }
    catch (error) {
        console.error('Error saving post:', error);
        return false;
    }
}
// Delete post
async function deletePost(slug, locale) {
    try {
        let deleted = false;
        if (locale) {
            // Try both markdown and JSON
            deleted = await (0, storage_1.storageDelete)(`content/posts/${locale}/${slug}.md`) ||
                await (0, storage_1.storageDelete)(`content/posts/${locale}/${slug}.json`);
        }
        else {
            // Try legacy format (both markdown and JSON)
            deleted = await (0, storage_1.storageDelete)(`content/posts/${slug}.md`) ||
                await (0, storage_1.storageDelete)(`content/posts/${slug}.json`);
        }
        return deleted;
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
}
// Get all pages
async function getAllPages(locale) {
    try {
        const pages = [];
        if (locale) {
            // Get pages for specific locale
            const keys = await (0, storage_1.storageList)(`content/pages/${locale}/`);
            for (const key of keys) {
                if (key.endsWith('.json')) {
                    const slug = key.replace('.json', '');
                    const page = await getPageBySlug(slug, locale);
                    if (page) {
                        pages.push(page);
                    }
                }
            }
        }
        else {
            // Get all pages from all locales (legacy support)
            const keys = await (0, storage_1.storageList)('content/pages/');
            for (const key of keys) {
                if (key.endsWith('.json') && !key.includes('/')) {
                    // Legacy format: content/pages/slug.json
                    const slug = key.replace('.json', '');
                    const page = await getPageBySlug(slug);
                    if (page) {
                        pages.push(page);
                    }
                }
            }
        }
        return pages;
    }
    catch (error) {
        console.error('Error getting all pages:', error);
        return [];
    }
}
// Get page by slug
async function getPageBySlug(slug, locale) {
    try {
        let content = null;
        if (locale) {
            // Try locale-specific path first
            content = await (0, storage_1.storageGet)(`content/pages/${locale}/${slug}.json`);
        }
        // Fallback to legacy format if locale-specific not found
        if (!content) {
            content = await (0, storage_1.storageGet)(`content/pages/${slug}.json`);
        }
        if (!content) {
            return null;
        }
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error getting page:', error);
        return null;
    }
}
// Save page
async function savePage(page, locale) {
    try {
        const content = JSON.stringify(page, null, 2);
        if (locale) {
            return await (0, storage_1.storageSet)(`content/pages/${locale}/${page.slug}.json`, content);
        }
        else {
            // Legacy format
            return await (0, storage_1.storageSet)(`content/pages/${page.slug}.json`, content);
        }
    }
    catch (error) {
        console.error('Error saving page:', error);
        return false;
    }
}
// Delete page
async function deletePage(slug, locale) {
    try {
        if (locale) {
            return await (0, storage_1.storageDelete)(`content/pages/${locale}/${slug}.json`);
        }
        else {
            // Try legacy format
            return await (0, storage_1.storageDelete)(`content/pages/${slug}.json`);
        }
    }
    catch (error) {
        console.error('Error deleting page:', error);
        return false;
    }
}
