import { NextResponse } from "next/server";
import { getInnertube } from "@/lib/youtube/client";
import { resolveDownloadOptions } from "@/lib/youtube/streams";
import type { StreamsRequest, StreamsResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StreamsRequest;
    const videoId = body.videoId?.trim();

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const yt = await getInnertube();
    const options = await resolveDownloadOptions(yt, videoId);

    return NextResponse.json({ options } satisfies StreamsResponse);
  } catch (error) {
    console.error("Streams error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get streams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
