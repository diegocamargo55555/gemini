import React, { useEffect } from 'react'
import { X, ExternalLink, Sparkles, Eye, CheckCircle2 } from 'lucide-react'
import { Project } from '../types/project'
import { GithubIcon } from './ProjectCard'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (project) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [project, onClose])

  if (!project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-10 my-auto max-h-[90vh] flex flex-col">
        {/* Header com Capa e Botão Fechar */}
        <div className="relative h-64 w-full bg-slate-950 flex-shrink-0">
          {project.cover_image && (
            <img
              src={project.cover_image}
              alt={project.title}
              className="h-full w-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-slate-950/70 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700/50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30 backdrop-blur">
              {project.category}
            </span>
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Projeto em Destaque
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-100">{project.title}</h2>
            <p className="mt-2 text-base text-slate-300 leading-relaxed">
              {project.short_description}
            </p>
          </div>

          {/* Métricas do Projeto */}
          {project.metrics && Object.keys(project.metrics).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-slate-950/80 p-4 border border-slate-800">
              {Object.entries(project.metrics).map(([key, val]) => (
                <div key={key} className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-xs uppercase tracking-wider text-slate-400 capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="mt-1 text-base font-bold text-teal-300">{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Descrição Completa */}
          <div className="space-y-3 border-t border-slate-800/80 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Sobre o Projeto
            </h4>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
              {project.description}
            </div>
          </div>

          {/* Tecnologias Utilizadas */}
          <div className="border-t border-slate-800/80 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Stack Tecnológica
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-teal-300 border border-slate-700/60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {typeof project.views === 'number' && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {project.views} visualizações
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-sm font-semibold transition-colors border border-slate-700"
              >
                <GithubIcon className="h-4 w-4" />
                <span>Ver Código</span>
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-2.5 text-sm font-bold transition-all shadow-md shadow-teal-500/20"
              >
                <span>Acessar Demo</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
