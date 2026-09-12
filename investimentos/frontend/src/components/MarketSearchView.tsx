import React, { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  PlusCircle,
  Clock,
  Building2,
  DollarSign
} from 'lucide-react';
import { api } from '../api/client';
import { QuoteResult, SearchResult } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

interface MarketSearchViewProps {
  onSelectAssetToBuy: (symbol: string, name: string, price: number, provider: string, currency: string) => void;
}

export const MarketSearchView: React.FC<MarketSearchViewProps> = ({ onSelectAssetToBuy }) => {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<'ALL' | 'BRAPI' | 'YAHOO'>('ALL');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResult | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Busca rápida com sugestões populares
  const popularTickers = [
    { symbol: 'PETR4', name: 'Petrobras PN', provider: 'BRAPI', flag: '🇧🇷' },
    { symbol: 'VALE3', name: 'Vale ON', provider: 'BRAPI', flag: '🇧🇷' },
    { symbol: 'HGLG11', name: 'CSHG Logística', provider: 'BRAPI', flag: '🇧🇷' },
    { symbol: 'MXRF11', name: 'Maxi Renda FII', provider: 'BRAPI', flag: '🇧🇷' },
    { symbol: 'AAPL', name: 'Apple Inc.', provider: 'YAHOO', flag: '🇺🇸' },
    { symbol: 'NVDA', name: 'Nvidia Corp.', provider: 'YAHOO', flag: '🇺🇸' },
    { symbol: 'VOO', name: 'Vanguard S&P 500', provider: 'YAHOO', flag: '🇺🇸' },
    { symbol: 'BTC-USD', name: 'Bitcoin', provider: 'YAHOO', flag: '🪙' },
  ];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const p = provider === 'ALL' ? undefined : provider;
      const results = await api.searchMarket(query.trim(), p);
      setSearchResults(results);
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInspectQuote = async (symbol: string, prov?: string) => {
    setIsLoadingQuote(true);
    setSelectedQuote(null);
    try {
      const quote = await api.getQuote(symbol, prov);
      setSelectedQuote(quote);
    } catch (err) {
      console.error('Erro ao obter cotação:', err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">
          Pesquisa de Cotações em Tempo Real
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Consulte ativos da <strong>B3</strong> (Ações, FIIs, BDRs via Brapi) e do <strong>Mercado Internacional</strong> (EUA, ETFs globais, Criptomoedas via Yahoo Finance).
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o código ou nome (ex: PETR4, MXRF11, AAPL, NVDA, BTC-USD)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todos os Provedores (Brapi + Yahoo)</option>
              <option value="BRAPI">🇧🇷 Brapi (B3 Brasil)</option>
              <option value="YAHOO">🇺🇸 Yahoo Finance (Exterior)</option>
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <span>Pesquisando...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center flex-wrap gap-2 pt-2 text-xs">
            <span className="text-slate-500 font-medium">Populares:</span>
            {popularTickers.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  setQuery(t.symbol);
                  handleInspectQuote(t.symbol, t.provider);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition flex items-center space-x-1"
              >
                <span>{t.flag}</span>
                <span className="font-mono">{t.symbol}</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Detalhe da Cotação em Destaque */}
      {isLoadingQuote && (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 animate-pulse text-slate-400 text-xs">
          Buscando cotação em tempo real na API...
        </div>
      )}

      {selectedQuote && !isLoadingQuote && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 border border-emerald-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-4">
              {selectedQuote.logo_url ? (
                <img
                  src={selectedQuote.logo_url}
                  alt={selectedQuote.symbol}
                  className="w-12 h-12 rounded-xl bg-slate-800 object-contain p-1 border border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-lg">
                  {selectedQuote.symbol.slice(0, 3)}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    {selectedQuote.symbol}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    {selectedQuote.provider}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedQuote.currency}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedQuote.long_name}</p>
              </div>
            </div>

            <button
              onClick={() =>
                onSelectAssetToBuy(
                  selectedQuote.symbol,
                  selectedQuote.long_name,
                  selectedQuote.current_price,
                  selectedQuote.provider,
                  selectedQuote.currency
                )
              }
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar à Carteira</span>
            </button>
          </div>

          {/* Métricas do Ativo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Preço Atual</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {formatCurrency(selectedQuote.current_price, selectedQuote.currency)}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">Variação no Dia</span>
              <div className="mt-0.5 flex items-center space-x-1 font-mono font-bold text-base">
                <span className={selectedQuote.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedQuote.change_percent >= 0 ? '+' : ''}
                  {formatPercent(selectedQuote.change_percent)}
                </span>
                <span className="text-xs text-slate-400">
                  ({selectedQuote.change >= 0 ? '+' : ''}{selectedQuote.change?.toFixed(2)})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">Faixa do Dia (Mín - Máx)</span>
              <div className="text-xs font-mono text-slate-200 mt-1">
                {selectedQuote.day_low?.toFixed(2)} - {selectedQuote.day_high?.toFixed(2)}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">Fechamento Anterior</span>
              <div className="text-xs font-mono text-slate-200 mt-1">
                {formatCurrency(selectedQuote.previous_close, selectedQuote.currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultados de Busca em Grid */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300">Resultados da Busca</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((item) => (
              <div
                key={item.symbol}
                onClick={() => handleInspectQuote(item.symbol, item.provider)}
                className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition font-mono">
                      {item.symbol}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-emerald-400">
                      {item.provider}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-800 text-slate-400">
                      {item.currency}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {item.name}
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition"
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
