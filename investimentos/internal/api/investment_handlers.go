package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"investimentos/internal/service"
)

func (h *Handler) ListAssets(c *gin.Context) {
	accountID, _ := strconv.ParseUint(c.Query("account_id"), 10, 32)
	assets, err := h.investments.ListAssets(uint(accountID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar ativos: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, assets)
}

func (h *Handler) GetAsset(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de ativo inválido"})
		return
	}

	asset, err := h.investments.GetAsset(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ativo não encontrado"})
		return
	}

	c.JSON(http.StatusOK, asset)
}

func (h *Handler) CreateOrder(c *gin.Context) {
	var input service.CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de ordem inválidos: " + err.Error()})
		return
	}

	order, err := h.investments.CreateOrder(&input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar ordem: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *Handler) RefreshQuotes(c *gin.Context) {
	updated, err := h.investments.RefreshQuotes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar cotações: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cotações atualizadas com sucesso",
		"updated": updated,
	})
}

func (h *Handler) DeleteAsset(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de ativo inválido"})
		return
	}

	if err := h.investments.DeleteAsset(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover ativo: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ativo removido da carteira"})
}
