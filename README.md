# Anime Online

Monta tu propia página de anime sin depender de una sola.

Este proyecto permite integrar múltiples proveedores de anime en una sola interfaz, dándote total libertad y control sobre tu contenido.

## Estructura del Proyecto

- **backend**: API desarrollada con NestJS para el scraping y resolución de fuentes.
- **frontend**: Interfaz de usuario para consumir la API de manera sencilla.

---


## Current Architecture

The codebase uses capability-based interface segregation to avoid provider spaghetti code.

Each provider only implements the features it actually supports:

- `anime-detail`
- `episode-list`
- `server-list`
- `download-links`

Stream resolution is modeled as a separate layer:

- providers discover servers
- resolvers convert server URLs into playable sources

This keeps provider adapters focused on scraping and keeps host-specific playback logic isolated.

## Main Modules

```text
src/
├── health/
├── metadata/
├── persistence/
├── providers/
│   ├── adapters/
│   ├── provider.contracts.ts
│   ├── provider-http.service.ts
│   ├── provider.registry.ts
│   └── providers.service.ts
└── streams/
    ├── resolvers/
    ├── stream-resolver.contracts.ts
    ├── stream-resolver.registry.ts
    └── streams.service.ts
```

## Implemented Features

### Metadata

- `GET /metadata/anime/search?q=...`
- Source: `Jikan API`

### Provider Discovery

- `GET /providers`
- `GET /providers/:key`

### Provider Scraping

- `GET /providers/:key/anime/:slug`
- `GET /providers/:key/anime/:slug/episodes`
- `GET /providers/:key/episodes/:episodeSlug/servers`
- `GET /providers/:key/episodes/:episodeSlug/downloads`
- `GET /providers/:key/episodes/:episodeSlug/sources`

### Stream Resolution

- `GET /streams/resolve?url=...&name=...`

### Persistence

- Redis-only cache layer
- No long-lived relational persistence for scraped catalog data at this stage
- When `REDIS_URL` is not configured, cache behavior is safely disabled

## Supported Providers

| Provider | Anime Detail | Episodes | Servers | Downloads | Status | Notes |
|---|---:|---:|---:|---:|---|---|
| AnimeAV1 | Yes | Yes | Yes | Yes | Implemented | Rich structured data embedded in HTML |
| MonosChinos | Yes | Yes | Yes | Yes | Implemented | Players exposed in base64 `data-player` attributes |
| JKAnime | Yes | Yes | Yes | No | Implemented | Servers resolved from inline iframe assignments |
| AnimeFLV | Yes | Yes | Yes | Yes | Implemented | Anime pages expose `anime_info`, `episodes`, and episode `videos` data |
| TioAnime | Yes | Yes | Yes | Yes | Implemented | Anime and episode pages expose `episodes` and `videos` arrays |

## Stream Resolvers

Current resolver chain:

- `DirectMediaResolver`
  - resolves direct `.m3u8` and `.mp4` URLs
- `Mp4UploadResolver`
  - extracts direct MP4 sources from MP4Upload embed pages
- `MixdropResolver`
  - derives direct media URLs from `MDCore` values in Mixdrop embeds
- `DoodstreamResolver`
  - derives direct MP4 sources through the `pass_md5` handshake exposed by Doodstream embed pages
- `YourUploadResolver`
  - extracts direct MP4 sources from YourUpload embed pages
- `KnownEmbedResolver`
  - resolves known embed hosts such as `mega.nz`, `mp4upload.com`, `terabox.com`, `voe.sx`, `mixdrop.top`, and provider-hosted embeds
- `FallbackEmbedResolver`
  - returns unknown URLs as generic embeds when no better resolver applies

This is intentionally modular so host-specific resolvers can be added without touching provider adapters.

Current honest limitation:

- `VOE` and `Filemoon` are still handled as generic embeds because their current public flows are less stable for direct extraction and need a dedicated verified parser before promoting them to deep resolvers.

## Development

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run start:dev
```

Environment:

```bash
cp .env.example .env
```

Available variables:

- `REDIS_URL`

Run tests:

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

## Testing Strategy

The project now mixes:

- unit tests for registries and services
- fixture-based provider parser tests
- e2e tests for the public API surface

Fixture-based tests are important because live provider pages can change, rate-limit, or block automation.

## API Contract

- The canonical API contract lives at the project root in `../openapi.yaml`.
- If any endpoint is added, removed, renamed, or its request/response shape changes, `openapi.yaml` must be updated in the same change.

## Design Notes

- Jikan is used only for general anime metadata.
- Providers are responsible for provider-specific episode and playback data.
- Resolvers are responsible for host-specific playback output.
- The backend returns normalized DTOs so the frontend stays simple.

## Near-Term Roadmap

1. Add dedicated resolvers for hosts like `filemoon`, `doodstream`, `voe`, and `okru` when stable extraction is verified
2. Add provider search where available
3. Improve source normalization with quality/language metadata
4. Add Redis-backed caching and provider health diagnostics
5. Add request throttling and provider-level backoff
