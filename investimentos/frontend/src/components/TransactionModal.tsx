import React, { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Account, TransactionType } from '../types';
import { api } from '../api/client';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState<number>(0);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState('Alimentação');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const categoriesIncome = ['Salário', 'Freelance', 'Rendimentos', 'Venda', 'Bônus', 'Outros'];
  const categoriesExpense = [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Saúde',
    'Lazer & Viagem',
    'Educação',
    'Assinaturas',
    'Impostos',
    'Outros',
  ];

  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      setAccountId(accounts[0].id);
      setAmount('');
      setDescription('');
      setError('');
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.createTransaction({
        account_id: accountId,
        type,
        category,
        amount: parsedAmount,
        description: description.trim(),
        date: new Date(date).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação');
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

        <h3 className="text-lg font-bold text-white mb-1">Nova Movimentação</h3>
        <p className="text-xs text-slate-400 mb-5">
          Adicione receitas ou despesas nas suas contas correntes ou carteiras.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo: Receita ou Despesa */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('Alimentação');
              }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('Salário');
              }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Receita</span>
            </button>
          </div>

          {/* Conta */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Conta *</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Valor ({selectedAccount?.currency || 'BRL'}) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {(type === 'INCOME' ? categoriesIncome : categoriesExpense).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço de domingo, Salário mensal..."
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
              {isSubmitting ? 'Salvando...' : 'Salvar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
