import React, { useState, useEffect } from 'react';
import {
  Library,
  BookOpen,
  Bookmark,
  CheckCircle,
  XCircle,
  Search,
  Compass,
  Star,
  Play,
  Trash2,
  Edit3,
} from 'lucide-react';
import { UserLibraryEntry, LibraryCategory, LibraryStats } from '../types/manga';
import { CategoryBadge } from '../components/CategoryBadge';
import { StatusModal } from '../components/StatusModal';
import { api } from '../services/api';

interface LibraryPageProps {
  initialFilter?: LibraryCategory;
  onSelectMangaId: (mangaId: string) => void;
  onExploreCatalog: () => void;
  stats?: LibraryStats;
  onLibraryUpdated: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  initialFilter,
  onSelectMangaId,
  onExploreCatalog,
  stats,
  onLibraryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryCategory | 'all'>(
    initialFilter || 'all'
  );
  const [entries, setEntries] = useState<UserLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<UserLibraryEntry | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await api.getLibrary(
        activeTab === 'all' ? undefined : activeTab
      );
      setEntries(data);
    } catch (err) {
      console.error('Failed to load library', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [activeTab]);

  const handleDelete = async (mangaId: string) => {
    if (!window.confirm('Deseja remover este mangá da sua biblioteca?')) return;
    try {
      await api.deleteLibraryEntry(mangaId);
      loadLibrary();
      onLibraryUpdated();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q);
  });

  const tabs: {
    id: LibraryCategory | 'all';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    color: string;
  }[] = [
    {
      id: 'all',
      label: 'Todos',
      icon: Library,
      count: stats?.total || 0,
      color: 'text-indigo-400',
    },
    {
      id: 'reading',
      label: 'Lendo',
      icon: BookOpen,
      count: stats?.reading || 0,
      color: 'text-emerald-400',
    },
    {
      id: 'plan_to_read',
      label: 'Pretendo Ler',
      icon: Bookmark,
      count: stats?.plan_to_read || 0,
      color: 'text-sky-400',
    },
    {
      id: 'finished',
      label: 'Concluídos',
      icon: CheckCircle,
      count: stats?.finished || 0,
      color: 'text-purple-400',
    },
    {
      id: 'dropped',
      label: 'Dropados',
      icon: XCircle,
      count: stats?.dropped || 0,
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-24">
      {/* Header with Title & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Library className="w-8 h-8 text-indigo-500" />
            <span>Minha Biblioteca de Mangás</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Seus títulos acompanhados e categorizados com progresso de leitura em tempo real.
          </p>
        </div>

        {/* Explore button shortcut */}
        <button
          type="button"
          onClick={onExploreCatalog}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all self-start md:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Explorar Catálogo</span>
        </button>
      </div>

      {/* Categories Tabs Bar */}
      <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search within library */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filtrar biblioteca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Saved Mangas */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Carregando sua biblioteca...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="mt-12 py-20 text-center bg-[#111625]/60 rounded-3xl border border-gray-800/80 p-8 max-w-xl mx-auto">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-200">
            {activeTab === 'all'
              ? 'Sua biblioteca ainda está vazia'
              : 'Nenhum mangá nesta categoria'}
          </h3>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            {activeTab === 'all'
              ? 'Navegue pelo catálogo e clique no botão de salvar para organizar seus mangás em Lendo, Pretendo Ler, Concluído ou Dropado.'
              : 'Adicione títulos a esta categoria a partir do catálogo ou da página de detalhes de qualquer obra.'}
          </p>
          <button
            type="button"
            onClick={onExploreCatalog}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explorar Mangás no Catálogo</span>
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredEntries.map((entry) => (
            <div
              key={entry.manga_id}
              className="group relative flex flex-col bg-[#111625] rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex p-3 gap-3.5">
                {/* Cover Poster */}
                <div
                  onClick={() => onSelectMangaId(entry.manga_id)}
                  className="relative w-24 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-900 cursor-pointer"
                >
                  <img
                    src={entry.cover_url}
                    alt={entry.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <CategoryBadge status={entry.status} size="sm" showIcon={false} />
                      {entry.rating ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{entry.rating}</span>
                        </span>
                      ) : null}
                    </div>

                    <h3
                      onClick={() => onSelectMangaId(entry.manga_id)}
                      title={entry.title}
                      className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 cursor-pointer leading-tight"
                    >
                      {entry.title}
                    </h3>

                    {entry.last_read_chapter_num ? (
                      <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Cap. {entry.last_read_chapter_num}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Ainda não iniciado</p>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 mt-2">
                    <button
                      type="button"
                      onClick={() => onSelectMangaId(entry.manga_id)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Detalhes</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingEntry(entry)}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                        title="Editar Categoria / Nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.manga_id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title="Remover da Biblioteca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Notes if present */}
              {entry.notes && (
                <div className="px-3 pb-3 pt-1 text-[11px] text-gray-400 border-t border-gray-850 bg-gray-950/30 line-clamp-1 italic">
                  "{entry.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Status Modal */}
      {editingEntry && (
        <StatusModal
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          manga={{
            id: editingEntry.manga_id,
            title: editingEntry.title,
            cover_url: editingEntry.cover_url,
            status: '',
            content_rating: 'safe',
            description: '',
            original_language: 'ja',
            tags: [],
          }}
          currentEntry={editingEntry}
          onSaved={(_status) => {
            setEditingEntry(null);
            loadLibrary();
            onLibraryUpdated();
          }}
        />
      )}
    </div>
  );
};
