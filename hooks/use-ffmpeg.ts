"use client";

import { useState, useCallback } from "react";
import { getFFmpeg, isFFmpegLoaded } from "@/lib/ffmpeg/instance";

export function useFFmpeg() {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(isFFmpegLoaded());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);

    try {
      await getFFmpeg();
      setLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load FFmpeg"
      );
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  return { loading, loaded, error, load };
}
