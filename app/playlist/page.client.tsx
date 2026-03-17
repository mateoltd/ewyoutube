"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconArrowLeft, IconDownload } from "@tabler/icons-react";
import { BatchDownloadDialog } from "@/components/batch-download-dialog";
import { DownloadOptionsDialog } from "@/components/download-options-dialog";
import { DownloadQueue } from "@/components/download-queue";
import { LogoMark } from "@/components/Logo";
import { SiteFooter } from "@/components/site-footer";
import { VideoList } from "@/components/video-list";
import { useDownloadQueue } from "@/hooks/use-download-queue";
import { useSettings } from "@/hooks/use-settings";
import { useResolve } from "@/hooks/use-youtube";
import { getBestOption } from "@/lib/download/preference";
import type {
  Container,
  DownloadOption,
  VideoInfo,
  VideoQualityPreference,
} from "@/lib/types";

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[13px] font-medium text-text-tertiary transition-colors hover:text-text-secondary active:scale-95"
      >
        <IconArrowLeft size={14} stroke={2} />
        Back
      </Link>
      <Link href="/" className="flex items-center gap-2">
        <LogoMark size={18} className="text-text-secondary" />
        <span className="text-[13px] font-semibold tracking-tight text-text-secondary">
          Phantom
        </span>
      </Link>
    </nav>
  );
}

function PlaylistPageContent() {
  const searchParams = useSearchParams();
  const listId = searchParams.get("list");
  const { resolve, loading, error, result } = useResolve();
  const { enqueue, enqueueBatch } = useDownloadQueue();
  const { setLastContainer, setLastQualityPreference } = useSettings();

  const [batchOpen, setBatchOpen] = useState(false);
  const [singleVideo, setSingleVideo] = useState<VideoInfo | null>(null);

  useEffect(() => {
    if (listId) {
      resolve(listId).then((res) => {
        if (res && res.videos.length > 1) {
          setBatchOpen(true);
        }
      });
    }
  }, [listId, resolve]);

  const handleVideoClick = useCallback((video: VideoInfo) => {
    setSingleVideo(video);
  }, []);

  const handleSingleDownload = useCallback(
    (video: VideoInfo, option: DownloadOption) => {
      enqueue(video, option);
      setSingleVideo(null);
    },
    [enqueue]
  );

  const handleBatchDownload = useCallback(
    async (
      videos: VideoInfo[],
      container: Container,
      quality: VideoQualityPreference
    ) => {
      setLastContainer(container);
      setLastQualityPreference(quality);

      const items: { video: VideoInfo; option: DownloadOption }[] = [];
      for (const video of videos) {
        try {
          const res = await fetch("/api/streams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId: video.id }),
          });
          if (!res.ok) continue;
          const data = await res.json();
          const bestOption = getBestOption(data.options, container, quality);
          if (bestOption) items.push({ video, option: bestOption });
        } catch {
          // skip
        }
      }
      if (items.length > 0) enqueueBatch(items);
    },
    [enqueueBatch, setLastContainer, setLastQualityPreference]
  );

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-8">
        {loading && (
          <div className="mx-auto mt-16 w-full max-w-sm animate-fade-in">
            <div className="overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-[3px] w-1/5 rounded-full bg-phantom/50"
                style={{ animation: "progress-slide 1.5s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-3 text-center text-[12px] text-text-tertiary">
              Loading playlist...
            </p>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-10 max-w-md animate-slide-up text-center">
            <p className="text-[15px] font-semibold tracking-tight text-text">
              {error}
            </p>
          </div>
        )}

        {!listId && (
          <p className="mt-16 text-center text-[13px] text-text-tertiary">
            No playlist ID provided. Use /playlist?list=PLAYLIST_ID
          </p>
        )}

        {result && result.videos.length > 0 && !batchOpen && (
          <div
            className="stagger-child px-1 sm:px-0"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-text-tertiary">
                {result.title}
              </span>
              <button
                onClick={() => setBatchOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-phantom px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-phantom-dark active:scale-[0.97]"
              >
                <IconDownload size={12} stroke={2} />
                Download All
              </button>
            </div>
            <VideoList
              videos={result.videos}
              onVideoClick={handleVideoClick}
            />
          </div>
        )}

        <div className="mt-6 px-1 sm:px-0">
          <DownloadQueue />
        </div>

        {singleVideo && (
          <DownloadOptionsDialog
            video={singleVideo}
            open={!!singleVideo}
            onClose={() => setSingleVideo(null)}
            onDownload={handleSingleDownload}
          />
        )}

        {result && result.videos.length > 1 && (
          <BatchDownloadDialog
            title={result.title}
            videos={result.videos}
            preselectAll
            open={batchOpen}
            onClose={() => setBatchOpen(false)}
            onDownload={handleBatchDownload}
          />
        )}

        <SiteFooter className="mt-8 pb-4 text-center" />
      </div>
    </main>
  );
}

export default function PlaylistPageClient() {
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
      <PlaylistPageContent />
    </Suspense>
  );
}
