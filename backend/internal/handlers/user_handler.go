package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	"github.com/gin-gonic/gin"
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
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"avatar":   user.AvatarURL,
		"role":     user.Role,
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
			"username": user.Username,
			"avatar":   user.AvatarURL,
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

	bookmarks, err := h.userService.GetBookmarks(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bookmarks)
}

func (h *UserHandler) GetHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	history, err := h.userService.GetHistory(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
