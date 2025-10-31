// Extract mentions (@username) from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return Array.from(new Set(mentions)); // Remove duplicates
}

// Extract hashtags (#tag) from text
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  return Array.from(new Set(hashtags)); // Remove duplicates
}

// Extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  return urls ? Array.from(new Set(urls)) : [];
}

// Sanitize text (basic XSS prevention)
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
