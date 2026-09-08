"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMentions = extractMentions;
exports.extractHashtags = extractHashtags;
exports.extractUrls = extractUrls;
exports.sanitizeText = sanitizeText;
// Extract mentions (@username) from text
function extractMentions(text) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
    }
    return Array.from(new Set(mentions)); // Remove duplicates
}
// Extract hashtags (#tag) from text
function extractHashtags(text) {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
        hashtags.push(match[1]);
    }
    return Array.from(new Set(hashtags)); // Remove duplicates
}
// Extract URLs from text
function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    return urls ? Array.from(new Set(urls)) : [];
}
// Sanitize text (basic XSS prevention)
function sanitizeText(text) {
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
//# sourceMappingURL=textParsers.js.map