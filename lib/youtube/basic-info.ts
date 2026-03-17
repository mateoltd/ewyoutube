import type { Innertube } from "youtubei.js";
import { getInnertube, resetInnertube } from "@/lib/youtube/client";

type BasicInfoClient = "ANDROID" | "MWEB" | "IOS";

type YoutubeBasicInfo = Awaited<ReturnType<Innertube["getBasicInfo"]>>;

const FALLBACK_CLIENTS: BasicInfoClient[] = ["ANDROID", "MWEB", "IOS"];

interface GetBasicInfoWithFallbackOptions {
  yt?: Innertube;
  requireStreamingData?: boolean;
}

function isUsableInfo(
  info: YoutubeBasicInfo,
  requireStreamingData: boolean
): boolean {
  if (requireStreamingData) {
    return Boolean(info.streaming_data);
  }

  return Boolean(info.basic_info?.title);
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

  for (const client of FALLBACK_CLIENTS) {
    const fallback = await requestBasicInfo(yt, videoId, client);
    if (isUsableInfo(fallback, requireStreamingData)) {
      return fallback;
    }
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
