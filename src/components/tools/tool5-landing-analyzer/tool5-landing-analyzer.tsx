'use client';

import React, { useState } from 'react';
import type { LandingPageWithAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Tool5LandingAnalyzerProps = {
  analyzedPages: LandingPageWithAnalysis[];
  setAnalyzedPages: React.Dispatch<React.SetStateAction<LandingPageWithAnalysis[]>>;
};

type AnalysisApiResponse = {
  choices: { message: { content: string; }; }[];
};

export function Tool5LandingAnalyzer({ analyzedPages, setAnalyzedPages }: Tool5LandingAnalyzerProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred during analysis.');
      }

      const analysisContent = (data as AnalysisApiResponse)?.choices?.[0]?.message?.content;
      if (!analysisContent) {
        throw new Error('Could not parse the analysis from the API response.');
      }

      const newAnalysis: LandingPageWithAnalysis = {
        id: new Date().toISOString(),
        url: url,
        analysis: analysisContent,
        timestamp: new Date().toLocaleString(),
      };

      setAnalyzedPages(prevPages => [newAnalysis, ...prevPages]);
      setUrl(''); // Pulisci l'input dopo il successo

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analizzatore Landing Page con AI</CardTitle>
        <p className="text-muted-foreground">
          Inserisci l'URL di una landing page per ottenere un'analisi basata su AI dei suoi punti di forza, debolezza e suggerimenti di miglioramento.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com"
            required
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Analisi in corso...' : 'Analizza URL'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mt-6">
          {analyzedPages.map((page) => (
            <Card key={page.id} className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg break-all">{page.url}</CardTitle>
                <p className="text-sm text-muted-foreground">{page.timestamp}</p>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">Risultato Analisi:</h3>
                <p className="whitespace-pre-wrap text-sm">{page.analysis}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}