import { muxStreams } from "@/lib/ffmpeg/muxer";
import type { DownloadOption } from "@/lib/types";

export interface DownloadWorkerCallbacks {
  onProgress: (progress: number) => void;
  onStatusChange: (status: "started" | "completed" | "failed") => void;
  onError: (message: string) => void;
  signal: AbortSignal;
}

/**
 * Orchestrates a single download:
 * - Muxed/single stream: stream directly from server via /api/download
 * - Needs muxing (1080p+ video+audio): download both streams, mux with ffmpeg.wasm
 * - Audio conversion (MP3/OGG): download audio stream, convert with ffmpeg.wasm
 */
export async function executeDownload(
  option: DownloadOption,
  videoId: string,
  fileName: string,
  callbacks: DownloadWorkerCallbacks
): Promise<void> {
  const { onProgress, onStatusChange, onError, signal } = callbacks;

  try {
    onStatusChange("started");

    if (option.needsMuxing && !option.isAudioOnly && option.streams.length >= 2) {
      // Download video + audio separately, mux client-side
      await downloadAndMux(option, videoId, fileName, onProgress, signal);
    } else if (option.needsMuxing && option.isAudioOnly) {
      // Audio format conversion via ffmpeg (e.g., WebM → MP3)
      await downloadAndConvertAudio(option, videoId, fileName, onProgress, signal);
    } else {
      // Single stream, no muxing needed - stream directly from server
      await downloadDirect(option, videoId, fileName, onProgress, signal);
    }

    onStatusChange("completed");
  } catch (error) {
    if (signal.aborted) return;
    const message =
      error instanceof Error ? error.message : "Download failed";
    onError(message);
    onStatusChange("failed");
  }
}

/**
 * Fetch a stream from the server-side download endpoint with progress tracking.
 */
async function fetchStream(
  videoId: string,
  params: Record<string, string>,
  onProgress: (downloaded: number, total: number) => void,
  signal: AbortSignal
): Promise<Blob> {
  const url = new URL("/api/download", window.location.origin);
  url.searchParams.set("videoId", videoId);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Download failed: ${text || response.statusText}`);
  }

  const contentLength = parseInt(
    response.headers.get("content-length") ?? "0",
    10
  );
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";

  if (!response.body) {
    const blob = await response.blob();
    onProgress(blob.size, blob.size);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let downloaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    downloaded += value.byteLength;
    onProgress(downloaded, contentLength);
  }

  return new Blob(chunks as BlobPart[], { type: contentType });
}

async function downloadDirect(
  option: DownloadOption,
  videoId: string,
  fileName: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<void> {
  const stream = option.streams[0];
  // Extract itag from the option id
  const itagMatch = option.id.match(/(\d+)/);
  const itag = itagMatch ? itagMatch[1] : undefined;

  const params: Record<string, string> = {
    type: option.isAudioOnly ? "audio" : "video+audio",
    quality: stream.qualityLabel ?? "best",
    format: option.container,
  };
  if (itag) params.itag = itag;

  const blob = await fetchStream(
    videoId,
    params,
    (downloaded, total) => {
      onProgress(total > 0 ? downloaded / total : 0);
    },
    signal
  );

  triggerDownload(blob, fileName);
  onProgress(1);
}

async function downloadAndMux(
  option: DownloadOption,
  videoId: string,
  fileName: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<void> {
  const videoStream = option.streams.find((s) => !s.isAudioOnly);
  const audioStream = option.streams.find((s) => s.isAudioOnly);

  if (!videoStream || !audioStream) {
    throw new Error("Missing video or audio stream for muxing");
  }

  // Extract itags from option ID (e.g., "adaptive-137-140")
  const itags = option.id.match(/\d+/g) ?? [];
  const videoItag = itags[0];
  const audioItag = itags[1];

  const totalSize =
    (videoStream.contentLength || 1) + (audioStream.contentLength || 1);
  let videoDownloaded = 0;

  // Download video stream (progress: 0-30%)
  const videoBlob = await fetchStream(
    videoId,
    {
      type: "video",
      quality: videoStream.qualityLabel ?? "best",
      format: option.container,
      ...(videoItag ? { itag: videoItag } : {}),
    },
    (downloaded) => {
      videoDownloaded = downloaded;
      onProgress((downloaded / totalSize) * 0.3);
    },
    signal
  );

  // Download audio stream (progress: 30-60%)
  const audioBlob = await fetchStream(
    videoId,
    {
      type: "audio",
      quality: "best",
      format: option.container === "mp4" ? "mp4" : "webm",
      ...(audioItag ? { itag: audioItag } : {}),
    },
    (downloaded) => {
      onProgress(
        ((videoDownloaded + downloaded) / totalSize) * 0.3 + 0.3
      );
    },
    signal
  );

  // Mux with ffmpeg.wasm (progress: 60-100%)
  onProgress(0.6);
  const outputBlob = await muxStreams(
    videoBlob,
    audioBlob,
    option.container,
    (muxProgress) => onProgress(0.6 + muxProgress * 0.4)
  );

  triggerDownload(outputBlob, fileName);
  onProgress(1);
}

async function downloadAndConvertAudio(
  option: DownloadOption,
  videoId: string,
  fileName: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<void> {
  // Download the source audio
  const blob = await fetchStream(
    videoId,
    {
      type: "audio",
      quality: "best",
      format: "any",
    },
    (downloaded, total) => {
      onProgress(total > 0 ? (downloaded / total) * 0.6 : 0);
    },
    signal
  );

  // Convert with ffmpeg.wasm
  onProgress(0.6);
  const outputBlob = await muxStreams(
    blob,
    null,
    option.container,
    (convertProgress) => onProgress(0.6 + convertProgress * 0.4)
  );

  triggerDownload(outputBlob, fileName);
  onProgress(1);
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
