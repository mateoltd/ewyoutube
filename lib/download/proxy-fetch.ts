/**
 * Fetch a stream URL through the proxy with progress tracking.
 * Returns an object with the response data as a Blob and progress callback support.
 */
export async function proxyFetch(
  streamUrl: string,
  onProgress?: (downloaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;

  const response = await fetch(proxyUrl, { signal });
  if (!response.ok) {
    throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
  }

  const contentLength = parseInt(
    response.headers.get("content-length") ?? "0",
    10
  );
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  if (!response.body) {
    // Fallback for browsers without ReadableStream
    const blob = await response.blob();
    onProgress?.(blob.size, blob.size);
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
    onProgress?.(downloaded, contentLength);
  }

  return new Blob(chunks as BlobPart[], { type: contentType });
}
