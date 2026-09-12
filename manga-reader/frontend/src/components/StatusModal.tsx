import React, { useState, useEffect } from 'react';
import { X, BookOpen, Bookmark, CheckCircle, XCircle, Trash2, Star } from 'lucide-react';
import { LibraryCategory, Manga, UserLibraryEntry } from '../types/manga';
import { api } from '../services/api';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  manga: Manga;
  currentEntry?: UserLibraryEntry | null;
  onSaved: (status: LibraryCategory | 'none') => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  manga,
  currentEntry,
  onSaved,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LibraryCategory | 'none'>('none');
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (currentEntry) {
      setSelectedStatus(currentEntry.status);
      setRating(currentEntry.rating || 0);
      setNotes(currentEntry.notes || '');
    } else if (manga.library_status && manga.library_status !== 'none') {
      setSelectedStatus(manga.library_status as LibraryCategory);
    } else {
      setSelectedStatus('plan_to_read');
    }
  }, [isOpen, currentEntry, manga]);

  if (!isOpen) return null;

  const categories: {
    id: LibraryCategory;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    activeColor: string;
    borderActive: string;
  }[] = [
    {
      id: 'reading',
      label: 'Lendo (Reading)',
      description: 'Acompanhando ativamente os capítulos',
      icon: BookOpen,
      activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      borderActive: 'border-emerald-500',
    },
    {
      id: 'plan_to_read',
      label: 'Pretendo Ler (Plan to Read)',
      description: 'Salvo na lista para leitura futura',
      icon: Bookmark,
      activeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
      borderActive: 'border-sky-500',
    },
    {
      id: 'finished',
      label: 'Concluído (Finished)',
      description: 'Leitura finalizada com sucesso',
      icon: CheckCircle,
      activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      borderActive: 'border-purple-500',
    },
    {
      id: 'dropped',
      label: 'Dropado (Dropped)',
      description: 'Leitura interrompida / abandonada',
      icon: XCircle,
      activeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      borderActive: 'border-rose-500',
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedStatus === 'none') {
        await api.deleteLibraryEntry(manga.id);
        onSaved('none');
      } else {
        await api.saveLibraryEntry({
          manga_id: manga.id,
          title: manga.title,
          cover_url: manga.cover_url,
          status: selectedStatus,
          rating,
          notes,
        });
        onSaved(selectedStatus);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Erro ao salvar categoria na biblioteca.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121826] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex gap-4 items-center mb-6 pr-8">
          {manga.cover_url && (
            <img
              src={manga.cover_url}
              alt={manga.title}
              className="w-14 h-20 object-cover rounded-lg border border-gray-700 shadow-md shrink-0"
            />
          )}
          <div>
            <h3 className="text-lg font-bold text-white line-clamp-1">{manga.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Gerenciar status na sua biblioteca</p>
          </div>
        </div>

        {/* Category options */}
        <div className="space-y-2.5 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Selecione a Categoria:
          </label>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedStatus === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedStatus(cat.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${cat.activeColor} ring-2 ring-offset-2 ring-offset-[#121826] ring-indigo-500/50`
                    : 'bg-gray-900/40 border-gray-800 text-gray-300 hover:bg-gray-800/40 hover:border-gray-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-white/10' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{cat.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{cat.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rating and Notes */}
        {selectedStatus !== 'none' && (
          <div className="space-y-4 mb-6 pt-4 border-t border-gray-800">
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                <span>Sua Avaliação (Nota):</span>
                <span className="text-amber-400 font-bold text-sm">
                  {rating > 0 ? `${rating} / 10` : 'Sem nota'}
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="p-1 text-gray-600 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Notas Pessoais:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Parei no capítulo 42, mangá muito bom..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentEntry ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => setSelectedStatus('none')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                selectedStatus === 'none'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-gray-400 hover:text-rose-400 hover:bg-rose-950/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover da biblioteca</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
