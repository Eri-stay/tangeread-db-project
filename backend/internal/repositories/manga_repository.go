package repositories

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type MangaRepository interface {
	GetAll(limit int) ([]models.Manga, error)
}

type postgresMangaRepository struct {
	db *gorm.DB
}

func NewMangaRepository(db *gorm.DB) MangaRepository {
	return &postgresMangaRepository{db: db}
}

func (r *postgresMangaRepository) GetAll(limit int) ([]models.Manga, error) {
	var mangas []models.Manga
	err := r.db.Preload("Tags").Limit(limit).Find(&mangas).Error
	return mangas, err
}
