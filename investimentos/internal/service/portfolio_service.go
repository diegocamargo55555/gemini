package service

import (
	"strings"

	"gorm.io/gorm"
	"investimentos/internal/market"
	"investimentos/internal/models"
)

type PortfolioService struct {
	db *gorm.DB
	fx *market.FXService
}

func NewPortfolioService(db *gorm.DB, fx *market.FXService) *PortfolioService {
	return &PortfolioService{
		db: db,
		fx: fx,
	}
}

type CurrencyAllocation struct {
	Currency        string  `json:"currency"`
	OriginalAmount  float64 `json:"original_amount"`
	ConvertedAmount float64 `json:"converted_amount"`
	Percentage      float64 `json:"percentage"`
}

type AssetTypeAllocation struct {
	Type            string  `json:"type"`
	Label           string  `json:"label"`
	ConvertedAmount float64 `json:"converted_amount"`
	Percentage      float64 `json:"percentage"`
	Count           int     `json:"count"`
}

type AccountBreakdown struct {
	AccountID       uint               `json:"account_id"`
	Name            string             `json:"name"`
	Type            models.AccountType `json:"type"`
	Currency        string             `json:"currency"`
	CurrentBalance  float64            `json:"current_balance"`
	ConvertedBalance float64           `json:"converted_balance"`
	TotalInvested   float64            `json:"total_invested"`
	TotalMarketVal  float64            `json:"total_market_val"`
	Color           string             `json:"color"`
}

type PortfolioSummary struct {
	BaseCurrency        string                `json:"base_currency"`
	TotalNetWorth       float64               `json:"total_net_worth"`
	TotalCash           float64               `json:"total_cash"`
	TotalInvested       float64               `json:"total_invested"`
	TotalMarketValue    float64               `json:"total_market_value"`
	TotalProfitLoss     float64               `json:"total_profit_loss"`
	TotalProfitLossPct  float64               `json:"total_profit_loss_pct"`
	CurrencyAllocations []CurrencyAllocation  `json:"currency_allocations"`
	AssetTypeAllocations []AssetTypeAllocation `json:"asset_type_allocations"`
	AccountBreakdowns   []AccountBreakdown    `json:"account_breakdowns"`
	TotalAssetsCount    int                   `json:"total_assets_count"`
	TotalAccountsCount  int                   `json:"total_accounts_count"`
}

func (s *PortfolioService) GetSummary(baseCurrency string) (*PortfolioSummary, error) {
	baseCurrency = strings.ToUpper(strings.TrimSpace(baseCurrency))
	if baseCurrency == "" {
		baseCurrency = "BRL"
	}

	var accounts []models.Account
	if err := s.db.Find(&accounts).Error; err != nil {
		return nil, err
	}

	var assets []models.Asset
	if err := s.db.Where("quantity > 0").Find(&assets).Error; err != nil {
		return nil, err
	}

	totalCashConverted := 0.0
	totalInvestedConverted := 0.0
	totalMarketValConverted := 0.0

	currencyTotals := make(map[string]float64)
	assetTypeTotals := make(map[string]float64)
	assetTypeCounts := make(map[string]int)
	accountInvestments := make(map[uint]struct {
		invested float64
		market   float64
	})

	// 1. Processa Saldos de Contas (Caixa)
	accountBreakdowns := make([]AccountBreakdown, 0, len(accounts))
	for _, acc := range accounts {
		convCash, _, _ := s.fx.Convert(acc.CurrentBalance, acc.Currency, baseCurrency)
		totalCashConverted += convCash
		currencyTotals[acc.Currency] += convCash

		accountBreakdowns = append(accountBreakdowns, AccountBreakdown{
			AccountID:        acc.ID,
			Name:             acc.Name,
			Type:             acc.Type,
			Currency:         acc.Currency,
			CurrentBalance:   acc.CurrentBalance,
			ConvertedBalance: convCash,
			Color:            acc.Color,
		})
	}

	// 2. Processa Ativos de Investimentos
	for _, a := range assets {
		convInvested, _, _ := s.fx.Convert(a.TotalInvested, a.Currency, baseCurrency)
		convMarketVal, _, _ := s.fx.Convert(a.CurrentTotalValue, a.Currency, baseCurrency)

		totalInvestedConverted += convInvested
		totalMarketValConverted += convMarketVal
		currencyTotals[a.Currency] += convMarketVal

		tKey := string(a.AssetType)
		assetTypeTotals[tKey] += convMarketVal
		assetTypeCounts[tKey]++

		// Vincula ao resumo da conta
		currInv := accountInvestments[a.AccountID]
		currInv.invested += convInvested
		currInv.market += convMarketVal
		accountInvestments[a.AccountID] = currInv
	}

	// Atualiza os breakdowns das contas com investimentos
	for i := range accountBreakdowns {
		inv := accountInvestments[accountBreakdowns[i].AccountID]
		accountBreakdowns[i].TotalInvested = inv.invested
		accountBreakdowns[i].TotalMarketVal = inv.market
	}

	totalNetWorth := totalCashConverted + totalMarketValConverted
	totalProfitLoss := totalMarketValConverted - totalInvestedConverted
	totalProfitLossPct := 0.0
	if totalInvestedConverted > 0 {
		totalProfitLossPct = (totalProfitLoss / totalInvestedConverted) * 100
	}

	// 3. Monta Alocação por Moeda
	currencyAllocations := make([]CurrencyAllocation, 0, len(currencyTotals))
	for curr, amount := range currencyTotals {
		pct := 0.0
		if totalNetWorth > 0 {
			pct = (amount / totalNetWorth) * 100
		}
		currencyAllocations = append(currencyAllocations, CurrencyAllocation{
			Currency:        curr,
			ConvertedAmount: amount,
			Percentage:      pct,
		})
	}

	// Adiciona Caixa à alocação por classe de ativo
	if totalCashConverted > 0 {
		assetTypeTotals["CASH"] = totalCashConverted
		assetTypeCounts["CASH"] = len(accounts)
	}

	// 4. Monta Alocação por Tipo de Ativo
	typeLabels := map[string]string{
		"STOCK_BR":   "Ações Brasil",
		"FII":        "Fundos Imobiliários (FIIs)",
		"BDR":        "BDRs",
		"STOCK_US":   "Ações EUA",
		"ETF_GLOBAL": "ETFs Globais",
		"CRYPTO":     "Criptoativos",
		"FIXED_INC":  "Renda Fixa",
		"CASH":       "Caixa & Contas",
	}

	assetTypeAllocations := make([]AssetTypeAllocation, 0, len(assetTypeTotals))
	for aType, amount := range assetTypeTotals {
		pct := 0.0
		if totalNetWorth > 0 {
			pct = (amount / totalNetWorth) * 100
		}
		lbl := typeLabels[aType]
		if lbl == "" {
			lbl = aType
		}
		assetTypeAllocations = append(assetTypeAllocations, AssetTypeAllocation{
			Type:            aType,
			Label:           lbl,
			ConvertedAmount: amount,
			Percentage:      pct,
			Count:           assetTypeCounts[aType],
		})
	}

	return &PortfolioSummary{
		BaseCurrency:         baseCurrency,
		TotalNetWorth:        totalNetWorth,
		TotalCash:            totalCashConverted,
		TotalInvested:        totalInvestedConverted,
		TotalMarketValue:     totalMarketValConverted,
		TotalProfitLoss:      totalProfitLoss,
		TotalProfitLossPct:   totalProfitLossPct,
		CurrencyAllocations:  currencyAllocations,
		AssetTypeAllocations: assetTypeAllocations,
		AccountBreakdowns:    accountBreakdowns,
		TotalAssetsCount:     len(assets),
		TotalAccountsCount:   len(accounts),
	}, nil
}
