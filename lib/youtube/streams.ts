import type { DownloadOption } from "@/lib/types";
import { resolveDownloadOptionsWithYtDlp } from "@/lib/youtube/ytdlp";

/**
 * Port of VideoDownloadOption.ResolveAll from C#.
 * Resolves all available download options from a video's streaming data.
 *
 * YouTube now uses Server ABR (SABR/UMP) for most formats, so individual
 * format URLs are no longer available. Instead, we report available formats
 * from the streaming metadata, and actual downloads are handled server-side
 * via the library's download() method.
 */
export async function resolveDownloadOptions(
  videoId: string
): Promise<DownloadOption[]> {
  return resolveDownloadOptionsWithYtDlp(videoId);
}
