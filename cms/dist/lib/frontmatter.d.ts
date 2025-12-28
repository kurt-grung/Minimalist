/**
 * Frontmatter utilities for parsing and stringifying YAML frontmatter in Markdown files
 */
export interface Frontmatter {
    id?: string;
    title?: string;
    slug?: string;
    excerpt?: string;
    date?: string;
    author?: string;
    [key: string]: any;
}
/**
 * Parse frontmatter from a markdown string
 * Returns the frontmatter object and the markdown content without frontmatter
 */
export declare function parseFrontmatter(markdown: string): {
    frontmatter: Frontmatter;
    content: string;
};
/**
 * Stringify frontmatter and content into a markdown string with frontmatter
 */
export declare function stringifyFrontmatter(frontmatter: Frontmatter, content: string): string;
/**
 * Check if a string is a markdown file with frontmatter
 */
export declare function hasFrontmatter(markdown: string): boolean;
