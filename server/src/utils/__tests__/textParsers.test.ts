import { extractMentions, extractHashtags, extractUrls, sanitizeText } from '../textParsers';

describe('Text Parsers', () => {
  describe('extractMentions', () => {
    it('should extract mentions from text', () => {
      const text = 'Hello @john and @jane!';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['john', 'jane']);
    });

    it('should remove duplicate mentions', () => {
      const text = 'Hello @john and @john again!';
      const mentions = extractMentions(text);
      expect(mentions).toEqual(['john']);
    });

    it('should return empty array for text without mentions', () => {
      const text = 'Hello world!';
      const mentions = extractMentions(text);
      expect(mentions).toEqual([]);
    });
  });

  describe('extractHashtags', () => {
    it('should extract hashtags from text', () => {
      const text = 'Check out #programming and #coding';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['programming', 'coding']);
    });

    it('should remove duplicate hashtags', () => {
      const text = '#test #test #test';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual(['test']);
    });

    it('should return empty array for text without hashtags', () => {
      const text = 'Hello world!';
      const hashtags = extractHashtags(text);
      expect(hashtags).toEqual([]);
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs from text', () => {
      const text = 'Visit https://example.com and http://test.com';
      const urls = extractUrls(text);
      expect(urls).toEqual(['https://example.com', 'http://test.com']);
    });

    it('should return empty array for text without URLs', () => {
      const text = 'Hello world!';
      const urls = extractUrls(text);
      expect(urls).toEqual([]);
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize HTML special characters', () => {
      const text = '<script>alert("XSS")</script>';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle normal text', () => {
      const text = 'Hello world!';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe('Hello world!');
    });
  });
});
