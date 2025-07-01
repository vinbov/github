import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { analyzeLandingPage } from '@/lib/landing-page-analyzer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL richiesto' },
        { status: 400 }
      );
    }

    // Analizza la landing page con Puppeteer per estrarre gli elementi rilevanti
    console.log(`Inizio analisi della landing page: ${url}`);
    const { data: landingData, screenshot } = await analyzeLandingPage(url);
    console.log('Estrazione dati dalla landing page completata');
    
    // Crea un prompt ottimizzato basato sui dati estratti
    const prompt = `
      Analizza questa landing page all'URL: ${url}
      
      ELEMENTI CHIAVE ESTRATTI:
      
      1. MESSAGGIO:
      Titolo pagina: ${landingData.title}
      H1: ${landingData.headlines.h1.join(' | ')}
      H2 principali: ${landingData.headlines.h2.join(' | ')}
      
      2. HERO SECTION:
      ${landingData.heroSection ? 'Presente' : 'Non identificata'}
      
      3. BENEFIT E COPY:
      ${landingData.benefitSections.length > 0 ? 
        `Sezioni benefit trovate: ${landingData.benefitSections.length}` : 
        'Nessuna sezione benefit chiaramente identificata'}
      
      4. SOCIAL PROOF:
      Testimonianze: ${landingData.socialProof.testimonials.length}
      Loghi client: ${landingData.socialProof.logos.length}
      Trust badges: ${landingData.socialProof.trustBadges.length}
      
      5. CTA:
      ${landingData.ctas.map(cta => `"${cta.text}" (${cta.isAboveTheFold ? 'above the fold' : 'below the fold'})`).join('\n      ')}
      
      6. FORM:
      Form trovati: ${landingData.contactForms.length}
      ${landingData.contactForms.length > 0 ? 
        `Campi nel primo form: ${landingData.contactForms[0].fields.map(f => f.type).join(', ')}` : 
        ''}
      
      7. UX:
      Colori principali: ${landingData.colorPalette.slice(0, 5).join(', ')}
      Navigazione: ${landingData.navigation ? 'Presente' : 'Non identificata'}
      
      Analizza questi elementi estratti secondo i 7 criteri chiave per una landing page efficace:
      1. Chiarezza del Messaggio e Proposta di Valore
      2. Impatto Visivo (Hero Section)
      3. Testo Persuasivo e Benefici
      4. Prova Sociale
      5. Call-to-Action
      6. Modulo di Contatto
      7. Esperienza Utente e Performance
    `;
    
    console.log('Invio richiesta a OpenAI');
    // Chiamata all'API OpenAI con il prompt ottimizzato
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Usa il modello standard, non vision (più economico)
      messages: [
        {
          role: 'system',
          content: `Sei un esperto di marketing specializzato nell'analisi di landing page.
            Analizza la landing page fornita secondo i criteri specificati.
            Organizza la tua risposta in sezioni chiaramente definite:
            - messageClarity: Analisi dell'headline, sub-headline e proposta di valore
            - visualImpact: Analisi dell'immagine hero e impatto visivo
            - persuasiveCopy: Analisi del testo persuasivo e focus sui benefici
            - socialProof: Analisi delle testimonianze, loghi, certificazioni
            - callToAction: Analisi dei CTA, posizionamento e testo
            - contactForm: Analisi del form di contatto
            - userExperience: Analisi dell'UX e performance
            - recommendations: Suggerimenti specifici per migliorare la landing page`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
    });
    console.log('Risposta ricevuta da OpenAI');

    // Estrai e processa la risposta
    const content = response.choices[0]?.message?.content || '';
    const sections = parseSections(content);
    
    return NextResponse.json({
      analysis: content,
      sections,
      tokens: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      screenshot // Includi lo screenshot come riferimento
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || "Errore nell'analisi della landing page" },
      { status: 500 }
    );
  }
}

// Helper per estrarre le sezioni dalla risposta
function parseSections(content: string) {
  const sections = {
    messageClarity: extractSection(content, 'messageClarity'),
    visualImpact: extractSection(content, 'visualImpact'),
    persuasiveCopy: extractSection(content, 'persuasiveCopy'),
    socialProof: extractSection(content, 'socialProof'),
    callToAction: extractSection(content, 'callToAction'),
    contactForm: extractSection(content, 'contactForm'),
    userExperience: extractSection(content, 'userExperience'),
    recommendations: extractSection(content, 'recommendations')
  };
  
  return sections;
}

function extractSection(content: string, sectionName: string) {
  // Pattern di ricerca flessibile
  const patterns = [
    new RegExp(`${sectionName}:[\\s\\n]*(.*?)(?=\\n\\w+:|$)`, 'is'),
    new RegExp(`${sectionName}[\\s\\n]*(.*?)(?=\\n\\w+:|$)`, 'is'),
    new RegExp(`${sectionName.replace(/([A-Z])/g, ' $1').trim()}:[\\s\\n]*(.*?)(?=\\n\\w+:|$)`, 'is')
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}