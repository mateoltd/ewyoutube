import type {
  DownloadOption,
  Container,
  VideoQualityPreference,
} from "@/lib/types";
import { isAudioOnlyContainer } from "@/lib/types";

/**
 * Port of VideoDownloadPreference.TryGetBestOption from C#.
 * Selects the best download option based on user preferences.
 */
export function getBestOption(
  options: DownloadOption[],
  preferredContainer: Container,
  preferredQuality: VideoQualityPreference
): DownloadOption | null {
  if (options.length === 0) return null;

  // Audio-only containers: just match the container
  if (isAudioOnlyContainer(preferredContainer)) {
    return (
      options.find(
        (o) => o.container === preferredContainer && o.isAudioOnly
      ) ?? null
    );
  }

  // Video: filter to non-audio-only options
  const videoOptions = options.filter((o) => !o.isAudioOnly);
  const sorted = [...videoOptions].sort(
    (a, b) => (a.height ?? 0) - (b.height ?? 0)
  );

  const maxHeightForPreference: Record<VideoQualityPreference, number | null> =
    {
      highest: null,
      up_to_1080p: 1080,
      up_to_720p: 720,
      up_to_480p: 480,
      up_to_360p: 360,
      lowest: 0,
    };

  const maxHeight = maxHeightForPreference[preferredQuality];

  let preferredOption: DownloadOption | undefined;

  if (preferredQuality === "lowest") {
    preferredOption = sorted.find(
      (o) => o.container === preferredContainer
    );
  } else if (maxHeight === null) {
    // Highest: last matching container
    preferredOption = sorted
      .filter((o) => o.container === preferredContainer)
      .pop();
  } else {
    // UpToXXXp: filter to ≤maxHeight then take last matching container
    preferredOption = sorted
      .filter(
        (o) =>
          (o.height ?? 0) <= maxHeight && o.container === preferredContainer
      )
      .pop();
  }

  // Fallback: first option matching preferred container regardless of quality
  return (
    preferredOption ??
    sorted.find((o) => o.container === preferredContainer) ??
    null
  );
}
