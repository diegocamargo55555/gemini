import React from 'react'
import { ExternalLink, Eye, Sparkles, ArrowRight } from 'lucide-react'
import { Project } from '../types/project'

export const GithubIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

interface ProjectCardProps {
  project: Project
  onSelect: (project: Project) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 p-6 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-teal-500/10">
      {/* Imagem de Capa ou Placeholder elegante */}
      {project.cover_image && (
        <div className="relative mb-5 h-48 w-full overflow-hidden rounded-xl bg-slate-950">
          <img
            src={project.cover_image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        </div>
      )}

      <div>
        {/* Categoria e Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20">
            {project.category}
          </span>
          <div className="flex items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                <Sparkles className="h-3 w-3" />
                Destaque
              </span>
            )}
            {typeof project.views === 'number' && project.views > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Eye className="h-3.5 w-3.5" />
                {project.views}
              </span>
            )}
          </div>
        </div>

        {/* Título & Descrição Curta */}
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
          {project.title}
        </h3>
        <p className="mt-2.5 text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {project.short_description}
        </p>

        {/* Métricas em destaque (se existirem) */}
        {project.metrics && Object.keys(project.metrics).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/60">
            {Object.entries(project.metrics).slice(0, 2).map(([key, val]) => (
              <div key={key} className="text-center">
                <span className="block text-xs uppercase tracking-wider text-slate-400 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold text-teal-300">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags de Tecnologias */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Ações e Links */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onSelect(project)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
          aria-label={`Ver detalhes de ${project.title}`}
        >
          <span>Ver Detalhes</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Código no GitHub"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-teal-400 transition-colors"
              title="Acessar Demonstração Online"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
