export interface SiteConfig {
    siteTitle: string;
    siteSubtitle: string;
    postRoute: string;
    pageRoute: string;
}
export declare function ensureConfig(): void;
export declare function getConfig(): SiteConfig;
export declare function updateConfig(config: Partial<SiteConfig>): SiteConfig;
