import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Flame,
  Search,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import { Manga, Tag } from '../types/manga';
import { MangaCard } from '../components/MangaCard';
import { api } from '../services/api';

interface HomePageProps {
  onSelectManga: (manga: Manga) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLibraryUpdated: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectManga,
  searchQuery,
  onSearchChange,
  onLibraryUpdated,
}) => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [order, setOrder] = useState<
    'followedCount' | 'relevance' | 'latestUploadedChapter' | 'title'
  >('followedCount');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');

  const limit = 24;

  // Load available tags on mount
  useEffect(() => {
    api.getTags()
      .then((tags) => {
        // Filter popular genre tags
        const genreTags = tags.filter((t) => t.group === 'genre').slice(0, 16);
        setAvailableTags(genreTags);
      })
      .catch((err) => console.warn('Could not load tags', err));
  }, []);

  // Fetch manga whenever search, order, or selectedTag changes
  useEffect(() => {
    let isCancelled = false;
    const loadMangas = async () => {
      setLoading(true);
      try {
        const res = await api.searchManga({
          q: searchQuery,
          order: searchQuery ? 'relevance' : order,
          orderDir: 'desc',
          tags: selectedTag ? [selectedTag] : undefined,
          limit,
          offset: 0,
        });
        if (!isCancelled) {
          setMangas(res.data);
          setTotal(res.total);
          setOffset(0);
        }
      } catch (err) {
        console.error('Failed to load manga', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadMangas();
    return () => {
      isCancelled = true;
    };
  }, [searchQuery, order, selectedTag]);

  const handleLoadMore = async () => {
    const nextOffset = offset + limit;
    try {
      const res = await api.searchManga({
        q: searchQuery,
        order: searchQuery ? 'relevance' : order,
        orderDir: 'desc',
        tags: selectedTag ? [selectedTag] : undefined,
        limit,
        offset: nextOffset,
      });
      setMangas((prev) => [...prev, ...res.data]);
      setOffset(nextOffset);
    } catch (err) {
      console.error('Failed to load more manga', err);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Banner (Only when not searching) */}
      {!searchQuery && (
        <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-800/60 bg-gradient-to-b from-indigo-950/20 via-[#0b0f19] to-[#0b0f19]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Catálogo Completo MangaDex API</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Descubra e Organize seus <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Mangás Favoritos
                </span>
              </h1>
              <p className="mt-4 text-base text-gray-400 max-w-xl">
                Explore milhares de títulos sincronizados diretamente do MangaDex, acompanhe capítulos traduzidos em PT-BR e organize sua biblioteca pessoal em categorias de leitura.
              </p>

              {/* Quick Feature Badges */}
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-300">
                <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Lendo (Reading)
                </span>
                <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Pretendo Ler (Plan to Read)
                </span>
                <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Concluído (Finished)
                </span>
                <span className="flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Dropado (Dropped)
                </span>
              </div>
            </div>

            {/* Visual Accent Card */}
            <div className="hidden lg:flex items-center justify-center p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 rounded-3xl border border-indigo-500/20 shadow-2xl backdrop-blur-sm">
              <div className="text-center space-y-2">
                <Flame className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
                <div className="text-2xl font-black text-white">50.000+</div>
                <p className="text-xs text-gray-400">Capítulos & Obras Indexadas</p>
                <div className="pt-2 text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <span>● Online & Atualizado</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter & Controls Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {searchQuery ? (
                <>
                  <Search className="w-5 h-5 text-indigo-400" />
                  <span>Resultados para "{searchQuery}"</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span>Explorar Catálogo</span>
                </>
              )}
              {total > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300">
                  {total}
                </span>
              )}
            </h2>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
              >
                Limpar busca
              </button>
            )}
          </div>

          {/* Sort order options */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Ordenar:</span>
            <button
              type="button"
              onClick={() => setOrder('followedCount')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                order === 'followedCount' && !searchQuery
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Mais Seguidos</span>
            </button>

            <button
              type="button"
              onClick={() => setOrder('latestUploadedChapter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                order === 'latestUploadedChapter' && !searchQuery
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Últimos Capítulos</span>
            </button>

            <button
              type="button"
              onClick={() => setOrder('title')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                order === 'title' && !searchQuery
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <span>A - Z</span>
            </button>
          </div>
        </div>

        {/* Genre Tags Strip */}
        {availableTags.length > 0 && (
          <div className="py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Gênero:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1 text-xs font-medium rounded-lg shrink-0 transition-all ${
                selectedTag === ''
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Todos
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg shrink-0 transition-all ${
                  selectedTag === tag.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Manga Cards Grid */}
        {loading && mangas.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 pt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col space-y-3">
                <div className="bg-gray-800/60 aspect-[3/4] rounded-xl" />
                <div className="h-4 bg-gray-800/80 rounded w-3/4" />
                <div className="h-3 bg-gray-800/40 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : mangas.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-300">Nenhum mangá encontrado</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Tente pesquisar com outro termo ou redefinir os filtros de gênero aplicados.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 pt-6">
              {mangas.map((m) => (
                <MangaCard
                  key={m.id}
                  manga={m}
                  onSelect={onSelectManga}
                  onStatusUpdated={onLibraryUpdated}
                />
              ))}
            </div>

            {/* Load More Button */}
            {mangas.length < total && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-900 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800 text-sm font-semibold text-gray-200 hover:text-white rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Carregando mais...' : 'Carregar Mais Mangás'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
