"use client";
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LandingPageAnalysis, LandingPageWithAnalysis } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { analyzeLandingPageAction } from '@/app/actions/tool4-actions';
import { TableLandingPageAnalysis } from './table-landing-page-analysis';
import { exportToCSV } from '@/lib/csv';
import { Search, Download, AlertCircle, Bot, Loader2, FileText, StopCircle, Globe, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface Tool4LandingAnalyzerProps {
  analyzedPages: LandingPageWithAnalysis[];
  setAnalyzedPages: React.Dispatch<React.SetStateAction<LandingPageWithAnalysis[]>>;
}

export function Tool4LandingAnalyzer({
  analyzedPages,
  setAnalyzedPages,
}: Tool4LandingAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAnalysisStoppedRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  const runLandingPageAnalysis = async () => {
    if (!landingPageUrl || !landingPageUrl.startsWith("http")) {
      setError("Inserisci un URL valido per la landing page da analizzare.");
      return;
    }
    
    setIsAnalyzing(true);
    setLoadingMessage("Avvio analisi marketing della landing page...");
    setError(null);
    isAnalysisStoppedRef.current = false;

    try {
      setLoadingMessage("Scraping contenuto della landing page...");
      
      // Prima facciamo lo scraping del contenuto della pagina
      const scrapingResponse = await fetch('/api/scrape-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: landingPageUrl })
      });

      if (!scrapingResponse.ok) {
        throw new Error(`Errore durante lo scraping: ${scrapingResponse.statusText}`);
      }

      const scrapedData = await scrapingResponse.json();
      
      setLoadingMessage("Analisi marketing in corso con Gemini...");
      
      // Poi analizziamo i dati con OpenAI
      const analysisResult = await analyzeLandingPageAction({
        url: landingPageUrl,
        scrapedData: scrapedData,
        businessType: businessType || "general",
        primaryGoal: primaryGoal || "conversion",
        targetAudience: targetAudience || "general"
      });

      const newAnalyzedPage: LandingPageWithAnalysis = {
        id: generateId(),
        url: landingPageUrl,
        businessType: businessType || "general",
        primaryGoal: primaryGoal || "conversion",
        targetAudience: targetAudience || "general",
        scrapedData: scrapedData,
        analysis: analysisResult,
        analyzedAt: new Date().toISOString()
      };

      setAnalyzedPages(prev => [newAnalyzedPage, ...prev]);
      setLoadingMessage("Analisi completata!");
      
      toast({ 
        title: "Analisi Completata", 
        description: `Landing page analizzata con successo. Score: ${analysisResult.overallScore}/100` 
      });

      // Reset form
      setLandingPageUrl("");
      setBusinessType("");
      setPrimaryGoal("");
      setTargetAudience("");

    } catch (e: any) {
      console.error("Errore durante l'analisi della landing page:", e);
      setError(`Errore analisi: ${e.message}`);
      toast({ title: "Errore Analisi", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopAnalysis = () => {
    isAnalysisStoppedRef.current = true;
    setLoadingMessage("Interruzione analisi in corso...");
  };

  const handleDownloadCSV = () => {
    if (analyzedPages.length === 0) {
      toast({ title: "Nessun dato", description: "Nessun risultato da scaricare.", variant: "destructive" });
      return;
    }

    const headers = [
      "URL", "Tipo Business", "Obiettivo", "Target Audience", "Data Analisi",
      "Score Totale", "M1_Chiarezza_Messaggio", "M2_Impatto_Visivo", "M3_Efficacia_CTA", 
      "M4_Elementi_Fiducia", "M5_Flusso_Utente", "M6_Esperienza_Mobile", 
      "M7_Prova_Sociale", "M8_Urgenza_Scarsita", "M9_Qualita_Contenuto", "M10_Ottimizzazione_Conversioni",
      "Valutazione", "Punti_Forza", "Problemi_Critici", "Raccomandazioni_Priorita", "Analisi_Dettagliata"
    ];

    const csvRows = analyzedPages.map(page => ({
      "URL": page.url,
      "Tipo Business": page.businessType,
      "Obiettivo": page.primaryGoal,
      "Target Audience": page.targetAudience,
      "Data Analisi": new Date(page.analyzedAt).toLocaleString(),
      "Score Totale": page.analysis.overallScore,
      "M1_Chiarezza_Messaggio": page.analysis.m1MessageClarity,
      "M2_Impatto_Visivo": page.analysis.m2VisualImpact,
      "M3_Efficacia_CTA": page.analysis.m3CtaEffectiveness,
      "M4_Elementi_Fiducia": page.analysis.m4TrustElements,
      "M5_Flusso_Utente": page.analysis.m5UserFlow,
      "M6_Esperienza_Mobile": page.analysis.m6MobileExperience,
      "M7_Prova_Sociale": page.analysis.m7SocialProof,
      "M8_Urgenza_Scarsita": page.analysis.m8UrgencyScarcity,
      "M9_Qualita_Contenuto": page.analysis.m9ContentQuality,
      "M10_Ottimizzazione_Conversioni": page.analysis.m10ConversionOptimization,
      "Valutazione": page.analysis.evaluation,
      "Punti_Forza": page.analysis.strengths.join("; "),
      "Problemi_Critici": page.analysis.criticalIssues.join("; "),
      "Raccomandazioni_Priorita": page.analysis.priorityRecommendations.join("; "),
      "Analisi_Dettagliata": page.analysis.detailedAnalysis
    }));

    exportToCSV("landing_page_analysis_report.csv", headers, csvRows);
  };

  const openDetailPage = () => {
    if (analyzedPages.length === 0) {
      toast({ title: "Dati Insufficienti", description: "Analizza almeno una landing page.", variant: "destructive" });
      return;
    }
    localStorage.setItem('tool4LandingAnalysisData', JSON.stringify(analyzedPages));
    router.push('/tool4/landing-analysis');
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--emerald-600))' }}>
          Landing Page Marketing Analyzer
        </h2>
        <p className="text-muted-foreground mt-2">
          Analizza landing page e siti web con il framework Marketing 10M per ottimizzare le conversioni.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configurazione Analisi Landing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="landingPageUrl" className="block text-sm font-medium text-foreground mb-1">
              URL Landing Page
            </label>
            <Input
              type="url"
              id="landingPageUrl"
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              disabled={isAnalyzing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-foreground mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Tipo di Business
              </label>
              <Select value={businessType} onValueChange={setBusinessType} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS / Software</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="leadgen">Lead Generation</SelectItem>
                  <SelectItem value="course">Corsi Online</SelectItem>
                  <SelectItem value="consulting">Consulenza</SelectItem>
                  <SelectItem value="agency">Agenzia</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="primaryGoal" className="block text-sm font-medium text-foreground mb-1">
                <Target className="inline h-4 w-4 mr-1" />
                Obiettivo Primario
              </label>
              <Select value={primaryGoal} onValueChange={setPrimaryGoal} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona obiettivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Vendita Diretta</SelectItem>
                  <SelectItem value="lead">Generazione Lead</SelectItem>
                  <SelectItem value="signup">Registrazione/Signup</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="booking">Prenotazione</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-foreground mb-1">
                <Globe className="inline h-4 w-4 mr-1" />
                Target Audience
              </label>
              <Select value={targetAudience} onValueChange={setTargetAudience} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona target..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b2b">B2B Professional</SelectItem>
                  <SelectItem value="b2c">B2C Consumer</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="smb">Small Business</SelectItem>
                  <SelectItem value="students">Studenti</SelectItem>
                  <SelectItem value="general">Generico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="openAIApiKeyTool4" className="block text-sm font-medium text-foreground mb-1">
              OpenAI API Key
            </label>
            <Input
              type="password"
              id="openAIApiKeyTool4"
              value={""} // Rimuovo la chiave API
              onChange={(e) => {}} // Rimuovo la funzione di aggiornamento
              placeholder="La tua chiave API OpenAI (es. sk-...)"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground mt-1">Usata per l'analisi marketing con Gemini 2.5 Pro (Google AI).</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={runLandingPageAnalysis} 
          disabled={isAnalyzing} 
          className="action-button bg-emerald-600 hover:bg-emerald-700 text-white text-lg"
        >
          {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
          {isAnalyzing ? "Analisi in corso..." : "Analizza Landing Page"}
        </Button>
      </div>

      {isAnalyzing && (
        <div className="text-center my-6">
          <p className="text-emerald-600 text-lg mb-1">{loadingMessage}</p>
          <Progress value={50} className="w-3/4 mx-auto mt-2" />
          <Button onClick={handleStopAnalysis} variant="destructive" size="sm" className="mt-3">
            <StopCircle className="mr-2 h-4 w-4" /> Interrompi Analisi
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analyzedPages.length > 0 && !isAnalyzing && (
        <Card className="mt-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Risultati Analisi Landing Page</CardTitle>
              <CardDescription>
                {analyzedPages.length} landing page analizzate con il framework Marketing 10M.
              </CardDescription>
            </div>
            <Button variant="link" onClick={openDetailPage} className="detail-button">
              Visualizza Report Dettagliato <FileText className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <TableLandingPageAnalysis landingPages={analyzedPages.slice(0, 5)} />
            {analyzedPages.length > 5 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Mostrate le prime 5 analisi. Clicca su "Visualizza Report Dettagliato" per vederle tutte.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {analyzedPages.length > 0 && !isAnalyzing && (
        <div className="text-center mt-6">
          <Button onClick={handleDownloadCSV} variant="outline">
            Scarica Risultati Landing Page (CSV) <Download className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
