import React, { useState, useEffect } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { AccountsView } from './components/AccountsView';
import { PortfolioView } from './components/PortfolioView';
import { TransactionsView } from './components/TransactionsView';
import { MarketSearchView } from './components/MarketSearchView';
import { AccountModal } from './components/AccountModal';
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { OrderModal } from './components/OrderModal';
import { api } from './api/client';
import { 
  Account, 
  Asset, 
  PortfolioSummary, 
  Transaction, 
  FXRatesResponse 
} from './types';
import { 
  PlusCircle, 
  TrendingUp, 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatPercent } from './utils/format';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [baseCurrency, setBaseCurrency] = useState<string>('BRL');

  // Dados da Aplicação
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fxRates, setFxRates] = useState<FXRatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Estados dos Modais
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInitialFrom, setTransferInitialFrom] = useState<Account | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderAsset, setOrderAsset] = useState<Asset | null>(null);

  // Notificação temporária
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Carrega todos os dados
  const loadData = async (currency = baseCurrency) => {
    try {
      const [sumRes, accRes, assRes, txRes, fxRes] = await Promise.all([
        api.getPortfolioSummary(currency),
        api.getAccounts(),
        api.getAssets(),
        api.getTransactions({ limit: 50 }),
        api.getFXRates(),
      ]);

      setSummary(sumRes);
      setAccounts(accRes);
      setAssets(assRes);
      setTransactions(txRes.data);
      setFxRates(fxRes);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast(err.message || 'Erro ao carregar dados do servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(baseCurrency);
  }, [baseCurrency]);

  // Atualização de cotações em tempo real (Brapi & Yahoo)
  const handleRefreshQuotes = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.refreshQuotes();
      showToast(`${res.updated} cotações atualizadas via Brapi e Yahoo Finance!`);
      await loadData(baseCurrency);
    } catch (err: any) {
      showToast(err.message || 'Erro ao sincronizar cotações', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Salvar / Criar Conta
  const handleSaveAccount = async (data: Partial<Account>) => {
    if (accountToEdit) {
      await api.updateAccount(accountToEdit.id, data);
      showToast('Conta atualizada com sucesso!');
    } else {
      await api.createAccount(data);
      showToast('Conta criada com sucesso!');
    }
    await loadData(baseCurrency);
  };

  // Excluir Conta
  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta? Todas as transações associadas serão removidas.')) {
      return;
    }
    try {
      await api.deleteAccount(id);
      showToast('Conta removida com sucesso!');
      await loadData(baseCurrency);
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover conta', 'error');
    }
  };

  // Excluir Ativo
  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este ativo da carteira?')) {
      return;
    }
    try {
      await api.deleteAsset(id);
      showToast('Ativo removido da carteira!');
      await loadData(baseCurrency);
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover ativo', 'error');
    }
  };

  // Excluir Transação
  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Deseja excluir esta movimentação? O saldo da conta será recalculado.')) {
      return;
    }
    try {
      await api.deleteTransaction(id);
      showToast('Transação removida!');
      await loadData(baseCurrency);
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover transação', 'error');
    }
  };

  // Abrir modal de ordem pré-preenchido vindo da busca de mercado
  const handleSelectAssetToBuyFromSearch = (
    symbol: string,
    name: string,
    price: number,
    provider: string,
    currency: string
  ) => {
    // Acha conta compatível com a moeda
    const compatAccount = accounts.find((a) => a.currency === currency) || accounts[0];
    const dummyAsset: any = {
      account_id: compatAccount ? compatAccount.id : 0,
      symbol,
      name,
      current_price: price,
      market_provider: provider,
      currency,
      asset_type: currency === 'BRL' ? 'STOCK_BR' : 'STOCK_US',
    };
    setOrderAsset(dummyAsset);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Toast Notificação */}
      {message && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold border transition-all animate-bounce ${
          message.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
        }`}>
          {message.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        baseCurrency={baseCurrency}
        setBaseCurrency={setBaseCurrency}
        fxRates={fxRates}
        onRefreshQuotes={handleRefreshQuotes}
        isRefreshing={isRefreshing}
        onOpenNewTransaction={() => setIsTransactionModalOpen(true)}
        onOpenNewOrder={() => {
          setOrderAsset(null);
          setIsOrderModalOpen(true);
        }}
        onOpenTransfer={() => {
          setTransferInitialFrom(null);
          setIsTransferModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Carregando carteira consolidada...</p>
          </div>
        ) : (
          <>
            {/* TAB: VISÃO GERAL */}
            {activeTab === 'overview' && summary && (
              <div className="space-y-8">
                {/* Cartões Consolidados */}
                <SummaryCards summary={summary} baseCurrency={baseCurrency} />

                {/* Grid Rápido: Maiores Posições & Últimas Movimentações */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Maiores Ativos da Carteira */}
                  <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">Destaques da Carteira</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('investments')}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        Ver todos ({assets.length})
                      </button>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {assets.slice(0, 4).map((a) => {
                        const isProfitable = a.profit_loss >= 0;
                        return (
                          <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 font-mono text-[11px] border border-slate-700">
                                {a.symbol.slice(0, 4)}
                              </div>
                              <div>
                                <div className="font-bold text-white font-mono flex items-center space-x-1.5">
                                  <span>{a.symbol}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    • {a.quantity} cotas
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 line-clamp-1">{a.name}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-white">
                                {formatCurrency(a.current_total_value, a.currency)}
                              </div>
                              <div className={`font-mono text-[11px] font-semibold flex items-center justify-end ${
                                isProfitable ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {isProfitable ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{formatPercent(a.profit_loss_percent)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Últimas Transações */}
                  <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Últimas Movimentações</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs text-blue-400 hover:underline font-semibold"
                      >
                        Ver extrato completo
                      </button>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {transactions.slice(0, 4).map((t) => {
                        const isIncome = t.type === 'INCOME' || t.type === 'DIVIDEND' || t.type === 'INVESTMENT_SELL';
                        return (
                          <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-slate-200">{t.description || t.category}</div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                <span>{t.account?.name || 'Conta'}</span>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{t.category}</span>
                              </div>
                            </div>

                            <div className={`font-mono font-bold text-right ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isIncome ? '+' : '-'} {formatCurrency(t.amount, t.currency)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CARTEIRA DE INVESTIMENTOS */}
            {activeTab === 'investments' && (
              <PortfolioView
                assets={assets}
                accounts={accounts}
                baseCurrency={baseCurrency}
                onOpenNewOrder={(asset) => {
                  setOrderAsset(asset || null);
                  setIsOrderModalOpen(true);
                }}
                onRefreshQuotes={handleRefreshQuotes}
                isRefreshing={isRefreshing}
                onDeleteAsset={handleDeleteAsset}
              />
            )}

            {/* TAB: MINHAS CONTAS */}
            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                baseCurrency={baseCurrency}
                fxRates={fxRates?.rates_to_brl || {}}
                onOpenCreateAccount={() => {
                  setAccountToEdit(null);
                  setIsAccountModalOpen(true);
                }}
                onOpenEditAccount={(acc) => {
                  setAccountToEdit(acc);
                  setIsAccountModalOpen(true);
                }}
                onOpenTransfer={(acc) => {
                  setTransferInitialFrom(acc || null);
                  setIsTransferModalOpen(true);
                }}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {/* TAB: TRANSAÇÕES / EXTRATO */}
            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                accounts={accounts}
                onOpenNewTransaction={() => setIsTransactionModalOpen(true)}
                onOpenTransfer={() => {
                  setTransferInitialFrom(null);
                  setIsTransferModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {/* TAB: BUSCA DE MERCADO */}
            {activeTab === 'market' && (
              <MarketSearchView
                onSelectAssetToBuy={handleSelectAssetToBuyFromSearch}
              />
            )}
          </>
        )}
      </main>

      {/* Footer Moderno */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Plataforma de Finanças & Investimentos — Golang Gin + GORM + Brapi + Yahoo Finance</span>
          <span className="text-slate-400 font-mono">Multimoeda: BRL • USD • EUR • GBP • BTC</span>
        </div>
      </footer>

      {/* Modais da Aplicação */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        accounts={accounts}
        onSuccess={() => loadData(baseCurrency)}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        initialFromAccount={transferInitialFrom}
        onSuccess={() => loadData(baseCurrency)}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        accounts={accounts}
        initialAsset={orderAsset}
        onSuccess={() => loadData(baseCurrency)}
      />
    </div>
  );
};

export default App;
