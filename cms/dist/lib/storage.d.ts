/**
 * Storage adapter that uses files in development and Vercel KV in production
 * This allows the CMS to work on Vercel's read-only filesystem
 */
export declare const USE_KV: boolean;
/**
 * Read a value from storage
 */
export declare function storageGet(key: string): Promise<string | null>;
/**
 * Write a value to storage
 */
export declare function storageSet(key: string, value: string): Promise<boolean>;
/**
 * Delete a value from storage
 */
export declare function storageDelete(key: string): Promise<boolean>;
/**
 * List all keys with a prefix
 */
export declare function storageList(prefix: string): Promise<string[]>;
/**
 * Check if a key exists
 */
export declare function storageExists(key: string): Promise<boolean>;
