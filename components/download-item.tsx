"use client";

import type { DownloadItem as DownloadItemType } from "@/lib/types";
import { formatFileSize, containerDisplayName } from "@/lib/types";
import { ProgressBar } from "./progress-bar";
import { IconX, IconRefresh, IconTrash } from "@tabler/icons-react";

interface DownloadItemProps {
  item: DownloadItemType;
  onCancel: (id: string) => void;
  onRestart: (id: string) => void;
  onRemove: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  enqueued: "Queued",
  started: "Downloading",
  completed: "Completed",
  failed: "Failed",
  canceled: "Canceled",
};

const STATUS_COLORS: Record<string, string> = {
  enqueued: "text-text-tertiary",
  started: "text-phantom",
  completed: "text-success",
  failed: "text-error",
  canceled: "text-text-tertiary",
};

export function DownloadItemRow({
  item,
  onCancel,
  onRestart,
  onRemove,
}: DownloadItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
          <img
            src={item.video.thumbnailUrl}
            alt={item.video.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[13px] font-medium text-text-secondary">
            {item.video.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-tertiary">
            <span className="rounded bg-white/[0.04] px-1 py-0.5 font-mono font-medium">
              {containerDisplayName(item.option.container)}
            </span>
            {item.option.qualityLabel && (
              <span>{item.option.qualityLabel}</span>
            )}
            {item.option.isAudioOnly && <span>Audio</span>}
            <span>&middot;</span>
            <span>{formatFileSize(item.option.totalSize)}</span>
          </div>
          <div className="mt-0.5">
            <span
              className={`text-[11px] font-medium ${STATUS_COLORS[item.status]}`}
            >
              {STATUS_LABELS[item.status]}
              {item.status === "started" &&
                ` ${Math.round(item.progress * 100)}%`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {(item.status === "enqueued" || item.status === "started") && (
            <button
              onClick={() => onCancel(item.id)}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary"
              title="Cancel"
            >
              <IconX size={14} stroke={2} />
            </button>
          )}
          {(item.status === "failed" || item.status === "canceled") && (
            <button
              onClick={() => onRestart(item.id)}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary"
              title="Restart"
            >
              <IconRefresh size={14} stroke={2} />
            </button>
          )}
          {(item.status === "completed" ||
            item.status === "failed" ||
            item.status === "canceled") && (
            <button
              onClick={() => onRemove(item.id)}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary"
              title="Remove"
            >
              <IconTrash size={14} stroke={2} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(item.status === "started" || item.status === "enqueued") && (
        <ProgressBar progress={item.progress} />
      )}

      {/* Error message */}
      {item.errorMessage && (
        <p className="text-[11px] text-error">{item.errorMessage}</p>
      )}
    </div>
  );
}
