import React, { useState, useEffect } from 'react';
import { X, Search, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Account, Asset, AssetType, MarketProvider } from '../types';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialAsset?: Asset | null;
  onSuccess: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialAsset,
  onSuccess,
}) => {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY');
  const [accountId, setAccountId] = useState<number>(0);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('STOCK_BR');
  const [marketProvider, setMarketProvider] = useState<MarketProvider>('BRAPI');
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('');
  const [fees, setFees] = useState('0');
  const [notes, setNotes] = useState('');
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedAccount = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    if (!isOpen) return;

    if (initialAsset) {
      setAccountId(initialAsset.account_id);
      setSymbol(initialAsset.symbol);
      setName(initialAsset.name);
      setAssetType(initialAsset.asset_type);
      setMarketProvider(initialAsset.market_provider);
      setPrice(String(initialAsset.current_price || ''));
      setOrderType('BUY');
    } else {
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
      setSymbol('');
      setName('');
      setPrice('');
      setOrderType('BUY');
    }
    setError('');
  }, [isOpen, initialAsset, accounts]);

  // Ao mudar conta, auto-ajusta provedor padrão
  useEffect(() => {
    if (!selectedAccount || initialAsset) return;
    if (selectedAccount.currency === 'BRL') {
      setMarketProvider('BRAPI');
      setAssetType('STOCK_BR');
    } else {
      setMarketProvider('YAHOO');
      setAssetType('STOCK_US');
    }
  }, [accountId]);

  const handleFetchCurrentPrice = async () => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;

    setIsFetchingQuote(true);
    setError('');
    try {
      const quote = await api.getQuote(s, marketProvider);
      if (quote) {
        setPrice(String(quote.current_price));
        if (!name || name === s) {
          setName(quote.long_name || quote.short_name);
        }
      }
    } catch (err: any) {
      setError('Cotação não encontrada: ' + (err.message || ''));
    } finally {
      setIsFetchingQuote(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount =
    orderType === 'DIVIDEND'
      ? (parseFloat(quantity) || 0) * (parseFloat(price) || 0)
      : (parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fees) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    const fe = parseFloat(fees) || 0;

    if (!symbol.trim()) {
      setError('Informe o código do ativo');
      return;
    }
    if (!qty || qty <= 0) {
      setError('Quantidade deve ser maior que zero');
      return;
    }
    if (!prc || prc <= 0) {
      setError('Preço deve ser maior que zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.createOrder({
        account_id: accountId,
        symbol: symbol.trim().toUpperCase(),
        name: name.trim() || symbol.trim().toUpperCase(),
        asset_type: assetType,
        market_provider: marketProvider,
        type: orderType,
        quantity: qty,
        price: prc,
        fees: fe,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar operação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>Operação com Ativo</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Compre, venda ou registre proventos (dividendos/JCP) na sua carteira.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo de Operação */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setOrderType('BUY')}
              className={`py-2 rounded-lg font-bold transition ${
                orderType === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => setOrderType('SELL')}
              className={`py-2 rounded-lg font-bold transition ${
                orderType === 'SELL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Venda
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DIVIDEND')}
              className={`py-2 rounded-lg font-bold transition ${
                orderType === 'DIVIDEND'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dividendo
            </button>
          </div>

          {/* Conta / Corretora */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Conta / Corretora *</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency}) — Saldo: {formatCurrency(a.current_balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Código do Ativo com Botão de Buscar Preço */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Código do Ativo (Ticker) *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Ex: PETR4, VALE3, HGLG11, AAPL, NVDA, BTC-USD..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleFetchCurrentPrice}
                disabled={isFetchingQuote || !symbol}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition disabled:opacity-50 flex items-center space-x-1"
                title="Consultar cotação ao vivo via API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingQuote ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Cotação</span>
              </button>
            </div>
          </div>

          {/* Nome e Classe de Ativo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome do Ativo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Petrobras PN"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Classe do Ativo</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="STOCK_BR">Ação Brasil (B3)</option>
                <option value="FII">FII (Fundo Imobiliário)</option>
                <option value="BDR">BDR</option>
                <option value="STOCK_US">Ação EUA (Global)</option>
                <option value="ETF_GLOBAL">ETF Global</option>
                <option value="CRYPTO">Criptoativo</option>
                <option value="FIXED_INC">Renda Fixa</option>
              </select>
            </div>
          </div>

          {/* Provedor de Mercado (Brapi vs Yahoo) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Fonte de Cotação</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                marketProvider === 'BRAPI'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="marketProvider"
                  value="BRAPI"
                  checked={marketProvider === 'BRAPI'}
                  onChange={() => setMarketProvider('BRAPI')}
                  className="hidden"
                />
                <span className="font-bold">🇧🇷 Brapi (B3)</span>
              </label>

              <label className={`p-2.5 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                marketProvider === 'YAHOO'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="marketProvider"
                  value="YAHOO"
                  checked={marketProvider === 'YAHOO'}
                  onChange={() => setMarketProvider('YAHOO')}
                  className="hidden"
                />
                <span className="font-bold">🌐 Yahoo Finance</span>
              </label>
            </div>
          </div>

          {/* Quantidade, Preço Unitário e Taxas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {orderType === 'DIVIDEND' ? 'Cotas' : 'Quantidade *'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {orderType === 'DIVIDEND' ? 'Provento/Cota *' : 'Preço Unitário *'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Taxas/Corretagem</label>
              <input
                type="number"
                step="any"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                disabled={orderType === 'DIVIDEND'}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Resumo Financeiro da Ordem */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total da Operação:</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatCurrency(totalAmount, selectedAccount?.currency || 'BRL')}
            </span>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aporte mensal com preço de fechamento..."
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <span>{isSubmitting ? 'Processando...' : 'Confirmar Operação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
