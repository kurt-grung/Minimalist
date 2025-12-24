"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConfig = ensureConfig;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_FILE = path_1.default.join(process.cwd(), 'config.json');
const DEFAULT_CONFIG = {
    siteTitle: 'My Blog',
    siteSubtitle: 'Welcome to our simple file-based CMS',
    postRoute: 'posts',
    pageRoute: ''
};
// Ensure config file exists
function ensureConfig() {
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    }
}
// Get site configuration
function getConfig() {
    ensureConfig();
    try {
        const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return DEFAULT_CONFIG;
    }
}
// Update site configuration
function updateConfig(config) {
    ensureConfig();
    const currentConfig = getConfig();
    const newConfig = {
        ...currentConfig,
        ...config
    };
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    return newConfig;
}
