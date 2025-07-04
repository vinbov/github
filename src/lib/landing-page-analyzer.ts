import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// Tipi per i dati e i problemi
type LandingPageData = {
  title: string;
  headlines: { h1: string[]; h2: string[]; };
  ctas: { text: string; isAboveTheFold: boolean; }[];
  contactForms: { fields: { type: string; name: string; label: string; }[]; }[];
  socialProof: { testimonials: string[]; logos: { src: string; alt: string; }[]; };
};
type Issue = { category: string; severity: 'critical' | 'high' | 'medium'; issue: string };


export async function analyzeLandingPage(url: string): Promise<{ data: LandingPageData }> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data: LandingPageData = await page.evaluate(() => {
      const getAllElementsText = (selector: string): string[] => 
        Array.from(document.querySelectorAll(selector)).map(el => el.textContent?.trim() || '');

      const isAboveTheFold = (element: Element | null): boolean => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.top < window.innerHeight;
      };

      return {
          title: document.title,
          headlines: {
              h1: getAllElementsText('h1'),
              h2: getAllElementsText('h2'),
          },
          ctas: Array.from(document.querySelectorAll('a, button')).map(el => ({
              text: el.textContent?.trim() || '',
              isAboveTheFold: isAboveTheFold(el)
          })).filter(cta => cta.text.length > 5 && cta.text.length < 50),
          contactForms: Array.from(document.querySelectorAll('form')).map(form => ({
              fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
                  type: (field as HTMLInputElement).type || field.tagName.toLowerCase(),
                  name: (field as HTMLInputElement).name || '',
                  label: document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || ''
              }))
          })),
          socialProof: {
              testimonials: getAllElementsText('.testimonial, .quote, [class*="testimonial"], [class*="quote"]'),
              logos: Array.from(document.querySelectorAll('.client-logos img, .customer-logo img, [class*="logo"] img')).map(img => ({
                  src: (img as HTMLImageElement).src,
                  alt: (img as HTMLImageElement).alt
              }))
          },
      };
    });

    return { data };
  } finally {
    await browser.close();
  }
}

export function findStructuralIssues(data: LandingPageData): Issue[] {
  const issues: Issue[] = [];

  // 1. Chiarezza del Messaggio
  if (data.headlines.h1.length === 0) {
    issues.push({ category: 'messageClarity', severity: 'critical', issue: 'Manca un titolo H1, fondamentale per la SEO e la chiarezza.' });
  }
  if (data.headlines.h1.length > 1) {
    issues.push({ category: 'messageClarity', severity: 'high', issue: `Sono presenti ${data.headlines.h1.length} titoli H1. Dovrebbe essercene solo uno.` });
  }
  if (!data.title) {
    issues.push({ category: 'messageClarity', severity: 'high', issue: 'Manca il meta-titolo della pagina (<title>).' });
  }

  // 2. Call to Action
  if (data.ctas.length === 0) {
    issues.push({ category: 'callToAction', severity: 'critical', issue: 'Nessuna Call-to-Action (CTA) trovata sulla pagina.' });
  }
  const ctasAboveFold = data.ctas.filter(cta => cta.isAboveTheFold).length;
  if (ctasAboveFold === 0 && data.ctas.length > 0) {
    issues.push({ category: 'callToAction', severity: 'high', issue: 'Nessuna Call-to-Action (CTA) è visibile "above the fold" (senza scrollare).' });
  }

  // 3. Form di Contatto
  if (data.contactForms.length === 0) {
    issues.push({ category: 'contactForm', severity: 'medium', issue: 'Nessun form di contatto trovato. Potrebbe essere intenzionale, ma è un elemento chiave per la lead generation.' });
  } else {
    const form = data.contactForms[0];
    if (form.fields.length > 6) {
      issues.push({ category: 'contactForm', severity: 'medium', issue: `Il primo form di contatto ha ${form.fields.length} campi, il che potrebbe ridurre le conversioni.` });
    }
  }

  // 4. Prova Sociale
  if (data.socialProof.testimonials.length === 0 && data.socialProof.logos.length === 0) {
    issues.push({ category: 'socialProof', severity: 'medium', issue: 'Nessuna prova sociale evidente (testimonianze, loghi clienti) trovata.' });
  }

  return issues;
}