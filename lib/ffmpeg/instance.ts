import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Lazy singleton FFmpeg instance.
 * Loads ffmpeg.wasm (~25MB) only when first needed (1080p+ muxing or audio conversion).
 * Uses single-threaded mode to avoid COOP/COEP header requirements.
 */
export async function getFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(Math.max(0, Math.min(1, progress)));
      });
    }

    // Load single-threaded WASM core from CDN
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadPromise;
  } catch (error) {
    loadPromise = null;
    throw error;
  }
}

/**
 * Check if ffmpeg is already loaded (avoid loading indicator for pre-loaded state).
 */
export function isFFmpegLoaded(): boolean {
  return ffmpegInstance?.loaded ?? false;
}
