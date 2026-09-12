import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Chapter, ChapterPages } from '../types/manga';
import { api } from '../services/api';

interface ReaderProps {
  mangaId: string;
  mangaTitle: string;
  chapter: Chapter;
  allChapters: Chapter[];
  onBack: () => void;
  onSelectChapter: (ch: Chapter) => void;
  onProgressUpdated?: () => void;
}

export const Reader: React.FC<ReaderProps> = ({
  mangaId,
  mangaTitle,
  chapter,
  allChapters,
  onBack,
  onSelectChapter,
  onProgressUpdated,
}) => {
  const [pagesData, setPagesData] = useState<ChapterPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDataSaver, setUseDataSaver] = useState(false);
  const [readerMode, setReaderMode] = useState<'vertical' | 'single'>('vertical');
  const [currentPage, setCurrentPage] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [failedPages, setFailedPages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Find adjacent chapters
  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  // Assuming descending order by default:
  // previous chapter has higher index if descending, or check chapter numbers
  const prevChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
  const nextChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;

  // Load chapter pages
  useEffect(() => {
    let isCancelled = false;
    const fetchPages = async () => {
      setLoading(true);
      setError(null);
      setFailedPages({});
      setCurrentPage(0);

      try {
        const data = await api.getChapterPages(chapter.id);
        if (!isCancelled) {
          setPagesData(data);
          // Mark progress in library
          api.updateReadingProgress(mangaId, chapter.id, chapter.chapter, chapter.title).then(() => {
            if (onProgressUpdated) onProgressUpdated();
          });
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Erro ao carregar páginas deste capítulo.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchPages();

    return () => {
      isCancelled = true;
    };
  }, [chapter.id, mangaId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (readerMode === 'single' && pagesData) {
          setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (readerMode === 'single') {
          setCurrentPage((prev) => Math.max(prev - 1, 0));
        }
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerMode, pagesData]);

  const pages = pagesData ? (useDataSaver ? pagesData.data_saver : pagesData.pages) : [];

  const handleRetryPage = (idx: number) => {
    setFailedPages((prev) => ({ ...prev, [idx]: false }));
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#07090e] text-white flex flex-col select-none"
    >
      {/* Sticky Reader Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 bg-black/85 backdrop-blur-md border-b border-gray-800 transition-transform duration-300 ${
          controlsVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Voltar aos detalhes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate">{mangaTitle}</h1>
              <p className="text-xs text-indigo-400 font-medium">
                Capítulo {chapter.chapter || 'Especial'}
                {chapter.title ? ` - ${chapter.title}` : ''}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Chapter switcher */}
            <select
              value={chapter.id}
              onChange={(e) => {
                const target = allChapters.find((c) => c.id === e.target.value);
                if (target) onSelectChapter(target);
              }}
              className="bg-gray-900 border border-gray-700 text-xs rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-indigo-500 max-w-[140px] sm:max-w-[200px]"
            >
              {allChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Cap. {c.chapter} ({c.language.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Mode switch: Vertical or Single Page */}
            <button
              type="button"
              onClick={() => setReaderMode(readerMode === 'vertical' ? 'single' : 'vertical')}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
              title={
                readerMode === 'vertical'
                  ? 'Modo Cascata (Webtoon) ativo. Mudar para Página Única'
                  : 'Modo Página Única ativo. Mudar para Cascata'
              }
            >
              {readerMode === 'vertical' ? (
                <Layers className="w-4 h-4 text-indigo-400" />
              ) : (
                <FileText className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Data saver toggle */}
            <button
              type="button"
              onClick={() => setUseDataSaver(!useDataSaver)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                useDataSaver
                  ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
              }`}
              title="Economizador de dados do MangaDex"
            >
              {useDataSaver ? 'Econômico' : 'HQ'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Reading Area */}
      <main
        onClick={() => setControlsVisible(!controlsVisible)}
        className="flex-1 flex flex-col items-center justify-center pt-16 pb-20 px-2 sm:px-0 cursor-default"
      >
        {loading ? (
          <div className="py-28 text-center text-gray-400">
            <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-base font-medium">Carregando páginas do MangaDex At-Home...</p>
            <p className="text-xs text-gray-500 mt-1">Conectando aos servidores de cache</p>
          </div>
        ) : error ? (
          <div className="max-w-md p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-200">Não foi possível carregar o capítulo</h3>
            <p className="text-xs text-red-300 mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-800/60 hover:bg-red-700/60 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        ) : pages.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">Nenhuma página disponível para este capítulo.</p>
          </div>
        ) : readerMode === 'vertical' ? (
          /* Continuous Vertical Webtoon Strip */
          <div className="w-full max-w-3xl flex flex-col items-center space-y-2">
            {pages.map((url, idx) => (
              <div
                key={idx}
                className="relative w-full min-h-[300px] flex items-center justify-center bg-gray-950/40 rounded-lg overflow-hidden"
              >
                {failedPages[idx] ? (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-xs mb-2">Erro ao carregar página {idx + 1}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetryPage(idx);
                      }}
                      className="px-3 py-1 bg-gray-800 text-xs rounded hover:bg-gray-700 text-gray-300"
                    >
                      Recarregar
                    </button>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Página ${idx + 1}`}
                    loading="lazy"
                    onError={() => setFailedPages((prev) => ({ ...prev, [idx]: true }))}
                    className="w-full h-auto object-contain select-none shadow-md"
                  />
                )}
                <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                  {idx + 1} / {pages.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Single Page Mode */
          <div className="relative w-full max-w-3xl flex flex-col items-center">
            <div className="relative w-full min-h-[500px] flex items-center justify-center bg-gray-950/60 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                className="max-h-[85vh] w-auto object-contain select-none"
              />
            </div>

            {/* Page navigation bar */}
            <div className="mt-4 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-800">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.max(p - 1, 0));
                }}
                className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-semibold text-gray-200">
                {currentPage + 1} / {pages.length}
              </span>

              <button
                type="button"
                disabled={currentPage === pages.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.min(p + 1, pages.length - 1));
                }}
                className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar: Chapter Navigation */}
      <footer
        className={`fixed bottom-0 inset-x-0 z-50 bg-black/85 backdrop-blur-md border-t border-gray-800 transition-transform duration-300 ${
          controlsVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={!prevChapter}
            onClick={() => prevChapter && onSelectChapter(prevChapter)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Capítulo Anterior</span>
          </button>

          <div className="text-xs text-gray-400">
            {pages.length > 0 ? `${pages.length} páginas` : ''}
          </div>

          <button
            type="button"
            disabled={!nextChapter}
            onClick={() => nextChapter && onSelectChapter(nextChapter)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-indigo-600/20 transition-all"
          >
            <span>Próximo Capítulo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
