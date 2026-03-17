// Server-side YouTube types bridging youtubei.js to our API types

export interface RawStreamInfo {
  itag: number;
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength: number;
  width?: number;
  height?: number;
  qualityLabel?: string;
  fps?: number;
  audioSampleRate?: number;
  audioChannels?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  language?: string | null;
  isDefault?: boolean;
}
