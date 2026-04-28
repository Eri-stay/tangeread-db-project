package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": manga})
}

func (h *MangaHandler) GetChapter(c *gin.Context) {
	mangaIDStr := c.Param("id")
	chapterNumStr := c.Param("number")

	mangaID, err := strconv.ParseUint(mangaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	chapterNum, err := strconv.ParseFloat(chapterNumStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chapter number"})
		return
	}

	chapter, err := h.mangaService.GetChapter(uint(mangaID), chapterNum)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": chapter})
}
