package repositories

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type CommentRepository interface {
	GetByChapterID(chapterID uint) ([]models.Comment, error)
	Create(comment *models.Comment) error
	Delete(id uint) error
}

type postgresCommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &postgresCommentRepository{db: db}
}

func (r *postgresCommentRepository) GetByChapterID(chapterID uint) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.Where("chapter_id = ? AND display_status = 'active'", chapterID).
		Preload("User").
		Order("created_at DESC").
		Find(&comments).Error
	return comments, err
}

func (r *postgresCommentRepository) Create(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *postgresCommentRepository) Delete(id uint) error {
	return r.db.Model(&models.Comment{}).Where("id = ?", id).Update("display_status", "deleted").Error
}
