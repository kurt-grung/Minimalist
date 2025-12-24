export interface User {
    username: string;
    passwordHash: string;
}
export declare function initDefaultUser(): void;
export declare function verifyPassword(password: string, hash: string): boolean;
export declare function getUser(username: string): User | null;
export declare function createToken(username: string): string;
export declare function verifyToken(token: string): {
    username: string;
} | null;
