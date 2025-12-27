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
// Get all posts
async function getAllPosts(locale) {
    try {
        const posts = [];
        if (locale) {
            // Get posts for specific locale
            const keys = await (0, storage_1.storageList)(`content/posts/${locale}/`);
            for (const key of keys) {
                if (key.endsWith('.json')) {
                    const slug = key.replace('.json', '');
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
                if (key.endsWith('.json') && !key.includes('/')) {
                    // Legacy format: content/posts/slug.json
                    const slug = key.replace('.json', '');
                    const post = await getPostBySlug(slug);
                    if (post) {
                        posts.push(post);
                    }
                }
            }
        }
        return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        if (locale) {
            // Try locale-specific path first
            content = await (0, storage_1.storageGet)(`content/posts/${locale}/${slug}.json`);
        }
        // Fallback to legacy format if locale-specific not found
        if (!content) {
            content = await (0, storage_1.storageGet)(`content/posts/${slug}.json`);
        }
        if (!content) {
            return null;
        }
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error getting post:', error);
        return null;
    }
}
// Save post
async function savePost(post, locale) {
    try {
        const content = JSON.stringify(post, null, 2);
        if (locale) {
            return await (0, storage_1.storageSet)(`content/posts/${locale}/${post.slug}.json`, content);
        }
        else {
            // Legacy format
            return await (0, storage_1.storageSet)(`content/posts/${post.slug}.json`, content);
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
        if (locale) {
            return await (0, storage_1.storageDelete)(`content/posts/${locale}/${slug}.json`);
        }
        else {
            // Try legacy format
            return await (0, storage_1.storageDelete)(`content/posts/${slug}.json`);
        }
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
