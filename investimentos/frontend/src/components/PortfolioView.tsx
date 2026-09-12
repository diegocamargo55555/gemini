import React, { useState } from 'react';
import { 
  PlusCircle, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  MinusCircle, 
  Trash2, 
  ExternalLink,
  Filter,
  Coins
} from 'lucide-react';
import { Asset, Account } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

interface PortfolioViewProps {
  assets: Asset[];
  accounts: Account[];
  baseCurrency: string;
  onOpenNewOrder: (asset?: Asset) => void;
  onRefreshQuotes: () => void;
  isRefreshing: boolean;
  onDeleteAsset: (id: number) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  assets,
  accounts,
  baseCurrency,
  onOpenNewOrder,
  onRefreshQuotes,
  isRefreshing,
  onDeleteAsset,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');

  const filteredAssets = assets.filter((a) => {
    if (filterType !== 'ALL' && a.asset_type !== filterType) return false;
    if (filterAccount !== 'ALL' && String(a.account_id) !== filterAccount) return false;
    return true;
  });

  const getAssetTypeBadge = (type: string) => {
    switch (type) {
      case 'STOCK_BR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Ação Brasil</span>;
      case 'FII':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">FII</span>;
      case 'BDR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">BDR</span>;
      case 'STOCK_US':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Ação EUA</span>;
      case 'ETF_GLOBAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">ETF Global</span>;
      case 'CRYPTO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Cripto</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">Ativo</span>;
    }
  };

  const getProviderBadge = (provider: string) => {
    if (provider === 'BRAPI') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
          <span>🇧🇷 Brapi</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
        <span>🌐 Yahoo</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Filtros e Ações */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Carteira de Investimentos</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cotações automáticas via <strong>Brapi</strong> (B3 Brasil) e <strong>Yahoo Finance</strong> (EUA e Cripto).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filtro por Classe */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos os Tipos</option>
              <option value="STOCK_BR" className="bg-slate-900">Ações Brasil (B3)</option>
              <option value="FII" className="bg-slate-900">FIIs (Imobiliário)</option>
              <option value="STOCK_US" className="bg-slate-900">Ações EUA (Global)</option>
              <option value="ETF_GLOBAL" className="bg-slate-900">ETFs</option>
              <option value="CRYPTO" className="bg-slate-900">Cripto</option>
            </select>
          </div>

          {/* Filtro por Conta */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none px-2 py-1 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todas as Contas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Botão Atualizar Cotações */}
          <button
            onClick={onRefreshQuotes}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
            title="Buscar cotações em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}</span>
          </button>

          {/* Botão Novo Aporte / Ordem */}
          <button
            onClick={() => onOpenNewOrder()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Operação</span>
          </button>
        </div>
      </div>

      {/* Tabela de Ativos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-4">Ativo</th>
                <th className="py-3.5 px-4">Conta & Moeda</th>
                <th className="py-3.5 px-4 text-right">Qtd</th>
                <th className="py-3.5 px-4 text-right">Preço Médio</th>
                <th className="py-3.5 px-4 text-right">Cotação Atual</th>
                <th className="py-3.5 px-4 text-right">Var. Dia</th>
                <th className="py-3.5 px-4 text-right">Total Investido</th>
                <th className="py-3.5 px-4 text-right">Valor Mercado</th>
                <th className="py-3.5 px-4 text-right">Lucro / Prejuízo</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum ativo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isProfitable = asset.profit_loss >= 0;
                  const isDayUp = asset.day_change_percent >= 0;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-800/40 transition group">
                      {/* Ativo e Logo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {asset.logo_url ? (
                            <img
                              src={asset.logo_url}
                              alt={asset.symbol}
                              className="w-8 h-8 rounded-lg bg-slate-800 object-contain p-0.5 border border-slate-700"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-extrabold text-[11px] text-slate-300 border border-slate-700">
                              {asset.symbol.slice(0, 3)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-white text-sm tracking-tight">
                                {asset.symbol}
                              </span>
                              {getProviderBadge(asset.market_provider)}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[140px]">
                              {asset.name}
                            </div>
                            <div className="mt-1">
                              {getAssetTypeBadge(asset.asset_type)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Conta & Moeda */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">
                          {asset.account?.name || 'Corretora'}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400">
                          {asset.currency}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {asset.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                      </td>

                      {/* Preço Médio */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(asset.average_price, asset.currency)}
                      </td>

                      {/* Cotação Atual */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(asset.current_price, asset.currency)}
                      </td>

                      {/* Variação no Dia */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                          isDayUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                          {isDayUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {formatPercent(asset.day_change_percent)}
                        </span>
                      </td>

                      {/* Total Investido */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(asset.total_invested, asset.currency)}
                      </td>

                      {/* Valor de Mercado */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white">
                        {formatCurrency(asset.current_total_value, asset.currency)}
                      </td>

                      {/* Lucro / Prejuízo */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-mono font-extrabold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(asset.profit_loss, asset.currency)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatPercent(asset.profit_loss_percent)}
                        </div>
                      </td>

                      {/* Botões de Ação Rápida */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onOpenNewOrder(asset)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                            title="Comprar mais / Realizar Ordem"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteAsset(asset.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Excluir Ativo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
