import type { Innertube } from "youtubei.js";
import { getInnertube, resetInnertube } from "@/lib/youtube/client";

type BasicInfoClient =
  | "WEB_CREATOR"
  | "WEB_EMBEDDED"
  | "ANDROID"
  | "MWEB"
  | "IOS"
  | "TV";

type YoutubeBasicInfo = Awaited<ReturnType<Innertube["getBasicInfo"]>>;

const FALLBACK_CLIENTS: BasicInfoClient[] = [
  "WEB_CREATOR",
  "WEB_EMBEDDED",
  "ANDROID",
  "MWEB",
  "IOS",
  "TV",
];

interface GetBasicInfoWithFallbackOptions {
  yt?: Innertube;
  requireStreamingData?: boolean;
}

function isUsableInfo(
  info: YoutubeBasicInfo,
  requireStreamingData: boolean
): boolean {
  if (requireStreamingData) {
    const formats = info.streaming_data?.formats?.length ?? 0;
    const adaptiveFormats = info.streaming_data?.adaptive_formats?.length ?? 0;
    return formats + adaptiveFormats > 0;
  }

  return Boolean(info.basic_info?.title);
}

function formatFailureReason(info: YoutubeBasicInfo, client: string): string | null {
  const status = info.playability_status?.status;
  const reason = info.playability_status?.reason?.trim();

  if (!status && !reason) {
    return null;
  }

  if (reason) {
    return `${client}: ${status ?? "UNKNOWN"} - ${reason}`;
  }

  return `${client}: ${status}`;
}

async function requestBasicInfo(
  yt: Innertube,
  videoId: string,
  client?: BasicInfoClient
): Promise<YoutubeBasicInfo> {
  if (!client) {
    return yt.getBasicInfo(videoId);
  }

  return yt.getBasicInfo(videoId, { client });
}

async function tryBasicInfoAcrossClients(
  yt: Innertube,
  videoId: string,
  requireStreamingData: boolean
): Promise<YoutubeBasicInfo | null> {
  const primary = await requestBasicInfo(yt, videoId);
  if (isUsableInfo(primary, requireStreamingData)) {
    return primary;
  }

  const failures: string[] = [];
  const primaryReason = formatFailureReason(primary, "WEB");
  if (primaryReason) {
    failures.push(primaryReason);
  }

  for (const client of FALLBACK_CLIENTS) {
    const fallback = await requestBasicInfo(yt, videoId, client);
    if (isUsableInfo(fallback, requireStreamingData)) {
      return fallback;
    }

    const reason = formatFailureReason(fallback, client);
    if (reason) {
      failures.push(reason);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `${
        requireStreamingData
          ? "No streaming data available for this video"
          : "Failed to load video information"
      }. Attempt results: ${failures.join(" | ")}`
    );
  }

  return null;
}

export async function getBasicInfoWithFallback(
  videoId: string,
  options: GetBasicInfoWithFallbackOptions = {}
): Promise<YoutubeBasicInfo> {
  const requireStreamingData = options.requireStreamingData ?? false;
  let lastError: unknown;

  const attempts: Innertube[] = [];
  attempts.push(options.yt ?? (await getInnertube()));
  attempts.push(await resetInnertube());

  for (const yt of attempts) {
    try {
      const info = await tryBasicInfoAcrossClients(
        yt,
        videoId,
        requireStreamingData
      );

      if (info) {
        return info;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    requireStreamingData
      ? "No streaming data available for this video"
      : "Failed to load video information"
  );
}
