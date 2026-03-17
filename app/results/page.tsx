import ResultsPageClient from "@/app/results/page.client";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "YouTube Search Results",
  description:
    "Browse YouTube search results and review available downloads inside Phantom YouTube.",
  path: "/results",
  keywords: ["youtube search downloader", "youtube search results"],
  noIndex: true,
});

export default function ResultsPage() {
  return <ResultsPageClient />;
}
