package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"
	"investimentos/internal/market"
	"investimentos/internal/models"
)

type InvestmentService struct {
	db    *gorm.DB
	brapi *market.BrapiClient
	yahoo *market.YahooClient
}

func NewInvestmentService(db *gorm.DB, brapi *market.BrapiClient, yahoo *market.YahooClient) *InvestmentService {
	return &InvestmentService{
		db:    db,
		brapi: brapi,
		yahoo: yahoo,
	}
}

func (s *InvestmentService) ListAssets(accountID uint) ([]models.Asset, error) {
	var assets []models.Asset
	q := s.db.Model(&models.Asset{}).Preload("Account").Where("quantity > 0")
	if accountID > 0 {
		q = q.Where("account_id = ?", accountID)
	}

	if err := q.Order("current_total_value desc").Find(&assets).Error; err != nil {
		return nil, err
	}
	return assets, nil
}

func (s *InvestmentService) GetAsset(id uint) (*models.Asset, error) {
	var asset models.Asset
	if err := s.db.Preload("Account").Preload("Orders").First(&asset, id).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

type CreateOrderInput struct {
	AccountID      uint                 `json:"account_id" binding:"required"`
	Symbol         string               `json:"symbol" binding:"required"`
	Name           string               `json:"name"`
	AssetType      models.AssetType     `json:"asset_type" binding:"required"`
	MarketProvider models.MarketProvider `json:"market_provider"`
	Type           models.OrderType     `json:"type" binding:"required"`
	Date           *time.Time           `json:"date"`
	Quantity       float64              `json:"quantity" binding:"required,gt=0"`
	Price          float64              `json:"price" binding:"required,gt=0"`
	Fees           float64              `json:"fees"`
	Notes          string               `json:"notes"`
}

func (s *InvestmentService) CreateOrder(input *CreateOrderInput) (*models.Order, error) {
	symbol := strings.ToUpper(strings.TrimSpace(input.Symbol))
	if symbol == "" {
		return nil, fmt.Errorf("código/símbolo do ativo é obrigatório")
	}

	orderDate := time.Now()
	if input.Date != nil && !input.Date.IsZero() {
		orderDate = *input.Date
	}

	// Identifica automaticamente provedor se não especificado
	provider := input.MarketProvider
	if provider == "" {
		if input.AssetType == models.AssetTypeStockBR || input.AssetType == models.AssetTypeFII || input.AssetType == models.AssetTypeBDR {
			provider = models.ProviderBrapi
		} else {
			provider = models.ProviderYahoo
		}
	}

	var createdOrder *models.Order

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var acc models.Account
		if err := tx.First(&acc, input.AccountID).Error; err != nil {
			return fmt.Errorf("conta não encontrada: %w", err)
		}

		// Encontra ou prepara o ativo
		var asset models.Asset
		err := tx.Where("account_id = ? AND symbol = ?", acc.ID, symbol).First(&asset).Error
		assetExists := err == nil

		totalCost := (input.Quantity * input.Price) + input.Fees
		totalReturn := (input.Quantity * input.Price) - input.Fees

		switch input.Type {
		case models.OrderBuy:
			// Débito no saldo da conta
			acc.CurrentBalance -= totalCost
			if err := tx.Save(&acc).Error; err != nil {
				return err
			}

			if assetExists {
				oldTotalCost := asset.Quantity * asset.AveragePrice
				newQty := asset.Quantity + input.Quantity
				asset.AveragePrice = (oldTotalCost + (input.Quantity * input.Price)) / newQty
				asset.Quantity = newQty
				asset.TotalInvested = asset.Quantity * asset.AveragePrice
				if asset.CurrentPrice <= 0 {
					asset.CurrentPrice = input.Price
				}
				asset.CurrentTotalValue = asset.Quantity * asset.CurrentPrice
				asset.ProfitLoss = asset.CurrentTotalValue - asset.TotalInvested
				if asset.TotalInvested > 0 {
					asset.ProfitLossPercent = (asset.ProfitLoss / asset.TotalInvested) * 100
				}
			} else {
				assetName := strings.TrimSpace(input.Name)
				if assetName == "" {
					assetName = symbol
				}
				asset = models.Asset{
					AccountID:         acc.ID,
					Symbol:            symbol,
					Name:              assetName,
					AssetType:         input.AssetType,
					MarketProvider:    provider,
					Currency:          acc.Currency,
					Quantity:          input.Quantity,
					AveragePrice:      input.Price,
					TotalInvested:     input.Quantity * input.Price,
					CurrentPrice:      input.Price,
					CurrentTotalValue: input.Quantity * input.Price,
					ProfitLoss:        0,
					ProfitLossPercent: 0,
					LastPriceUpdate:   orderDate,
				}
			}

			if err := tx.Save(&asset).Error; err != nil {
				return err
			}

			// Registra transação de fluxo de caixa
			t := models.Transaction{
				Date:        orderDate,
				AccountID:   acc.ID,
				Type:        models.TxInvestmentBuy,
				Category:    "Investimentos",
				Amount:      totalCost,
				Currency:    acc.Currency,
				Description: fmt.Sprintf("Compra %s: %.4g cotas a %.2f %s", symbol, input.Quantity, input.Price, acc.Currency),
			}
			if err := tx.Create(&t).Error; err != nil {
				return err
			}

		case models.OrderSell:
			if !assetExists || asset.Quantity < input.Quantity {
				return fmt.Errorf("quantidade insuficiente em carteira para venda (possui: %.4g)", asset.Quantity)
			}

			// Crédito no saldo da conta
			acc.CurrentBalance += totalReturn
			if err := tx.Save(&acc).Error; err != nil {
				return err
			}

			asset.Quantity -= input.Quantity
			asset.TotalInvested = asset.Quantity * asset.AveragePrice
			asset.CurrentTotalValue = asset.Quantity * asset.CurrentPrice
			asset.ProfitLoss = asset.CurrentTotalValue - asset.TotalInvested
			if asset.TotalInvested > 0 {
				asset.ProfitLossPercent = (asset.ProfitLoss / asset.TotalInvested) * 100
			} else {
				asset.ProfitLossPercent = 0
			}

			if err := tx.Save(&asset).Error; err != nil {
				return err
			}

			// Registra transação de fluxo de caixa
			t := models.Transaction{
				Date:        orderDate,
				AccountID:   acc.ID,
				Type:        models.TxInvestmentSell,
				Category:    "Investimentos",
				Amount:      totalReturn,
				Currency:    acc.Currency,
				Description: fmt.Sprintf("Venda %s: %.4g cotas a %.2f %s", symbol, input.Quantity, input.Price, acc.Currency),
			}
			if err := tx.Create(&t).Error; err != nil {
				return err
			}

		case models.OrderDividend:
			if !assetExists {
				return fmt.Errorf("ativo não encontrado para creditar proventos")
			}

			dividendTotal := input.Quantity * input.Price
			acc.CurrentBalance += dividendTotal
			if err := tx.Save(&acc).Error; err != nil {
				return err
			}

			t := models.Transaction{
				Date:        orderDate,
				AccountID:   acc.ID,
				Type:        models.TxDividend,
				Category:    "Dividendos",
				Amount:      dividendTotal,
				Currency:    acc.Currency,
				Description: fmt.Sprintf("Proventos %s: %.4g cotas x %.2f %s", symbol, input.Quantity, input.Price, acc.Currency),
			}
			if err := tx.Create(&t).Error; err != nil {
				return err
			}
		}

		// Registra a ordem no banco
		order := &models.Order{
			AssetID:     asset.ID,
			AccountID:   acc.ID,
			Type:        input.Type,
			Date:        orderDate,
			Quantity:    input.Quantity,
			Price:       input.Price,
			Fees:        input.Fees,
			TotalAmount: totalCost,
			Currency:    acc.Currency,
			Notes:       strings.TrimSpace(input.Notes),
		}

		if err := tx.Create(order).Error; err != nil {
			return err
		}

		createdOrder = order
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Dispara atualização de cotação em background para buscar o preço real mais atual
	go s.updateSingleAssetQuote(createdOrder.AssetID)

	return createdOrder, nil
}

// RefreshQuotes atualiza as cotações de todos os ativos da carteira usando Brapi ou Yahoo
func (s *InvestmentService) RefreshQuotes() (int, error) {
	var assets []models.Asset
	if err := s.db.Where("quantity > 0").Find(&assets).Error; err != nil {
		return 0, err
	}

	updatedCount := 0
	for _, a := range assets {
		var quote *market.QuoteResult
		var err error

		if a.MarketProvider == models.ProviderBrapi {
			quote, err = s.brapi.GetQuote(a.Symbol)
		} else {
			quote, err = s.yahoo.GetQuote(a.Symbol)
		}

		if err != nil || quote == nil {
			log.Printf("[Investments] Aviso: Falha ao atualizar cotação de %s (%s): %v", a.Symbol, a.MarketProvider, err)
			continue
		}

		if quote.CurrentPrice > 0 {
			a.CurrentPrice = quote.CurrentPrice
			a.DayChangePercent = quote.ChangePercent
			a.DayChange = quote.Change
			a.CurrentTotalValue = a.Quantity * a.CurrentPrice
			a.ProfitLoss = a.CurrentTotalValue - a.TotalInvested
			if a.TotalInvested > 0 {
				a.ProfitLossPercent = (a.ProfitLoss / a.TotalInvested) * 100
			}
			if quote.LogoURL != "" {
				a.LogoURL = quote.LogoURL
			}
			if quote.LongName != "" && a.Name == a.Symbol {
				a.Name = quote.LongName
			}
			a.LastPriceUpdate = time.Now()

			if err := s.db.Save(&a).Error; err == nil {
				updatedCount++
			}
		}
	}

	return updatedCount, nil
}

func (s *InvestmentService) updateSingleAssetQuote(assetID uint) {
	var asset models.Asset
	if err := s.db.First(&asset, assetID).Error; err != nil {
		return
	}

	var quote *market.QuoteResult
	var err error

	if asset.MarketProvider == models.ProviderBrapi {
		quote, err = s.brapi.GetQuote(asset.Symbol)
	} else {
		quote, err = s.yahoo.GetQuote(asset.Symbol)
	}

	if err == nil && quote != nil && quote.CurrentPrice > 0 {
		asset.CurrentPrice = quote.CurrentPrice
		asset.DayChangePercent = quote.ChangePercent
		asset.DayChange = quote.Change
		asset.CurrentTotalValue = asset.Quantity * asset.CurrentPrice
		asset.ProfitLoss = asset.CurrentTotalValue - asset.TotalInvested
		if asset.TotalInvested > 0 {
			asset.ProfitLossPercent = (asset.ProfitLoss / asset.TotalInvested) * 100
		}
		if quote.LogoURL != "" {
			asset.LogoURL = quote.LogoURL
		}
		if quote.LongName != "" && (asset.Name == asset.Symbol || asset.Name == "") {
			asset.Name = quote.LongName
		}
		asset.LastPriceUpdate = time.Now()
		_ = s.db.Save(&asset).Error
	}
}

func (s *InvestmentService) DeleteAsset(id uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("asset_id = ?", id).Delete(&models.Order{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Asset{}, id).Error
	})
}
