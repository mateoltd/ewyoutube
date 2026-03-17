"use client";

import { useState, useCallback } from "react";
import type {
  QueryResult,
  DownloadOption,
  ResolveResponse,
  StreamsResponse,
  SearchResponse,
} from "@/lib/types";

export function useResolve() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const resolve = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as ResolveResponse;
      setResult(data.result);
      return data.result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resolve query";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resolve, loading, error, result, setResult };
}

export function useStreams() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<DownloadOption[]>([]);

  const fetchStreams = useCallback(async (videoId: string) => {
    setLoading(true);
    setError(null);
    setOptions([]);

    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as StreamsResponse;
      setOptions(data.options);
      return data.options;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get streams";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchStreams, loading, error, options };
}

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as SearchResponse;
      setResult(data.result);
      return data.result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Search failed";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, error, result };
}
