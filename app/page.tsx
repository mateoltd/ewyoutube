import HomePageClient from "@/app/home.client";
import { StructuredData } from "@/components/structured-data";
import { buildMetadata, getBaseUrl, siteConfig } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "YouTube Downloader for Video, Audio, and Playlists",
  description:
    "Download YouTube videos, playlists, and audio in a fast interface with queueing, format choices, and personal-use guidance.",
  path: "/",
  keywords: [
    "download youtube videos online",
    "youtube audio downloader",
    "youtube playlist download tool",
  ],
});

export default function Home() {
  const baseUrl = getBaseUrl().toString();
  const searchTarget = new URL("/results", getBaseUrl()).toString();

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: baseUrl,
          description: siteConfig.description,
          potentialAction: {
            "@type": "SearchAction",
            target: `${searchTarget}?search_query={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: siteConfig.name,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          description: siteConfig.description,
          url: baseUrl,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What can Phantom YouTube resolve?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Phantom YouTube can resolve individual videos, playlists, and search-based YouTube queries so you can review available downloads before saving them.",
              },
            },
            {
              "@type": "Question",
              name: "Which formats are supported?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Available formats depend on the source video, but the app is designed around common video and audio download workflows such as MP4 and audio-oriented options.",
              },
            },
            {
              "@type": "Question",
              name: "Is Phantom YouTube affiliated with YouTube?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "No. Phantom YouTube is an independent tool and is not endorsed by or affiliated with YouTube or Google.",
              },
            },
          ],
        }}
      />
      <HomePageClient />
    </>
  );
}
