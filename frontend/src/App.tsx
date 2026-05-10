import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Search, Tv, BookOpen, Loader2, ArrowLeft, Play, Info } from 'lucide-react'
import type { 
  MetadataSearchResponse, 
  AnimeMetadataSummary, 
  ProviderDescriptor,
  ProviderEpisode, 
  ResolvedServerSources 
} from './types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = 'http://localhost:3000'

type EpisodeWithProvider = ProviderEpisode & {
  providerKey: string;
  providerName: string;
}

type BrowseProps = {
  results: AnimeMetadataSummary[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e?: React.FormEvent) => void;
  activeTab: 'anime' | 'manga';
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: 'anime' | 'manga') => void }) => {
  const navigate = useNavigate();
  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col p-6 hidden md:flex">
      <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Tv size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">AnimeOnline</h1>
      </div>
      
      <nav className="space-y-2">
        <button
          onClick={() => { setActiveTab('anime'); navigate('/'); }}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200",
            activeTab === 'anime' ? "bg-purple-600/10 text-purple-400" : "hover:bg-zinc-900 text-zinc-500"
          )}
        >
          <Tv size={20} />
          <span className="font-semibold">Anime</span>
        </button>
        
        <button
          onClick={() => { setActiveTab('manga'); navigate('/'); }}
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
  );
};

const Browse = ({ results, isLoading, error, searchQuery, setSearchQuery, handleSearch, activeTab }: BrowseProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
            <p className="text-zinc-500 text-sm">We are working hard to integrate manga providers.</p>
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
                <Info size={24}/>
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
              {results.map((anime, index) => (
                <div 
                  key={`${anime.malId}-${index}`} 
                  onClick={() => navigate(`/anime/${anime.malId}`, { state: { anime } })}
                  className="group cursor-pointer flex flex-col h-full"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 mb-4 relative shadow-lg group-hover:shadow-purple-600/20 transition-all duration-500">
                    <img src={anime.posterImage} alt={anime.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
                      <button className="bg-purple-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Play size={14} fill="white" /> WATCH NOW
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors mb-1">{anime.title}</h3>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<AnimeMetadataSummary | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeWithProvider[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeWithProvider | null>(null);
  const [sources, setSources] = useState<ResolvedServerSources[]>([]);
  const [selectedSourceUrl, setSelectedSourceUrl] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // 1. Get metadata
        const metaResp = await fetch(`${API_BASE_URL}/metadata/anime/${id}`);
        const metaData = await metaResp.json();
        setAnime(metaData);

        // 2. Get providers
        const provResp = await fetch(`${API_BASE_URL}/providers`);
        const { providers }: { providers: ProviderDescriptor[] } = await provResp.json();
       
        // Try to find episodes in any provider
        for (const provider of providers) {
          const slug = metaData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const epResp = await fetch(`${API_BASE_URL}/providers/${provider.key}/anime/${slug}/episodes`);
          if (epResp.ok) {
            const { episodes }: { episodes: ProviderEpisode[] } = await epResp.json();
            if (episodes.length > 0) {
              setEpisodes(episodes.map((episode: ProviderEpisode) => ({
                ...episode,
                providerKey: provider.key,
                providerName: provider.name,
              })));
              break; 
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const fetchSources = async (episode: EpisodeWithProvider) => {
    setSelectedEpisode(episode);
    setSelectedSourceUrl(null);
    setSelectedSourceType(null);
    setSources([]);
    try {
      const sourceResp = await fetch(`${API_BASE_URL}/providers/${episode.providerKey}/episodes/${episode.slug}/sources`);
      if (sourceResp.ok) {
        const { results } = await sourceResp.json();
        setSources(results);
        if (results[0]?.sources[0]) {
          setSelectedSourceUrl(results[0].sources[0].url);
          setSelectedSourceType(results[0].sources[0].type);
        }
      }
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  if (!anime) return <div className="flex-1 p-10 text-center">Anime not found</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950">
      <div className="relative h-[40vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
        <img src={anime.posterImage || ''} className="w-full h-full object-cover opacity-30 blur-sm" alt="" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-20 bg-black/50 p-2 rounded-full hover:bg-purple-600 transition-colors"><ArrowLeft size={24} /></button>
        <div className="absolute bottom-0 left-0 p-8 z-20 flex gap-8 items-end w-full">
          <img src={anime.posterImage || ''} className="w-48 aspect-[2/3] object-cover rounded-xl shadow-2xl border border-zinc-800 hidden sm:block" alt="" />
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-black mb-4">{anime.title}</h2>
            <p className="text-zinc-400 max-w-3xl line-clamp-3 text-sm">{anime.synopsis}</p>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-purple-500" /> {selectedEpisode ? `Episode ${selectedEpisode.number} - ${selectedEpisode.providerName}` : 'Select an Episode'}</h3>
            {selectedSourceUrl ? (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                {selectedSourceType === 'embed' ? <iframe src={selectedSourceUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media" /> : <video key={selectedSourceUrl} src={selectedSourceUrl} controls autoPlay className="w-full h-full" />}
              </div>
            ) : (
              <div className="aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center border border-dashed border-zinc-700 text-zinc-500">Pick an episode</div>
            )}
            {sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sources.map((s, idx) => (
                  <button key={idx} onClick={() => { setSelectedSourceUrl(s.sources[0]?.url); setSelectedSourceType(s.sources[0]?.type); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", selectedSourceUrl === s.sources[0]?.url ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>{s.server.name}</button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4">Episodes</h3>
            {episodes.length > 0 ? (
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1">
                {episodes.map((ep) => (
                  <button key={`${ep.providerKey}-${ep.slug}`} onClick={() => fetchSources(ep)} className={cn("aspect-square rounded-sm flex items-center justify-center font-bold text-[9px] transition-all border", selectedEpisode?.slug === ep.slug && selectedEpisode.providerKey === ep.providerKey ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_8px_rgba(147,51,234,0.6)]" : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white")}>{ep.number}</button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No episodes found in the available providers.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<AnimeMetadataSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/anime/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data: MetadataSearchResponse = await response.json();
        setResults(data.results);
      }
    } catch { setError("Search failed"); } finally { setIsLoading(false); }
  }, [searchQuery]);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/metadata/anime/trending`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch {
        setError("Could not load trending anime");
      } finally { setIsLoading(false); }
    };
    fetchTrending();
  }, []);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Browse results={results} isLoading={isLoading} error={error} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} activeTab={activeTab} />} />
          <Route path="/anime/:id" element={<Detail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
