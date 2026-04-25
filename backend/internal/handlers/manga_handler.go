package handlers

import (
	"net/http"
	"strconv"

	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type MangaHandler struct {
	mangaService services.MangaService
}

func NewMangaHandler(mangaService services.MangaService) *MangaHandler {
	return &MangaHandler{mangaService: mangaService}
}

func (h *MangaHandler) GetMangaList(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	mangas, err := h.mangaService.GetMangaList(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch manga list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mangas})
}
