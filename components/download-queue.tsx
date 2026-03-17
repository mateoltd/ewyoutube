"use client";

import { useDownloadQueue } from "@/hooks/use-download-queue";
import { DownloadItemRow } from "./download-item";

export function DownloadQueue() {
  const {
    downloads,
    cancelDownload,
    cancelAllDownloads,
    removeDownload,
    removeCompletedDownloads,
    removeInactiveDownloads,
    restartDownload,
    restartFailedDownloads,
  } = useDownloadQueue();

  if (downloads.length === 0) return null;

  const hasActive = downloads.some(
    (d) => d.status === "enqueued" || d.status === "started"
  );
  const hasCompleted = downloads.some((d) => d.status === "completed");
  const hasFailed = downloads.some((d) => d.status === "failed");
  const hasInactive = downloads.some(
    (d) =>
      d.status === "completed" ||
      d.status === "failed" ||
      d.status === "canceled"
  );

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-text-tertiary">
          Downloads ({downloads.length})
        </span>
        <div className="flex gap-1">
          {hasFailed && (
            <button
              onClick={restartFailedDownloads}
              className="rounded-md px-2 py-1 text-[11px] text-text-tertiary transition-colors hover:bg-white/[0.03] hover:text-text-secondary"
            >
              Restart failed
            </button>
          )}
          {hasCompleted && (
            <button
              onClick={removeCompletedDownloads}
              className="rounded-md px-2 py-1 text-[11px] text-text-tertiary transition-colors hover:bg-white/[0.03] hover:text-text-secondary"
            >
              Clear done
            </button>
          )}
          {hasInactive && (
            <button
              onClick={removeInactiveDownloads}
              className="rounded-md px-2 py-1 text-[11px] text-text-tertiary transition-colors hover:bg-white/[0.03] hover:text-text-secondary"
            >
              Clear all
            </button>
          )}
          {hasActive && (
            <button
              onClick={cancelAllDownloads}
              className="rounded-md px-2 py-1 text-[11px] text-error/80 transition-colors hover:bg-error/5 hover:text-error"
            >
              Cancel all
            </button>
          )}
        </div>
      </div>

      {/* Download list */}
      <div className="space-y-1.5">
        {downloads.map((item) => (
          <DownloadItemRow
            key={item.id}
            item={item}
            onCancel={cancelDownload}
            onRestart={restartDownload}
            onRemove={removeDownload}
          />
        ))}
      </div>
    </div>
  );
}
