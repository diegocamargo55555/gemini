import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  Globe
} from 'lucide-react';
import { PortfolioSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

interface SummaryCardsProps {
  summary: PortfolioSummary;
  baseCurrency: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, baseCurrency }) => {
  const isProfitable = summary.total_profit_loss >= 0;

  return (
    <div className="space-y-6">
      {/* 4 Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Patrimônio Líquido Total */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Patrimônio Consolidado</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(summary.total_net_worth, baseCurrency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">Caixa + Ativos</span>
            <span className="mx-1.5">•</span>
            <span>{summary.total_accounts_count} contas</span>
            <span className="mx-1.5">•</span>
            <span>{summary.total_assets_count} ativos</span>
          </div>
        </div>

        {/* 2. Saldo em Contas (Caixa) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Líquido em Contas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(summary.total_cash, baseCurrency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span>Disponível para aportes imediatos</span>
          </div>
        </div>

        {/* 3. Posição em Investimentos (Valor Atual) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mercado / Investido</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(summary.total_market_value, baseCurrency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span>Custo: {formatCurrency(summary.total_invested, baseCurrency)}</span>
          </div>
        </div>

        {/* 4. Lucro / Prejuízo da Carteira */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rendimento Acumulado</span>
            <div className={`p-2 rounded-xl ${isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isProfitable ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(summary.total_profit_loss, baseCurrency)}
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className={`font-semibold px-2 py-0.5 rounded-md ${isProfitable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {formatPercent(summary.total_profit_loss_pct)}
            </span>
            <span className="ml-2 text-slate-400">sobre o valor investido</span>
          </div>
        </div>
      </div>

      {/* Alocações: Moedas e Classes de Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição por Moeda */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Exposição por Moeda</h3>
            </div>
            <span className="text-xs text-slate-400">Convertido em {baseCurrency}</span>
          </div>

          {/* Barra de progresso multi-segmento */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex mb-4">
            {summary.currency_allocations.map((alloc, idx) => {
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={alloc.currency}
                  style={{ width: `${alloc.percentage}%` }}
                  className={`${color} h-full transition-all duration-500`}
                  title={`${alloc.currency}: ${alloc.percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Legenda de moedas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {summary.currency_allocations.map((alloc, idx) => {
              const dotColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
              return (
                <div key={alloc.currency} className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                    <span className="text-xs font-bold text-slate-200">{alloc.currency}</span>
                    <span className="text-[11px] font-semibold text-emerald-400 ml-auto">{alloc.percentage.toFixed(1)}%</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {formatCurrency(alloc.converted_amount, baseCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Classe de Ativo */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Alocação por Classe de Ativo</h3>
            </div>
            <span className="text-xs text-slate-400">Carteira & Caixa</span>
          </div>

          <div className="space-y-3">
            {summary.asset_type_allocations.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-mono">{formatCurrency(item.converted_amount, baseCurrency)}</span>
                    <span className="text-emerald-400 font-bold w-12 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
