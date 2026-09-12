import {
  Account,
  Asset,
  PortfolioSummary,
  Transaction,
  QuoteResult,
  SearchResult,
  FXRatesResponse,
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erro HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Resumo de Carteira
  getPortfolioSummary: (baseCurrency = 'BRL'): Promise<PortfolioSummary> =>
    request(`${API_BASE}/portfolio/summary?base_currency=${baseCurrency}`),

  // Contas
  getAccounts: (): Promise<Account[]> =>
    request(`${API_BASE}/accounts`),

  createAccount: (data: Partial<Account>): Promise<Account> =>
    request(`${API_BASE}/accounts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAccount: (id: number, data: Partial<Account>): Promise<Account> =>
    request(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAccount: (id: number): Promise<{ message: string }> =>
    request(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
    }),

  // Transações
  getTransactions: (params?: {
    account_id?: number;
    type?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Transaction[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.account_id) query.set('account_id', String(params.account_id));
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return request(`${API_BASE}/transactions?${query.toString()}`);
  },

  createTransaction: (data: {
    account_id: number;
    type: string;
    category: string;
    amount: number;
    date?: string;
    description?: string;
  }): Promise<Transaction> =>
    request(`${API_BASE}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  transfer: (data: {
    from_account_id: number;
    to_account_id: number;
    from_amount: number;
    to_amount: number;
    exchange_rate?: number;
    date?: string;
    description?: string;
  }): Promise<{ message: string }> =>
    request(`${API_BASE}/transactions/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: number): Promise<{ message: string }> =>
    request(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    }),

  // Investimentos
  getAssets: (accountId?: number): Promise<Asset[]> => {
    const q = accountId ? `?account_id=${accountId}` : '';
    return request(`${API_BASE}/investments/assets${q}`);
  },

  createOrder: (data: {
    account_id: number;
    symbol: string;
    name?: string;
    asset_type: string;
    market_provider?: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND';
    quantity: number;
    price: number;
    fees?: number;
    notes?: string;
    date?: string;
  }): Promise<any> =>
    request(`${API_BASE}/investments/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshQuotes: (): Promise<{ message: string; updated: number }> =>
    request(`${API_BASE}/investments/refresh`, {
      method: 'POST',
    }),

  deleteAsset: (id: number): Promise<{ message: string }> =>
    request(`${API_BASE}/investments/assets/${id}`, {
      method: 'DELETE',
    }),

  // Cotações e Mercado
  searchMarket: (query: string, provider?: string): Promise<SearchResult[]> => {
    const q = new URLSearchParams({ query });
    if (provider) q.set('provider', provider);
    return request(`${API_BASE}/market/search?${q.toString()}`);
  },

  getQuote: (symbol: string, provider?: string): Promise<QuoteResult> => {
    const q = new URLSearchParams({ symbol });
    if (provider) q.set('provider', provider);
    return request(`${API_BASE}/market/quote?${q.toString()}`);
  },

  getFXRates: (): Promise<FXRatesResponse> =>
    request(`${API_BASE}/market/rates`),

  convertCurrency: (amount: number, from: string, to: string): Promise<{
    from: string;
    to: string;
    amount: number;
    converted: number;
    rate: number;
  }> =>
    request(`${API_BASE}/market/convert?amount=${amount}&from=${from}&to=${to}`),
};
