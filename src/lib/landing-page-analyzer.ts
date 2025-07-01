import puppeteer from 'puppeteer';

export async function analyzeLandingPage(url: string) {
  // Verifica che l'URL sia valido
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  
  console.log(`Analisi ottimizzata della landing page: ${url}`);
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Naviga all'URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendi che la pagina sia completamente caricata
    await page.waitForTimeout(2000);
    
    // Estrai SELETTIVAMENTE solo gli elementi rilevanti per i 7 criteri di analisi
    const landingPageData = await page.evaluate(() => {
      // 1. Funzione helper per estrarre il contenuto HTML di un elemento con limite di caratteri
      const extractElementHtml = (element, maxChars = 500) => {
        if (!element) return '';
        const html = element.outerHTML;
        return html.length > maxChars ? html.substring(0, maxChars) + '...' : html;
      };
      
      // 2. Funzione per trovare il "hero section" della pagina
      const findHeroSection = () => {
        // Strategie euristiche per identificare una hero section:
        const potentialHeros = [
          document.querySelector('.hero'),
          document.querySelector('header + section'),
          document.querySelector('section:first-of-type'),
          document.querySelector('div[class*="hero"]'),
          document.querySelector('div[class*="banner"]'),
          document.querySelector('div[class*="header-content"]'),
          // Se la prima immagine grande è nella parte superiore della pagina
          Array.from(document.querySelectorAll('img')).find(img => {
            const rect = img.getBoundingClientRect();
            return (img.width > 600 || img.height > 350) && rect.top < 500;
          })?.parentElement
        ];
        
        // Prendi il primo elemento hero valido trovato
        const heroElement = potentialHeros.find(el => el !== null);
        return heroElement ? extractElementHtml(heroElement, 1000) : '';
      };
      
      // 3. Trova i moduli di contatto
      const findContactForms = () => {
        const forms = Array.from(document.querySelectorAll('form'));
        
        // Se non ci sono form con tag form, cerca div che sembrano form
        if (forms.length === 0) {
          const potentialForms = Array.from(document.querySelectorAll('div[class*="form"], div[class*="contact"], .wpcf7'));
          return potentialForms.map(form => ({
            html: extractElementHtml(form, 1000),
            fields: Array.from(form.querySelectorAll('input, textarea, select'))
              .map(field => ({ 
                type: field.getAttribute('type') || field.tagName.toLowerCase(),
                name: field.getAttribute('name') || '',
                placeholder: field.getAttribute('placeholder') || '',
                label: field.getAttribute('aria-label') || 
                       document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || ''
              }))
          }));
        }
        
        return forms.map(form => ({
          html: extractElementHtml(form, 1000),
          fields: Array.from(form.querySelectorAll('input, textarea, select'))
            .map(field => ({ 
              type: field.getAttribute('type') || field.tagName.toLowerCase(),
              name: field.getAttribute('name') || '',
              placeholder: field.getAttribute('placeholder') || '',
              label: field.getAttribute('aria-label') || 
                     document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || ''
            }))
        }));
      };
      
      // 4. Trova i CTA (Call to Action)
      const findCTAs = () => {
        const ctaElements = [
          ...Array.from(document.querySelectorAll('a.btn, a.button, button[type="submit"], [class*="cta"]')),
          ...Array.from(document.querySelectorAll('a, button')).filter(el => {
            const text = el.textContent?.toLowerCase().trim() || '';
            const ctaPhrases = ['get started', 'try now', 'start', 'sign up', 'subscribe', 
                               'register', 'join', 'buy now', 'download', 'learn more', 'contact'];
            return ctaPhrases.some(phrase => text.includes(phrase));
          })
        ];
        
        return ctaElements.map(cta => ({
          text: cta.textContent?.trim() || '',
          html: extractElementHtml(cta, 300),
          isAboveTheFold: cta.getBoundingClientRect().top < window.innerHeight
        }));
      };
      
      // 5. Trova testimonianze e social proof
      const findSocialProof = () => {
        const testimonialElements = Array.from(document.querySelectorAll(
          '.testimonial, .review, blockquote, [class*="testimonial"], [class*="review"], .feedback'
        ));
        
        const clientLogos = Array.from(document.querySelectorAll(
          '.client-logos img, .clients img, .partners img, .brands img, [class*="client"] img, [class*="partner"] img'
        ));
        
        return {
          testimonials: testimonialElements.map(t => ({
            text: t.textContent?.trim() || '',
            html: extractElementHtml(t, 500)
          })),
          logos: clientLogos.map(logo => ({
            alt: logo.alt || '',
            src: logo.src || ''
          })),
          trustBadges: Array.from(document.querySelectorAll(
            '.trust-badge, .security-badge, img[src*="trust"], img[src*="secure"], img[src*="guarantee"]'
          )).map(badge => extractElementHtml(badge, 300))
        };
      };
      
      return {
        // Informazioni generali
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        
        // 1. Chiarezza del Messaggio e Proposta di Valore
        headlines: {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || ''),
          h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || '').slice(0, 5),
          subheadings: Array.from(document.querySelectorAll('h3, h4, .subheading')).map(h => h.textContent?.trim() || '').slice(0, 5)
        },
        
        // 2. Impatto Visivo (Hero Section)
        heroSection: findHeroSection(),
        mainImages: Array.from(document.querySelectorAll('img')).slice(0, 3).map(img => ({
          alt: img.alt || '',
          src: img.src || '',
          isAboveTheFold: img.getBoundingClientRect().top < window.innerHeight
        })),
        
        // 3. Testo Persuasivo e Benefici
        benefitSections: Array.from(document.querySelectorAll('.benefits, .features, [class*="benefit"], [class*="feature"]')).map(section => 
          extractElementHtml(section, 700)
        ),
        
        // 4. Prova Sociale
        socialProof: findSocialProof(),
        
        // 5. Call-to-Action
        ctas: findCTAs(),
        
        // 6. Modulo di Contatto
        contactForms: findContactForms(),
        
        // 7. Esperienza Utente e Performance
        navigation: extractElementHtml(document.querySelector('nav, .navbar, .navigation, header'), 500),
        footerLinks: Array.from(document.querySelectorAll('footer a')).map(a => a.textContent?.trim() || '').slice(0, 10),
        
        // Misurazioni di usabilità 
        fontSizesUsed: Array.from(new Set(
          Array.from(document.querySelectorAll('*')).map(el => {
            const style = window.getComputedStyle(el);
            return style.fontSize;
          }).filter(Boolean)
        )),
        colorPalette: Array.from(new Set(
          Array.from(document.querySelectorAll('*')).map(el => {
            const style = window.getComputedStyle(el);
            return [style.color, style.backgroundColor].filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent');
          }).flat()
        )).slice(0, 10)
      };
    });
    
    // Cattura anche uno screenshot come riferimento
    const screenshot = await page.screenshot({ 
      type: 'jpeg',
      quality: 80,
      fullPage: false
    });
    
    return {
      data: landingPageData,
      screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`
    };
  } finally {
    await browser.close();
  }
}