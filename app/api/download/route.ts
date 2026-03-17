import { NextRequest } from "next/server";
import { spawn } from "child_process";

export const maxDuration = 300; // 5 minutes for long videos

/**
 * Server-side download streaming endpoint.
 * Uses yt-dlp to extract direct URLs for any quality/format,
 * then proxies the stream to the client.
 *
 * Query params:
 *   videoId: YouTube video ID
 *   itag: specific itag (optional)
 *   type: 'video+audio' | 'video' | 'audio'
 *   quality: '360p' | '720p' | '1080p' | 'best' etc
 *   container: 'mp4' | 'webm'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get("videoId");
  const itag = searchParams.get("itag");
  const type = searchParams.get("type") ?? "video+audio";
  const quality = searchParams.get("quality") ?? "best";
  const container = searchParams.get("container") ?? "mp4";

  if (!videoId) {
    return new Response("Missing videoId parameter", { status: 400 });
  }

  try {
    // Build yt-dlp format selector
    let formatSpec: string;
    if (itag) {
      formatSpec = itag;
    } else if (type === "audio") {
      formatSpec =
        container === "webm"
          ? "bestaudio[ext=webm]"
          : "bestaudio[ext=m4a]/bestaudio";
    } else if (type === "video") {
      const heightFilter =
        quality !== "best" ? `[height<=${parseInt(quality)}]` : "";
      formatSpec =
        container === "webm"
          ? `bestvideo${heightFilter}[ext=webm]`
          : `bestvideo${heightFilter}[ext=mp4]`;
    } else {
      // video+audio (muxed if available, otherwise best separate)
      const heightFilter =
        quality !== "best" ? `[height<=${parseInt(quality)}]` : "";
      formatSpec = `best${heightFilter}[ext=${container}]/best${heightFilter}`;
    }

    // Get direct URL and title in parallel
    const [url, title] = await Promise.all([
      getStreamUrl(videoId, formatSpec),
      getVideoTitle(videoId),
    ]);
    const fileName = `${title}.${container}`;

    // Proxy the stream from YouTube CDN to client
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!upstream.ok) {
      throw new Error(`YouTube CDN returned ${upstream.status}`);
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") ?? "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    headers.set("Access-Control-Allow-Origin", "*");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, { headers });
  } catch (error) {
    console.error("Download error:", error);
    const message =
      error instanceof Error ? error.message : "Download failed";
    return new Response(message, { status: 500 });
  }
}

function getStreamUrl(videoId: string, formatSpec: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", [
      "-g",
      "-f",
      formatSpec,
      "--no-warnings",
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
        return;
      }
      const url = stdout.trim().split("\n")[0];
      if (!url) {
        reject(new Error("No URL returned by yt-dlp"));
        return;
      }
      resolve(url);
    });

    proc.on("error", (err) => reject(err));
  });
}

function getVideoTitle(videoId: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("yt-dlp", [
      "--print",
      "%(title)s",
      "--no-warnings",
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    let stdout = "";
    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.on("close", () => resolve(stdout.trim() || videoId));
    proc.on("error", () => resolve(videoId));
  });
}
