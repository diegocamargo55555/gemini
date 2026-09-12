import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowLeftRight, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  PieChart, 
  ListOrdered,
  DollarSign
} from 'lucide-react';
import { FXRatesResponse } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
  fxRates: FXRatesResponse | null;
  onRefreshQuotes: () => void;
  isRefreshing: boolean;
  onOpenNewTransaction: () => void;
  onOpenNewOrder: () => void;
  onOpenTransfer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  baseCurrency,
  setBaseCurrency,
  fxRates,
  onRefreshQuotes,
  isRefreshing,
  onOpenNewTransaction,
  onOpenNewOrder,
  onOpenTransfer,
}) => {
  const currencies = ['BRL', 'USD', 'EUR', 'GBP'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Bar: FX Ticker & Fast Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Invest<span className="text-emerald-400">Hub</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Multimoeda & B3 / Yahoo
              </span>
            </div>
          </div>

          {/* FX Rates Live Bar */}
          <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-400 bg-slate-950/60 py-1.5 px-4 rounded-full border border-slate-800">
            <span className="text-slate-500 font-medium">Câmbio Comercial:</span>
            {fxRates?.popular_pairs ? (
              <>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-300">USD/BRL</span>
                  <span className="text-emerald-400 font-mono">
                    R$ {fxRates.popular_pairs['USD/BRL']?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-300">EUR/BRL</span>
                  <span className="text-emerald-400 font-mono">
                    R$ {fxRates.popular_pairs['EURBRL'] || fxRates.popular_pairs['EUR/BRL']?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-300">EUR/USD</span>
                  <span className="text-slate-300 font-mono">
                    $ {fxRates.popular_pairs['EUR/USD']?.toFixed(3)}
                  </span>
                </div>
              </>
            ) : (
              <span className="animate-pulse text-slate-500">Carregando cotações...</span>
            )}
          </div>

          {/* Base Currency & Quick Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Moeda Base */}
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-medium px-1.5 hidden sm:inline">Moeda Base:</span>
              {currencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setBaseCurrency(curr)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                    baseCurrency === curr
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Refresh Quotes */}
            <button
              onClick={onRefreshQuotes}
              disabled={isRefreshing}
              title="Atualizar cotações da B3 (Brapi) e Exterior (Yahoo Finance)"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Fast Action Dropdown or Buttons */}
            <button
              onClick={onOpenNewOrder}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Investir</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar: Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto no-scrollbar text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('investments')}
            className={`flex items-center space-x-2 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === 'investments'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Carteira de Ativos</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center space-x-2 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === 'accounts'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Minhas Contas</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center space-x-2 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === 'transactions'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Extrato / Transações</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center space-x-2 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === 'market'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Pesquisar Mercado</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
