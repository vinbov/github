"use client";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Target,
  Users,
  Calendar
} from 'lucide-react';
import type { LandingPageWithAnalysis } from '@/lib/types';

interface TableLandingPageAnalysisProps {
  landingPages: LandingPageWithAnalysis[];
}

export function TableLandingPageAnalysis({ landingPages }: TableLandingPageAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 6) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    if (score >= 4) return <TrendingDown className="h-4 w-4 text-orange-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getEvaluationBadge = (evaluation: string, score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Ottimo</Badge>;
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Buono</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Mediocre</Badge>;
    return <Badge className="bg-red-100 text-red-800">Scarso</Badge>;
  };

  const getConversionProbabilityBadge = (probability: string) => {
    switch (probability) {
      case 'Alta':
        return <Badge className="bg-green-100 text-green-800">Alta</Badge>;
      case 'Media':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'Bassa':
        return <Badge className="bg-red-100 text-red-800">Bassa</Badge>;
      default:
        return <Badge variant="secondary">{probability}</Badge>;
    }
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (landingPages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nessuna landing page analizzata ancora.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagine Analizzate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landingPages.length}</div>
            <p className="text-xs text-muted-foreground">Landing page processate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Medio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(landingPages.reduce((sum, page) => sum + page.analysis.overallScore, 0) / landingPages.length).toFixed(1)}/100
            </div>
            <p className="text-xs text-muted-foreground">Framework Marketing 10M</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversioni Alta Probabilità</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landingPages.filter(page => page.analysis.conversionProbability === 'Alta').length}
            </div>
            <p className="text-xs text-muted-foreground">Su {landingPages.length} analizzate</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analisi Dettagliata Landing Page</CardTitle>
          <CardDescription>
            Risultati completi dell'analisi marketing con framework 10M
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Landing Page</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Score Totale</TableHead>
                  <TableHead>Conversione</TableHead>
                  <TableHead>Top 3 Metriche</TableHead>
                  <TableHead>Problemi Critici</TableHead>
                  <TableHead>Analizzata</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landingPages.map((page) => {
                  // Calculate top 3 metrics
                  const metrics = [
                    { name: 'M1', score: page.analysis.m1MessageClarity, label: 'Messaggio' },
                    { name: 'M2', score: page.analysis.m2VisualImpact, label: 'Visual' },
                    { name: 'M3', score: page.analysis.m3CtaEffectiveness, label: 'CTA' },
                    { name: 'M4', score: page.analysis.m4TrustElements, label: 'Fiducia' },
                    { name: 'M5', score: page.analysis.m5UserFlow, label: 'UX Flow' },
                    { name: 'M6', score: page.analysis.m6MobileExperience, label: 'Mobile' },
                    { name: 'M7', score: page.analysis.m7SocialProof, label: 'Social' },
                    { name: 'M8', score: page.analysis.m8UrgencyScarcity, label: 'Urgenza' },
                    { name: 'M9', score: page.analysis.m9ContentQuality, label: 'Content' },
                    { name: 'M10', score: page.analysis.m10ConversionOptimization, label: 'Conversioni' }
                  ].sort((a, b) => b.score - a.score).slice(0, 3);

                  return (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {formatUrl(page.url)}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>{page.primaryGoal}</span>
                            <Users className="h-3 w-3 ml-2" />
                            <span>{page.targetAudience}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">{page.businessType}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getScoreIcon(page.analysis.overallScore / 10)}
                            <span className={`font-bold ${getScoreColor(page.analysis.overallScore / 10)}`}>
                              {page.analysis.overallScore}/100
                            </span>
                          </div>
                          <Progress 
                            value={page.analysis.overallScore} 
                            className="w-20 h-2" 
                          />
                          {getEvaluationBadge(page.analysis.evaluation, page.analysis.overallScore)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getConversionProbabilityBadge(page.analysis.conversionProbability)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {metrics.map((metric, index) => (
                            <TooltipProvider key={index}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="font-mono text-xs bg-muted px-1 rounded">
                                      {metric.name}
                                    </span>
                                    <span className={getScoreColor(metric.score)}>
                                      {metric.score}/10
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{metric.label}: {metric.score}/10</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-[200px]">
                          {page.analysis.criticalIssues.length > 0 ? (
                            <ul className="space-y-1">
                              {page.analysis.criticalIssues.slice(0, 2).map((issue, index) => (
                                <li key={index} className="flex items-start space-x-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{issue}</span>
                                </li>
                              ))}
                              {page.analysis.criticalIssues.length > 2 && (
                                <li className="text-xs italic">
                                  +{page.analysis.criticalIssues.length - 2} altri...
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Nessun problema critico
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(page.analyzedAt)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(page.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
