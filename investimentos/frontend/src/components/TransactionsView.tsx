import React, { useState } from 'react';
import { 
  Plus, 
  ArrowLeftRight, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Search, 
  Trash2, 
  Calendar,
  Filter
} from 'lucide-react';
import { Transaction, Account, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onOpenNewTransaction: () => void;
  onOpenTransfer: () => void;
  onDeleteTransaction: (id: number) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onOpenNewTransaction,
  onOpenTransfer,
  onDeleteTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');

  const filtered = transactions.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterAccount !== 'ALL' && String(t.account_id) !== filterAccount) return false;
    if (search) {
      const s = search.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      if (!desc.includes(s) && !cat.includes(s)) return false;
    }
    return true;
  });

  const getTxTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'INCOME':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpCircle className="w-3 h-3 mr-1" /> Receita
          </span>
        );
      case 'EXPENSE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownCircle className="w-3 h-3 mr-1" /> Despesa
          </span>
        );
      case 'TRANSFER_OUT':
      case 'TRANSFER_IN':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ArrowLeftRight className="w-3 h-3 mr-1" /> Transferência
          </span>
        );
      case 'INVESTMENT_BUY':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Aporte / Compra
          </span>
        );
      case 'INVESTMENT_SELL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Resgate / Venda
          </span>
        );
      case 'DIVIDEND':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-3 h-3 mr-1" /> Proventos
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Extrato & Fluxo de Caixa</h2>
          <p className="text-xs text-slate-400 mt-1">
            Histórico completo de entradas, saídas, câmbio multimoeda e dividendos recebidos.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenTransfer}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>Transferir</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">Todos os Tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
          <option value="DIVIDEND">Dividendos / Proventos</option>
          <option value="TRANSFER_OUT">Transferências Enviadas</option>
          <option value="TRANSFER_IN">Transferências Recebidas</option>
          <option value="INVESTMENT_BUY">Compras de Ativos</option>
          <option value="INVESTMENT_SELL">Vendas de Ativos</option>
        </select>

        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">Todas as Contas</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Transações */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isPositive =
                    t.type === 'INCOME' ||
                    t.type === 'DIVIDEND' ||
                    t.type === 'INVESTMENT_SELL' ||
                    t.type === 'TRANSFER_IN';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTxTypeBadge(t.type)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {t.description || 'Sem descrição'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {t.account?.name || `Conta #${t.account_id}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? '+' : '-'} {formatCurrency(t.amount, t.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                          title="Remover transação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
