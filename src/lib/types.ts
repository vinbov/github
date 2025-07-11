import type { DataForSEOKeywordMetrics } from './dataforseo/types';

// Tool 1: Keyword Comparator
export interface CsvRowTool1 {
  keyword: string;
  posizione: number | null;
  url: string;
  volume: number | null;
  difficolta: number | null;
  opportunity: number | null;
  intento: string;
  varTraffico?: string;
  trafficoStimato?: string;
  cpcMedio?: string;
}

export interface CompetitorEntry {
  name: string;
  pos: number | string | null; 
  url: string;
}

export interface ComparisonResult {
  keyword: string;
  mySiteInfo: { pos: number | string | null; url: string };
  competitorInfo: CompetitorEntry[];
  volume: number | string | null;
  difficolta: number | string | null;
  opportunity: number | string | null;
  intento: string;
  status: 'common' | 'mySiteOnly' | 'competitorOnly';
}

// Tool 2: Keyword Pertinence & Priority Analyzer
export interface CsvRowTool2 {
  keyword: string;
  volume: number | string; 
  difficolta: number | string; 
  opportunity: number | string; 
  posizione: number | string; 
  url: string;
  intento: string;
}

export interface PertinenceAnalysisResult {
  keyword: string;
  settore: string;
  pertinenza: string;
  prioritaSEO: string;
  motivazioneSEO: string;
  volume?: number | string;
  kd?: number | string;
  opportunity?: number | string;
  posizione?: number | string;
  url?: string;
  intento?: string;
  // DataForSEO specific metrics
  dfs_volume?: number | null;
  dfs_cpc?: number | null;
  dfs_keyword_difficulty?: number | null;
  dfs_error?: string | null;
}

// Tool "Analisi Domanda Consapevole" (DataForSEO Keyword Ideas)
// This tool will directly use DataForSEOKeywordMetrics[] for its results state.

// Tool 3: Facebook Ads Library Scraper
export interface ApifyRawAdItem {
  snapshot?: {
    cards?: Array<{
      body?: string;
      title?: string;
      link_url?: string;
      resized_image_url?: string;
      original_image_url?: string;
    }>;
    body?: { text?: string };
    title?: string;
    page_name?: string;
    link_url?: string;
    page_profile_uri?: string;
    videos?: Array<{ video_preview_image_url?: string }>;
    images?: Array<{ url?: string }>;
    page_profile_picture_url?: string;
    // Instagram-specific fields
    platforms?: string[];
    instagram_actor_name?: string;
    instagram_text?: string;
    story_text?: string;
    text?: string;
    caption?: string;
    description?: string;
    creative_body?: string;
    ad_creative_body?: string;
    post_text?: string;
    content?: string;
    actor_name?: string;
    story?: {
      text?: string;
      body?: string;
    };
    creative?: {
      body?: string;
      text?: string;
      caption?: string;
    };
    media?: Array<{
      caption?: string;
      text?: string;
      image_url?: string;
      video_preview_image_url?: string;
    }>;
  };
  url?: string; 
  text?: string;
  body?: string;
  description?: string;
  caption?: string;
  [key: string]: unknown;
}

export interface ScrapedAd {
  id: string; 
  testo: string;
  titolo: string;
  link: string;
  immagine: string;
}

export interface AngleAnalysisScores {
  C1: number; 
  C2: number; 
  C3: number; 
  C4: number; 
  C5: number; 
  C6: number; 
  C7: number; 
}

export interface AngleAnalysis {
  c1Clarity: number;
  c2Engagement: number;
  c3Concreteness: number;
  c4Coherence: number;
  c5Credibility: number;
  c6CallToAction: number;
  c7Context: number;
  scores: AngleAnalysisScores; // Kept for potential direct use if AI returns this nested
  totalScore: number;
  evaluation: string;
  detailedAnalysis: string;
  error?: string; 
  raw?: string; 
}

export interface AdWithAngleAnalysis extends ScrapedAd {
  angleAnalysis?: AngleAnalysis;
  analysisError?: string;
}

// Tool 4: GSC Analyzer
export type GscReportType = 'queries' | 'pages' | 'countries' | 'devices' | 'searchAppearance' | 'filters';

export interface GscSheetRow {
  item?: string; 
  clicks_current?: number;
  clicks_previous?: number;
  impressions_current?: number;
  impressions_previous?: number;
  ctr_current?: number;
  ctr_previous?: number;
  position_current?: number | null;
  position_previous?: number | null;
  filterName?: string;
  filterValue?: string;
  [key: string]: unknown;
}

export interface GscAnalyzedItem {
  item: string;
  clicks_current: number;
  clicks_previous: number;
  diff_clicks: number;
  perc_change_clicks: number; 
  impressions_current: number;
  impressions_previous: number;
  diff_impressions: number;
  perc_change_impressions: number; 
  ctr_current: number;
  ctr_previous: number;
  diff_ctr: number; 
  position_current: number | null;
  position_previous: number | null;
  diff_position: number | null; 
}

export interface GscSectionAnalysis {
  summaryText: string;
  detailedDataWithDiffs: GscAnalyzedItem[];
  topItemsByClicksChartData: { 
    labels: string[]; 
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: string; 
    }>;
  };
  pieChartData?: Array<{ name: string; value: number; fill: string }>;
}


export interface GscParsedData {
  queries?: GscSheetRow[];
  pages?: GscSheetRow[];
  countries?: GscSheetRow[];
  devices?: GscSheetRow[];
  searchAppearance?: GscSheetRow[];
  filters?: GscSheetRow[];
}

export interface GscAnalyzedData {
  queries?: GscSectionAnalysis;
  pages?: GscSectionAnalysis;
  countries?: GscSectionAnalysis;
  devices?: GscSectionAnalysis;
  searchAppearance?: GscSectionAnalysis;
}

// For Master Report Tool 5
export interface Tool2MasterReportData {
  analysisResults: PertinenceAnalysisResult[];
  industryContext: string;
}

export interface ToolDataForSeoMasterReportData {
  seedKeywords: string;
  locationContext: string;
  results: DataForSEOKeywordMetrics[]; // Top N results for the report
  totalIdeasFound: number;
}


// For detail pages
export type DetailPageSection = 
  | 'distribution' 
  | 'commonTop10' 
  | 'topOpportunities' 
  | 'commonKeywordsSectionTool1' 
  | 'mySiteOnlyKeywordsSectionTool1' 
  | 'competitorOnlyKeywordsSectionTool1'
  | 'angleAnalysisDetail'
  | GscReportType; 


export type ChartConfig = unknown; 

export interface DetailPageDataTool1 {
  pageTitle: string;
  description: string;
  chartComponent?: React.ReactNode; 
  tableData?: ComparisonResult[];
  tableHeaders?: string[];
  tableType?: 'common' | 'mySiteOnly' | 'competitorOnly';
  activeCompetitorNames?: string[];
  additionalContent?: string; 
}

export interface DetailPageDataTool3 {
  pageTitle: string;
  descriptionHTML: string; 
  chartConfig?: ChartConfig; 
  tableData: AdWithAngleAnalysis[];
}

export interface DetailPageDataTool4 {
  pageTitle: string;
  description: string;
  analyzedData: GscSectionAnalysis | null;
  itemDisplayName: string; 
  reportType: GscReportType;
  chartType?: 'bar' | 'pie';
}


// CSV Column mapping
export const EXPECTED_COLUMNS_TOOL1: Record<keyof CsvRowTool1, string> = { 
  keyword: 'Keyword', posizione: 'Pos', url: 'URL', volume: 'Volume',
  difficolta: 'Keyword Difficulty', opportunity: 'Keyword Opportunity', intento: 'Intent',
  varTraffico: 'var. traffico', trafficoStimato: 'traffico stimato', cpcMedio: 'cpc medio'
};

export const COLUMN_ALIASES_TOOL1: Record<keyof Partial<CsvRowTool1>, string[]> = { 
  difficolta: ['keyword difficulty', 'key diff', 'kd'], 
  opportunity: ['keyword opportunity', 'opportunity score'], 
  posizione: ['pos', 'position']
};

export const EXPECTED_COLUMNS_TOOL2: Record<keyof CsvRowTool2, string> = { 
  keyword: 'Keyword', posizione: 'Pos', url: 'URL', volume: 'Volume',
  difficolta: 'Keyword Difficulty', opportunity: 'Keyword Opportunity', intento: 'Intent'
};
export const COLUMN_ALIASES_TOOL2 = COLUMN_ALIASES_TOOL1;

// Tool 4: Landing Page Marketing Analyzer
export interface LandingPageScrapedData {
  title: string;
  headline: string;
  subheadline?: string;
  metaDescription?: string;
  ctaButtons: Array<{
    text: string;
    href?: string;
    position: string;
  }>;
  forms: Array<{
    fields: number;
    requiredFields: number;
    position: string;
  }>;
  images: Array<{
    src: string;
    alt?: string;
    isHero?: boolean;
  }>;
  videos: Array<{
    src: string;
    position: string;
  }>;
  testimonials: Array<{
    text: string;
    author?: string;
    position?: string;
  }>;
  socialProof: {
    clientLogos: string[];
    reviewCount?: number;
    ratings?: number;
    certifications: string[];
  };
  trustElements: {
    securityBadges: string[];
    guarantees: string[];
    contactInfo: boolean;
    privacyPolicy: boolean;
  };
  technicalData: {
    loadTime?: number;
    mobileResponsive: boolean;
    hasSSL: boolean;
    metaTagsOptimized: boolean;
  };
  contentSections: Array<{
    type: string;
    content: string;
    position: number;
  }>;
}

export interface LandingPageAnalysis {
  // 10M Framework Scores (0-10 each)
  m1MessageClarity: number;
  m2VisualImpact: number;
  m3CtaEffectiveness: number;
  m4TrustElements: number;
  m5UserFlow: number;
  m6MobileExperience: number;
  m7SocialProof: number;
  m8UrgencyScarcity: number;
  m9ContentQuality: number;
  m10ConversionOptimization: number;
  
  // Overall metrics
  overallScore: number; // 0-100 (sum of all M scores)
  evaluation: string; // Ottimo/Buono/Mediocre/Scarso
  
  // Actionable insights
  strengths: string[];
  criticalIssues: string[];
  priorityRecommendations: string[];
  
  // Detailed analysis with motivations
  detailedAnalysis: string;
  
  // Performance indicators
  conversionProbability: 'Alta' | 'Media' | 'Bassa';
  
  // Error handling
  error?: string;
}

export interface LandingPageWithAnalysis {
  id: string;
  url: string;
  businessType: string;
  primaryGoal: string;
  targetAudience: string;
  scrapedData: LandingPageScrapedData;
  analysis: LandingPageAnalysis;
  analyzedAt: string;
}
