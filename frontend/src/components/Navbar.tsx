import React from 'react'
import { Terminal, Activity } from 'lucide-react'
import { GithubIcon } from './ProjectCard'

interface NavbarProps {
  apiStatus: 'online' | 'offline' | 'checking'
}

export const Navbar: React.FC<NavbarProps> = ({ apiStatus }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Título */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-100">
              Dev<span className="text-teal-400">Portfolio</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-mono">
              [Go • React • Docker]
            </span>
          </div>
        </a>

        {/* Links de Navegação */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a
            href="#projetos"
            className="text-slate-300 hover:text-teal-400 transition-colors"
          >
            Projetos
          </a>
          <a
            href="#sobre"
            className="text-slate-300 hover:text-teal-400 transition-colors hidden sm:block"
          >
            Sobre
          </a>
          <a
            href="#contato"
            className="text-slate-300 hover:text-teal-400 transition-colors"
          >
            Contato
          </a>

          {/* Status da API em Tempo Real */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono"
            title="Status da API Backend Golang"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : apiStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              API: {apiStatus.toUpperCase()}
            </span>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            aria-label="Perfil do GitHub"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  )
}
