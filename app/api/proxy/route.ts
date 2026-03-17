import { NextRequest } from "next/server";
import { PROXY_ALLOWED_DOMAINS } from "@/lib/constants";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Validate domain allowlist
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const isAllowed = PROXY_ALLOWED_DOMAINS.some(
    (domain) =>
      parsedUrl.hostname === domain ||
      parsedUrl.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowed) {
    return new Response("Domain not allowed", { status: 403 });
  }

  try {
    // Forward range headers for resumable downloads
    const headers: HeadersInit = {};
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const upstream = await fetch(url, { headers });

    // Build response headers with CORS
    const responseHeaders = new Headers();
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");

    // Forward content headers for progress tracking
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    // Stream the response without buffering
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Proxy request failed", { status: 502 });
  }
}
