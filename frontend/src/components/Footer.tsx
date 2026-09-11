import { Terminal } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-teal-400" />
          <span>Construído com Golang, React & Docker sob metodologia TDD</span>
        </div>

        <div>
          <span>Hospedado em Servidor VPS (4 vCPUs • 8 GB RAM • PostgreSQL)</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Criado com foco em simplicidade & performance</span>
        </div>
      </div>
    </footer>
  )
}
