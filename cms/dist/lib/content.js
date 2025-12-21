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
async function getAllPosts() {
    try {
        const keys = await (0, storage_1.storageList)('content/posts/');
        const posts = [];
        for (const key of keys) {
            if (key.endsWith('.json')) {
                const slug = key.replace('.json', '');
                const post = await getPostBySlug(slug);
                if (post) {
                    posts.push(post);
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
async function getPostBySlug(slug) {
    try {
        const content = await (0, storage_1.storageGet)(`content/posts/${slug}.json`);
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
async function savePost(post) {
    try {
        const content = JSON.stringify(post, null, 2);
        return await (0, storage_1.storageSet)(`content/posts/${post.slug}.json`, content);
    }
    catch (error) {
        console.error('Error saving post:', error);
        return false;
    }
}
// Delete post
async function deletePost(slug) {
    try {
        return await (0, storage_1.storageDelete)(`content/posts/${slug}.json`);
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
}
// Get all pages
async function getAllPages() {
    try {
        const keys = await (0, storage_1.storageList)('content/pages/');
        const pages = [];
        for (const key of keys) {
            if (key.endsWith('.json')) {
                const slug = key.replace('.json', '');
                const page = await getPageBySlug(slug);
                if (page) {
                    pages.push(page);
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
async function getPageBySlug(slug) {
    try {
        const content = await (0, storage_1.storageGet)(`content/pages/${slug}.json`);
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
async function savePage(page) {
    try {
        const content = JSON.stringify(page, null, 2);
        return await (0, storage_1.storageSet)(`content/pages/${page.slug}.json`, content);
    }
    catch (error) {
        console.error('Error saving page:', error);
        return false;
    }
}
// Delete page
async function deletePage(slug) {
    try {
        return await (0, storage_1.storageDelete)(`content/pages/${slug}.json`);
    }
    catch (error) {
        console.error('Error deleting page:', error);
        return false;
    }
}
