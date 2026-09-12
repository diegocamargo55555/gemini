package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"investimentos/internal/service"
)

func (h *Handler) ListAccounts(c *gin.Context) {
	accounts, err := h.accounts.ListAccounts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar contas: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, accounts)
}

func (h *Handler) GetAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de conta inválido"})
		return
	}

	account, err := h.accounts.GetAccount(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *Handler) CreateAccount(c *gin.Context) {
	var input service.CreateAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	account, err := h.accounts.CreateAccount(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar conta: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

func (h *Handler) UpdateAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de conta inválido"})
		return
	}

	var input service.UpdateAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	account, err := h.accounts.UpdateAccount(uint(id), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar conta: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de conta inválido"})
		return
	}

	if err := h.accounts.DeleteAccount(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover conta: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conta removida com sucesso"})
}
