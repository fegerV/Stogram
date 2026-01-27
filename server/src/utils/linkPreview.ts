import axios from 'axios';
import * as cheerio from 'cheerio';

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
export function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Fetch link preview metadata
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    const preview: LinkPreview = {
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
      } catch (e) {
        // Invalid URL, remove image
        delete preview.image;
      }
    }

    return preview;
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
}
