import { NextResponse } from "next/server";
import { resolveQuery } from "@/lib/youtube/resolve";
import type { SearchRequest, SearchResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchRequest;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Force search interpretation by prepending ?
    const result = await resolveQuery(null, `?${query}`);

    return NextResponse.json({ result } satisfies SearchResponse);
  } catch (error) {
    console.error("Search error:", error);
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
