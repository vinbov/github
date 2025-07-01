import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOpenAI } from '@/hooks/use-openai';
import { Skeleton } from '@/components/ui/skeleton';

export interface Tool5MasterReportProps {
  landingPageUrl: string;
  landingPageScreenshot: string;
}

export function Tool5MasterReport({ 
  landingPageUrl, 
  landingPageScreenshot
}: Tool5MasterReportProps) {
  const { generateAnalysis, loading, error } = useOpenAI();
  const [analysis, setAnalysis] = useState<{
    messageClarity: string;
    visualImpact: string;
    persuasiveCopy: string;
    socialProof: string;
    callToAction: string;
    contactForm: string;
    userExperience: string;
    recommendations: string;
  } | null>(null);

  useEffect(() => {
    const analyzeLandingPage = async () => {
      // Crea un prompt dettagliato basato sui 7 criteri
      const prompt = `
        Analizza questa landing page all'URL: ${landingPageUrl}
        
        Basati su questi 7 criteri chiave per una landing page efficace:
        
        1. Chiarezza del Messaggio e Proposta di Valore:
           - Headline: È chiara, concisa e orientata al beneficio?
           - Sub-headline: Espande efficacemente l'headline?
           - Unique Value Proposition: È chiaro perché questa offerta è migliore della concorrenza?
        
        2. Impatto Visivo (Hero Section):
           - L'immagine/video principale è di alta qualità e rilevante?
           - C'è coerenza visiva con il brand e l'annuncio di origine?
        
        3. Testo Persuasivo e Benefici:
           - Si concentra sui benefici per l'utente o solo sulle caratteristiche?
           - Il copywriting è semplice, diretto e persuasivo?
           - Anticipa e supera le obiezioni potenziali?
        
        4. Prova Sociale:
           - Ci sono testimonianze credibili, recensioni, loghi di clienti?
           - Vengono mostrati numeri e dati concreti che costruiscono fiducia?
           - Ci sono sigilli di fiducia o certificazioni?
        
        5. Call-to-Action:
           - I CTA sono visibili e dal design accattivante?
           - Il testo dei pulsanti è specifico e orientato all'azione?
           - Il posizionamento è ottimale (above the fold e ripetuto)?
        
        6. Modulo di Contatto:
           - Quanti campi richiede? È ottimizzato per massimizzare le conversioni?
           - Le etichette sono chiare e ci sono messaggi di errore comprensibili?
           - Ci sono rassicurazioni sulla privacy?
        
        7. Esperienza Utente e Performance:
           - La pagina si carica velocemente (sotto i 3 secondi)?
           - Il design è completamente responsive e mobile-friendly?
           - La gerarchia visiva guida l'utente verso la conversione?
        
        Fornisci un'analisi dettagliata per ciascuna categoria e concludi con raccomandazioni specifiche per migliorare la landing page.
      `;
      
      try {
        const result = await generateAnalysis(prompt, landingPageScreenshot);
        if (result) {
          setAnalysis(result);
        }
      } catch (err) {
        console.error("Errore nell'analisi della landing page:", err);
      }
    };
    
    if (landingPageUrl) {
      analyzeLandingPage();
    }
  }, [landingPageUrl, landingPageScreenshot, generateAnalysis]);

  if (loading) return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisi in corso...</CardTitle>
        <CardDescription>
          Stiamo analizzando la landing page secondo i 7 criteri chiave
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
  
  if (error) return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-red-600">Errore nell'analisi</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{error}</p>
        <p className="mt-2">Riprova con un altro URL o contatta l'assistenza.</p>
      </CardContent>
    </Card>
  );
  
  if (!analysis) return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisi della landing page</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Caricamento analisi...</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisi Completa della Landing Page</CardTitle>
        <CardDescription>
          Valutazione di {landingPageUrl} basata sui 7 elementi critici di una landing page efficace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messageClarity" className="w-full">
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value="messageClarity">Messaggio</TabsTrigger>
            <TabsTrigger value="visualImpact">Impatto Visivo</TabsTrigger>
            <TabsTrigger value="persuasiveCopy">Copy</TabsTrigger>
            <TabsTrigger value="socialProof">Prova Sociale</TabsTrigger>
            <TabsTrigger value="callToAction">CTA</TabsTrigger>
            <TabsTrigger value="contactForm">Form</TabsTrigger>
            <TabsTrigger value="userExperience">UX</TabsTrigger>
          </TabsList>

          <TabsContent value="messageClarity" className="space-y-4">
            <h3 className="text-lg font-bold">Chiarezza del Messaggio e Proposta di Valore</h3>
            <div className="whitespace-pre-wrap">{analysis.messageClarity}</div>
          </TabsContent>

          <TabsContent value="visualImpact" className="space-y-4">
            <h3 className="text-lg font-bold">Impatto Visivo (Hero Section)</h3>
            <div className="whitespace-pre-wrap">{analysis.visualImpact}</div>
          </TabsContent>

          <TabsContent value="persuasiveCopy" className="space-y-4">
            <h3 className="text-lg font-bold">Testo Persuasivo e Benefici</h3>
            <div className="whitespace-pre-wrap">{analysis.persuasiveCopy}</div>
          </TabsContent>

          <TabsContent value="socialProof" className="space-y-4">
            <h3 className="text-lg font-bold">Prova Sociale</h3>
            <div className="whitespace-pre-wrap">{analysis.socialProof}</div>
          </TabsContent>

          <TabsContent value="callToAction" className="space-y-4">
            <h3 className="text-lg font-bold">Call-to-Action</h3>
            <div className="whitespace-pre-wrap">{analysis.callToAction}</div>
          </TabsContent>

          <TabsContent value="contactForm" className="space-y-4">
            <h3 className="text-lg font-bold">Modulo di Contatto</h3>
            <div className="whitespace-pre-wrap">{analysis.contactForm}</div>
          </TabsContent>

          <TabsContent value="userExperience" className="space-y-4">
            <h3 className="text-lg font-bold">Esperienza Utente e Performance</h3>
            <div className="whitespace-pre-wrap">{analysis.userExperience}</div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Raccomandazioni per Miglioramenti</h3>
          <div className="whitespace-pre-wrap">{analysis.recommendations}</div>
        </div>
      </CardContent>
    </Card>
  );
}