package repositories

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type MangaRepository interface {
	GetAll(limit int) ([]models.Manga, error)
	GetLatestUpdated(limit int) ([]models.Manga, error)
	GetTrending(limit int) ([]models.Manga, error)
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

// GetLatestUpdated returns manga with the most recently added chapters
func (r *postgresMangaRepository) GetLatestUpdated(limit int) ([]models.Manga, error) {
	var mangas []models.Manga
	err := r.db.Preload("Tags").Preload("Chapters", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Limit(1)
	}).
		Joins("JOIN chapters ON chapters.manga_id = mangas.id").
		Where("mangas.display_status = ?", "active").
		Where("chapters.display_status = ?", "active").
		Group("mangas.id").
		Order("MAX(chapters.created_at) DESC").
		Limit(limit).
		Find(&mangas).Error
	return mangas, err
}

// GetTrending returns manga ranked by: ratings_this_week * 1.0 + ratings_prev_week * 0.5
func (r *postgresMangaRepository) GetTrending(limit int) ([]models.Manga, error) {
	var mangas []models.Manga

	// Weighted popularity: current week score + 0.5 * previous week score
	err := r.db.Preload("Tags").
		Where("mangas.display_status = ?", "active").
		Joins(`LEFT JOIN (
			SELECT manga_id,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS score_week,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS score_prev
			FROM ratings
			GROUP BY manga_id
		) trending ON trending.manga_id = mangas.id`).
		Order("(COALESCE(trending.score_week, 0) + 0.5 * COALESCE(trending.score_prev, 0)) DESC").
		Limit(limit).
		Find(&mangas).Error

	return mangas, err
}
