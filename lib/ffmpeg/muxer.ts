import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./instance";
import type { Container } from "@/lib/types";

/**
 * Mux video + audio streams (or convert audio) using ffmpeg.wasm.
 *
 * Cases:
 * 1. Video + Audio → muxed output (e.g., 1080p MP4)
 * 2. Audio only → format conversion (e.g., WebM → MP3)
 */
export async function muxStreams(
  inputA: Blob,
  inputB: Blob | null,
  outputContainer: Container,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  const inputAName = `input_a.${guessExtension(inputA.type)}`;
  const outputName = `output.${outputContainer}`;

  // Write input files to virtual filesystem
  await ffmpeg.writeFile(inputAName, await fetchFile(inputA));

  let args: string[];

  if (inputB) {
    // Mux video + audio: copy both streams without re-encoding
    const inputBName = `input_b.${guessExtension(inputB.type)}`;
    await ffmpeg.writeFile(inputBName, await fetchFile(inputB));

    args = [
      "-i",
      inputAName,
      "-i",
      inputBName,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputName,
    ];
  } else {
    // Audio conversion
    if (outputContainer === "mp3") {
      args = [
        "-i",
        inputAName,
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "2",
        outputName,
      ];
    } else if (outputContainer === "ogg") {
      args = [
        "-i",
        inputAName,
        "-vn",
        "-codec:a",
        "libvorbis",
        "-q:a",
        "5",
        outputName,
      ];
    } else {
      // Generic copy
      args = ["-i", inputAName, "-c", "copy", outputName];
    }
  }

  await ffmpeg.exec(args);

  // Read output
  const outputData = await ffmpeg.readFile(outputName);

  // Cleanup virtual filesystem
  await ffmpeg.deleteFile(inputAName);
  if (inputB) {
    const inputBName = `input_b.${guessExtension(inputB.type)}`;
    await ffmpeg.deleteFile(inputBName);
  }
  await ffmpeg.deleteFile(outputName);

  const mimeType = containerToMime(outputContainer);
  return new Blob([outputData as BlobPart], { type: mimeType });
}

function guessExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  return "bin";
}

function containerToMime(container: Container): string {
  switch (container) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
  }
}
