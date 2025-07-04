import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// ... (le funzioni analyzeLandingPage e findStructuralIssues rimangono qui)

async function analyzeLandingPage(url: string) {
  // ... codice esistente di analyzeLandingPage
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const getElementText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || '';
    const getAllElementsText = (selector: string) => Array.from(document.querySelectorAll(selector)).map(el => el.textContent?.trim() || '');

    const getElementData = (selector: string, attribute: string) => {
        return Array.from(document.querySelectorAll(selector)).map(el => ({
            text: el.textContent?.trim() || '',
            [attribute]: el.getAttribute(attribute) || ''
        }));
    };

    const isAboveTheFold = (element: Element | null): boolean => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight;
    };

    const ctas = Array.from(document.querySelectorAll('a, button')).map(el => ({
        text: el.textContent?.trim() || '',
        isAboveTheFold: isAboveTheFold(el)
    })).filter(cta => cta.text.length > 5 && cta.text.length < 50);

    const contactForms = Array.from(document.querySelectorAll('form')).map(form => ({
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
            type: (field as HTMLInputElement).type || field.tagName.toLowerCase(),
            name: (field as HTMLInputElement).name || '',
            label: document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || ''
        }))
    }));

    return {
        title: document.title,
        headlines: {
            h1: getAllElementsText('h1'),
            h2: getAllElementsText('h2'),
        },
        ctas: ctas,
        contactForms: contactForms,
        socialProof: {
            testimonials: getAllElementsText('.testimonial, .quote'),
            logos: Array.from(document.querySelectorAll('.client-logos img, .customer-logo img')).map(img => ({
                src: (img as HTMLImageElement).src,
                alt: (img as HTMLImageElement).alt
            }))
        },
    };
  });

  await browser.close();
  return { data };
}

type LandingPageData = Awaited<ReturnType<typeof analyzeLandingPage>>['data'];
type Issue = { category: string; severity: 'critical' | 'high' | 'medium'; issue: string };

function findStructuralIssues(data: LandingPageData): Issue[] {
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


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, action, extractedData } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (action === 'extract') {
      const { data } = await analyzeLandingPage(url);
      const issues = findStructuralIssues(data);
      return NextResponse.json({ extractedData: { data }, issues });
    }

    // Qui andrà la logica per l'azione 'analyze'
    if (action === 'analyze') {
       // TODO: Implementare la logica di analisi con Gemini
       // Per ora, restituiamo un placeholder
       return NextResponse.json({ analysis: "Analisi AI completata (placeholder)" });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}