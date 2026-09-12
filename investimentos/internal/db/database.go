package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"investimentos/internal/config"
	"investimentos/internal/models"
)

func InitDB(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	}

	if cfg.DatabaseURL != "" {
		log.Printf("[DB] Conectando ao PostgreSQL...")
		dialector = postgres.Open(cfg.DatabaseURL)
	} else {
		// Garante que o diretório do SQLite exista
		dir := filepath.Dir(cfg.DBPath)
		if dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return nil, fmt.Errorf("falha ao criar pasta do banco: %w", err)
			}
		}
		dsn := fmt.Sprintf("%s?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)", cfg.DBPath)
		log.Printf("[DB] Conectando ao SQLite (%s)...", cfg.DBPath)
		dialector = sqlite.Open(dsn)
	}

	db, err := gorm.Open(dialector, gormConfig)
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao banco de dados: %w", err)
	}

	// Auto-migrações
	if err := db.AutoMigrate(
		&models.Account{},
		&models.Transaction{},
		&models.Asset{},
		&models.Order{},
		&models.ExchangeRate{},
	); err != nil {
		return nil, fmt.Errorf("falha na migração do schema: %w", err)
	}

	log.Println("[DB] Tabelas migradas com sucesso.")

	// Seed inicial se o banco estiver vazio
	if err := SeedInitialData(db); err != nil {
		log.Printf("[DB] Aviso ao rodar seed inicial: %v", err)
	}

	return db, nil
}

func SeedInitialData(db *gorm.DB) error {
	var count int64
	db.Model(&models.Account{}).Count(&count)
	if count > 0 {
		return nil // Já possui dados
	}

	log.Println("[DB] Banco vazio. Criando contas e dados iniciais de demonstração...")

	now := time.Now()

	// 1. Contas em múltiplas moedas
	accNubank := models.Account{
		Name:           "Nubank Conta",
		Type:           models.AccountTypeChecking,
		Currency:       "BRL",
		InitialBalance: 5200.00,
		CurrentBalance: 5200.00,
		Color:          "#8A05BE",
		Institution:    "Nubank",
		Notes:          "Conta para gastos diários e reserva imediata",
	}

	accXP := models.Account{
		Name:           "XP Investimentos",
		Type:           models.AccountTypeInvestment,
		Currency:       "BRL",
		InitialBalance: 1500.00,
		CurrentBalance: 1500.00,
		Color:          "#1E293B",
		Institution:    "XP",
		Notes:          "Carteira de Ações e FIIs na B3",
	}

	accNomad := models.Account{
		Name:           "Nomad Global",
		Type:           models.AccountTypeInvestment,
		Currency:       "USD",
		InitialBalance: 850.00,
		CurrentBalance: 850.00,
		Color:          "#10B981",
		Institution:    "Nomad",
		Notes:          "Investimentos internacionais em Dólar (EUA)",
	}

	accWise := models.Account{
		Name:           "Wise Europa",
		Type:           models.AccountTypeChecking,
		Currency:       "EUR",
		InitialBalance: 420.00,
		CurrentBalance: 420.00,
		Color:          "#0284C7",
		Institution:    "Wise",
		Notes:          "Conta multimoeda para viagens e despesas em Euro",
	}

	accCrypto := models.Account{
		Name:           "Binance / Cripto",
		Type:           models.AccountTypeCrypto,
		Currency:       "USD",
		InitialBalance: 300.00,
		CurrentBalance: 300.00,
		Color:          "#F59E0B",
		Institution:    "Binance",
		Notes:          "Carteira de criptoativos",
	}

	accounts := []*models.Account{&accNubank, &accXP, &accNomad, &accWise, &accCrypto}
	for _, acc := range accounts {
		if err := db.Create(acc).Error; err != nil {
			return err
		}
	}

	// 2. Ativos na B3 (XP - BRL) via BRAPI
	assetPetr4 := models.Asset{
		AccountID:         accXP.ID,
		Symbol:            "PETR4",
		Name:              "Petrobras PN",
		AssetType:         models.AssetTypeStockBR,
		MarketProvider:    models.ProviderBrapi,
		Currency:          "BRL",
		Quantity:          100,
		AveragePrice:      38.50,
		TotalInvested:     3850.00,
		CurrentPrice:      49.00,
		CurrentTotalValue: 4900.00,
		ProfitLoss:        1050.00,
		ProfitLossPercent: 27.27,
		DayChangePercent:  -0.24,
		DayChange:         -0.12,
		LogoURL:           "https://s3-symbol-logo.tradingview.com/petrobras-pref--big.svg",
		LastPriceUpdate:   now,
	}

	assetVale3 := models.Asset{
		AccountID:         accXP.ID,
		Symbol:            "VALE3",
		Name:              "Vale S.A. ON",
		AssetType:         models.AssetTypeStockBR,
		MarketProvider:    models.ProviderBrapi,
		Currency:          "BRL",
		Quantity:          50,
		AveragePrice:      66.00,
		TotalInvested:     3300.00,
		CurrentPrice:      78.20,
		CurrentTotalValue: 3910.00,
		ProfitLoss:        610.00,
		ProfitLossPercent: 18.48,
		DayChangePercent:  0.85,
		DayChange:         0.65,
		LogoURL:           "https://icons.brapi.dev/icons/VALE3.svg",
		LastPriceUpdate:   now,
	}

	assetHglg11 := models.Asset{
		AccountID:         accXP.ID,
		Symbol:            "HGLG11",
		Name:              "CSHG Logística FII",
		AssetType:         models.AssetTypeFII,
		MarketProvider:    models.ProviderBrapi,
		Currency:          "BRL",
		Quantity:          25,
		AveragePrice:      158.00,
		TotalInvested:     3950.00,
		CurrentPrice:      164.50,
		CurrentTotalValue: 4112.50,
		ProfitLoss:        162.50,
		ProfitLossPercent: 4.11,
		DayChangePercent:  0.18,
		DayChange:         0.30,
		LogoURL:           "https://icons.brapi.dev/icons/HGLG11.svg",
		LastPriceUpdate:   now,
	}

	// 3. Ativos Internacionais (Nomad - USD) via YAHOO FINANCE
	assetAapl := models.Asset{
		AccountID:         accNomad.ID,
		Symbol:            "AAPL",
		Name:              "Apple Inc.",
		AssetType:         models.AssetTypeStockUS,
		MarketProvider:    models.ProviderYahoo,
		Currency:          "USD",
		Quantity:          6,
		AveragePrice:      195.00,
		TotalInvested:     1170.00,
		CurrentPrice:      230.50,
		CurrentTotalValue: 1383.00,
		ProfitLoss:        213.00,
		ProfitLossPercent: 18.21,
		DayChangePercent:  1.12,
		DayChange:         2.55,
		LastPriceUpdate:   now,
	}

	assetVoo := models.Asset{
		AccountID:         accNomad.ID,
		Symbol:            "VOO",
		Name:              "Vanguard S&P 500 ETF",
		AssetType:         models.AssetTypeETFGlobal,
		MarketProvider:    models.ProviderYahoo,
		Currency:          "USD",
		Quantity:          3,
		AveragePrice:      480.00,
		TotalInvested:     1440.00,
		CurrentPrice:      542.00,
		CurrentTotalValue: 1626.00,
		ProfitLoss:        186.00,
		ProfitLossPercent: 12.92,
		DayChangePercent:  0.45,
		DayChange:         2.40,
		LastPriceUpdate:   now,
	}

	// 4. Cripto (Binance - USD) via YAHOO FINANCE
	assetBtc := models.Asset{
		AccountID:         accCrypto.ID,
		Symbol:            "BTC-USD",
		Name:              "Bitcoin USD",
		AssetType:         models.AssetTypeCrypto,
		MarketProvider:    models.ProviderYahoo,
		Currency:          "USD",
		Quantity:          0.045,
		AveragePrice:      59500.00,
		TotalInvested:     2677.50,
		CurrentPrice:      68500.00,
		CurrentTotalValue: 3082.50,
		ProfitLoss:        405.00,
		ProfitLossPercent: 15.13,
		DayChangePercent:  2.34,
		DayChange:         1560.00,
		LastPriceUpdate:   now,
	}

	assets := []*models.Asset{&assetPetr4, &assetVale3, &assetHglg11, &assetAapl, &assetVoo, &assetBtc}
	for _, a := range assets {
		if err := db.Create(a).Error; err != nil {
			return err
		}
	}

	// 5. Histórico de Ordens
	orders := []models.Order{
		{AssetID: assetPetr4.ID, AccountID: accXP.ID, Type: models.OrderBuy, Date: now.AddDate(0, -2, 0), Quantity: 100, Price: 38.50, TotalAmount: 3850.00, Currency: "BRL", Notes: "Aporte inicial PETR4"},
		{AssetID: assetVale3.ID, AccountID: accXP.ID, Type: models.OrderBuy, Date: now.AddDate(0, -1, -15), Quantity: 50, Price: 66.00, TotalAmount: 3300.00, Currency: "BRL", Notes: "Aporte VALE3"},
		{AssetID: assetHglg11.ID, AccountID: accXP.ID, Type: models.OrderBuy, Date: now.AddDate(0, -1, 0), Quantity: 25, Price: 158.00, TotalAmount: 3950.00, Currency: "BRL", Notes: "Aporte FII Logístico"},
		{AssetID: assetAapl.ID, AccountID: accNomad.ID, Type: models.OrderBuy, Date: now.AddDate(0, -3, 0), Quantity: 6, Price: 195.00, TotalAmount: 1170.00, Currency: "USD", Notes: "Compra ações Apple"},
		{AssetID: assetVoo.ID, AccountID: accNomad.ID, Type: models.OrderBuy, Date: now.AddDate(0, -2, 0), Quantity: 3, Price: 480.00, TotalAmount: 1440.00, Currency: "USD", Notes: "Compra ETF S&P500"},
		{AssetID: assetBtc.ID, AccountID: accCrypto.ID, Type: models.OrderBuy, Date: now.AddDate(0, -1, 0), Quantity: 0.045, Price: 59500.00, TotalAmount: 2677.50, Currency: "USD", Notes: "Aporte Bitcoin"},
	}
	for _, o := range orders {
		_ = db.Create(&o).Error
	}

	// 6. Algumas transações de fluxo financeiro
	transactions := []models.Transaction{
		{Date: now.AddDate(0, 0, -5), AccountID: accNubank.ID, Type: models.TxIncome, Category: "Salário", Amount: 8500.00, Currency: "BRL", Description: "Salário Mensal Tech Lead"},
		{Date: now.AddDate(0, 0, -4), AccountID: accNubank.ID, Type: models.TxExpense, Category: "Moradia", Amount: 2400.00, Currency: "BRL", Description: "Aluguel e Condomínio"},
		{Date: now.AddDate(0, 0, -3), AccountID: accNubank.ID, Type: models.TxExpense, Category: "Alimentação", Amount: 650.00, Currency: "BRL", Description: "Supermercado Mensal"},
		{Date: now.AddDate(0, 0, -2), AccountID: accXP.ID, Type: models.TxDividend, Category: "Dividendos", Amount: 27.50, Currency: "BRL", Description: "Rendimentos mensais HGLG11"},
		{Date: now.AddDate(0, 0, -1), AccountID: accNomad.ID, Type: models.TxDividend, Category: "Dividendos", Amount: 4.80, Currency: "USD", Description: "Dividendos trimestrais AAPL"},
	}
	for _, t := range transactions {
		_ = db.Create(&t).Error
	}

	log.Println("[DB] Seed inicial concluído com sucesso!")
	return nil
}
