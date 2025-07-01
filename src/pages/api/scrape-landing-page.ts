import { NextApiRequest, NextApiResponse } from 'next';
import { LandingPageScrapedData } from '@/lib/types';

interface ScrapeRequestBody {
  url: string;
}

// Helper function to extract text content from HTML
function extractTextContent(html: string, selector: string): string {
  try {
    // Basic HTML parsing without external dependencies
    const match = html.match(new RegExp(`<${selector}[^>]*>([^<]+)</${selector}>`, 'i'));
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

// Helper function to extract multiple elements
function extractMultipleElements(html: string, pattern: RegExp): string[] {
  const matches = html.match(pattern);
  return matches ? matches.map(match => match.trim()) : [];
}

// Extract CTA buttons from HTML
function extractCTAButtons(html: string) {
  const ctaButtons: Array<{ text: string; href?: string; position: string }> = [];
  
  // Look for buttons and links that look like CTAs
  const buttonPatterns = [
    /<button[^>]*>([^<]+)<\/button>/gi,
    /<a[^>]*href=['"]([^'"]*)['"][^>]*>([^<]+)<\/a>/gi,
    /<input[^>]*type=['"]button['"][^>]*value=['"]([^'"]+)['"][^>]*/gi,
    /<input[^>]*type=['"]submit['"][^>]*value=['"]([^'"]+)['"][^>]*/gi
  ];

  buttonPatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && match[1].length > 0) {
        const text = match[2] || match[1];
        const href = pattern.source.includes('href') ? match[1] : undefined;
        
        // Filter for likely CTA text
        if (text.match(/acquista|compra|iscriviti|registrati|download|scarica|contatta|richiedi|prova|inizia|scopri|buy|purchase|sign up|register|contact|request|try|start|discover|get started/i)) {
          ctaButtons.push({
            text: text.trim(),
            href: href,
            position: `section-${index}`
          });
        }
      }
    }
  });

  return ctaButtons.slice(0, 10); // Limit to first 10 CTAs
}

// Extract forms from HTML
function extractForms(html: string) {
  const forms: Array<{ fields: number; requiredFields: number; position: string }> = [];
  
  const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi);
  
  if (formMatches) {
    formMatches.forEach((form, index) => {
      const inputFields = (form.match(/<input[^>]*type=['"](?!hidden)[^'"]*['"][^>]*>/gi) || []).length;
      const textareas = (form.match(/<textarea[^>]*>/gi) || []).length;
      const selects = (form.match(/<select[^>]*>/gi) || []).length;
      
      const totalFields = inputFields + textareas + selects;
      const requiredFields = (form.match(/required[^>]*>/gi) || []).length;
      
      if (totalFields > 0) {
        forms.push({
          fields: totalFields,
          requiredFields: requiredFields,
          position: `form-${index}`
        });
      }
    });
  }
  
  return forms;
}

// Extract testimonials
function extractTestimonials(html: string) {
  const testimonials: Array<{ text: string; author?: string; position?: string }> = [];
  
  // Look for common testimonial patterns
  const testimonialPatterns = [
    /<div[^>]*class=['"][^'"]*testimonial[^'"]*['"][^>]*>[\s\S]*?<\/div>/gi,
    /<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi,
    /<div[^>]*class=['"][^'"]*review[^'"]*['"][^>]*>[\s\S]*?<\/div>/gi
  ];

  testimonialPatterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const testimonialHtml = match[0];
      
      // Extract text content (simple approach)
      const textMatch = testimonialHtml.match(/>([^<]+)</g);
      if (textMatch && textMatch.length > 0) {
        const text = textMatch.join(' ').replace(/[<>]/g, '').trim();
        
        if (text.length > 20 && text.length < 500) {
          testimonials.push({
            text: text,
            author: undefined, // Could be enhanced to extract author names
            position: `testimonial-${patternIndex}`
          });
        }
      }
    }
  });

  return testimonials.slice(0, 5); // Limit to first 5 testimonials
}

// Extract social proof elements
function extractSocialProof(html: string) {
  const clientLogos: string[] = [];
  const certifications: string[] = [];
  
  // Look for images that might be client logos
  const logoMatches = html.match(/<img[^>]*src=['"]([^'"]*(?:logo|client|partner)[^'"]*)['"][^>]*>/gi);
  if (logoMatches) {
    logoMatches.forEach(match => {
      const srcMatch = match.match(/src=['"]([^'"]+)['"]/);
      if (srcMatch) {
        clientLogos.push(srcMatch[1]);
      }
    });
  }

  // Look for certification or trust badges
  const certMatches = html.match(/<img[^>]*src=['"]([^'"]*(?:cert|trust|badge|secure|ssl)[^'"]*)['"][^>]*>/gi);
  if (certMatches) {
    certMatches.forEach(match => {
      const srcMatch = match.match(/src=['"]([^'"]+)['"]/);
      if (srcMatch) {
        certifications.push(srcMatch[1]);
      }
    });
  }

  return {
    clientLogos: clientLogos.slice(0, 10),
    reviewCount: undefined, // Could be enhanced to extract review counts
    ratings: undefined, // Could be enhanced to extract ratings
    certifications: certifications.slice(0, 5)
  };
}

// Extract trust elements
function extractTrustElements(html: string) {
  const securityBadges: string[] = [];
  const guarantees: string[] = [];
  
  // Look for security-related text
  const securityText = html.match(/ssl|secure|encryption|privacy|gdpr|security/gi);
  if (securityText) {
    securityBadges.push(...securityText.slice(0, 3));
  }

  // Look for guarantee text
  const guaranteeText = html.match(/garanzia|rimborso|soddisfatti|guarantee|refund|satisfaction/gi);
  if (guaranteeText) {
    guarantees.push(...guaranteeText.slice(0, 3));
  }

  return {
    securityBadges,
    guarantees,
    contactInfo: html.includes('contact') || html.includes('contatto'),
    privacyPolicy: html.includes('privacy') || html.includes('cookie')
  };
}

// Main scraping function
async function scrapeLandingPage(url: string): Promise<LandingPageScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract basic page information
    const title = extractTextContent(html, 'title') || '';
    const metaDescription = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]+)['"][^>]*>/i)?.[1] || '';
    
    // Extract headline (h1)
    const headline = extractTextContent(html, 'h1') || '';
    const subheadline = extractTextContent(html, 'h2') || '';

    // Extract various elements
    const ctaButtons = extractCTAButtons(html);
    const forms = extractForms(html);
    const testimonials = extractTestimonials(html);
    const socialProof = extractSocialProof(html);
    const trustElements = extractTrustElements(html);    // Extract images
    const images: Array<{ src: string; alt?: string; isHero?: boolean }> = [];
    const imgMatches = html.match(/<img[^>]*src=['"]([^'"]+)['"][^>]*>/gi);
    if (imgMatches) {
      imgMatches.slice(0, 10).forEach((img, index) => {
        const srcMatch = img.match(/src=['"]([^'"]+)['"]/);
        const altMatch = img.match(/alt=['"]([^'"]+)['"]/);
        if (srcMatch) {
          images.push({
            src: srcMatch[1],
            alt: altMatch?.[1],
            isHero: index === 0 // First image considered hero
          });
        }
      });
    }

    // Extract videos
    const videos: Array<{ src: string; position: string }> = [];
    const videoMatches = html.match(/<video[^>]*src=['"]([^'"]+)['"][^>]*>|<iframe[^>]*src=['"]([^'"]*(?:youtube|vimeo)[^'"]*)['"][^>]*>/gi);
    if (videoMatches) {
      videoMatches.slice(0, 5).forEach((video, index) => {
        const srcMatch = video.match(/src=['"]([^'"]+)['"]/);
        if (srcMatch) {
          videos.push({
            src: srcMatch[1],
            position: `video-${index}`
          });
        }
      });
    }

    // Technical data
    const technicalData = {
      loadTime: undefined, // Could be measured
      mobileResponsive: html.includes('viewport') && html.includes('device-width'),
      hasSSL: url.startsWith('https://'),
      metaTagsOptimized: !!(title && metaDescription && title.length > 10 && metaDescription.length > 50)
    };    // Content sections (simplified)
    const contentSections: Array<{ type: string; content: string; position: number }> = [];
    const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
    if (headings) {
      headings.slice(0, 10).forEach((heading, index) => {
        const textMatch = heading.match(/>([^<]+)</);
        if (textMatch) {
          contentSections.push({
            type: 'heading',
            content: textMatch[1].trim(),
            position: index
          });
        }
      });
    }

    return {
      title,
      headline,
      subheadline,
      metaDescription,
      ctaButtons,
      forms,
      images,
      videos,
      testimonials,
      socialProof,
      trustElements,
      technicalData,
      contentSections
    };

  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url }: ScrapeRequestBody = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Scrape the landing page
    const scrapedData = await scrapeLandingPage(url);

    return res.status(200).json(scrapedData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
