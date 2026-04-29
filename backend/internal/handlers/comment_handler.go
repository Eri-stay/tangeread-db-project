package handlers

import (
	"net/http"
	"strconv"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	commentService services.CommentService
}

func NewCommentHandler(commentService services.CommentService) *CommentHandler {
	return &CommentHandler{commentService: commentService}
}

func (h *CommentHandler) GetChapterComments(c *gin.Context) {
	chapterIDStr := c.Param("id")
	chapterID, err := strconv.ParseUint(chapterIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chapter ID"})
		return
	}

	comments, err := h.commentService.GetChapterComments(uint(chapterID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comments})
}

func (h *CommentHandler) AddComment(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		ChapterID uint   `json:"chapter_id" binding:"required"`
		Content   string `json:"content" binding:"required"`
		ParentID  *uint  `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid := userID.(uint)
	comment := &models.Comment{
		UserID:    &uid,
		ChapterID: input.ChapterID,
		Content:   input.Content,
		ParentID:  input.ParentID,
	}

	if err := h.commentService.AddComment(comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	commentIDStr := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	userRole, _ := c.Get("role")
	isAdmin := userRole == string(models.UserRoleAdmin)

	if err := h.commentService.DeleteComment(uint(commentID), userID.(uint), isAdmin); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}
