import { NextResponse } from "next/server";
import { resolveQuery } from "@/lib/youtube/resolve";
import type { ResolveRequest, ResolveResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveRequest;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await resolveQuery(null, query);

    return NextResponse.json({ result } satisfies ResolveResponse);
  } catch (error) {
    console.error("Resolve error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resolve query";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
