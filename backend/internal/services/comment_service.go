package services

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
)

type CommentService interface {
	GetChapterComments(chapterID uint) ([]models.Comment, error)
	AddComment(comment *models.Comment) error
	DeleteComment(id uint, userID uint, isAdmin bool) error
}

type commentService struct {
	commentRepo repositories.CommentRepository
}

func NewCommentService(commentRepo repositories.CommentRepository) CommentService {
	return &commentService{commentRepo: commentRepo}
}

func (s *commentService) GetChapterComments(chapterID uint) ([]models.Comment, error) {
	return s.commentRepo.GetByChapterID(chapterID)
}

func (s *commentService) AddComment(comment *models.Comment) error {
	return s.commentRepo.Create(comment)
}

func (s *commentService) DeleteComment(id uint, userID uint, isAdmin bool) error {
	// TODO: Add ownership check if not admin
	return s.commentRepo.Delete(id)
}
