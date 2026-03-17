"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { VideoList } from "@/components/video-list";
import { DownloadOptionsDialog } from "@/components/download-options-dialog";
import { BatchDownloadDialog } from "@/components/batch-download-dialog";
import { DownloadQueue } from "@/components/download-queue";
import { SettingsPanel } from "@/components/settings-panel";
import { LogoMark } from "@/components/Logo";
import { useResolve } from "@/hooks/use-youtube";
import { useDownloadQueue } from "@/hooks/use-download-queue";
import { useSettings } from "@/hooks/use-settings";
import { getBestOption } from "@/lib/download/preference";
import { IconSettings, IconDownload } from "@tabler/icons-react";
import type {
  VideoInfo,
  DownloadOption,
  Container,
  VideoQualityPreference,
} from "@/lib/types";

function Navbar({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <nav className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <a href="/" className="flex items-center gap-2">
        <LogoMark size={18} className="text-text-secondary" />
        <span className="text-[13px] font-semibold tracking-tight text-text-secondary">
          Phantom
        </span>
      </a>
      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary active:scale-95"
          title="Settings"
        >
          <IconSettings size={16} stroke={2} />
        </button>
        <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium tracking-wider text-text-tertiary/80">
          v1.0
        </span>
      </div>
    </nav>
  );
}

export default function Home() {
  const { resolve, loading, error, result } = useResolve();
  const { enqueue, enqueueBatch, downloads } = useDownloadQueue();
  const { setLastContainer, setLastQualityPreference } = useSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [singleDialogVideo, setSingleDialogVideo] = useState<VideoInfo | null>(
    null
  );
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const handleSubmit = useCallback(
    async (query: string) => {
      const res = await resolve(query);
      if (!res) return;

      if (res.videos.length === 1 && res.kind === "video") {
        setSingleDialogVideo(res.videos[0]);
      } else if (
        res.videos.length > 1 &&
        res.kind !== "search" &&
        res.kind !== "aggregate"
      ) {
        setBatchDialogOpen(true);
      }
    },
    [resolve]
  );

  const handleVideoClick = useCallback((video: VideoInfo) => {
    setSingleDialogVideo(video);
  }, []);

  const handleSingleDownload = useCallback(
    (video: VideoInfo, option: DownloadOption) => {
      enqueue(video, option);
      setSingleDialogVideo(null);
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
          if (bestOption) {
            items.push({ video, option: bestOption });
          }
        } catch {
          // Skip videos that fail
        }
      }

      if (items.length > 0) {
        enqueueBatch(items);
      }
    },
    [enqueueBatch, setLastContainer, setLastQualityPreference]
  );

  const hasContent = result || downloads.length > 0;
  const isHero = !hasContent && !loading;

  return (
    <main className="relative min-h-screen">
      {isHero && (
        <div className="flex min-h-screen flex-col animate-fade-in">
          <Navbar onSettingsClick={() => setSettingsOpen(true)} />

          <div className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 lg:px-8">
            <h1 className="sr-only">Phantom YouTube - Download YouTube Videos</h1>
            <SearchBar
              onSubmit={handleSubmit}
              loading={loading}
              compact={false}
            />
          </div>

          <footer className="px-5 pb-4 text-center sm:px-8">
            <p className="text-[11px] text-text-tertiary/70">
              For personal use only.
            </p>
          </footer>
        </div>
      )}

      {!isHero && (
        <div className="min-h-screen animate-fade-in">
          <Navbar onSettingsClick={() => setSettingsOpen(true)} />

          <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-8">
            <div className="mb-5 px-1 sm:px-0 animate-slide-up">
              <SearchBar
                onSubmit={handleSubmit}
                loading={loading}
                compact={true}
              />
            </div>

            {/* Loading */}
            {loading && !result && (
              <div className="mx-auto mt-10 w-full max-w-sm animate-fade-in">
                <div className="overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-[3px] w-1/5 rounded-full bg-phantom/50"
                    style={{ animation: "progress-slide 1.5s ease-in-out infinite" }}
                  />
                </div>
                <p className="mt-3 text-center text-[12px] text-text-tertiary">
                  Resolving...
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-auto mt-10 max-w-md animate-slide-up text-center">
                <p className="text-[15px] font-semibold tracking-tight text-text">
                  {error}
                </p>
              </div>
            )}

            {/* Search results / video list */}
            {result && result.videos.length >= 1 && !batchDialogOpen && (
              <div
                className="stagger-child px-1 sm:px-0"
                style={{ animationDelay: "0.05s" }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-[11px] font-medium text-text-tertiary">
                    {result.title}
                  </span>
                  <button
                    onClick={() => setBatchDialogOpen(true)}
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

            {/* Download queue */}
            {downloads.length > 0 && (
              <div
                className="mt-6 px-1 sm:px-0 stagger-child"
                style={{ animationDelay: "0.1s" }}
              >
                <DownloadQueue />
              </div>
            )}

            <footer className="mt-8 pb-4 text-center">
              <p className="text-[11px] text-text-tertiary/70">
                For personal use only.
              </p>
            </footer>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {singleDialogVideo && (
        <DownloadOptionsDialog
          video={singleDialogVideo}
          open={!!singleDialogVideo}
          onClose={() => setSingleDialogVideo(null)}
          onDownload={handleSingleDownload}
        />
      )}

      {result && result.videos.length > 1 && (
        <BatchDownloadDialog
          title={result.title}
          videos={result.videos}
          preselectAll={result.kind !== "search" && result.kind !== "aggregate"}
          open={batchDialogOpen}
          onClose={() => setBatchDialogOpen(false)}
          onDownload={handleBatchDownload}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
