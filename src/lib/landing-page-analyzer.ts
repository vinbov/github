'use server';
import 'server-only';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export type LandingPageData = {
  title: string;
  headlines: { h1: string[]; h2: string[]; };
  ctas: { text: string; isAboveTheFold: boolean; }[];
  contactForms: { fields: { type: string; name: string; label: string; }[]; }[];
  socialProof: { testimonials: string[]; logos: { src: string; alt: string; }[]; };
};

// Questa è l'unica funzione esportata ed è ASYNC, come richiesto.
export async function analyzeLandingPage(url:string): Promise<{ data: LandingPageData }> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const data: LandingPageData = await page.evaluate(() => {
      const getAllElementsText = (selector: string): string[] => Array.from(document.querySelectorAll(selector)).map(el => el.textContent?.trim() || '');
      const isAboveTheFold = (element: Element | null): boolean => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.top < window.innerHeight;
      };
      return {
          title: document.title,
          headlines: { h1: getAllElementsText('h1'), h2: getAllElementsText('h2') },
          ctas: Array.from(document.querySelectorAll('a, button')).map(el => ({ text: el.textContent?.trim() || '', isAboveTheFold: isAboveTheFold(el) })).filter(cta => cta.text.length > 5 && cta.text.length < 50),
          contactForms: Array.from(document.querySelectorAll('form')).map(form => ({ fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({ type: (field as HTMLInputElement).type || field.tagName.toLowerCase(), name: (field as HTMLInputElement).name || '', label: document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || '' })) })),
          socialProof: { testimonials: getAllElementsText('.testimonial, .quote, [class*="testimonial"], [class*="quote"]'), logos: Array.from(document.querySelectorAll('.client-logos img, .customer-logo img, [class*="logo"] img')).map(img => ({ src: (img as HTMLImageElement).src, alt: (img as HTMLImageElement).alt })) },
      };
    });
    return { data };
  } finally {
    await browser.close();
  }
}