"use client";

import { useDownloadStore } from "@/stores/download-store";

export function useSettings() {
  const parallelLimit = useDownloadStore((s) => s.parallelLimit);
  const lastContainer = useDownloadStore((s) => s.lastContainer);
  const lastQualityPreference = useDownloadStore((s) => s.lastQualityPreference);
  const setParallelLimit = useDownloadStore((s) => s.setParallelLimit);
  const setLastContainer = useDownloadStore((s) => s.setLastContainer);
  const setLastQualityPreference = useDownloadStore((s) => s.setLastQualityPreference);

  return {
    parallelLimit,
    lastContainer,
    lastQualityPreference,
    setParallelLimit,
    setLastContainer,
    setLastQualityPreference,
  };
}
