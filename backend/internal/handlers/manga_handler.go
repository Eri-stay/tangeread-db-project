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
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 { limit = 20 }

	offsetStr := c.DefaultQuery("offset", "0")
	offset, _ := strconv.Atoi(offsetStr)

	mangas, err := h.mangaService.GetMangaList(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch manga list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mangas})
}

func (h *MangaHandler) GetLatestUpdated(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "30")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 { limit = 30 }

	offsetStr := c.DefaultQuery("offset", "0")
	offset, _ := strconv.Atoi(offsetStr)

	mangas, err := h.mangaService.GetLatestUpdated(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch latest updated manga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mangas})
}

func (h *MangaHandler) GetTrending(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "12")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 { limit = 12 }

	offsetStr := c.DefaultQuery("offset", "0")
	offset, _ := strconv.Atoi(offsetStr)

	mangas, err := h.mangaService.GetTrending(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch trending manga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mangas})
}

func (h *MangaHandler) GetMangaByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	manga, err := h.mangaService.GetMangaByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": manga})
}
