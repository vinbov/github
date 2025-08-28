"use server";

// Tipo per i dati estratti dalla pagina
export type LandingPageData = {
  title: string;
  headlines: { h1: string[]; h2: string[]; };
  ctas: { text: string; isAboveTheFold: boolean; }[];
  contactForms: { fields: { type: string; name: string; label: string; }[]; }[];
  socialProof: { testimonials: string[]; logos: { src: string; alt: string; }[]; };
};

// Funzione unica per scraping e analisi
export async function scrapeAndAnalyze(url: string): Promise<{ success: true, analysis: LandingPageData } | { success: false, error: string }> {
  console.log(`Inizio scraping e analisi per: ${url}`);

  // Importazione dinamica delle librerie pesanti
  const puppeteer = (await import('puppeteer-extra')).default;
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
  
  puppeteer.use(StealthPlugin());

  let browser;
  try {
    console.log('Avvio del browser Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    console.log('Estrazione dati dalla pagina...');
    const analysis: LandingPageData = await page.evaluate(() => {
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
            h2: getAllElementsText('h2') 
          },
          ctas: Array.from(document.querySelectorAll('a, button'))
            .map(el => ({ text: el.textContent?.trim() || '', isAboveTheFold: isAboveTheFold(el) }))
            .filter(cta => cta.text.length > 5 && cta.text.length < 50),
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

    console.log('Analisi completata con successo.');
    return { success: true, analysis };

  } catch (error) {
    console.error("Errore durante lo scraping o l'analisi:", error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return { success: false, error: `Si è verificato un errore: ${errorMessage}` };
  } finally {
    if (browser) {
      console.log('Chiusura del browser.');
      await browser.close();
    }
  }
}
