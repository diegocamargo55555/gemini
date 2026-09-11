import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectFilter } from './ProjectFilter'

describe('ProjectFilter Component', () => {
  const categories = ['Fintech & Investimentos', 'Entretenimento & Mangá']

  it('renderiza os botões de categorias incluindo "Todos"', () => {
    render(
      <ProjectFilter
        categories={categories}
        selectedCategory=""
        onSelectCategory={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: /todos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fintech & investimentos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entretenimento & mangá/i })).toBeInTheDocument()
  })

  it('chama onSelectCategory quando uma categoria é clicada', () => {
    const handleCategory = vi.fn()
    render(
      <ProjectFilter
        categories={categories}
        selectedCategory=""
        onSelectCategory={handleCategory}
        searchQuery=""
        onSearchChange={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /fintech & investimentos/i }))
    expect(handleCategory).toHaveBeenCalledWith('Fintech & Investimentos')
  })

  it('chama onSearchChange ao digitar no campo de busca', () => {
    const handleSearch = vi.fn()
    render(
      <ProjectFilter
        categories={categories}
        selectedCategory=""
        onSelectCategory={() => {}}
        searchQuery=""
        onSearchChange={handleSearch}
      />
    )

    const input = screen.getByPlaceholderText(/buscar projetos/i)
    fireEvent.change(input, { target: { value: 'manga' } })

    expect(handleSearch).toHaveBeenCalledWith('manga')
  })
})
