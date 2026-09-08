"use strict";
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
exports.extractLinks = extractLinks;
exports.fetchLinkPreview = fetchLinkPreview;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
/**
 * Extract URLs from text
 */
function extractLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}
/**
 * Fetch link preview metadata
 */
async function fetchLinkPreview(url) {
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 5000,
            maxRedirects: 5,
        });
        const $ = cheerio.load(response.data);
        const preview = {
            url,
            title: $('meta[property="og:title"]').attr('content') ||
                $('title').text() ||
                $('meta[name="title"]').attr('content') ||
                undefined,
            description: $('meta[property="og:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                undefined,
            image: $('meta[property="og:image"]').attr('content') ||
                $('meta[name="image"]').attr('content') ||
                undefined,
            siteName: $('meta[property="og:site_name"]').attr('content') ||
                new URL(url).hostname ||
                undefined,
        };
        // Clean up image URL (make absolute if relative)
        if (preview.image && !preview.image.startsWith('http')) {
            try {
                const baseUrl = new URL(url);
                preview.image = new URL(preview.image, baseUrl.origin).href;
            }
            catch (e) {
                // Invalid URL, remove image
                delete preview.image;
            }
        }
        return preview;
    }
    catch (error) {
        console.error('Error fetching link preview:', error);
        return null;
    }
}
//# sourceMappingURL=linkPreview.js.map