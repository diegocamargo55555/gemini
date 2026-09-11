import { useState, useEffect, useMemo } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ProjectCard } from './components/ProjectCard'
import { ProjectFilter } from './components/ProjectFilter'
import { ProjectModal } from './components/ProjectModal'
import { ContactForm } from './components/ContactForm'
import { Footer } from './components/Footer'
import { Project, Stats, ContactFormData } from './types/project'
import { Layers, Database, Container, Code2, AlertCircle, RefreshCw } from 'lucide-react'

export function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchPortfolioData = async () => {
    try {
      // 1. Health check
      const healthRes = await fetch('/api/health').catch(() => null)
      if (healthRes && healthRes.ok) {
        setApiStatus('online')
      } else {
        setApiStatus('offline')
      }

      // 2. Fetch Projects
      const projRes = await fetch('/api/projects')
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data)
      }

      // 3. Fetch Stats
      const statsRes = await fetch('/api/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Erro ao conectar com a API:', err)
      setApiStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  // Lista de categorias únicas extraídas dos projetos
  const categories = useMemo(() => {
    if (stats?.categories && stats.categories.length > 0) {
      return stats.categories
    }
    const catSet = new Set<string>()
    projects.forEach((p) => {
      if (p.category) catSet.add(p.category)
    })
    return Array.from(catSet)
  }, [projects, stats])

  // Filtragem combinada por categoria e busca textual
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchCat =
        selectedCategory === '' ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())

      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))

      return matchCat && matchSearch
    })
  }, [projects, selectedCategory, searchQuery])

  // Incremento de views e abertura do modal
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project)
    // Dispara incremento assíncrono na API
    fetch(`/api/projects/${project.slug}/view`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.views === 'number') {
          setProjects((prev) =>
            prev.map((p) => (p.slug === project.slug ? { ...p, views: data.views } : p))
          )
          setSelectedProject((prev) => (prev ? { ...prev, views: data.views } : null))
        }
      })
      .catch(() => {})
  }

  // Envio de formulário de contato para a API Go
  const handleContactSubmit = async (data: ContactFormData): Promise<boolean> => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.ok
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-slate-950">
      <Navbar apiStatus={apiStatus} />

      <main className="flex-grow">
        <Hero stats={stats} />

        {/* Alerta caso a API backend esteja offline durante desenvolvimento */}
        {apiStatus === 'offline' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>
                  O backend Go está offline ou inacessível no momento. Inicie o container Docker ou execute <code>go run ./cmd/server</code>.
                </span>
              </div>
              <button
                onClick={fetchPortfolioData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reconectar
              </button>
            </div>
          </div>
        )}

        {/* Seção de Projetos */}
        <section id="projetos" className="py-12 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                  Catálogo
                </span>
                <h2 className="text-3xl font-extrabold text-slate-100 mt-1">
                  Projetos Desenvolvidos
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Soluções completas com arquitetura limpa, alta performance e cobertura de testes.
                </p>
              </div>
            </div>

            {/* Filtros e Barra de Pesquisa */}
            <div className="mb-8">
              <ProjectFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Lista de Cards de Projetos */}
            {loading ? (
              <div className="py-20 text-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-teal-500 mb-3" />
                <p className="text-sm">Carregando catálogo de projetos...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8">
                <Code2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">Nenhum projeto encontrado</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tente alterar os termos da busca ou selecionar outra categoria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={handleSelectProject}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Seção Sobre a Stack & Arquitetura */}
        <section id="sobre" className="py-16 bg-slate-900/40 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Infraestrutura & Arquitetura
              </span>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">
                Construído para Durar e Escalar
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Projetado para rodar com eficiência máxima em servidor com 4 vCPUs e 8 GB de RAM,
                deixando a maior parte dos recursos livre para os sistemas finais (Plataforma de Investimentos e Leitor de Mangá).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Backend em Golang</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  API REST de baixa latência e consumo mínimo de memória (&lt; 25 MB RAM). Implementada seguindo Test-Driven Development (TDD).
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <Container className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Docker & Compose</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Ambiente padronizado, seguro e isolado com imagens multi-stage ultra-otimizadas e gerenciamento simples via Docker Compose.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">PostgreSQL & Hot-Reload</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Fonte de projetos em YAML com watcher de recarga em tempo real sincronizado ao banco PostgreSQL relacional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Contato */}
        <section id="contato" className="py-16 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Fale Conosco
              </span>
              <h2 className="text-3xl font-extrabold text-slate-100 mt-1">
                Vamos Conversar?
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Tem interesse em parcerias, sugestões ou dúvidas sobre os projetos de investimentos ou mangá? Envie uma mensagem!
              </p>
            </div>

            <ContactForm onSubmit={handleContactSubmit} />
          </div>
        </section>
      </main>

      <Footer />

      {/* Modal de Detalhes do Projeto */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  )
}
export default App
