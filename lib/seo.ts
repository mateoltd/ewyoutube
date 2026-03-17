import type { Metadata } from "next";

export const siteConfig = {
  name: "Phantom YouTube",
  shortName: "Phantom",
  description:
    "Download YouTube videos, audio, and playlists in a fast interface built for personal and authorized use.",
  creator: "mateoltd",
  publisher: "Phantom Research",
  keywords: [
    "youtube downloader",
    "download youtube videos",
    "youtube mp4 downloader",
    "youtube mp3 downloader",
    "youtube playlist downloader",
    "video downloader",
    "audio downloader",
    "phantom youtube",
  ],
};

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL);
  }

  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }

  return new URL("http://localhost:3000");
}

type RouteMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false,
}: RouteMetadataOptions): Metadata {
  const url = new URL(path, getBaseUrl()).toString();

  return {
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      creator: "@mateoltd",
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
