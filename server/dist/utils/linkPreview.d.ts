export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
}
/**
 * Extract URLs from text
 */
export declare function extractLinks(text: string): string[];
/**
 * Fetch link preview metadata
 */
export declare function fetchLinkPreview(url: string): Promise<LinkPreview | null>;
//# sourceMappingURL=linkPreview.d.ts.map