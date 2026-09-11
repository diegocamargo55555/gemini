import React, { useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { ContactFormData } from '../types/project'

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<boolean>
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    if (formData.message.trim().length < 5) {
      setError('A mensagem deve ter pelo menos 5 caracteres.')
      return
    }

    setLoading(true)
    try {
      const ok = await onSubmit(formData)
      if (ok) {
        setSuccess(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setError('Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.')
      }
    } catch {
      setError('Falha na comunicação com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Mensagem enviada com sucesso! Entrarei em contato em breve.</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Nome <span className="text-teal-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Seu nome completo"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          E-mail <span className="text-teal-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="seu.email@exemplo.com"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Assunto
        </label>
        <input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Ex: Parceria em Projeto / Oportunidade"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Mensagem <span className="text-teal-400">*</span>
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Descreva sua proposta, dúvida ou feedback sobre os projetos..."
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3.5 text-sm transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Enviar Mensagem</span>
          </>
        )}
      </button>
    </form>
  )
}
