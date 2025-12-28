"use strict";
/**
 * Frontmatter utilities for parsing and stringifying YAML frontmatter in Markdown files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
exports.stringifyFrontmatter = stringifyFrontmatter;
exports.hasFrontmatter = hasFrontmatter;
/**
 * Parse frontmatter from a markdown string
 * Returns the frontmatter object and the markdown content without frontmatter
 */
function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);
    if (!match) {
        // No frontmatter found, return empty frontmatter and full content
        return { frontmatter: {}, content: markdown };
    }
    const frontmatterText = match[1];
    const content = match[2];
    // Simple YAML parser for basic key-value pairs
    const frontmatter = {};
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        // Match key: value pattern
        const keyValueMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (keyValueMatch) {
            const key = keyValueMatch[1].trim();
            let value = keyValueMatch[2].trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            frontmatter[key] = value;
        }
    }
    return { frontmatter, content };
}
/**
 * Stringify frontmatter and content into a markdown string with frontmatter
 */
function stringifyFrontmatter(frontmatter, content) {
    if (Object.keys(frontmatter).length === 0) {
        return content;
    }
    // Convert frontmatter to YAML-like string
    const frontmatterLines = [];
    for (const [key, value] of Object.entries(frontmatter)) {
        if (value !== undefined && value !== null) {
            // Escape special characters and wrap in quotes if needed
            const stringValue = String(value);
            const needsQuotes = stringValue.includes(':') || stringValue.includes('\n') || stringValue.includes('"');
            const escapedValue = needsQuotes ? `"${stringValue.replace(/"/g, '\\"')}"` : stringValue;
            frontmatterLines.push(`${key}: ${escapedValue}`);
        }
    }
    if (frontmatterLines.length === 0) {
        return content;
    }
    return `---\n${frontmatterLines.join('\n')}\n---\n\n${content}`;
}
/**
 * Check if a string is a markdown file with frontmatter
 */
function hasFrontmatter(markdown) {
    return /^---\s*\n/.test(markdown);
}
