import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Play } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Tipi semplificati per il nuovo flusso
type Analysis = {
  recommendations: string;
};

type AnalysisApiResponse = {
  choices: { message: { content: string; }; }[];
};

// Stato del componente semplificato per un flusso a singolo passaggio
type ComponentState =
  | { name: 'idle' }
  | { name: 'analyzing' }
  | { name: 'analysis_failed'; error: string }
  | { name: 'complete'; analysis: Analysis };

export interface Tool5MasterReportProps {
  landingPageUrl: string;
}

export function Tool5MasterReport({ landingPageUrl }: Tool5MasterReportProps) {
  const [state, setState] = useState<ComponentState>({ name: 'idle' });

  // Funzione unica per avviare l'analisi completa
  const runFullAnalysis = async () => {
    setState({ name: 'analyzing' });
    try {
      // Chiamata alla nostra API unificata
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: landingPageUrl }), // Invia solo l'URL
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore sconosciuto durante l'analisi");
      }

      // Estraiamo il contenuto dalla risposta di OpenRouter
      const analysisContent = (data as AnalysisApiResponse)?.choices?.[0]?.message?.content;
      if (!analysisContent) {
        throw new Error("Non è stato possibile interpretare la risposta dell'API.");
      }

      const analysisResult: Analysis = {
        recommendations: analysisContent,
      };

      setState({ name: 'complete', analysis: analysisResult });

    } catch (err: any) {
      setState({ name: 'analysis_failed', error: err.message });
    }
  };

  // Avvia l'analisi automaticamente quando l'URL cambia
  useEffect(() => {
    if (landingPageUrl) {
      runFullAnalysis();
    }
  }, [landingPageUrl]);

  // Render condizionale basato sul nuovo stato semplificato
  switch (state.name) {
    case 'analyzing':
      return <LoadingCard title="Analisi AI in corso..." description="Stiamo analizzando la tua landing page con OpenRouter..." />;

    case 'analysis_failed':
      return <ErrorCard error={state.error} onRetry={runFullAnalysis} />;

    case 'complete':
      return (
        <FullReportCard
          url={landingPageUrl}
          analysis={state.analysis}
        />
      );

    default:
      // Mostra un pulsante per avviare se non parte in automatico
      return (
        <Card>
          <CardHeader>
            <CardTitle>Pronto per l'analisi</CardTitle>
            <CardDescription>Premi il pulsante per avviare l'analisi della landing page.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={runFullAnalysis}><Play className="mr-2 h-4 w-4" /> Avvia Analisi</Button>
          </CardFooter>
        </Card>
      );
  }
}

// --- Componenti di UI (leggermente modificati) ---

const LoadingCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="w-full"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></CardContent></Card>
);

const ErrorCard = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="w-full"><CardHeader><CardTitle className="text-red-600">Errore</CardTitle></CardHeader><CardContent><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Si è verificato un errore</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></CardContent><CardFooter><Button onClick={onRetry}>Riprova</Azione></Button></CardFooter></Card>
);

const FullReportCard = ({ url, analysis }: { url: string, analysis: Analysis }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Analisi Completa della Landing Page</CardTitle>
      <CardDescription>Valutazione di {url}</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">Raccomandazioni e Analisi</TabsTrigger>
        </TabsList>
        <TabsContent value="recommendations" className="mt-4">
          <div className="whitespace-pre-wrap p-4 bg-slate-50 rounded-lg border text-sm">
            {analysis.recommendations}
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);