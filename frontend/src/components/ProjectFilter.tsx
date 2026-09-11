import React from 'react'
import { Search, Filter } from 'lucide-react'

interface ProjectFilterProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Campo de Busca */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar projetos por nome, tecnologia..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl bg-slate-900/90 border border-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      </div>

      {/* Botões de Categorias */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filtro:
        </span>
        <button
          onClick={() => onSelectCategory('')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            selectedCategory === ''
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
          }`}
        >
          Todos
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
