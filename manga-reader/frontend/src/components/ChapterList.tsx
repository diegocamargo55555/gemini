import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  ArrowUpDown,
  Search,
  Globe,
} from 'lucide-react';
import { Chapter } from '../types/manga';

interface ChapterListProps {
  chapters: Chapter[];
  loading: boolean;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  order: 'asc' | 'desc';
  onOrderToggle: () => void;
  onSelectChapter: (chapter: Chapter) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  loading,
  selectedLanguage,
  onLanguageChange,
  order,
  onOrderToggle,
  onSelectChapter,
}) => {
  const [filterText, setFilterText] = useState('');

  const filtered = chapters.filter((c) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    const cNum = c.chapter.toLowerCase();
    const cTitle = (c.title || '').toLowerCase();
    const cGroup = (c.scanlation_group || '').toLowerCase();
    return cNum.includes(q) || cTitle.includes(q) || cGroup.includes(q);
  });

  return (
    <div className="bg-[#111625] rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-xl">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Capítulos Disponíveis</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
              {filtered.length}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Language filter buttons */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onLanguageChange('pt-br')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedLanguage === 'pt-br'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PT-BR
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedLanguage === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedLanguage === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={onOrderToggle}
            title={order === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-medium text-gray-300 rounded-xl transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>{order === 'desc' ? 'Decrescente' : 'Crescente'}</span>
          </button>
        </div>
      </div>

      {/* Chapter Search within list */}
      <div className="pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filtrar por número do capítulo, título ou scan..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Chapters Scrollable Table / List */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Carregando lista de capítulos do MangaDex...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Globe className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-medium">Nenhum capítulo encontrado com os filtros atuais.</p>
          <p className="text-xs text-gray-600 mt-1">
            Experimente selecionar outro idioma (ex: EN) ou limpar o campo de busca.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((chap) => {
            const isRead = chap.is_read;
            const isExternal = Boolean(chap.external_url);

            return (
              <div
                key={chap.id}
                onClick={() => {
                  if (isExternal && chap.external_url) {
                    window.open(chap.external_url, '_blank');
                  } else {
                    onSelectChapter(chap);
                  }
                }}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isRead
                    ? 'bg-gray-900/40 border-gray-800/60 text-gray-400 hover:bg-gray-800/40'
                    : 'bg-gray-900/80 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/60 text-gray-200'
                }`}
              >
                {/* Left side: Chapter Number, Title, Scan */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isRead
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        : 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                    }`}
                  >
                    {isRead ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      chap.chapter || 'SP'
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm group-hover:text-indigo-300 transition-colors truncate">
                        Capítulo {chap.chapter || 'Especial'}
                        {chap.title ? ` - ${chap.title}` : ''}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
                        {chap.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {chap.scanlation_group && (
                        <span className="truncate">Scan: {chap.scanlation_group}</span>
                      )}
                      {chap.pages > 0 && <span>{chap.pages} páginas</span>}
                    </div>
                  </div>
                </div>

                {/* Right side: Action icon */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isExternal ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                      <span>Externo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span className="hidden sm:inline">Ler agora</span>
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
