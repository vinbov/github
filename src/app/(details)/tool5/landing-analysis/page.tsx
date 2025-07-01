"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import type { LandingPageWithAnalysis } from '@/lib/types';
import { TableLandingPageAnalysis } from '@/components/tools/tool5-landing-analyzer/table-landing-page-analysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { exportToCSV } from '@/lib/csv';

const LOGO_URL = "https://placehold.co/150x50/0284c7/FFFFFF?text=SEO+Toolkit+Pro";

const framework10M_HTML = `
    <h4 class="text-lg font-semibold mb-2 text-foreground">Framework di Valutazione Landing Page – Marketing 10M</h4>
    <ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
        <li><strong>🎯 M1 Chiarezza Messaggio:</strong> Value proposition chiara e specifica, messaggio comunicato in 5-8 secondi</li>
        <li><strong>🎨 M2 Impatto Visivo:</strong> Design professionale, gerarchia visiva efficace, contrasti appropriati</li>
        <li><strong>🚀 M3 Efficacia CTA:</strong> CTA visibili e contrastanti, testo action-oriented, posizionamento strategico</li>
        <li><strong>🛡️ M4 Elementi Fiducia:</strong> Testimonial, logo clienti, certificazioni, garanzie credibili</li>
        <li><strong>🔄 M5 Flusso Utente:</strong> Navigazione intuitiva, percorso conversione chiaro, friction minimizzata</li>
        <li><strong>📱 M6 Esperienza Mobile:</strong> Responsive design, touch targets appropriati, velocità mobile</li>
        <li><strong>👥 M7 Prova Sociale:</strong> Recensioni, numeri, case studies, testimonial video rilevanti</li>
        <li><strong>⏰ M8 Urgenza/Scarsità:</strong> Elementi urgenza genuini, scarsità credibile, FOMO implementato</li>
        <li><strong>📝 M9 Qualità Contenuto:</strong> Copywriting persuasivo, benefici chiari, objections handling</li>
        <li><strong>📊 M10 Ottimizzazione Conversioni:</strong> Form ottimizzati, A/B test evidence, funnel logico</li>
    </ul>
    <h5 class="text-md font-semibold mb-1 text-foreground">Punteggio e Valutazione:</h5>
    <ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        <li><strong>0-10 per M:</strong> Ogni metrica valutata da 0 (assente) a 10 (eccellente).</li>
        <li><strong>Totale (max 100):</strong> 85-100 Ottimo; 70-84 Buono; 50-69 Mediocre; 0-49 Scarso.</li>
    </ul>`;

export default function Tool5LandingAnalysisDetailPage() {
  const router = useRouter();
  const [pageData, setPageData] = useState<LandingPageWithAnalysis[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedDataString = localStorage.getItem('tool5LandingAnalysisData');
    if (storedDataString) {
      try {
        const landingPages: LandingPageWithAnalysis[] = JSON.parse(storedDataString);
        setPageData(landingPages);
      } catch (error) {
        console.error('Errore nel parsing dei dati Tool5:', error);
        setPageData(null);
      }
    } else {
      setPageData(null);
    }
    setIsLoading(false);
  }, []);

  const handleDownloadCSV = () => {
    if (!pageData || pageData.length === 0) return;
    
    const headers = [
      "URL", "Tipo Business", "Obiettivo", "Target Audience", "Data Analisi",
      "Score Totale", "M1_Chiarezza_Messaggio", "M2_Impatto_Visivo", "M3_Efficacia_CTA", 
      "M4_Elementi_Fiducia", "M5_Flusso_Utente", "M6_Esperienza_Mobile", 
      "M7_Prova_Sociale", "M8_Urgenza_Scarsita", "M9_Qualita_Contenuto", "M10_Ottimizzazione_Conversioni",
      "Valutazione", "Punti_Forza", "Problemi_Critici", "Raccomandazioni_Priorita", "Analisi_Dettagliata"
    ];

    const csvRows = pageData.map(page => ({
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

    exportToCSV("tool5_landing_page_detailed_analysis.csv", headers, csvRows);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader logoUrl={LOGO_URL} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Caricamento dati analisi...</p>
        </div>
      </div>
    );
  }

  if (!pageData || pageData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader logoUrl={LOGO_URL} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">Nessun dato disponibile</h2>
              <p className="text-muted-foreground mb-4">
                Non sono stati trovati dati dell'analisi landing page. Torna al Tool 5 per effettuare un'analisi.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate average scores for radar chart
  const averageScores = {
    M1: pageData.reduce((sum, page) => sum + page.analysis.m1MessageClarity, 0) / pageData.length,
    M2: pageData.reduce((sum, page) => sum + page.analysis.m2VisualImpact, 0) / pageData.length,
    M3: pageData.reduce((sum, page) => sum + page.analysis.m3CtaEffectiveness, 0) / pageData.length,
    M4: pageData.reduce((sum, page) => sum + page.analysis.m4TrustElements, 0) / pageData.length,
    M5: pageData.reduce((sum, page) => sum + page.analysis.m5UserFlow, 0) / pageData.length,
    M6: pageData.reduce((sum, page) => sum + page.analysis.m6MobileExperience, 0) / pageData.length,
    M7: pageData.reduce((sum, page) => sum + page.analysis.m7SocialProof, 0) / pageData.length,
    M8: pageData.reduce((sum, page) => sum + page.analysis.m8UrgencyScarcity, 0) / pageData.length,
    M9: pageData.reduce((sum, page) => sum + page.analysis.m9ContentQuality, 0) / pageData.length,
    M10: pageData.reduce((sum, page) => sum + page.analysis.m10ConversionOptimization, 0) / pageData.length,
  };

  const averageOverallScore = pageData.reduce((sum, page) => sum + page.analysis.overallScore, 0) / pageData.length;

  // Prepare data for charts
  const barChartData = Object.keys(averageScores).map(key => ({
    metric: key,
    score: averageScores[key as keyof typeof averageScores],
    fullValue: 10
  }));

  const radarChartData = Object.keys(averageScores).map(key => ({
    metric: key,
    score: averageScores[key as keyof typeof averageScores],
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader logoUrl={LOGO_URL} />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna Indietro
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--purple-600))' }}>
              Report Dettagliato Analisi Landing Page (Tool 5)
            </h1>
            <p className="text-muted-foreground">
              Analisi completa di {pageData.length} landing page con framework Marketing 10M
            </p>
          </div>
          <Button onClick={handleDownloadCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Scarica Report CSV
          </Button>
        </div>

        {/* Framework Description */}
        <Card>
          <CardHeader>
            <CardTitle>Framework Marketing 10M</CardTitle>
            <CardDescription>Metodologia di valutazione per landing page ad alta conversione</CardDescription>
          </CardHeader>
          <CardContent>
            <div dangerouslySetInnerHTML={{ __html: framework10M_HTML }} />
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Landing Page Analizzate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pageData.length}</div>
              <p className="text-xs text-muted-foreground">Pagine processate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score Medio Complessivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{averageOverallScore.toFixed(1)}/100</div>
              <Progress value={averageOverallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagine ad Alta Conversione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {pageData.filter(page => page.analysis.conversionProbability === 'Alta').length}
              </div>
              <p className="text-xs text-muted-foreground">
                ({((pageData.filter(page => page.analysis.conversionProbability === 'Alta').length / pageData.length) * 100).toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Metrica Migliore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Object.keys(averageScores).reduce((a, b) => 
                  averageScores[a as keyof typeof averageScores] > averageScores[b as keyof typeof averageScores] ? a : b
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {averageScores[Object.keys(averageScores).reduce((a, b) => 
                  averageScores[a as keyof typeof averageScores] > averageScores[b as keyof typeof averageScores] ? a : b
                ) as keyof typeof averageScores].toFixed(1)}/10
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Punteggi Medi per Metrica (Marketing 10M)</CardTitle>
              <CardDescription>Performance media di tutte le landing page analizzate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--purple-600))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analisi Radar Marketing 10M</CardTitle>
              <CardDescription>Vista d'insieme delle performance su tutte le metriche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--purple-600))"
                      fill="hsl(var(--purple-600))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Landing Page Results */}
        <Card>
          <CardHeader>
            <CardTitle>Risultati Dettagliati per Landing Page</CardTitle>
            <CardDescription>
              Analisi individuale di ogni landing page processata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pageData.map((page, index) => (
                <div key={page.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{page.url}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{page.businessType}</Badge>
                        <span>Obiettivo: {page.primaryGoal}</span>
                        <span>Target: {page.targetAudience}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {page.analysis.overallScore}/100
                      </div>
                      <Badge 
                        className={
                          page.analysis.overallScore >= 85 ? "bg-green-100 text-green-800" :
                          page.analysis.overallScore >= 70 ? "bg-blue-100 text-blue-800" :
                          page.analysis.overallScore >= 50 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }
                      >
                        {page.analysis.evaluation.split(' - ')[0]}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">M1</div>
                      <div className="text-lg font-bold">{page.analysis.m1MessageClarity}/10</div>
                      <div className="text-xs text-muted-foreground">Messaggio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">M2</div>
                      <div className="text-lg font-bold">{page.analysis.m2VisualImpact}/10</div>
                      <div className="text-xs text-muted-foreground">Visual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">M3</div>
                      <div className="text-lg font-bold">{page.analysis.m3CtaEffectiveness}/10</div>
                      <div className="text-xs text-muted-foreground">CTA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">M4</div>
                      <div className="text-lg font-bold">{page.analysis.m4TrustElements}/10</div>
                      <div className="text-xs text-muted-foreground">Fiducia</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">M5</div>
                      <div className="text-lg font-bold">{page.analysis.m5UserFlow}/10</div>
                      <div className="text-xs text-muted-foreground">UX Flow</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">✅ Punti di Forza</h4>
                      <ul className="text-sm space-y-1">
                        {page.analysis.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">❌ Problemi Critici</h4>
                      <ul className="text-sm space-y-1">
                        {page.analysis.criticalIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">🔧 Raccomandazioni Prioritarie</h4>
                      <ul className="text-sm space-y-1">
                        {page.analysis.priorityRecommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">{idx + 1}.</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <details>
                      <summary className="cursor-pointer font-medium">Analisi Dettagliata Completa</summary>
                      <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {page.analysis.detailedAnalysis}
                      </div>
                    </details>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(page.url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visita Landing Page
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        <TableLandingPageAnalysis landingPages={pageData} />
      </div>
    </div>
  );
}
