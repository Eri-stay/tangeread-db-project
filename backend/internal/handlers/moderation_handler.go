package handlers

import (
	"net/http"
	"strconv"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ModerationHandler struct {
	db *gorm.DB
}

func NewModerationHandler(db *gorm.DB) *ModerationHandler {
	return &ModerationHandler{db: db}
}

// checkModerator verifies that the user is either a moderator or an admin.
func (h *ModerationHandler) checkModerator(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists || (role != string(models.UserRoleAdmin) && role != string(models.UserRoleModerator)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Moderator access required"})
		return false
	}
	return true
}

// GetManga — GET /api/moderation/manga
func (h *ModerationHandler) GetManga(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 10 }
	offset := (page - 1) * limit

	search := c.Query("search")

	var mangas []models.Manga
	var total int64

	query := h.db.Model(&models.Manga{})
	if search != "" {
		// Use ILIKE for case-insensitive search in Postgres
		query = query.Where("title_ua ILIKE ? OR title_orig ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count manga"})
		return
	}

	if err := query.Preload("Team").Order("created_at DESC").Offset(offset).Limit(limit).Find(&mangas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch manga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": mangas,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// ToggleMangaVisibility — POST /api/moderation/manga/:id/toggle
func (h *ModerationHandler) ToggleMangaVisibility(c *gin.Context) {

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	var manga models.Manga
	if err := h.db.First(&manga, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&body)

	adminID := c.MustGet("user_id").(uint)
	newStatus := models.DisplayStatusActive
	action := models.AdminActionRestore

	if manga.DisplayStatus == models.DisplayStatusActive {
		newStatus = models.DisplayStatusHiddenByMod
		action = models.AdminActionHideManga
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&manga).Update("display_status", newStatus).Error; err != nil {
			return err
		}

		log := models.AdminLog{
			AdminID:       adminID,
			ActionType:    action,
			TargetMangaID: &manga.ID,
		}
		if body.Reason != "" {
			log.Reason = &body.Reason
		}
		return tx.Create(&log).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update visibility"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Visibility updated", "status": newStatus})
}

// GetComments — GET /api/moderation/comments
func (h *ModerationHandler) GetComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 10 }
	offset := (page - 1) * limit

	var comments []models.Comment
	var total int64

	if err := h.db.Model(&models.Comment{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count comments"})
		return
	}

	if err := h.db.Preload("User").Preload("Chapter.Manga").Order("created_at DESC").Offset(offset).Limit(limit).Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": comments,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// GetLogs — GET /api/moderation/logs
func (h *ModerationHandler) GetLogs(c *gin.Context) {

	var logs []models.AdminLog
	if err := h.db.Preload("Admin").Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

// ToggleCommentVisibility — POST /api/moderation/comments/:id/toggle
func (h *ModerationHandler) ToggleCommentVisibility(c *gin.Context) {

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var comment models.Comment
	if err := h.db.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&body)

	adminID := c.MustGet("user_id").(uint)
	newStatus := models.DisplayStatusActive
	action := models.AdminActionRestore

	if comment.DisplayStatus == models.DisplayStatusActive {
		newStatus = models.DisplayStatusHiddenByMod
		action = models.AdminActionHideComment
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&comment).Update("display_status", newStatus).Error; err != nil {
			return err
		}

		log := models.AdminLog{
			AdminID:         adminID,
			ActionType:      action,
			TargetCommentID: &comment.ID,
		}
		if body.Reason != "" {
			log.Reason = &body.Reason
		}
		return tx.Create(&log).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update visibility"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Visibility updated", "status": newStatus})
}
