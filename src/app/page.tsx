import HomePageClient from '@/components/layout/home-page-client';
import { scrapeAndAnalyze } from '@/app/actions/scrape-actions';

export default function Page() {
  // Questo è ora un Server Component.
  // Può importare e passare in sicurezza le Server Actions.
  return <HomePageClient scrapeAndAnalyze={scrapeAndAnalyze} />;
}