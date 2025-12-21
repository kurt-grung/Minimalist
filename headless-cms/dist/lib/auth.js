"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDefaultUser = initDefaultUser;
exports.verifyPassword = verifyPassword;
exports.getUser = getUser;
exports.createToken = createToken;
exports.verifyToken = verifyToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS_FILE = path_1.default.join(process.cwd(), 'users.json');
// Initialize default admin user
function initDefaultUser() {
    try {
        if (!fs_1.default.existsSync(USERS_FILE)) {
            const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const passwordHash = bcryptjs_1.default.hashSync(defaultPassword, 10);
            const users = [
                {
                    username: 'admin',
                    passwordHash
                }
            ];
            fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            console.log('Default admin user created. Username: admin, Password: admin123');
            console.log('⚠️  Change the default password in production!');
        }
    }
    catch (error) {
        // On serverless platforms (Vercel, etc.), file system is read-only
        // Users file must be committed to the repository
        console.warn('Could not create users file. This is expected on serverless platforms.');
        console.warn('Ensure users.json exists in your repository for production.');
    }
}
// Verify password
function verifyPassword(password, hash) {
    return bcryptjs_1.default.compareSync(password, hash);
}
// Get user by username
function getUser(username) {
    try {
        if (!fs_1.default.existsSync(USERS_FILE)) {
            initDefaultUser();
            // If file still doesn't exist after init (e.g., on Vercel), return null
            if (!fs_1.default.existsSync(USERS_FILE)) {
                console.error('users.json does not exist and could not be created. Please commit users.json to your repository.');
                return null;
            }
        }
        const users = JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf-8'));
        return users.find(u => u.username === username) || null;
    }
    catch (error) {
        console.error('Error reading users.json:', error);
        return null;
    }
}
// Create JWT token
function createToken(username) {
    return jsonwebtoken_1.default.sign({ username }, SECRET, { expiresIn: '7d' });
}
// Verify JWT token
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET);
    }
    catch {
        return null;
    }
}
