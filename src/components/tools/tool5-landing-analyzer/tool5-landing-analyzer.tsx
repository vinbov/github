// filepath: /workspaces/github/src/components/tools/tool5-landing-analyzer/tool5-landing-analyzer.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertTriangle, CheckCircle } from 'lucide-react';

type ReportSection = { title: string; content: string };
type Issue = { category: string; severity: string; issue: string };
type ExtractedData = any;

type State = 
  | { name: 'idle' }
  | { name: 'extracting'; url: string }
  | { name: 'analyzing'; url: string; extractedData: ExtractedData; issues: Issue[] }
  | { name: 'success'; url: string; sections: ReportSection[]; issues: Issue[]; tokens: any }
  | { name: 'error'; message: string };

export function Tool5LandingAnalyzer() {
  const [state, setState] = useState<State>({ name: 'idle' });
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    
    setState({ name: 'extracting', url: urlInput });

    try {
      // --- FASE 1: Estrazione Dati ---
      const extractRes = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, action: 'extract' }),
      });

      if (!extractRes.ok) {
        const { error } = await extractRes.json();
        throw new Error(error || 'Errore durante l\'estrazione dei dati.');
      }

      const { extractedData, issues } = await extractRes.json();
      setState({ name: 'analyzing', url: urlInput, extractedData, issues });

      // --- FASE 2: Analisi AI ---
      const analyzeRes = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, action: 'analyze', extractedData }),
      });

      if (!analyzeRes.ok) {
        const { error } = await analyzeRes.json();
        throw new Error(error || 'Errore durante l\'analisi AI.');
      }

      const { sections, tokens } = await analyzeRes.json();
      const reportSections = Object.entries(sections).map(([key, value]) => ({
        title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        content: value as string,
      }));

      setState({ name: 'success', url: urlInput, sections: reportSections, issues, tokens });

    } catch (error: any) {
      setState({ name: 'error', message: error.message });
    }
  };

  const renderContent = () => {
    switch (state.name) {
      case 'extracting':
        return <div className="flex items-center"><Loader className="mr-2 animate-spin" /> Estrazione dei dati dalla pagina...</div>;
      case 'analyzing':
        return <div className="flex items-center"><Loader className="mr-2 animate-spin" /> Analisi con AI in corso...</div>;
      case 'success':
        return (
          <div>
            <h3 className="text-lg font-bold mb-2">Report Analisi per: {state.url}</h3>
            {state.issues.length > 0 && (
              <Card className="mb-4 bg-yellow-50 border-yellow-200">
                <CardHeader><CardTitle>Problemi Strutturali Rilevati</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5">
                    {state.issues.map((issue, i) => <li key={i} className="mb-1">{issue.issue}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
            {state.sections.map((section, i) => (
              <Card key={i} className="mb-4">
                <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
                <CardContent><p>{section.content}</p></CardContent>
              </Card>
            ))}
          </div>
        );
      case 'error':
        return <div className="text-red-500 flex items-center"><AlertTriangle className="mr-2" /> Errore: {state.message}</div>;
      default:
        return <p>Inserisci un URL per iniziare l'analisi.</p>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analizzatore Landing Page con AI</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="url"
            placeholder="https://www.esempio.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={state.name === 'extracting' || state.name === 'analyzing'}
          />
          <Button type="submit" disabled={state.name === 'extracting' || state.name === 'analyzing'}>
            Analizza
          </Button>
        </form>
        <div className="mt-4 p-4 border rounded-lg min-h-[100px]">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}