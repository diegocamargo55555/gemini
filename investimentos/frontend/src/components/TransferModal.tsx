import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { Account } from '../types';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialFromAccount?: Account | null;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialFromAccount,
  onSuccess,
}) => {
  const [fromAccountId, setFromAccountId] = useState<number>(0);
  const [toAccountId, setToAccountId] = useState<number>(0);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isAutoConverting, setIsAutoConverting] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  useEffect(() => {
    if (isOpen && accounts.length >= 2) {
      const from = initialFromAccount ? initialFromAccount.id : accounts[0].id;
      const to = accounts.find((a) => a.id !== from)?.id || accounts[1].id;
      setFromAccountId(from);
      setToAccountId(to);
      setFromAmount('');
      setToAmount('');
      setDescription('');
      setError('');
    }
  }, [isOpen, initialFromAccount, accounts]);

  // Atualiza taxa de câmbio automaticamente quando as contas mudam
  useEffect(() => {
    if (!fromAcc || !toAcc) return;

    if (fromAcc.currency === toAcc.currency) {
      setExchangeRate(1);
      if (fromAmount) setToAmount(fromAmount);
      return;
    }

    const fetchRate = async () => {
      setIsAutoConverting(true);
      try {
        const res = await api.convertCurrency(1, fromAcc.currency, toAcc.currency);
        setExchangeRate(res.rate);
        if (fromAmount) {
          const calculated = (parseFloat(fromAmount) || 0) * res.rate;
          setToAmount(calculated.toFixed(2));
        }
      } catch (err) {
        console.error('Falha ao obter taxa cambial:', err);
      } finally {
        setIsAutoConverting(false);
      }
    };

    fetchRate();
  }, [fromAccountId, toAccountId]);

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    const num = parseFloat(val) || 0;
    if (exchangeRate > 0) {
      setToAmount((num * exchangeRate).toFixed(2));
    }
  };

  const handleToAmountChange = (val: string) => {
    setToAmount(val);
    const num = parseFloat(val) || 0;
    const fNum = parseFloat(fromAmount) || 0;
    if (fNum > 0) {
      setExchangeRate(num / fNum);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fAmt = parseFloat(fromAmount);
    const tAmt = parseFloat(toAmount);

    if (!fAmt || fAmt <= 0) {
      setError('Informe um valor válido para transferência');
      return;
    }
    if (!tAmt || tAmt <= 0) {
      setError('Valor de destino inválido');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('A conta de origem e destino devem ser diferentes');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        from_amount: fAmt,
        to_amount: tAmt,
        exchange_rate: exchangeRate,
        description: description.trim() || `Transferência de ${fromAcc?.name} para ${toAcc?.name}`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar transferência');
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

        <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
          <span>Transferência & Câmbio</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Mova saldo entre contas ou simule remessas internacionais multimoeda.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* De */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">De (Origem)</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              {fromAcc && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Saldo: {formatCurrency(fromAcc.current_balance, fromAcc.currency)}
                </span>
              )}
            </div>

            {/* Para */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Para (Destino)</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
              </select>
              {toAcc && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Saldo: {formatCurrency(toAcc.current_balance, toAcc.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Valor Enviado ({fromAcc?.currency}) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Valor Recebido ({toAcc?.currency}) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Indicador de Taxa de Câmbio */}
          {fromAcc?.currency !== toAcc?.currency && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
              <span className="text-slate-400">Taxa Cambial Aplicada:</span>
              <span className="font-mono font-bold text-emerald-400">
                1 {fromAcc?.currency} = {exchangeRate.toFixed(4)} {toAcc?.currency}
              </span>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Câmbio para viagem, aporte internacional..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Transferindo...' : 'Confirmar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
