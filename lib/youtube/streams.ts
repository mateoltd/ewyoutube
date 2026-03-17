import { Innertube } from "youtubei.js";
import type { DownloadOption, Container } from "@/lib/types";

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
  yt: Innertube,
  videoId: string
): Promise<DownloadOption[]> {
  const info = await yt.getBasicInfo(videoId);
  const streamingData = info.streaming_data;

  if (!streamingData) {
    throw new Error("No streaming data available for this video");
  }

  const muxedFormats = streamingData.formats ?? [];
  const adaptiveFormats = streamingData.adaptive_formats ?? [];

  const options: DownloadOption[] = [];

  // Split adaptive formats
  const videoStreams = adaptiveFormats.filter(
    (f) => f.has_video && !f.has_audio
  );
  const audioStreams = adaptiveFormats.filter(
    (f) => f.has_audio && !f.has_video
  );

  // 1. Muxed streams (video+audio combined, typically ≤720p)
  for (const fmt of muxedFormats) {
    const container = mimeToContainer(fmt.mime_type);
    if (!container) continue;

    options.push({
      id: `muxed-${fmt.itag}`,
      container,
      isAudioOnly: false,
      qualityLabel: fmt.quality_label ?? null,
      height: fmt.height ?? null,
      needsMuxing: false,
      streams: [
        {
          url: "", // URLs resolved server-side via download endpoint
          container: container,
          mimeType: fmt.mime_type,
          bitrate: fmt.bitrate ?? 0,
          contentLength: fmt.content_length ?? 0,
          isAudioOnly: false,
          qualityLabel: fmt.quality_label,
          width: fmt.width,
          height: fmt.height,
          fps: fmt.fps,
        },
      ],
      totalSize: fmt.content_length ?? 0,
    });
  }

  // 2. Adaptive video + best audio (for higher qualities)
  for (const videoFmt of videoStreams) {
    const container = mimeToContainer(videoFmt.mime_type);
    if (!container || container === "mp3" || container === "ogg") continue;

    const bestAudio = findBestAudio(audioStreams, container);
    if (!bestAudio) continue;

    const totalSize =
      (videoFmt.content_length ?? 0) + (bestAudio.content_length ?? 0);

    options.push({
      id: `adaptive-${videoFmt.itag}-${bestAudio.itag}`,
      container,
      isAudioOnly: false,
      qualityLabel: videoFmt.quality_label ?? null,
      height: videoFmt.height ?? null,
      needsMuxing: true,
      streams: [
        {
          url: "",
          container,
          mimeType: videoFmt.mime_type,
          bitrate: videoFmt.bitrate ?? 0,
          contentLength: videoFmt.content_length ?? 0,
          isAudioOnly: false,
          qualityLabel: videoFmt.quality_label,
          width: videoFmt.width,
          height: videoFmt.height,
          fps: videoFmt.fps,
        },
        {
          url: "",
          container,
          mimeType: bestAudio.mime_type,
          bitrate: bestAudio.bitrate ?? 0,
          contentLength: bestAudio.content_length ?? 0,
          isAudioOnly: true,
        },
      ],
      totalSize,
    });
  }

  // 3. Audio-only options
  const bestWebmAudio = audioStreams
    .filter((f) => f.mime_type.includes("webm"))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];

  const bestMp4Audio = audioStreams
    .filter((f) => f.mime_type.includes("mp4"))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];

  if (bestWebmAudio) {
    const audioStream = {
      url: "",
      container: "webm" as Container,
      mimeType: bestWebmAudio.mime_type,
      bitrate: bestWebmAudio.bitrate ?? 0,
      contentLength: bestWebmAudio.content_length ?? 0,
      isAudioOnly: true,
    };
    options.push({
      id: `audio-webm-${bestWebmAudio.itag}`,
      container: "webm",
      isAudioOnly: true,
      qualityLabel: null,
      height: null,
      needsMuxing: false,
      streams: [audioStream],
      totalSize: audioStream.contentLength,
    });
    options.push({
      id: `audio-mp3-${bestWebmAudio.itag}`,
      container: "mp3",
      isAudioOnly: true,
      qualityLabel: null,
      height: null,
      needsMuxing: true,
      streams: [audioStream],
      totalSize: audioStream.contentLength,
    });
    options.push({
      id: `audio-ogg-${bestWebmAudio.itag}`,
      container: "ogg",
      isAudioOnly: true,
      qualityLabel: null,
      height: null,
      needsMuxing: true,
      streams: [audioStream],
      totalSize: audioStream.contentLength,
    });
  }

  if (bestMp4Audio) {
    const audioStream = {
      url: "",
      container: "mp4" as Container,
      mimeType: bestMp4Audio.mime_type,
      bitrate: bestMp4Audio.bitrate ?? 0,
      contentLength: bestMp4Audio.content_length ?? 0,
      isAudioOnly: true,
    };
    options.push({
      id: `audio-mp4-${bestMp4Audio.itag}`,
      container: "mp4",
      isAudioOnly: true,
      qualityLabel: null,
      height: null,
      needsMuxing: false,
      streams: [audioStream],
      totalSize: audioStream.contentLength,
    });
  }

  return deduplicateOptions(options);
}

function mimeToContainer(mimeType: string): Container | null {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  return null;
}

function findBestAudio(
  audioStreams: { mime_type: string; bitrate: number; content_length?: number; itag: number }[],
  preferredContainer: Container
) {
  const preferredMime = preferredContainer === "mp4" ? "mp4" : "webm";

  const matching = audioStreams
    .filter((f) => f.mime_type.includes(preferredMime))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

  if (matching.length > 0) return matching[0];

  return [...audioStreams].sort(
    (a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0)
  )[0];
}

function deduplicateOptions(options: DownloadOption[]): DownloadOption[] {
  const seen = new Set<string>();
  const result: DownloadOption[] = [];

  for (const opt of options) {
    const key = `${opt.qualityLabel ?? "audio"}-${opt.container}-${opt.isAudioOnly}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(opt);
    }
  }

  return result;
}
