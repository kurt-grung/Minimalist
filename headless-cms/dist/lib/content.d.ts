export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    date: string;
    author?: string;
}
export interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
}
export declare function getAllPosts(): Promise<Post[]>;
export declare function getPostBySlug(slug: string): Promise<Post | null>;
export declare function savePost(post: Post): Promise<boolean>;
export declare function deletePost(slug: string): Promise<boolean>;
export declare function getAllPages(): Promise<Page[]>;
export declare function getPageBySlug(slug: string): Promise<Page | null>;
export declare function savePage(page: Page): Promise<boolean>;
export declare function deletePage(slug: string): Promise<boolean>;
