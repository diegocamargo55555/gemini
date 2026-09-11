import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ContactForm } from './ContactForm'

describe('ContactForm Component', () => {
  it('renderiza os campos de entrada e o botão de envio', () => {
    render(<ContactForm onSubmit={async () => true} />)

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeInTheDocument()
  })

  it('exibe erro de validação para campos vazios', async () => {
    render(<ContactForm onSubmit={async () => true} />)

    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }))

    expect(await screen.findByText(/por favor, preencha todos os campos obrigatórios/i)).toBeInTheDocument()
  })

  it('chama onSubmit com os dados preenchidos e exibe sucesso', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(true)
    render(<ContactForm onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'joao@exemplo.com' } })
    fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: 'Olá! Gostaria de falar sobre o projeto.' } })

    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'João Silva',
        email: 'joao@exemplo.com',
        subject: '',
        message: 'Olá! Gostaria de falar sobre o projeto.',
      })
    })

    expect(await screen.findByText(/mensagem enviada com sucesso/i)).toBeInTheDocument()
  })
})
