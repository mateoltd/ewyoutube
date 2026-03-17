"use client";

import type { VideoInfo } from "@/lib/types";
import { VideoCard } from "./video-card";

interface VideoListProps {
  videos: VideoInfo[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (video: VideoInfo) => void;
  onVideoClick?: (video: VideoInfo) => void;
}

export function VideoList({
  videos,
  selectable,
  selectedIds,
  onToggleSelect,
  onVideoClick,
}: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-text-tertiary">
        No videos found
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {videos.map((video, i) => (
        <VideoCard
          key={video.id}
          video={video}
          selectable={selectable}
          selected={selectedIds?.has(video.id)}
          onSelect={onToggleSelect}
          onClick={onVideoClick}
          style={{ animationDelay: `${0.03 * i}s` }}
        />
      ))}
    </div>
  );
}
