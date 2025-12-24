"use strict";
/**
 * Storage adapter that uses files in development and Vercel KV in production
 * This allows the CMS to work on Vercel's read-only filesystem
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USE_KV = void 0;
exports.storageGet = storageGet;
exports.storageSet = storageSet;
exports.storageDelete = storageDelete;
exports.storageList = storageList;
exports.storageExists = storageExists;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Check if we're on Vercel (has KV environment variables)
const isVercel = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
const isDevelopment = process.env.NODE_ENV === 'development';
// Use file storage in development, KV in production (Vercel)
exports.USE_KV = isVercel && !isDevelopment;
let kvClient = null;
async function getKVClient() {
    if (!exports.USE_KV)
        return null;
    if (!kvClient) {
        try {
            // Dynamic import to avoid build errors when @vercel/kv is not installed
            // Using type assertion to avoid TypeScript errors if package is missing
            const kvModule = await Promise.resolve(`${'@vercel/kv'}`).then(s => __importStar(require(s))).catch(() => null);
            if (!kvModule) {
                return null;
            }
            kvClient = kvModule.kv || kvModule.default || kvModule;
        }
        catch (error) {
            // @vercel/kv not available - this is fine, we'll use file system
            console.warn('Vercel KV not available, falling back to file system:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    return kvClient;
}
/**
 * Read a value from storage
 */
async function storageGet(key) {
    // Try KV first if available
    if (exports.USE_KV) {
        const kv = await getKVClient();
        if (kv) {
            try {
                const value = await kv.get(key);
                if (value !== null) {
                    return value;
                }
                // If KV returns null, fall through to file system
            }
            catch (error) {
                console.error('KV get error:', error);
                // Fall through to file system on error
            }
        }
    }
    // Fallback to file system (works in development and for committed files on Vercel)
    try {
        const filePath = path_1.default.join(process.cwd(), key);
        if (fs_1.default.existsSync(filePath)) {
            return fs_1.default.readFileSync(filePath, 'utf-8');
        }
    }
    catch (error) {
        // File doesn't exist or can't be read
    }
    return null;
}
/**
 * Write a value to storage
 */
async function storageSet(key, value) {
    if (exports.USE_KV) {
        const kv = await getKVClient();
        if (kv) {
            try {
                await kv.set(key, value);
                return true;
            }
            catch (error) {
                console.error('KV set error:', error);
                return false;
            }
        }
    }
    // Fallback to file system (works in development)
    try {
        const filePath = path_1.default.join(process.cwd(), key);
        const dir = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, value, 'utf-8');
        return true;
    }
    catch (error) {
        console.error('File write error:', error);
        return false;
    }
}
/**
 * Delete a value from storage
 */
async function storageDelete(key) {
    if (exports.USE_KV) {
        const kv = await getKVClient();
        if (kv) {
            try {
                await kv.del(key);
                return true;
            }
            catch (error) {
                console.error('KV delete error:', error);
                return false;
            }
        }
    }
    // Fallback to file system
    try {
        const filePath = path_1.default.join(process.cwd(), key);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
    }
    catch (error) {
        console.error('File delete error:', error);
    }
    return false;
}
/**
 * List all keys with a prefix
 */
async function storageList(prefix) {
    // Try KV first if available
    if (exports.USE_KV) {
        const kv = await getKVClient();
        if (kv) {
            try {
                const keys = await kv.keys(`${prefix}*`);
                const kvKeys = keys.map(key => key.replace(prefix, ''));
                // If KV has keys, return them; otherwise fall through to file system
                if (kvKeys.length > 0) {
                    return kvKeys;
                }
                // If KV is empty, fall through to file system
            }
            catch (error) {
                console.error('KV list error:', error);
                // Fall through to file system on error
            }
        }
    }
    // Fallback to file system (works in development and for committed files on Vercel)
    try {
        const dir = path_1.default.join(process.cwd(), prefix);
        if (fs_1.default.existsSync(dir) && fs_1.default.statSync(dir).isDirectory()) {
            return fs_1.default.readdirSync(dir);
        }
    }
    catch (error) {
        // Directory doesn't exist
    }
    return [];
}
/**
 * Check if a key exists
 */
async function storageExists(key) {
    if (exports.USE_KV) {
        const kv = await getKVClient();
        if (kv) {
            try {
                const value = await kv.get(key);
                return value !== null;
            }
            catch (error) {
                return false;
            }
        }
    }
    // Fallback to file system
    try {
        const filePath = path_1.default.join(process.cwd(), key);
        return fs_1.default.existsSync(filePath);
    }
    catch (error) {
        return false;
    }
}
