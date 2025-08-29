'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export type LandingPageWithAnalysis = {
  id: string;
  url: string;
  screenshotPath: string;
  analysis: any; // Usiamo 'any' per flessibilità, dato che la struttura può cambiare
  timestamp: string;
};

// NUOVO COMPONENTE PER RENDERIZZARE IL REPORT
function AnalysisReport({ analysis }: { analysis: any }) {
  if (!analysis || typeof analysis !== 'object') {
    return <p>{analysis?.message || 'Nessuna analisi disponibile.'}</p>;
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {analysis.preliminaryAnalysis && (
        <section className="mt-4">
          <h3 className="font-bold text-lg">Analisi Preliminare</h3>
          <p><strong>Quadrante FCB:</strong> {analysis.preliminaryAnalysis.fcbQuadrant}</p>
          <p><strong>Coerenza Strategia:</strong> {analysis.preliminaryAnalysis.strategyCoherence}</p>
          <p><strong>Target Audience:</strong> {analysis.preliminaryAnalysis.targetAudience}</p>
        </section>
      )}

      {analysis.structureAndFlow && (
        <section className="mt-4">
          <h3 className="font-bold text-lg">Struttura e Flusso (Punteggi 1-10)</h3>
          <ul className="list-disc pl-5">
            {Object.entries(analysis.structureAndFlow).map(([key, value]: [string, any]) => (
              <li key={key}>
                <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> [Score: {value.score}/10] - {value.notes}
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.criticalIssues && (
        <section className="mt-4">
          <h3 className="font-bold text-lg">3 Problemi più Critici</h3>
          <ul className="list-disc pl-5">
            {analysis.criticalIssues.map((issue: string, index: number) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis.priorityOptimizations && (
        <section className="mt-4">
          <h3 className="font-bold text-lg">5 Ottimizzazioni Prioritarie</h3>
          <ul className="list-disc pl-5">
            {analysis.priorityOptimizations.map((opt: any, index: number) => (
              <li key={index}>
                {opt.optimization} (<strong>Impatto Stimato:</strong> {opt.estimatedImpact})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}


type ScrapeAndAnalyzeFn = (url: string) => Promise<any>;

type Tool5LandingAnalyzerProps = {
  analyzedPages: LandingPageWithAnalysis[];
  setAnalyzedPages: React.Dispatch<React.SetStateAction<LandingPageWithAnalysis[]>>;
  scrapeAndAnalyze: ScrapeAndAnalyzeFn;
};

export function Tool5LandingAnalyzer({ analyzedPages, setAnalyzedPages, scrapeAndAnalyze }: Tool5LandingAnalyzerProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const rawResult = await scrapeAndAnalyze(url);

      if (rawResult.success === false || !rawResult.screenshotPath) {
        throw new Error(rawResult.error || 'Analisi fallita.');
      }

      const newPage: LandingPageWithAnalysis = {
        id: Date.now().toString(),
        url: url,
        screenshotPath: rawResult.screenshotPath,
        analysis: rawResult.analysis,
        timestamp: new Date().toLocaleString('it-IT'),
      };

      setAnalyzedPages(prevPages => [newPage, ...prevPages]);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore sconosciuto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analizzatore Landing Page</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://esempio.com/landing-page"
            required
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Analizza'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {analyzedPages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <CardTitle className="text-sm break-all">{page.url}</CardTitle>
                <p className="text-xs text-muted-foreground">{page.timestamp}</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">Screenshot</h3>
                  <img src={page.screenshotPath} alt={`Screenshot di ${page.url}`} className="rounded-md border" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">Risultato Analisi</h3>
                  {/* USO IL NUOVO COMPONENTE PER RENDERIZZARE IL REPORT */}
                  <AnalysisReport analysis={page.analysis} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}