import { HomePageClient } from "@/components/layout/home-page-client";
import { scrapeAndAnalyze } from "@/app/actions/scrape-actions";

export default function Home() {
  return (
    <main>
      <HomePageClient scrapeAndAnalyze={scrapeAndAnalyze} />
    </main>
  );
}