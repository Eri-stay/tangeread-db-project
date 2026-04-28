package repositories

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type MangaRepository interface {
	GetAll(limit, offset int) ([]models.Manga, error)
	GetLatestUpdated(limit, offset int) ([]models.Manga, error)
	GetTrending(limit, offset int) ([]models.Manga, error)
	GetByID(id uint) (*models.Manga, error)
}

type postgresMangaRepository struct {
	db *gorm.DB
}

func NewMangaRepository(db *gorm.DB) MangaRepository {
	return &postgresMangaRepository{db: db}
}

func (r *postgresMangaRepository) GetAll(limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga
	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Preload("Tags").
		Limit(limit).
		Offset(offset).
		Find(&mangas).Error
	return mangas, err
}

// GetLatestUpdated returns manga with the most recently added chapters
func (r *postgresMangaRepository) GetLatestUpdated(limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga
	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Joins("JOIN chapters ON chapters.manga_id = mangas.id").
		Preload("Tags").
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1)
		}).
		Where("mangas.display_status = ?", "active").
		Where("chapters.display_status = ?", "active").
		Group("mangas.id, stats.avg_rating, stats.chapter_count").
		Order("MAX(chapters.created_at) DESC").
		Limit(limit).
		Offset(offset).
		Find(&mangas).Error
	return mangas, err
}

func (r *postgresMangaRepository) GetByID(id uint) (*models.Manga, error) {
	var manga models.Manga
	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Preload("Tags").
		Preload("Team").
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("volume_number DESC, chapter_number DESC")
		}).
		First(&manga, id).Error

	if err != nil {
		return nil, err
	}
	return &manga, nil
}

// GetTrending returns manga ranked by: ratings_this_week * 1.0 + ratings_prev_week * 0.5
func (r *postgresMangaRepository) GetTrending(limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga

	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Joins(`LEFT JOIN (
			SELECT manga_id,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS score_week,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS score_prev
			FROM ratings
			GROUP BY manga_id
		) trending ON trending.manga_id = mangas.id`).
		Preload("Tags").
		Where("mangas.display_status = ?", "active").
		Order("(COALESCE(trending.score_week, 0) + 0.5 * COALESCE(trending.score_prev, 0)) DESC").
		Limit(limit).
		Offset(offset).
		Find(&mangas).Error

	return mangas, err
}
