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
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	userService  services.UserService
	mediaStorage services.MediaStorage
}

func NewUserHandler(userService services.UserService, mediaStorage services.MediaStorage) *UserHandler {
	return &UserHandler{
		userService:  userService,
		mediaStorage: mediaStorage,
	}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userService.GetProfile(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"avatar_url": user.AvatarURL,
		"role":       user.Role,
	})
}

type UpdateProfileRequest struct {
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateProfile(userID.(uint), req.Username, req.AvatarURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"username":   user.Username,
			"avatar_url": user.AvatarURL,
		},
	})
}

func (h *UserHandler) SoftDeleteAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.userService.SoftDeleteAccount(userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

func (h *UserHandler) UploadAvatar(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get avatar file"})
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg" // Default extension
	}

	// Generate unique filename
	fileName := fmt.Sprintf("avatars/user_%d_%d%s", userID.(uint), time.Now().Unix(), ext)

	// Upload to S3
	if err := h.mediaStorage.Store(c.Request.Context(), fileName, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload avatar: %v", err)})
		return
	}

	// Construct public URL
	bucket := os.Getenv("S3_BUCKET")
	endpoint := os.Getenv("S3_ENDPOINT")
	publicUrlBase := os.Getenv("S3_PUBLIC_URL")

	// The actual S3 key inside the bucket includes the root "tangeread-media"
	// because mediaStorage is initialized with it.
	fullKey := fmt.Sprintf("tangeread-media/%s", fileName)

	var publicURL string
	if publicUrlBase != "" {
		// Use public R2.dev domain or custom domain if configured
		publicURL = fmt.Sprintf("%s/%s", strings.TrimRight(publicUrlBase, "/"), fullKey)
	} else if endpoint != "" {
		// Fallback to direct endpoint (might fail with 400 if bucket isn't explicitly public without sigv4)
		publicURL = fmt.Sprintf("%s/%s/%s", strings.TrimRight(endpoint, "/"), bucket, fullKey)
	} else {
		publicURL = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, fullKey)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Avatar uploaded successfully",
		"avatar_url": publicURL,
	})
}

func (h *UserHandler) GetBookmarks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	bookmarks, counts, err := h.userService.GetBookmarks(userID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   bookmarks,
		"counts": counts,
	})
}

func (h *UserHandler) GetHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	history, total, err := h.userService.GetHistory(userID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  history,
		"total": total,
	})
}

func (h *UserHandler) GetMangaUserStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	mangaIDStr := c.Param("id")
	mangaID, err := strconv.ParseUint(mangaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	status, isFavorite, score, lastChapter, err := h.userService.GetMangaUserStatus(userID.(uint), uint(mangaID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      status,
		"is_favorite": isFavorite,
		"score":       score,
		"last_chapter": lastChapter,
	})
}

func (h *UserHandler) ToggleFavorite(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	mangaIDStr := c.Param("id")
	mangaID, err := strconv.ParseUint(mangaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	var input struct {
		IsFavorite bool `json:"is_favorite"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.SetFavorite(userID.(uint), uint(mangaID), input.IsFavorite); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_favorite": input.IsFavorite})
}

func (h *UserHandler) UpdateMangaStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	mangaIDStr := c.Param("id")
	mangaID, err := strconv.ParseUint(mangaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.SetMangaStatus(userID.(uint), uint(mangaID), input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": input.Status})
}

func (h *UserHandler) RateManga(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	mangaIDStr := c.Param("id")
	mangaID, err := strconv.ParseUint(mangaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manga ID"})
		return
	}

	var input struct {
		Score int `json:"score" binding:"required,min=1,max=10"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.RateManga(userID.(uint), uint(mangaID), input.Score); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"score": input.Score})
}

func (h *UserHandler) GetUserTeam(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var teamMember models.TeamMember
	// Fetch the team the user belongs to
	if err := database.DB.Where("user_id = ?", userID).First(&teamMember).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{"data": nil})
			return
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Fetch full team with all members and their user details
	var team models.Team
	if err := database.DB.Preload("Members.User").First(&team, teamMember.TeamID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": team})
}

// SubmitTeamApplication — POST /api/users/team-application
// Any authenticated user (not only authors) can submit an application to create a team.
func (h *UserHandler) SubmitTeamApplication(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Prevent duplicate pending applications from the same user
	var existing models.TeamApplication
	err := database.DB.
		Where("applied_by_id = ? AND status = ?", userID, models.TeamApplicationPending).
		First(&existing).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You already have a pending application"})
		return
	}

	desc := input.Description
	app := models.TeamApplication{
		Name:        input.Name,
		Description: &desc,
		AppliedByID: userID.(uint),
		Status:      models.TeamApplicationPending,
	}

	if err := database.DB.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Application submitted successfully",
		"id":      app.ID,
	})
}

// GetMyTeamApplication — GET /api/users/team-application
// Returns the latest team application submitted by the current user (if any).
func (h *UserHandler) GetMyTeamApplication(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var app models.TeamApplication
	err := database.DB.
		Where("applied_by_id = ?", userID).
		Order("created_at DESC").
		First(&app).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{"data": nil})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": app})
}

// SearchUsers — GET /api/users/search?q=...
func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	var users []models.User
	if err := database.DB.Where("username ILIKE ? OR email ILIKE ?", "%"+query+"%", "%"+query+"%").Limit(10).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

// AddTeamMember — POST /api/users/team/:id/members
func (h *UserHandler) AddTeamMember(c *gin.Context) {
	teamIDStr := c.Param("id")
	teamID, _ := strconv.ParseUint(teamIDStr, 10, 32)
	
	requesterID, _ := c.Get("user_id")
	
	// Check if requester is leader
	var requesterMember models.TeamMember
	if err := database.DB.Where("team_id = ? AND user_id = ?", teamID, requesterID).First(&requesterMember).Error; err != nil || requesterMember.InternalRole != models.InternalRoleLeader {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only leaders can add members"})
		return
	}

	var input struct {
		UserID uint   `json:"user_id" binding:"required"`
		Role   string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMember := models.TeamMember{
		TeamID:       uint(teamID),
		UserID:       input.UserID,
		InternalRole: models.InternalRole(input.Role),
	}

	if err := database.DB.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Member added successfully"})
}

// UpdateTeamMember — PATCH /api/users/team/:id/members/:userId
func (h *UserHandler) UpdateTeamMember(c *gin.Context) {
	teamIDStr := c.Param("id")
	teamID, _ := strconv.ParseUint(teamIDStr, 10, 32)
	targetUserIDStr := c.Param("userId")
	targetUserID, _ := strconv.ParseUint(targetUserIDStr, 10, 32)
	
	requesterID, _ := c.Get("user_id")
	
	// Check if requester is leader
	var requesterMember models.TeamMember
	if err := database.DB.Where("team_id = ? AND user_id = ?", teamID, requesterID).First(&requesterMember).Error; err != nil || requesterMember.InternalRole != models.InternalRoleLeader {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only leaders can change roles"})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.TeamMember{}).Where("team_id = ? AND user_id = ?", teamID, targetUserID).Update("internal_role", input.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update member role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member role updated"})
}

// RemoveTeamMember — DELETE /api/users/team/:id/members/:userId
func (h *UserHandler) RemoveTeamMember(c *gin.Context) {
	teamIDStr := c.Param("id")
	teamID, _ := strconv.ParseUint(teamIDStr, 10, 32)
	targetUserIDStr := c.Param("userId")
	targetUserID, _ := strconv.ParseUint(targetUserIDStr, 10, 32)
	
	requesterID, _ := c.Get("user_id")
	
	// Only leader can remove members, OR a member can remove themselves
	isSelf := requesterID.(uint) == uint(targetUserID)
	
	if !isSelf {
		var requesterMember models.TeamMember
		if err := database.DB.Where("team_id = ? AND user_id = ?", teamID, requesterID).First(&requesterMember).Error; err != nil || requesterMember.InternalRole != models.InternalRoleLeader {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only leaders can remove other members"})
			return
		}
	}

	if err := database.DB.Where("team_id = ? AND user_id = ?", teamID, targetUserID).Delete(&models.TeamMember{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed"})
}
