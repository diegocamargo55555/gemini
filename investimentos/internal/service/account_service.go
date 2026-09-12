package service

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
	"investimentos/internal/models"
)

type AccountService struct {
	db *gorm.DB
}

func NewAccountService(db *gorm.DB) *AccountService {
	return &AccountService{db: db}
}

func (s *AccountService) ListAccounts() ([]models.Account, error) {
	var accounts []models.Account
	if err := s.db.Order("id asc").Find(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

func (s *AccountService) GetAccount(id uint) (*models.Account, error) {
	var account models.Account
	if err := s.db.Preload("Assets").First(&account, id).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

type CreateAccountInput struct {
	Name           string             `json:"name" binding:"required"`
	Type           models.AccountType `json:"type" binding:"required"`
	Currency       string             `json:"currency" binding:"required"`
	InitialBalance float64            `json:"initial_balance"`
	Color          string             `json:"color"`
	Institution    string             `json:"institution"`
	Notes          string             `json:"notes"`
}

func (s *AccountService) CreateAccount(input *CreateAccountInput) (*models.Account, error) {
	curr := strings.ToUpper(strings.TrimSpace(input.Currency))
	if curr == "" {
		curr = "BRL"
	}

	color := input.Color
	if color == "" {
		color = "#3B82F6"
	}

	acc := &models.Account{
		Name:           strings.TrimSpace(input.Name),
		Type:           input.Type,
		Currency:       curr,
		InitialBalance: input.InitialBalance,
		CurrentBalance: input.InitialBalance,
		Color:          color,
		Institution:    strings.TrimSpace(input.Institution),
		Notes:          strings.TrimSpace(input.Notes),
	}

	if err := s.db.Create(acc).Error; err != nil {
		return nil, err
	}
	return acc, nil
}

type UpdateAccountInput struct {
	Name        string             `json:"name"`
	Type        models.AccountType `json:"type"`
	Color       string             `json:"color"`
	Institution string             `json:"institution"`
	Notes       string             `json:"notes"`
}

func (s *AccountService) UpdateAccount(id uint, input *UpdateAccountInput) (*models.Account, error) {
	var acc models.Account
	if err := s.db.First(&acc, id).Error; err != nil {
		return nil, fmt.Errorf("conta não encontrada: %w", err)
	}

	if input.Name != "" {
		acc.Name = strings.TrimSpace(input.Name)
	}
	if input.Type != "" {
		acc.Type = input.Type
	}
	if input.Color != "" {
		acc.Color = input.Color
	}
	if input.Institution != "" {
		acc.Institution = strings.TrimSpace(input.Institution)
	}
	acc.Notes = strings.TrimSpace(input.Notes)

	if err := s.db.Save(&acc).Error; err != nil {
		return nil, err
	}
	return &acc, nil
}

func (s *AccountService) DeleteAccount(id uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Deleta transações e ativos associados
		if err := tx.Where("account_id = ?", id).Delete(&models.Transaction{}).Error; err != nil {
			return err
		}
		if err := tx.Where("account_id = ?", id).Delete(&models.Asset{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&models.Account{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}
