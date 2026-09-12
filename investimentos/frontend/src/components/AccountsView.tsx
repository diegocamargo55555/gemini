import React from 'react';
import { 
  Plus, 
  ArrowLeftRight, 
  Edit3, 
  Trash2, 
  Landmark, 
  Wallet, 
  CircleDollarSign,
  TrendingUp,
  Coins
} from 'lucide-react';
import { Account, AccountType } from '../types';
import { formatCurrency } from '../utils/format';

interface AccountsViewProps {
  accounts: Account[];
  baseCurrency: string;
  fxRates: Record<string, number>;
  onOpenCreateAccount: () => void;
  onOpenEditAccount: (acc: Account) => void;
  onOpenTransfer: (acc?: Account) => void;
  onDeleteAccount: (id: number) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  baseCurrency,
  fxRates,
  onOpenCreateAccount,
  onOpenEditAccount,
  onOpenTransfer,
  onDeleteAccount,
}) => {
  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return <Landmark className="w-5 h-5 text-blue-400" />;
      case 'INVESTMENT':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'SAVINGS':
        return <CircleDollarSign className="w-5 h-5 text-amber-400" />;
      case 'CRYPTO':
        return <Coins className="w-5 h-5 text-purple-400" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return 'Conta Corrente';
      case 'INVESTMENT':
        return 'Corretora / Investimentos';
      case 'SAVINGS':
        return 'Reserva / Poupança';
      case 'CRYPTO':
        return 'Carteira Cripto';
      default:
        return 'Carteira Dinheiro';
    }
  };

  // Conversão de moeda local para moeda base do usuário
  const convertToBase = (amount: number, curr: string): number => {
    if (curr === baseCurrency) return amount;
    const rateFrom = fxRates[curr] || 1;
    const rateTo = fxRates[baseCurrency] || 1;
    if (rateTo <= 0) return amount;
    return (amount * rateFrom) / rateTo;
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Minhas Contas e Carteiras</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie saldos em Reais (BRL), Dólar (USD), Euro (EUR), Libra (GBP) ou Criptoativos.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenTransfer()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>Transferir / Câmbio</span>
          </button>
          <button
            onClick={onOpenCreateAccount}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const converted = convertToBase(acc.current_balance, acc.currency);
          const isBase = acc.currency === baseCurrency;

          return (
            <div
              key={acc.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative group transition"
            >
              {/* Header do Card */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2.5 rounded-xl border border-slate-700/60"
                      style={{ backgroundColor: `${acc.color}20` }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                        {acc.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>{acc.institution || getAccountTypeLabel(acc.type)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de Moeda */}
                  <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                    {acc.currency}
                  </span>
                </div>

                {/* Saldo na Moeda Nativa */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">Saldo Atual Disponível</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {formatCurrency(acc.current_balance, acc.currency)}
                  </div>

                  {/* Equivalente na moeda base */}
                  {!isBase && (
                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center space-x-1">
                      <span>≈ {formatCurrency(converted, baseCurrency)}</span>
                      <span className="text-[10px] text-slate-500 font-sans">(câmbio do dia)</span>
                    </div>
                  )}

                  {acc.notes && (
                    <p className="mt-3 text-xs text-slate-400 italic line-clamp-1">
                      "{acc.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Ações Rápidas no Rodapé */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenTransfer(acc)}
                  className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 font-medium transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transferir</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenEditAccount(acc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Editar Conta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteAccount(acc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Excluir Conta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Card Criar Nova Conta */}
        <button
          onClick={onOpenCreateAccount}
          className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition group min-h-[220px]"
        >
          <div className="p-3 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 transition mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Adicionar Nova Conta</span>
          <span className="text-xs text-slate-400 mt-1">BRL, USD, EUR, GBP, Cripto...</span>
        </button>
      </div>
    </div>
  );
};
