package service

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"investimentos/internal/models"
)

type TransactionService struct {
	db *gorm.DB
}

func NewTransactionService(db *gorm.DB) *TransactionService {
	return &TransactionService{db: db}
}

type ListTxParams struct {
	AccountID uint
	Type      string
	Category  string
	Search    string
	Limit     int
	Offset    int
}

func (s *TransactionService) ListTransactions(params ListTxParams) ([]models.Transaction, int64, error) {
	var txs []models.Transaction
	var total int64

	q := s.db.Model(&models.Transaction{}).Preload("Account")

	if params.AccountID > 0 {
		q = q.Where("account_id = ?", params.AccountID)
	}
	if params.Type != "" {
		q = q.Where("type = ?", params.Type)
	}
	if params.Category != "" {
		q = q.Where("category = ?", params.Category)
	}
	if params.Search != "" {
		searchPattern := "%" + strings.ToLower(params.Search) + "%"
		q = q.Where("LOWER(description) LIKE ? OR LOWER(category) LIKE ?", searchPattern, searchPattern)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := params.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	if err := q.Order("date desc, id desc").Limit(limit).Offset(params.Offset).Find(&txs).Error; err != nil {
		return nil, 0, err
	}

	return txs, total, nil
}

type CreateTxInput struct {
	AccountID   uint                   `json:"account_id" binding:"required"`
	Type        models.TransactionType `json:"type" binding:"required"`
	Category    string                 `json:"category" binding:"required"`
	Amount      float64                `json:"amount" binding:"required,gt=0"`
	Date        *time.Time             `json:"date"`
	Description string                 `json:"description"`
}

func (s *TransactionService) CreateTransaction(input *CreateTxInput) (*models.Transaction, error) {
	var createdTx *models.Transaction

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var acc models.Account
		if err := tx.First(&acc, input.AccountID).Error; err != nil {
			return fmt.Errorf("conta não encontrada: %w", err)
		}

		txDate := time.Now()
		if input.Date != nil && !input.Date.IsZero() {
			txDate = *input.Date
		}

		// Atualiza saldo da conta
		switch input.Type {
		case models.TxIncome, models.TxDividend, models.TxInvestmentSell:
			acc.CurrentBalance += input.Amount
		case models.TxExpense, models.TxInvestmentBuy:
			acc.CurrentBalance -= input.Amount
		default:
			return fmt.Errorf("tipo de transação simples inválido: %s", input.Type)
		}

		if err := tx.Save(&acc).Error; err != nil {
			return err
		}

		newTx := &models.Transaction{
			Date:        txDate,
			AccountID:   acc.ID,
			Type:        input.Type,
			Category:    strings.TrimSpace(input.Category),
			Amount:      input.Amount,
			Currency:    acc.Currency,
			Description: strings.TrimSpace(input.Description),
		}

		if err := tx.Create(newTx).Error; err != nil {
			return err
		}

		createdTx = newTx
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Carrega conta associada para o retorno
	s.db.Preload("Account").First(createdTx, createdTx.ID)
	return createdTx, nil
}

type TransferInput struct {
	FromAccountID uint      `json:"from_account_id" binding:"required"`
	ToAccountID   uint      `json:"to_account_id" binding:"required"`
	FromAmount    float64   `json:"from_amount" binding:"required,gt=0"`
	ToAmount      float64   `json:"to_amount" binding:"required,gt=0"`
	ExchangeRate  float64   `json:"exchange_rate"`
	Date          time.Time `json:"date"`
	Description   string    `json:"description"`
}

func (s *TransactionService) TransferBetweenAccounts(input *TransferInput) error {
	if input.FromAccountID == input.ToAccountID {
		return fmt.Errorf("a conta de origem e destino devem ser diferentes")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		var fromAcc models.Account
		var toAcc models.Account

		if err := tx.First(&fromAcc, input.FromAccountID).Error; err != nil {
			return fmt.Errorf("conta de origem não encontrada: %w", err)
		}
		if err := tx.First(&toAcc, input.ToAccountID).Error; err != nil {
			return fmt.Errorf("conta de destino não encontrada: %w", err)
		}

		if fromAcc.CurrentBalance < input.FromAmount {
			// Não bloqueamos estritamente para permitir cheque especial ou ajustes, mas pode ser avisado
		}

		// Debita da conta de origem
		fromAcc.CurrentBalance -= input.FromAmount
		if err := tx.Save(&fromAcc).Error; err != nil {
			return err
		}

		// Credita na conta de destino
		toAcc.CurrentBalance += input.ToAmount
		if err := tx.Save(&toAcc).Error; err != nil {
			return err
		}

		txDate := input.Date
		if txDate.IsZero() {
			txDate = time.Now()
		}

		desc := strings.TrimSpace(input.Description)
		if desc == "" {
			desc = fmt.Sprintf("Transferência de %s para %s", fromAcc.Name, toAcc.Name)
		}

		rate := input.ExchangeRate
		if rate <= 0 && input.FromAmount > 0 {
			rate = input.ToAmount / input.FromAmount
		}

		// Cria saída na origem
		txOut := &models.Transaction{
			Date:                 txDate,
			AccountID:            fromAcc.ID,
			Type:                 models.TxTransferOut,
			Category:             "Transferência",
			Amount:               input.FromAmount,
			Currency:             fromAcc.Currency,
			Description:          desc,
			DestinationAccountID: &toAcc.ID,
			DestinationAmount:    &input.ToAmount,
			ExchangeRate:         &rate,
		}
		if err := tx.Create(txOut).Error; err != nil {
			return err
		}

		// Cria entrada no destino
		invRate := 1.0 / rate
		txIn := &models.Transaction{
			Date:                 txDate,
			AccountID:            toAcc.ID,
			Type:                 models.TxTransferIn,
			Category:             "Transferência",
			Amount:               input.ToAmount,
			Currency:             toAcc.Currency,
			Description:          desc,
			DestinationAccountID: &fromAcc.ID,
			DestinationAmount:    &input.FromAmount,
			ExchangeRate:         &invRate,
			ReferenceID:          &txOut.ID,
		}
		if err := tx.Create(txIn).Error; err != nil {
			return err
		}

		return nil
	})
}

func (s *TransactionService) DeleteTransaction(id uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var t models.Transaction
		if err := tx.First(&t, id).Error; err != nil {
			return fmt.Errorf("transação não encontrada: %w", err)
		}

		var acc models.Account
		if err := tx.First(&acc, t.AccountID).Error; err == nil {
			// Reverte o saldo
			switch t.Type {
			case models.TxIncome, models.TxDividend, models.TxInvestmentSell, models.TxTransferIn:
				acc.CurrentBalance -= t.Amount
			case models.TxExpense, models.TxInvestmentBuy, models.TxTransferOut:
				acc.CurrentBalance += t.Amount
			}
			_ = tx.Save(&acc).Error
		}

		return tx.Delete(&t).Error
	})
}
