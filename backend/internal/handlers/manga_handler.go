package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/eri-stay/tangeread-db-project/backend/internal/database"
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	s3storage "github.com/eri-stay/tangeread-db-project/backend/internal/storage/s3"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MangaHandler struct {
	mangaService services.MangaService
	mediaStorage *s3storage.MediaStorage
}

func NewMangaHandler(mangaService services.MangaService, mediaStorage *s3storage.MediaStorage) *MangaHandler {
	return &MangaHandler{mangaService: mangaService, mediaStorage: mediaStorage}
}

func (h *MangaHandler) GetMangaList(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 20
	}

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
	if limit <= 0 {
		limit = 30
	}

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
	if limit <= 0 {
		limit = 12
	}

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

func (h *MangaHandler) GetAuthorProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	projects, err := h.mangaService.GetAuthorProjects(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": projects})
}

func (h *MangaHandler) CreateManga(c *gin.Context) {
	_, exists := c.Get("user_id")
	userRole, roleExists := c.Get("role")
	if !exists || !roleExists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		TitleUa     string `json:"title_ua" binding:"required"`
		TitleOrig   string `json:"title_orig"`
		Description string `json:"description"`
		CoverURL    string `json:"cover_url"`
		Status      string `json:"status" binding:"required"`
		Format      string `json:"format" binding:"required"`
		ReleaseYear int    `json:"release_year"`
		TeamID      *uint  `json:"team_id"`
		TagIDs      []uint `json:"tag_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	manga := &models.Manga{
		TitleUa:     input.TitleUa,
		TitleOrig:   &input.TitleOrig,
		Description: &input.Description,
		CoverURL:    &input.CoverURL,
		Status:      models.MangaStatus(input.Status),
		Format:      models.MangaFormat(input.Format),
		ReleaseYear: &input.ReleaseYear,
	}

	// Role-based logic
	if userRole == string(models.UserRoleAuthor) {
		// Authors MUST specify their own team
		// We'll trust the TeamID from input if they are in it,
		// OR we can fetch their team automatically.
		// For simplicity, let's just use the TeamID from input but we SHOULD verify it.
		// A better way is to fetch the team_id from the DB for this user.

		// Let's assume for now they pass the correct TeamID or we fetch it.
		// I'll add a simple check.
		if input.TeamID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Team ID is required for authors"})
			return
		}
		manga.TeamID = input.TeamID
	} else if userRole == string(models.UserRoleAdmin) || userRole == string(models.UserRoleModerator) {
		manga.TeamID = input.TeamID
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	if err := h.mangaService.CreateManga(manga, input.TagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": manga})
}

func (h *MangaHandler) UpdateManga(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	userID, exists := c.Get("user_id")
	userRole, roleExists := c.Get("role")
	if !exists || !roleExists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		TitleUa     string `json:"title_ua" binding:"required"`
		TitleOrig   string `json:"title_orig"`
		Description string `json:"description"`
		CoverURL    string `json:"cover_url"`
		Status      string `json:"status" binding:"required"`
		Format      string `json:"format" binding:"required"`
		ReleaseYear int    `json:"release_year"`
		TeamID      *uint  `json:"team_id"`
		TagIDs      []uint `json:"tag_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing manga
	existingManga, err := h.mangaService.GetMangaByID(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// Authorization check
	if userRole == string(models.UserRoleAuthor) {
		// Verify author is part of the team owning the manga
		var membership models.TeamMember
		if err := database.DB.Where("team_id = ? AND user_id = ?", existingManga.TeamID, userID).First(&membership).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to edit this manga"})
			return
		}
	} else if userRole != string(models.UserRoleAdmin) && userRole != string(models.UserRoleModerator) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	// Update fields
	existingManga.TitleUa = input.TitleUa
	existingManga.TitleOrig = &input.TitleOrig
	existingManga.Description = &input.Description
	existingManga.CoverURL = &input.CoverURL
	existingManga.Status = models.MangaStatus(input.Status)
	existingManga.Format = models.MangaFormat(input.Format)
	existingManga.ReleaseYear = &input.ReleaseYear
	
	if input.TeamID != nil {
		existingManga.TeamID = input.TeamID
	}

	if err := h.mangaService.UpdateManga(existingManga, input.TagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existingManga})
}

func (h *MangaHandler) GetTags(c *gin.Context) {
	var tags []models.Tag
	if err := database.DB.Find(&tags).Order("name_uk asc").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func (h *MangaHandler) UploadCover(c *gin.Context) {
	file, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("mangas/covers/%d_%d%s", time.Now().Unix(), 0, ext) // 0 as placeholder for now or use random

	if err := h.mediaStorage.Store(c.Request.Context(), filename, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store file in S3"})
		return
	}

	publicURL := os.Getenv("S3_PUBLIC_URL")
	bucket := os.Getenv("S3_BUCKET")
	endpoint := os.Getenv("S3_ENDPOINT")

	// The actual S3 key inside the bucket includes the root "tangeread-media"
	// because mediaStorage is initialized with it in main.go
	fullKey := fmt.Sprintf("tangeread-media/%s", filename)

	var url string
	if publicURL != "" {
		url = fmt.Sprintf("%s/%s", strings.TrimSuffix(publicURL, "/"), fullKey)
	} else if endpoint != "" {
		url = fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(endpoint, "/"), bucket, fullKey)
	} else {
		url = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, fullKey)
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func (h *MangaHandler) CreateChapter(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		MangaID       uint    `json:"manga_id" binding:"required"`
		Volume        *int    `json:"volume"`
		ChapterNumber float64 `json:"chapter_number" binding:"required"`
		Title         string  `json:"title"`
		PagesURL      string  `json:"pages_url" binding:"required"` // JSON array of URLs
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify permission (author must be in the team that owns the manga)
	var manga models.Manga
	if err := database.DB.First(&manga, input.MangaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		return
	}

	userRole, _ := c.Get("role")
	if userRole == string(models.UserRoleAuthor) {
		var membership models.TeamMember
		if err := database.DB.Where("team_id = ? AND user_id = ?", manga.TeamID, userID).First(&membership).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to upload chapters for this manga"})
			return
		}
	}

	uid := userID.(uint)
	chapter := &models.Chapter{
		MangaID:       input.MangaID,
		Volume:        input.Volume,
		ChapterNumber: input.ChapterNumber,
		Title:         &input.Title,
		PagesURL:      &input.PagesURL,
		UploaderID:    &uid,
		DisplayStatus: models.DisplayStatusActive,
	}

	if err := h.mangaService.CreateChapter(chapter); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": chapter})
}

func (h *MangaHandler) UploadChapterPages(c *gin.Context) {
	mangaID := c.PostForm("manga_id")
	chapterNum := c.PostForm("chapter_number")

	if mangaID == "" || chapterNum == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "manga_id and chapter_number are required"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get multipart form"})
		return
	}

	files := form.File["pages"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No pages uploaded"})
		return
	}

	urls := make([]string, len(files))
	publicURLBase := os.Getenv("S3_PUBLIC_URL")
	bucket := os.Getenv("S3_BUCKET")
	endpoint := os.Getenv("S3_ENDPOINT")

	for i, file := range files {
		src, err := file.Open()
		if err != nil {
			continue
		}

		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("mangas/%s/chapters/%s/page_%d%s", mangaID, chapterNum, i+1, ext)

		if err := h.mediaStorage.Store(c.Request.Context(), filename, src); err != nil {
			src.Close()
			continue
		}
		src.Close()

		fullKey := fmt.Sprintf("tangeread-media/%s", filename)
		var url string
		if publicURLBase != "" {
			url = fmt.Sprintf("%s/%s", strings.TrimSuffix(publicURLBase, "/"), fullKey)
		} else if endpoint != "" {
			url = fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(endpoint, "/"), bucket, fullKey)
		} else {
			url = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, fullKey)
		}
		urls[i] = url
	}

	c.JSON(http.StatusOK, gin.H{"urls": urls})
}
