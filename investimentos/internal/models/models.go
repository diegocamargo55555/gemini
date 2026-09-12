package models

import (
	"time"
)

// AccountType define o tipo de conta
type AccountType string

const (
	AccountTypeChecking   AccountType = "CHECKING"   // Conta Corrente
	AccountTypeInvestment AccountType = "INVESTMENT" // Corretora / Investimentos
	AccountTypeSavings    AccountType = "SAVINGS"    // Poupança / Reserva de Emergência
	AccountTypeCash       AccountType = "CASH"       // Dinheiro Físico
	AccountTypeCrypto     AccountType = "CRYPTO"     // Carteira Cripto
)

// Account representa uma conta financeira em uma moeda específica
type Account struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	Name           string         `gorm:"size:100;not null" json:"name"`
	Type           AccountType    `gorm:"size:20;not null;default:'CHECKING'" json:"type"`
	Currency       string         `gorm:"size:10;not null;default:'BRL'" json:"currency"`
	InitialBalance float64        `gorm:"type:decimal(18,4);default:0" json:"initial_balance"`
	CurrentBalance float64        `gorm:"type:decimal(18,4);default:0" json:"current_balance"`
	Color          string         `gorm:"size:30;default:'#3B82F6'" json:"color"`
	Institution    string         `gorm:"size:60" json:"institution"`
	Notes          string         `gorm:"size:255" json:"notes"`
	Transactions   []Transaction  `gorm:"foreignKey:AccountID;constraint:OnDelete:CASCADE" json:"transactions,omitempty"`
	Assets         []Asset        `gorm:"foreignKey:AccountID;constraint:OnDelete:CASCADE" json:"assets,omitempty"`
}

// TransactionType define a natureza da transação
type TransactionType string

const (
	TxIncome         TransactionType = "INCOME"          // Receita (Salário, Rendimentos, etc.)
	TxExpense        TransactionType = "EXPENSE"         // Despesa (Alimentação, Moradia, etc.)
	TxTransferOut    TransactionType = "TRANSFER_OUT"    // Transferência enviada
	TxTransferIn     TransactionType = "TRANSFER_IN"     // Transferência recebida
	TxInvestmentBuy  TransactionType = "INVESTMENT_BUY"  // Débito por compra de ativo
	TxInvestmentSell TransactionType = "INVESTMENT_SELL" // Crédito por venda de ativo
	TxDividend       TransactionType = "DIVIDEND"        // Provento / Dividendo recebido
)

// Transaction registra qualquer entrada, saída ou transferência
type Transaction struct {
	ID                   uint            `gorm:"primaryKey" json:"id"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
	Date                 time.Time       `gorm:"not null" json:"date"`
	AccountID            uint            `gorm:"not null;index" json:"account_id"`
	Account              *Account        `gorm:"foreignKey:AccountID" json:"account,omitempty"`
	Type                 TransactionType `gorm:"size:20;not null" json:"type"`
	Category             string          `gorm:"size:60;not null" json:"category"`
	Amount               float64         `gorm:"type:decimal(18,4);not null" json:"amount"`
	Currency             string          `gorm:"size:10;not null" json:"currency"`
	Description          string          `gorm:"size:255" json:"description"`
	DestinationAccountID *uint           `gorm:"index" json:"destination_account_id,omitempty"`
	DestinationAmount    *float64        `gorm:"type:decimal(18,4)" json:"destination_amount,omitempty"`
	ExchangeRate         *float64        `gorm:"type:decimal(18,6)" json:"exchange_rate,omitempty"`
	ReferenceID          *uint           `json:"reference_id,omitempty"`
}

// AssetType define a classe do ativo
type AssetType string

const (
	AssetTypeStockBR   AssetType = "STOCK_BR"   // Ações Brasil (B3)
	AssetTypeFII       AssetType = "FII"        // Fundos Imobiliários
	AssetTypeBDR       AssetType = "BDR"        // Brazilian Depositary Receipts
	AssetTypeStockUS   AssetType = "STOCK_US"   // Ações EUA / Internacionais
	AssetTypeETFGlobal AssetType = "ETF_GLOBAL" // ETFs Globais
	AssetTypeCrypto    AssetType = "CRYPTO"     // Criptoativos
	AssetTypeFixedInc  AssetType = "FIXED_INC"  // Renda Fixa / Tesouro
)

// MarketProvider indica a fonte de cotação
type MarketProvider string

const (
	ProviderBrapi  MarketProvider = "BRAPI"
	ProviderYahoo  MarketProvider = "YAHOO"
	ProviderManual MarketProvider = "MANUAL"
)

// Asset representa a posição mantida em carteira
type Asset struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	AccountID         uint           `gorm:"not null;index" json:"account_id"`
	Account           *Account       `gorm:"foreignKey:AccountID" json:"account,omitempty"`
	Symbol            string         `gorm:"size:30;not null;index" json:"symbol"`
	Name              string         `gorm:"size:120;not null" json:"name"`
	AssetType         AssetType      `gorm:"size:20;not null" json:"asset_type"`
	MarketProvider    MarketProvider `gorm:"size:20;not null;default:'BRAPI'" json:"market_provider"`
	Currency          string         `gorm:"size:10;not null;default:'BRL'" json:"currency"`
	Quantity          float64        `gorm:"type:decimal(18,6);not null;default:0" json:"quantity"`
	AveragePrice      float64        `gorm:"type:decimal(18,4);not null;default:0" json:"average_price"`
	TotalInvested     float64        `gorm:"type:decimal(18,4);not null;default:0" json:"total_invested"`
	CurrentPrice      float64        `gorm:"type:decimal(18,4);not null;default:0" json:"current_price"`
	CurrentTotalValue float64        `gorm:"type:decimal(18,4);not null;default:0" json:"current_total_value"`
	ProfitLoss        float64        `gorm:"type:decimal(18,4);default:0" json:"profit_loss"`
	ProfitLossPercent float64        `gorm:"type:decimal(18,4);default:0" json:"profit_loss_percent"`
	DayChangePercent  float64        `gorm:"type:decimal(18,4);default:0" json:"day_change_percent"`
	DayChange         float64        `gorm:"type:decimal(18,4);default:0" json:"day_change"`
	LogoURL           string         `gorm:"size:255" json:"logo_url"`
	LastPriceUpdate   time.Time      `json:"last_price_update"`
	Orders            []Order        `gorm:"foreignKey:AssetID;constraint:OnDelete:CASCADE" json:"orders,omitempty"`
}

// OrderType representa o tipo de operação com ativo
type OrderType string

const (
	OrderBuy      OrderType = "BUY"
	OrderSell     OrderType = "SELL"
	OrderDividend OrderType = "DIVIDEND"
)

// Order representa o histórico individual de compras, vendas e proventos
type Order struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	AssetID     uint      `gorm:"not null;index" json:"asset_id"`
	Asset       *Asset    `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	AccountID   uint      `gorm:"not null;index" json:"account_id"`
	Type        OrderType `gorm:"size:20;not null" json:"type"`
	Date        time.Time `gorm:"not null" json:"date"`
	Quantity    float64   `gorm:"type:decimal(18,6);not null" json:"quantity"`
	Price       float64   `gorm:"type:decimal(18,4);not null" json:"price"`
	Fees        float64   `gorm:"type:decimal(18,4);default:0" json:"fees"`
	TotalAmount float64   `gorm:"type:decimal(18,4);not null" json:"total_amount"`
	Currency    string    `gorm:"size:10;not null" json:"currency"`
	Notes       string    `gorm:"size:255" json:"notes"`
}

// ExchangeRate armazena cotação cambial em cache no banco
type ExchangeRate struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	FromCurrency string    `gorm:"size:10;not null;index:idx_fx_pair,unique" json:"from_currency"`
	ToCurrency   string    `gorm:"size:10;not null;index:idx_fx_pair,unique" json:"to_currency"`
	Rate         float64   `gorm:"type:decimal(18,6);not null" json:"rate"`
	Source       string    `gorm:"size:50" json:"source"`
	LastUpdated  time.Time `json:"last_updated"`
}
