package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"investimentos/internal/service"
)

func (h *Handler) ListTransactions(c *gin.Context) {
	accountID, _ := strconv.ParseUint(c.Query("account_id"), 10, 32)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	params := service.ListTxParams{
		AccountID: uint(accountID),
		Type:      c.Query("type"),
		Category:  c.Query("category"),
		Search:    c.Query("search"),
		Limit:     limit,
		Offset:    offset,
	}

	txs, total, err := h.transactions.ListTransactions(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar transações: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   txs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *Handler) CreateTransaction(c *gin.Context) {
	var input service.CreateTxInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	tx, err := h.transactions.CreateTransaction(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar transação: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func (h *Handler) Transfer(c *gin.Context) {
	var input service.TransferInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de transferência inválidos: " + err.Error()})
		return
	}

	if err := h.transactions.TransferBetweenAccounts(&input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro na transferência: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transferência realizada com sucesso"})
}

func (h *Handler) DeleteTransaction(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de transação inválido"})
		return
	}

	if err := h.transactions.DeleteTransaction(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover transação: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transação removida com sucesso"})
}
