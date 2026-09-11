import { Server, Cpu, ArrowDown, ShieldCheck } from 'lucide-react'
import { Stats } from '../types/project'

interface HeroProps {
  stats: Stats | null
}

export const Hero: React.FC<HeroProps> = ({ stats }) => {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge superior com TDD e Stack */}
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 border border-teal-500/30 px-4 py-1.5 text-xs font-semibold text-teal-300 shadow-lg mb-6 backdrop-blur">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <span>Test-Driven Development • Golang • React • Docker</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          Engenharia de Software de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400">
            Alta Performance
          </span>
        </h1>

        {/* Subtítulo com destaque aos projetos solicitados */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Portfólio com arquitetura resiliente e modular. Conheça meus projetos como a{' '}
          <strong className="text-teal-300 font-semibold">Plataforma de Investimentos</strong>, o{' '}
          <strong className="text-teal-300 font-semibold">Leitor de Mangás Online</strong> e outros sistemas de alto desempenho.
        </p>

        {/* Botões de Ação */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#projetos"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-3.5 text-sm font-bold shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
          >
            <span>Ver Projetos</span>
            <ArrowDown className="h-4 w-4" />
          </a>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 px-6 py-3.5 text-sm font-semibold border border-slate-800 transition-all hover:border-slate-700"
          >
            <span>Fale Comigo</span>
          </a>
        </div>

        {/* Cards de Métricas / Especificações do Servidor */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-center backdrop-blur">
            <div className="text-2xl sm:text-3xl font-black text-teal-400">
              {stats ? stats.total_projects : '3'}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Projetos Registrados
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-center backdrop-blur">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">
              {stats ? stats.total_views : '0'}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Visualizações Totais
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-center backdrop-blur">
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-black text-teal-300">
              <Cpu className="h-5 w-5 text-teal-400" />
              <span>4 Cores</span>
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Servidor Otimizado
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-center backdrop-blur">
            <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-black text-teal-300">
              <Server className="h-5 w-5 text-teal-400" />
              <span>8 GB RAM</span>
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Deploy Docker
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
