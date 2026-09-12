export type AccountType = 'CHECKING' | 'INVESTMENT' | 'SAVINGS' | 'CASH' | 'CRYPTO';

export interface Account {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: number;
  current_balance: number;
  color: string;
  institution: string;
  notes?: string;
  assets?: Asset[];
}

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'INVESTMENT_BUY'
  | 'INVESTMENT_SELL'
  | 'DIVIDEND';

export interface Transaction {
  id: number;
  created_at: string;
  date: string;
  account_id: number;
  account?: Account;
  type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  description: string;
  destination_account_id?: number;
  destination_amount?: number;
  exchange_rate?: number;
}

export type AssetType =
  | 'STOCK_BR'
  | 'FII'
  | 'BDR'
  | 'STOCK_US'
  | 'ETF_GLOBAL'
  | 'CRYPTO'
  | 'FIXED_INC';

export type MarketProvider = 'BRAPI' | 'YAHOO' | 'MANUAL';

export interface Asset {
  id: number;
  created_at: string;
  updated_at: string;
  account_id: number;
  account?: Account;
  symbol: string;
  name: string;
  asset_type: AssetType;
  market_provider: MarketProvider;
  currency: string;
  quantity: number;
  average_price: number;
  total_invested: number;
  current_price: number;
  current_total_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  day_change_percent: number;
  day_change: number;
  logo_url?: string;
  last_price_update: string;
}

export interface CurrencyAllocation {
  currency: string;
  original_amount: number;
  converted_amount: number;
  percentage: number;
}

export interface AssetTypeAllocation {
  type: string;
  label: string;
  converted_amount: number;
  percentage: number;
  count: number;
}

export interface AccountBreakdown {
  account_id: number;
  name: string;
  type: AccountType;
  currency: string;
  current_balance: number;
  converted_balance: number;
  total_invested: number;
  total_market_val: number;
  color: string;
}

export interface PortfolioSummary {
  base_currency: string;
  total_net_worth: number;
  total_cash: number;
  total_invested: number;
  total_market_value: number;
  total_profit_loss: number;
  total_profit_loss_pct: number;
  currency_allocations: CurrencyAllocation[];
  asset_type_allocations: AssetTypeAllocation[];
  account_breakdowns: AccountBreakdown[];
  total_assets_count: number;
  total_accounts_count: number;
}

export interface QuoteResult {
  symbol: string;
  short_name: string;
  long_name: string;
  currency: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  market_cap?: number;
  logo_url?: string;
  provider: string;
  updated_at: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  currency: string;
  exchange: string;
  sector?: string;
  provider: string;
  logo_url?: string;
}

export interface FXRatesResponse {
  base: string;
  popular_pairs: Record<string, number>;
  rates_to_brl: Record<string, number>;
  last_updated: string;
}
