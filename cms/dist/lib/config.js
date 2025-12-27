"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConfig = ensureConfig;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.getEnabledLocales = getEnabledLocales;
exports.getLocaleByCode = getLocaleByCode;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_FILE = path_1.default.join(process.cwd(), 'config.json');
const DEFAULT_CONFIG = {
    siteTitle: 'My Blog',
    siteSubtitle: 'Welcome to our simple file-based CMS',
    postRoute: 'posts',
    pageRoute: '',
    defaultLocale: 'en',
    locales: [
        { code: 'en', name: 'English', enabled: true }
    ]
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
        const config = JSON.parse(content);
        // Migrate old configs that don't have locales
        if (!config.locales || config.locales.length === 0) {
            config.defaultLocale = config.defaultLocale || 'en';
            config.locales = [{ code: 'en', name: 'English', enabled: true }];
        }
        if (!config.defaultLocale) {
            config.defaultLocale = config.locales[0]?.code || 'en';
        }
        return config;
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
    // Ensure locales array exists and defaultLocale is set
    if (!newConfig.locales || newConfig.locales.length === 0) {
        newConfig.locales = [{ code: 'en', name: 'English', enabled: true }];
    }
    if (!newConfig.defaultLocale) {
        newConfig.defaultLocale = newConfig.locales[0]?.code || 'en';
    }
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    return newConfig;
}
// Get enabled locales
function getEnabledLocales() {
    const config = getConfig();
    return config.locales.filter(locale => locale.enabled);
}
// Get locale by code
function getLocaleByCode(code) {
    const config = getConfig();
    return config.locales.find(locale => locale.code === code);
}
