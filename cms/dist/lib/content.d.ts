export type PostStatus = 'draft' | 'published' | 'scheduled';
export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    date: string;
    author?: string;
    status?: PostStatus;
    scheduledDate?: string;
    categories?: string[];
    tags?: string[];
    updatedAt?: string;
}
export interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
}
export declare function getAllPosts(locale?: string, includeDrafts?: boolean, includeScheduled?: boolean): Promise<Post[]>;
export declare function getPostBySlug(slug: string, locale?: string): Promise<Post | null>;
export declare function savePost(post: Post, locale?: string, useMarkdown?: boolean): Promise<boolean>;
export declare function deletePost(slug: string, locale?: string): Promise<boolean>;
export declare function getAllPages(locale?: string): Promise<Page[]>;
export declare function getPageBySlug(slug: string, locale?: string): Promise<Page | null>;
export declare function savePage(page: Page, locale?: string): Promise<boolean>;
export declare function deletePage(slug: string, locale?: string): Promise<boolean>;
