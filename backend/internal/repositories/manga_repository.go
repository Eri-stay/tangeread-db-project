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
	GetChapter(mangaID uint, chapterNum float64) (*models.Chapter, error)
	GetByAuthorID(authorID uint) ([]models.Manga, error)
	Create(manga *models.Manga, tagIDs []uint) error
	Update(manga *models.Manga, tagIDs []uint) error
	CreateChapter(chapter *models.Chapter) error
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
		Group("mangas.id, mangas.title_ua, stats.avg_rating, stats.chapter_count").
		Order("MAX(chapters.created_at) DESC").
		Limit(limit).
		Offset(offset).
		Find(&mangas).Error
	return mangas, err
}

func (r *postgresMangaRepository) GetChapter(mangaID uint, chapterNum float64) (*models.Chapter, error) {
	var chapter models.Chapter
	err := r.db.Where("manga_id = ? AND chapter_number = ?", mangaID, chapterNum).First(&chapter).Error
	if err != nil {
		return nil, err
	}
	return &chapter, nil
}

func (r *postgresMangaRepository) GetByID(id uint) (*models.Manga, error) {
	var manga models.Manga
	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Preload("Tags").
		Preload("Team").
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("volume DESC, chapter_number DESC")
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
func (r *postgresMangaRepository) GetByAuthorID(authorID uint) ([]models.Manga, error) {
	var mangas []models.Manga
	err := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Joins("JOIN team_members tm ON mangas.team_id = tm.team_id").
		Where("tm.user_id = ?", authorID).
		Preload("Tags").
		Order("mangas.created_at DESC").
		Find(&mangas).Error
	return mangas, err
}

func (r *postgresMangaRepository) Create(manga *models.Manga, tagIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(manga).Error; err != nil {
			return err
		}

		if len(tagIDs) > 0 {
			var tags []models.Tag
			if err := tx.Where("id IN ?", tagIDs).Find(&tags).Error; err != nil {
				return err
			}
			if err := tx.Model(manga).Association("Tags").Replace(tags); err != nil {
				return err
			}
		}

		return nil
	})
}
func (r *postgresMangaRepository) Update(manga *models.Manga, tagIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Tags").Save(manga).Error; err != nil {
			return err
		}

		var tags []models.Tag
		if len(tagIDs) > 0 {
			if err := tx.Where("id IN ?", tagIDs).Find(&tags).Error; err != nil {
				return err
			}
		}
		
		if err := tx.Model(manga).Association("Tags").Replace(tags); err != nil {
			return err
		}

		return nil
	})
}
func (r *postgresMangaRepository) CreateChapter(chapter *models.Chapter) error {
	return r.db.Create(chapter).Error
}
