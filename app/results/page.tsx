"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { SearchBar } from "@/components/search-bar";
import { VideoList } from "@/components/video-list";
import { DownloadOptionsDialog } from "@/components/download-options-dialog";
import { DownloadQueue } from "@/components/download-queue";
import { LogoMark } from "@/components/Logo";
import { useSearch } from "@/hooks/use-youtube";
import { useDownloadQueue } from "@/hooks/use-download-queue";
import { IconArrowLeft } from "@tabler/icons-react";
import type { VideoInfo, DownloadOption } from "@/lib/types";

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <a
        href="/"
        className="flex items-center gap-1.5 text-[13px] font-medium text-text-tertiary transition-colors hover:text-text-secondary active:scale-95"
      >
        <IconArrowLeft size={14} stroke={2} />
        Back
      </a>
      <a href="/" className="flex items-center gap-2">
        <LogoMark size={18} className="text-text-secondary" />
        <span className="text-[13px] font-semibold tracking-tight text-text-secondary">
          Phantom
        </span>
      </a>
    </nav>
  );
}

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search_query");
  const { search, loading, error, result } = useSearch();
  const { enqueue } = useDownloadQueue();

  const [singleVideo, setSingleVideo] = useState<VideoInfo | null>(null);

  useEffect(() => {
    if (searchQuery) {
      search(searchQuery);
    }
  }, [searchQuery, search]);

  const handleSearch = useCallback(
    (query: string) => {
      search(query);
      window.history.replaceState(
        null,
        "",
        `/results?search_query=${encodeURIComponent(query)}`
      );
    },
    [search]
  );

  const handleVideoClick = useCallback((video: VideoInfo) => {
    setSingleVideo(video);
  }, []);

  const handleDownload = useCallback(
    (video: VideoInfo, option: DownloadOption) => {
      enqueue(video, option);
      setSingleVideo(null);
    },
    [enqueue]
  );

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-8">
        <div className="mb-5 px-1 sm:px-0 animate-slide-up">
          <SearchBar
            onSubmit={handleSearch}
            loading={loading}
            placeholder="Search YouTube..."
            compact={true}
          />
        </div>

        {error && (
          <div className="mx-auto mt-10 max-w-md animate-slide-up text-center">
            <p className="text-[15px] font-semibold tracking-tight text-text">
              {error}
            </p>
          </div>
        )}

        {result && result.videos.length > 0 && (
          <div className="px-1 sm:px-0 stagger-child" style={{ animationDelay: "0.05s" }}>
            <div className="mb-3 px-1">
              <span className="text-[11px] font-medium text-text-tertiary">
                {result.title}
              </span>
            </div>
            <VideoList
              videos={result.videos}
              onVideoClick={handleVideoClick}
            />
          </div>
        )}

        {result && result.videos.length === 0 && !loading && (
          <p className="mt-16 text-center text-[13px] text-text-tertiary">
            No results found
          </p>
        )}

        <div className="mt-6 px-1 sm:px-0">
          <DownloadQueue />
        </div>

        {singleVideo && (
          <DownloadOptionsDialog
            video={singleVideo}
            open={!!singleVideo}
            onClose={() => setSingleVideo(null)}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-[3px] w-16 rounded-full bg-phantom/50"
              style={{ animation: "progress-slide 1.5s ease-in-out infinite" }}
            />
          </div>
        </main>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
