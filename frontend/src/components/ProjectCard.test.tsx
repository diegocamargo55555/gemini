import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectCard } from './ProjectCard'
import { Project } from '../types/project'

const mockProject: Project = {
  id: 'investimentos-test',
  title: 'Site de Investimentos',
  slug: 'site-de-investimentos',
  short_description: 'Plataforma para gestão financeira e cotações',
  description: 'Descrição completa',
  category: 'Investimentos',
  tags: ['Golang', 'React', 'PostgreSQL'],
  cover_image: '/images/inv.png',
  demo_url: 'https://demo.com',
  github_url: 'https://github.com/test/repo',
  status: 'completed',
  featured: true,
  order: 1,
  metrics: {
    ativos: '5.000+',
  },
  views: 42,
}

describe('ProjectCard Component', () => {
  it('renderiza o título, categoria e descrição do projeto', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />)

    expect(screen.getByText('Site de Investimentos')).toBeInTheDocument()
    expect(screen.getByText('Investimentos')).toBeInTheDocument()
    expect(screen.getByText('Plataforma para gestão financeira e cotações')).toBeInTheDocument()
  })

  it('renderiza as tags do projeto', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />)

    expect(screen.getByText('Golang')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })

  it('exibe o badge de destaque quando featured é true', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />)

    expect(screen.getByText(/destaque/i)).toBeInTheDocument()
  })

  it('chama onSelect ao clicar no botão de detalhes', () => {
    const handleSelect = vi.fn()
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />)

    const btn = screen.getByRole('button', { name: /detalhes/i })
    fireEvent.click(btn)

    expect(handleSelect).toHaveBeenCalledWith(mockProject)
  })
})
