import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Users,
  Bookmark,
  BookmarkCheck,
  Play,
  Share2,
  Check,
  Star,
} from 'lucide-react';
import { Manga, Chapter, UserLibraryEntry, LibraryCategory } from '../types/manga';
import { ChapterList } from '../components/ChapterList';
import { StatusModal } from '../components/StatusModal';
import { CategoryBadge } from '../components/CategoryBadge';
import { api } from '../services/api';

interface MangaDetailPageProps {
  mangaId: string;
  onBack: () => void;
  onSelectChapter: (chapter: Chapter, allChapters: Chapter[]) => void;
  onLibraryUpdated: () => void;
}

export const MangaDetailPage: React.FC<MangaDetailPageProps> = ({
  mangaId,
  onBack,
  onSelectChapter,
  onLibraryUpdated,
}) => {
  const [manga, setManga] = useState<Manga | null>(null);
  const [loadingManga, setLoadingManga] = useState(true);
  const [libraryEntry, setLibraryEntry] = useState<UserLibraryEntry | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-br');
  const [chapterOrder, setChapterOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandDesc, setExpandDesc] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load Manga details and library status
  const loadManga = async () => {
    try {
      const data = await api.getManga(mangaId);
      setManga(data);
      const entry = await api.getLibraryEntry(mangaId);
      setLibraryEntry(entry);
    } catch (err) {
      console.error('Failed to load manga details', err);
    } finally {
      setLoadingManga(false);
    }
  };

  useEffect(() => {
    loadManga();
  }, [mangaId]);

  // Load chapters
  const loadChapters = async () => {
    setLoadingChapters(true);
    try {
      const languages =
        selectedLanguage === 'all'
          ? []
          : [selectedLanguage];
      const res = await api.getChapters(mangaId, {
        lang: languages,
        order: chapterOrder,
        limit: 100,
      });
      setChapters(res.data);
    } catch (err) {
      console.error('Failed to load chapters', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, [mangaId, selectedLanguage, chapterOrder]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingManga) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Carregando detalhes do mangá...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-200">Mangá não encontrado</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  // Find continue reading target chapter
  const continueChapter = libraryEntry?.last_read_chapter_id
    ? chapters.find((c) => c.id === libraryEntry.last_read_chapter_id)
    : chapters.length > 0
    ? chapters[chapters.length - 1] // first chapter if descending
    : null;

  return (
    <div className="min-h-screen pb-24">
      {/* Top Banner / Backdrop with blur */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-950">
        {manga.cover_url && (
          <img
            src={manga.cover_url}
            alt=""
            className="w-full h-full object-cover blur-2xl opacity-25 scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/80 to-transparent" />

        {/* Back navigation button */}
        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-xs font-semibold text-gray-200 hover:text-white border border-gray-700/60 transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Catálogo</span>
          </button>
        </div>
      </div>

      {/* Main Content Info Card */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Manga Poster Cover */}
          <div className="shrink-0 w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800 bg-gray-900 mx-auto md:mx-0">
            {manga.cover_url ? (
              <img
                src={manga.cover_url}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <BookOpen className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  manga.status === 'completed'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-700/40'
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                }`}
              >
                {manga.status === 'completed' ? 'Completo' : 'Em lançamento'}
              </span>

              {libraryEntry && (
                <CategoryBadge status={libraryEntry.status} size="md" showIcon={true} />
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {manga.title}
            </h1>

            {manga.alt_titles && manga.alt_titles.length > 0 && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-1 italic">
                {manga.alt_titles.slice(0, 3).join(' • ')}
              </p>
            )}

            {/* Metadata pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-4">
              {manga.year && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{manga.year}</span>
                </span>
              )}
              {manga.authors && manga.authors.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{manga.authors.join(', ')}</span>
                </span>
              )}
              {libraryEntry?.rating ? (
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Nota {libraryEntry.rating}/10</span>
                </span>
              ) : null}
            </div>

            {/* Tags / Genres */}
            {manga.tags && manga.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {manga.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-900/90 text-gray-300 border border-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons: Add to Library & Continue Reading */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Category selector button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                  libraryEntry
                    ? 'bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-500'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {libraryEntry ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Status: {libraryEntry.status.replace('_', ' ').toUpperCase()}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Salvar na Biblioteca</span>
                  </>
                )}
              </button>

              {/* Continue Reading button */}
              {chapters.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (continueChapter) {
                      onSelectChapter(continueChapter, chapters);
                    } else if (chapters.length > 0) {
                      onSelectChapter(chapters[chapters.length - 1], chapters);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {libraryEntry?.last_read_chapter_num
                      ? `Continuar Cap. ${libraryEntry.last_read_chapter_num}`
                      : 'Começar a Ler'}
                  </span>
                </button>
              )}

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                title="Compartilhar"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Synopsis / Description */}
            {manga.description && (
              <div className="mt-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Sinopse
                </h3>
                <p
                  className={`text-sm text-gray-300 leading-relaxed ${
                    !expandDesc ? 'line-clamp-3' : ''
                  }`}
                >
                  {manga.description}
                </p>
                {manga.description.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setExpandDesc(!expandDesc)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2"
                  >
                    {expandDesc ? 'Mostrar menos' : 'Ler sinopse completa...'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mt-12">
          <ChapterList
            chapters={chapters}
            loading={loadingChapters}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            order={chapterOrder}
            onOrderToggle={() =>
              setChapterOrder(chapterOrder === 'desc' ? 'asc' : 'desc')
            }
            onSelectChapter={(c) => onSelectChapter(c, chapters)}
          />
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        manga={manga}
        currentEntry={libraryEntry}
        onSaved={(_status) => {
          loadManga();
          onLibraryUpdated();
        }}
      />
    </div>
  );
};
