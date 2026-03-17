"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { DownloadOptionsDialog } from "@/components/download-options-dialog";
import { DownloadQueue } from "@/components/download-queue";
import { LogoMark } from "@/components/Logo";
import { useResolve } from "@/hooks/use-youtube";
import { useDownloadQueue } from "@/hooks/use-download-queue";
import { IconArrowLeft, IconDownload, IconAlertTriangle } from "@tabler/icons-react";
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

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");
  const { resolve, loading, error, result } = useResolve();
  const { enqueue } = useDownloadQueue();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (videoId) {
      resolve(videoId).then((res) => {
        if (res && res.videos.length === 1) {
          setDialogOpen(true);
        }
      });
    }
  }, [videoId, resolve]);

  const video = result?.videos[0] ?? null;

  const handleDownload = (v: VideoInfo, option: DownloadOption) => {
    enqueue(v, option);
    setDialogOpen(false);
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="mx-auto mt-16 w-full max-w-sm animate-fade-in">
            <div className="overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-[3px] w-1/5 rounded-full bg-phantom/50"
                style={{ animation: "progress-slide 1.5s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-3 text-center text-[12px] text-text-tertiary">
              Loading video info...
            </p>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-16 max-w-md animate-slide-up text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error">
              <IconAlertTriangle size={20} stroke={1.8} />
            </div>
            <p className="text-[15px] font-semibold tracking-tight text-text">
              {error}
            </p>
            <a
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-phantom px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-phantom-dark active:scale-[0.97]"
            >
              Try again
            </a>
          </div>
        )}

        {!videoId && (
          <p className="mt-16 text-center text-[13px] text-text-tertiary">
            No video ID provided. Use /watch?v=VIDEO_ID
          </p>
        )}

        {video && !dialogOpen && (
          <div className="mt-6 flex items-center gap-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 sm:p-4 animate-slide-up">
            <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md bg-surface sm:h-20 sm:w-36">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[13px] font-semibold tracking-tight text-text sm:text-[14px]">
                {video.title}
              </h2>
              <p className="mt-1 text-[11px] text-text-tertiary sm:text-[12px]">
                {video.author}
              </p>
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-phantom px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-phantom-dark active:scale-[0.97] sm:flex"
            >
              <IconDownload size={14} stroke={2} />
              Download
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-phantom text-white transition-all hover:bg-phantom-dark active:scale-95 sm:hidden"
            >
              <IconDownload size={16} stroke={2} />
            </button>
          </div>
        )}

        <div className="mt-6">
          <DownloadQueue />
        </div>

        {video && (
          <DownloadOptionsDialog
            video={video}
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}

export default function WatchPage() {
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
      <WatchPageContent />
    </Suspense>
  );
}
