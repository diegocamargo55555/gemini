package service_test

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"investimentos/internal/market"
	"investimentos/internal/models"
	"investimentos/internal/service"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file:memdb1?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxOpenConns(1)
	}

	err = db.AutoMigrate(
		&models.Account{},
		&models.Transaction{},
		&models.Asset{},
		&models.Order{},
		&models.ExchangeRate{},
	)
	if err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}
	return db
}

func TestMultiCurrencyAccountsAndTransfers(t *testing.T) {
	db := setupTestDB(t)
	accSvc := service.NewAccountService(db)
	txSvc := service.NewTransactionService(db)

	// 1. Cria conta em BRL
	accBRL, err := accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "Nubank",
		Type:           models.AccountTypeChecking,
		Currency:       "BRL",
		InitialBalance: 1000.0,
		Institution:    "Nubank",
	})
	if err != nil {
		t.Fatalf("failed to create BRL account: %v", err)
	}

	// 2. Cria conta em USD
	accUSD, err := accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "Nomad",
		Type:           models.AccountTypeInvestment,
		Currency:       "USD",
		InitialBalance: 100.0,
		Institution:    "Nomad",
	})
	if err != nil {
		t.Fatalf("failed to create USD account: %v", err)
	}

	// 3. Cria conta em EUR
	accEUR, err := accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "Wise EUR",
		Type:           models.AccountTypeChecking,
		Currency:       "EUR",
		InitialBalance: 50.0,
		Institution:    "Wise",
	})
	if err != nil {
		t.Fatalf("failed to create EUR account: %v", err)
	}

	// Verifica se as 3 moedas foram cadastradas
	accounts, err := accSvc.ListAccounts()
	if err != nil || len(accounts) != 3 {
		t.Fatalf("expected 3 accounts, got %d", len(accounts))
	}

	// 4. Realiza transferência BRL -> USD com taxa de câmbio (ex: R$ 565,00 vira $ 100.00 a 5.65)
	err = txSvc.TransferBetweenAccounts(&service.TransferInput{
		FromAccountID: accBRL.ID,
		ToAccountID:   accUSD.ID,
		FromAmount:    565.0,
		ToAmount:      100.0,
		ExchangeRate:  5.65,
		Date:          time.Now(),
		Description:   "Câmbio Remessa Nomad",
	})
	if err != nil {
		t.Fatalf("failed transfer: %v", err)
	}

	// Verifica saldos pós-transferência
	updatedBRL, _ := accSvc.GetAccount(accBRL.ID)
	updatedUSD, _ := accSvc.GetAccount(accUSD.ID)

	if updatedBRL.CurrentBalance != 435.0 {
		t.Errorf("expected BRL balance 435.0, got %.2f", updatedBRL.CurrentBalance)
	}
	if updatedUSD.CurrentBalance != 200.0 {
		t.Errorf("expected USD balance 200.0, got %.2f", updatedUSD.CurrentBalance)
	}

	// 5. Verifica extrato
	txs, count, err := txSvc.ListTransactions(service.ListTxParams{})
	if err != nil || count != 2 {
		t.Fatalf("expected 2 transactions from transfer, got %d", count)
	}
	_ = accEUR
	_ = txs
}

func TestInvestmentOrderAndAveragePrice(t *testing.T) {
	db := setupTestDB(t)
	accSvc := service.NewAccountService(db)
	brapi := market.NewBrapiClient("")
	yahoo := market.NewYahooClient()
	invSvc := service.NewInvestmentService(db, brapi, yahoo)

	acc, _ := accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "XP Investimentos",
		Type:           models.AccountTypeInvestment,
		Currency:       "BRL",
		InitialBalance: 10000.0,
	})

	// Compra 1: 100 cotas a R$ 30,00 = R$ 3000
	_, err := invSvc.CreateOrder(&service.CreateOrderInput{
		AccountID:      acc.ID,
		Symbol:         "PETR4",
		Name:           "Petrobras PN",
		AssetType:      models.AssetTypeStockBR,
		MarketProvider: models.ProviderBrapi,
		Type:           models.OrderBuy,
		Quantity:       100,
		Price:          30.0,
		Fees:           0,
	})
	if err != nil {
		t.Fatalf("order 1 failed: %v", err)
	}

	// Compra 2: 100 cotas a R$ 40,00 = R$ 4000 (novo PM = (3000 + 4000) / 200 = R$ 35,00)
	_, err = invSvc.CreateOrder(&service.CreateOrderInput{
		AccountID:      acc.ID,
		Symbol:         "PETR4",
		Name:           "Petrobras PN",
		AssetType:      models.AssetTypeStockBR,
		MarketProvider: models.ProviderBrapi,
		Type:           models.OrderBuy,
		Quantity:       100,
		Price:          40.0,
		Fees:           0,
	})
	if err != nil {
		t.Fatalf("order 2 failed: %v", err)
	}

	assets, err := invSvc.ListAssets(acc.ID)
	if err != nil || len(assets) != 1 {
		t.Fatalf("expected 1 asset, got %d", len(assets))
	}

	petr4 := assets[0]
	if petr4.Quantity != 200 {
		t.Errorf("expected quantity 200, got %.2f", petr4.Quantity)
	}
	if petr4.AveragePrice != 35.0 {
		t.Errorf("expected average price 35.0, got %.2f", petr4.AveragePrice)
	}

	// Saldo da conta deve ter sido debitado em 3000 + 4000 = 7000 (10000 - 7000 = 3000)
	updatedAcc, _ := accSvc.GetAccount(acc.ID)
	if updatedAcc.CurrentBalance != 3000.0 {
		t.Errorf("expected account balance 3000, got %.2f", updatedAcc.CurrentBalance)
	}
}

func TestPortfolioSummaryConsolidation(t *testing.T) {
	db := setupTestDB(t)
	accSvc := service.NewAccountService(db)
	yahoo := market.NewYahooClient()
	fx := market.NewFXService(yahoo)
	portSvc := service.NewPortfolioService(db, fx)

	// Cria conta BRL com R$ 10.000
	_, err := accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "Conta BRL",
		Type:           models.AccountTypeChecking,
		Currency:       "BRL",
		InitialBalance: 10000.0,
	})
	if err != nil {
		t.Fatalf("failed to create BRL account: %v", err)
	}

	// Cria conta USD com $ 1.000 (a ~5.65 BRL/USD = ~R$ 5.650)
	_, err = accSvc.CreateAccount(&service.CreateAccountInput{
		Name:           "Conta USD",
		Type:           models.AccountTypeChecking,
		Currency:       "USD",
		InitialBalance: 1000.0,
	})
	if err != nil {
		t.Fatalf("failed to create USD account: %v", err)
	}

	// Resumo consolidado em BRL
	sumBRL, err := portSvc.GetSummary("BRL")
	if err != nil {
		t.Fatalf("failed get summary BRL: %v", err)
	}

	if sumBRL.TotalNetWorth < 15000.0 {
		t.Errorf("expected consolidated BRL > 15000, got %.2f", sumBRL.TotalNetWorth)
	}

	// Resumo consolidado em USD
	sumUSD, err := portSvc.GetSummary("USD")
	if err != nil {
		t.Fatalf("failed get summary USD: %v", err)
	}

	if sumUSD.TotalNetWorth < 2500.0 {
		t.Errorf("expected consolidated USD > 2500, got %.2f", sumUSD.TotalNetWorth)
	}
}
