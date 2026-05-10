import { useState, useEffect, useCallback } from 'react'
import { Search, Tv, BookOpen, Loader2, ArrowLeft, Play, Info } from 'lucide-react'
import type { 
  MetadataSearchResponse, 
  AnimeMetadataSummary, 
  ProviderDescriptor, 
  ProviderAnimeDetail, 
  ProviderEpisode, 
  ResolvedServerSources 
} from './types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = 'http://localhost:3000'

function App() {
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<AnimeMetadataSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Navigation State
  const [selectedAnime, setSelectedAnime] = useState<AnimeMetadataSummary | null>(null)
  const [, setAnimeDetail] = useState<ProviderAnimeDetail | null>(null)
  const [episodes, setEpisodes] = useState<ProviderEpisode[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<ProviderEpisode | null>(null)
  const [sources, setSources] = useState<ResolvedServerSources[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/anime/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Failed to fetch anime metadata')
      const data: MetadataSearchResponse = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  // Fetch initial results (Trending)
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/metadata/anime/trending`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        } else {
          // Fallback if trending fails
          const searchResp = await fetch(`${API_BASE_URL}/metadata/anime/search?q=boku no hero`);
          if (searchResp.ok) {
            const data = await searchResp.json();
            setResults(data.results || []);
          }
        }
      } catch (err) {
        console.error("Initial fetch failed", err);
        setError("Error al cargar animes iniciales.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (activeTab === 'anime' && searchQuery && !selectedAnime) {
      const timer = setTimeout(() => handleSearch(), 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, activeTab, handleSearch, selectedAnime])

  const fetchAnimeDetails = async (anime: AnimeMetadataSummary) => {
    setSelectedAnime(anime)
    setIsDetailLoading(true)
    setError(null)
    setAnimeDetail(null)
    setEpisodes([])
    setSelectedEpisode(null)
    setSources([])

    try {
      // 1. Get providers
      const provResp = await fetch(`${API_BASE_URL}/providers`)
      const { providers } = await provResp.json() as { providers: ProviderDescriptor[] }
      
      // We'll use the first provider that supports search/anime-detail for this demo
      const provider = providers[0]
      if (!provider) throw new Error('No providers available')

      // 2. Get anime detail from provider (using title as slug placeholder - ideally you'd search the provider first)
      // Since we don't have a direct MAL ID -> Provider Slug mapping here, we use a search or just hope the title matches
      // For this implementation, we'll try to find the anime in the provider.
      const slug = anime.title.toLowerCase().replace(/ /g, '-')
      
      const detailResp = await fetch(`${API_BASE_URL}/providers/${provider.key}/anime/${slug}`)
      if (detailResp.ok) {
        const detail = await detailResp.json()
        setAnimeDetail(detail)
      }

      // 3. Get episodes
      const epResp = await fetch(`${API_BASE_URL}/providers/${provider.key}/anime/${slug}/episodes`)
      if (epResp.ok) {
        const { episodes } = await epResp.json()
        setEpisodes(episodes)
      }
    } catch (err) {
      console.error(err)
      setError('Could not load details for this anime.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const fetchEpisodeSources = async (episode: ProviderEpisode) => {
    setSelectedEpisode(episode)
    setSources([])
    setSelectedSource(null)
    
    try {
      // Assuming first provider again
      const provResp = await fetch(`${API_BASE_URL}/providers`)
      const { providers } = await provResp.json()
      const provider = providers[0]

      const sourceResp = await fetch(`${API_BASE_URL}/providers/${provider.key}/episodes/${episode.slug}/sources`)
      if (sourceResp.ok) {
        const { results } = await sourceResp.json()
        setSources(results)
        // Auto-select first source if available
        if (results[0]?.sources[0]) {
          setSelectedSource(results[0].sources[0].url)
        }
      }
    } catch (err) {
      setError('Could not load stream sources.')
    }
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Tv size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">AnimeOnline</h1>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => { setActiveTab('anime'); setSelectedAnime(null); }}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200",
              activeTab === 'anime' ? "bg-purple-600/10 text-purple-400" : "hover:bg-zinc-900 text-zinc-500"
            )}
          >
            <Tv size={20} />
            <span className="font-semibold">Anime</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('manga'); setSelectedAnime(null); }}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200",
              activeTab === 'manga' ? "bg-purple-600/10 text-purple-400" : "hover:bg-zinc-900 text-zinc-500"
            )}
          >
            <BookOpen size={20} />
            <div className="flex flex-col items-start">
              <span className="font-semibold">Manga</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-purple-600">Coming Soon</span>
            </div>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {selectedAnime ? (
          /* Detail View */
          <div className="flex-1 overflow-y-auto bg-zinc-950">
            <div className="relative h-[40vh] w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
              <img 
                src={selectedAnime.posterImage || ''} 
                className="w-full h-full object-cover opacity-30 blur-sm"
                alt="blur background"
              />
              <button 
                onClick={() => setSelectedAnime(null)}
                className="absolute top-6 left-6 z-20 bg-black/50 p-2 rounded-full hover:bg-purple-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              
              <div className="absolute bottom-0 left-0 p-8 z-20 flex gap-8 items-end w-full">
                <img 
                  src={selectedAnime.posterImage || ''} 
                  className="w-48 aspect-[2/3] object-cover rounded-xl shadow-2xl border border-zinc-800 hidden sm:block"
                  alt={selectedAnime.title}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-purple-600 text-[10px] font-bold rounded uppercase">{selectedAnime.type}</span>
                    <span className="text-zinc-400 text-sm">{selectedAnime.year}</span>
                    <span className="text-yellow-500 text-sm font-bold">★ {selectedAnime.score}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black mb-4">{selectedAnime.title}</h2>
                  <p className="text-zinc-400 max-w-3xl line-clamp-3 text-sm md:text-base">{selectedAnime.synopsis}</p>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Player Section */}
                <section>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Play size={20} className="text-purple-500" />
                    {selectedEpisode ? `Watching Episode ${selectedEpisode.number}` : 'Select an Episode'}
                  </h3>
                  
                  {selectedSource ? (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                       {/* If it's an HLS or MP4 stream, we should use a video player, but for now we'll stick to iframe or a simple video tag if possible.
                           Based on openapi, PlayableSource can be 'hls', 'mp4', or 'embed'. */}
                       {sources.find(s => s.sources.find(src => src.url === selectedSource))?.sources.find(src => src.url === selectedSource)?.type === 'embed' ? (
                         <iframe 
                           src={selectedSource} 
                           className="w-full h-full" 
                           allowFullScreen 
                           title="Player"
                         />
                       ) : (
                         <video 
                           src={selectedSource} 
                           controls 
                           className="w-full h-full"
                           poster={selectedAnime.posterImage || ''}
                         />
                       )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center border border-dashed border-zinc-700">
                      <p className="text-zinc-500">Pick an episode to start streaming</p>
                    </div>
                  )}

                  {sources.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-sm text-zinc-500 mr-2 self-center">Servers:</span>
                      {sources.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSource(s.sources[0]?.url)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            selectedSource === s.sources[0]?.url ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          )}
                        >
                          {s.server.name}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-4">Episodes</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                    {episodes.map((ep) => (
                      <button
                        key={ep.slug}
                        onClick={() => fetchEpisodeSources(ep)}
                        className={cn(
                          "aspect-square rounded-md flex items-center justify-center font-bold text-[10px] transition-all border",
                          selectedEpisode?.slug === ep.slug 
                            ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                        )}
                      >
                        {ep.number}
                      </button>
                    ))}
                  </div>
                  {episodes.length === 0 && !isDetailLoading && (
                    <div className="p-10 bg-zinc-900/50 rounded-2xl text-center border border-zinc-800">
                      <Info className="mx-auto mb-2 text-zinc-600" />
                      <p className="text-zinc-500">No episodes found for this provider.</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <h4 className="font-bold mb-4 text-purple-400 uppercase text-xs tracking-widest">Details</h4>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-zinc-500 mb-1">Status</dt>
                      <dd className="text-zinc-200">{selectedAnime.status}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 mb-1">Genres</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {selectedAnime.genres.map(g => (
                          <span key={g} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px]">{g}</span>
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 mb-1">English Title</dt>
                      <dd className="text-zinc-200 text-xs italic">{selectedAnime.titleEnglish || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Browser View */
          <>
            <header className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-30">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder={activeTab === 'anime' ? "Search your favorite anime..." : "Manga search coming soon..."}
                    disabled={activeTab === 'manga'}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600 transition-all disabled:opacity-50 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'manga' ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 max-w-md mx-auto text-center">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                    <BookOpen size={40} className="text-purple-600 opacity-50" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Manga is Coming Soon</h2>
                  <p className="text-zinc-500 text-sm">We are working hard to integrate manga providers. Stay tuned for the next update!</p>
                </div>
              ) : (
                <>
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                      <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                      <p className="text-zinc-500 animate-pulse">Searching the multiverse...</p>
                    </div>
                  )}

                  {error && !isLoading && (
                    <div className="bg-red-900/10 border border-red-500/20 text-red-400 p-6 rounded-2xl mb-8 flex items-center gap-4">
                      <div className="p-2 bg-red-500/10 rounded-lg"><Info size={24}/></div>
                      <div>
                        <p className="font-bold">Something went wrong</p>
                        <p className="text-sm opacity-80">{error}</p>
                      </div>
                    </div>
                  )}

                  {!isLoading && results.length === 0 && searchQuery && (
                    <div className="text-center py-32">
                      <p className="text-zinc-500 text-lg">No results found for <span className="text-white font-bold italic">"{searchQuery}"</span></p>
                      <p className="text-zinc-600 text-sm mt-2">Try checking the spelling or use fewer keywords.</p>
                    </div>
                  )}

                  {!isLoading && results.length === 0 && !searchQuery && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-30">
                       <div className="h-48 bg-zinc-900 rounded-3xl border border-dashed border-zinc-700" />
                       <div className="h-48 bg-zinc-900 rounded-3xl border border-dashed border-zinc-700" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
                    {results.map((anime) => (
                      <div 
                        key={anime.malId} 
                        onClick={() => fetchAnimeDetails(anime)}
                        className="group cursor-pointer flex flex-col h-full"
                      >
                        <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 mb-4 relative shadow-lg group-hover:shadow-purple-600/20 transition-all duration-500">
                          {anime.posterImage ? (
                            <img
                              src={anime.posterImage}
                              alt={anime.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800">
                              <Tv size={64} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
                            <button className="bg-purple-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
                              <Play size={14} fill="white" /> WATCH NOW
                            </button>
                          </div>
                          {anime.score && (
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                              <span className="text-[10px] font-black text-yellow-500">★ {anime.score}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors mb-1">
                          {anime.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{anime.type}</span>
                          <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{anime.year || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Loading Overlay for detail transitions */}
        {isDetailLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
            <p className="text-white font-bold tracking-widest uppercase text-xs">Loading Metadata...</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
