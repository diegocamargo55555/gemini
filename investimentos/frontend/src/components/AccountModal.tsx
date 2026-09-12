import React, { useState, useEffect } from 'react';
import { X, Landmark, Wallet, Coins } from 'lucide-react';
import { Account, AccountType } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Account>) => Promise<void>;
  accountToEdit?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency] = useState('BRL');
  const [initialBalance, setInitialBalance] = useState('0');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro (R$)', flag: '🇧🇷' },
    { code: 'USD', name: 'Dólar Americano ($)', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro (€)', flag: '🇪🇺' },
    { code: 'GBP', name: 'Libra Esterlina (£)', flag: '🇬🇧' },
    { code: 'CAD', name: 'Dólar Canadense (C$)', flag: '🇨🇦' },
    { code: 'JPY', name: 'Iene Japonês (¥)', flag: '🇯🇵' },
    { code: 'BTC', name: 'Bitcoin (BTC)', flag: '🪙' },
  ];

  const colors = [
    '#8A05BE', // Nubank Roxo
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#64748B', // Slate
  ];

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency);
      setInitialBalance(String(accountToEdit.initial_balance || 0));
      setInstitution(accountToEdit.institution || '');
      setColor(accountToEdit.color || '#3B82F6');
      setNotes(accountToEdit.notes || '');
    } else {
      setName('');
      setType('CHECKING');
      setCurrency('BRL');
      setInitialBalance('0');
      setInstitution('');
      setColor('#3B82F6');
      setNotes('');
    }
    setError('');
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nome da conta é obrigatório');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        type,
        currency,
        initial_balance: parseFloat(initialBalance) || 0,
        institution: institution.trim(),
        color,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">
          {accountToEdit ? 'Editar Conta' : 'Nova Conta Multimoeda'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Cadastre contas em Real, Dólar, Euro ou Cripto para gerenciar seu patrimônio.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nome da Conta */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nome da Conta *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Nomad Dólar, XP Investimentos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Moeda */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Moeda da Conta *</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!!accountToEdit}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Conta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tipo de Conta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="CHECKING">Conta Corrente</option>
                <option value="INVESTMENT">Corretora / Investimentos</option>
                <option value="SAVINGS">Reserva / Poupança</option>
                <option value="CASH">Dinheiro Físico</option>
                <option value="CRYPTO">Carteira Cripto</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Instituição</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Inter, XP, Charles Schwab"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Saldo Inicial (apenas na criação) */}
          {!accountToEdit && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Saldo Inicial ({currency})</label>
              <input
                type="number"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Cor Visual */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Cor Identificadora</label>
            <div className="flex items-center space-x-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações opcionais sobre esta conta..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
