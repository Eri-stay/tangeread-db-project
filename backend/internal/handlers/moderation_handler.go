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
	if !h.checkModerator(c) {
		return
	}

	var mangas []models.Manga
	if err := h.db.Preload("Team").Find(&mangas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch manga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mangas})
}

// ToggleMangaVisibility — POST /api/moderation/manga/:id/toggle
func (h *ModerationHandler) ToggleMangaVisibility(c *gin.Context) {
	if !h.checkModerator(c) {
		return
	}

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
	if !h.checkModerator(c) {
		return
	}

	var comments []models.Comment
	if err := h.db.Preload("User").Preload("Chapter.Manga").Order("created_at DESC").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comments})
}

// GetLogs — GET /api/moderation/logs
func (h *ModerationHandler) GetLogs(c *gin.Context) {
	if !h.checkModerator(c) {
		return
	}

	var logs []models.AdminLog
	if err := h.db.Preload("Admin").Order("created_at DESC").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

// ToggleCommentVisibility — POST /api/moderation/comments/:id/toggle
func (h *ModerationHandler) ToggleCommentVisibility(c *gin.Context) {
	if !h.checkModerator(c) {
		return
	}

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
