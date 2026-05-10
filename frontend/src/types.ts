export interface AnimeMetadataSummary {
  malId: number;
  title: string;
  titleEnglish: string | null;
  titleJapanese: string | null;
  synopsis: string | null;
  posterImage: string | null;
  score: number | null;
  year: number | null;
  status: string | null;
  type: string | null;
  episodes: number | null;
  genres: string[];
}

export interface MetadataSearchResponse {
  source: string;
  query: string;
  results: AnimeMetadataSummary[];
}

export interface ProviderDescriptor {
  key: string;
  name: string;
  baseUrl: string;
  language: string;
  capabilities: string[];
}

export interface ProviderAnimeDetail {
  title: string;
  slug: string;
  url: string;
  synopsis?: string;
  poster?: string;
  genres?: string[];
  status?: string;
}

export interface ProviderEpisode {
  number: number;
  slug: string;
  url: string;
}

export interface ProviderServer {
  name: string;
  type: 'embed' | 'download' | 'unknown';
  url: string;
}

export interface PlayableSource {
  type: 'hls' | 'mp4' | 'embed';
  url: string;
  quality?: string;
}

export interface ResolvedServerSources {
  server: ProviderServer;
  sources: PlayableSource[];
}
