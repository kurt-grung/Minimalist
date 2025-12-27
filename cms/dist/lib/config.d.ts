export interface Locale {
    code: string;
    name: string;
    enabled: boolean;
}
export interface SiteConfig {
    siteTitle: string;
    siteSubtitle: string;
    postRoute: string;
    pageRoute: string;
    defaultLocale: string;
    locales: Locale[];
}
export declare function ensureConfig(): void;
export declare function getConfig(): SiteConfig;
export declare function updateConfig(config: Partial<SiteConfig>): SiteConfig;
export declare function getEnabledLocales(): Locale[];
export declare function getLocaleByCode(code: string): Locale | undefined;
