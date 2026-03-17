import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Phantom YouTube — Download YouTube Videos Without Limits",
    template: "%s | Phantom YouTube",
  },
  description:
    "Download any YouTube video in any quality and format. A modern, fast, and clean web downloader for YouTube with batch support.",
  keywords: [
    "youtube downloader",
    "download youtube videos",
    "phantom youtube",
    "youtube mp4",
    "youtube mp3",
    "youtube playlist downloader",
    "youtube video downloader",
  ],
  authors: [{ name: "mateoltd", url: "https://github.com/mateoltd" }],
  creator: "mateoltd",
  publisher: "Phantom Research",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Phantom YouTube — Download YouTube Videos Without Limits",
    description:
      "Download any YouTube video in any quality and format. Modern web downloader with batch support.",
    url: "/",
    siteName: "Phantom YouTube",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phantom YouTube — Download YouTube Videos Without Limits",
    description:
      "Download any YouTube video in any quality and format. Modern web downloader with batch support.",
    creator: "@mateoltd",
  },
  robots: {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
