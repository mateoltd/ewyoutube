"use client";

import type { VideoInfo } from "@/lib/types";
import { formatDuration } from "@/lib/types";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

interface VideoCardProps {
  video: VideoInfo;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (video: VideoInfo) => void;
  onClick?: (video: VideoInfo) => void;
  style?: React.CSSProperties;
}

export function VideoCard({
  video,
  selected,
  selectable,
  onSelect,
  onClick,
  style,
}: VideoCardProps) {
  return (
    <button
      type="button"
      className={`stagger-child group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors active:bg-white/[0.05] ${
        selected
          ? "bg-phantom/15"
          : "hover:bg-white/[0.03]"
      }`}
      style={style}
      onClick={() => {
        if (selectable) onSelect?.(video);
        else onClick?.(video);
      }}
    >
      {selectable && (
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            selected
              ? "border-phantom bg-phantom text-white"
              : "border-white/[0.08] bg-white/[0.02]"
          }`}
        >
          {selected && <IconCheck size={12} stroke={3} />}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-surface">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {video.duration > 0 && (
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-0.5 font-mono text-[10px] font-medium text-white/90">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[13px] font-medium text-text-secondary">
          {video.title}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <span>{video.author}</span>
          {video.viewCount !== undefined && (
            <>
              <span>&middot;</span>
              <span>{video.viewCount.toLocaleString()} views</span>
            </>
          )}
        </div>
      </div>

      {!selectable && (
        <IconArrowRight
          size={12}
          stroke={2.5}
          className="shrink-0 text-text-tertiary/60 transition-colors group-hover:text-text-secondary"
        />
      )}
    </button>
  );
}
