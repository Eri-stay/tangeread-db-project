package repositories

import (
	"strings"

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
	GetSimilarManga(mangaID uint, limit, offset int) ([]models.Manga, error)
	GetPersonalizedRecommendations(userID uint, limit int) ([]models.Manga, error)
	Search(query string, limit, offset int) ([]models.Manga, error)
	GetFiltered(filters MangaFilters, limit, offset int) ([]models.Manga, error)
	UpdateReadingHistory(userID, mangaID, chapterID uint) error
}

type MangaFilters struct {
	Query   string
	Tags    []uint
	Status  []string
	Format  []string
	Sort    string
	Exclude []uint
}

type postgresMangaRepository struct {
	db *gorm.DB
}

func NewMangaRepository(db *gorm.DB) MangaRepository {
	return &postgresMangaRepository{db: db}
}

func (r *postgresMangaRepository) GetAll(limit, offset int) ([]models.Manga, error) {
	return r.GetFiltered(MangaFilters{}, limit, offset)
}

func (r *postgresMangaRepository) GetFiltered(filters MangaFilters, limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga
	db := r.db.Table("mangas").
		Select("mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count").
		Joins("LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id").
		Preload("Tags").
		Preload("Team")

	if filters.Query != "" {
		likeQuery := "%" + filters.Query + "%"
		db = db.Where("(mangas.title_ua ILIKE ? OR mangas.title_orig ILIKE ? OR similarity(mangas.title_ua, ?) > 0.2)", likeQuery, likeQuery, filters.Query)
	}

	if len(filters.Status) > 0 {
		db = db.Where("mangas.status IN ?", filters.Status)
	}
	if len(filters.Format) > 0 {
		db = db.Where("mangas.format IN ?", filters.Format)
	}

	if len(filters.Tags) > 0 {
		// All tags must be present
		for _, tagID := range filters.Tags {
			db = db.Where("EXISTS (SELECT 1 FROM manga_tags WHERE manga_id = mangas.id AND tag_id = ?)", tagID)
		}
	}

	if len(filters.Exclude) > 0 {
		db = db.Where("NOT EXISTS (SELECT 1 FROM manga_tags WHERE manga_id = mangas.id AND tag_id IN ?)", filters.Exclude)
	}

	// Always filter by display_status active for catalog unless admin? (Let's keep it simple for now)
	db = db.Where("mangas.display_status = ?", "active")

	switch filters.Sort {
	case "best-match":
		if filters.Query != "" {
			// Using strings.ReplaceAll prevents simple quote escaping issues
			safeQuery := strings.ReplaceAll(filters.Query, "'", "''")
			db = db.Order("similarity(mangas.title_ua, '" + safeQuery + "') DESC, mangas.title_ua ASC")
		} else {
			db = db.Order("mangas.created_at DESC")
		}
	case "rating":
		db = db.Order("stats.avg_rating DESC NULLS LAST, mangas.title_ua ASC")
	case "popularity":
		// Use trending score if available or just rating count
		db = db.Order("stats.rating_count DESC NULLS LAST, mangas.title_ua ASC")
	case "updated":
		db = db.Joins("LEFT JOIN (SELECT manga_id, MAX(created_at) as last_update FROM chapters GROUP BY manga_id) c ON c.manga_id = mangas.id").
			Order("c.last_update DESC NULLS LAST, mangas.title_ua ASC")
	case "alphabet":
		db = db.Order("mangas.title_ua ASC")
	case "newest":
		db = db.Order("mangas.created_at DESC")
	default:
		db = db.Order("mangas.created_at DESC")
	}

	err := db.Limit(limit).Offset(offset).Find(&mangas).Error
	return mangas, err
}

func (r *postgresMangaRepository) Search(query string, limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga
	sql := `
    SELECT mangas.*, COALESCE(stats.avg_rating, 0) as avg_rating, COALESCE(stats.chapter_count, 0) as chapters_count,
           similarity(mangas.title_ua, ?) as sim
    FROM mangas
    LEFT JOIN manga_stats_mv stats ON stats.manga_id = mangas.id
    WHERE (mangas.title_ua ILIKE ? OR mangas.title_orig ILIKE ?)
       OR similarity(mangas.title_ua, ?) > 0.2
    ORDER BY sim DESC, mangas.title_ua ASC
    LIMIT ? OFFSET ?
    `

	likeQuery := "%" + query + "%"
	err := r.db.Raw(sql, query, likeQuery, likeQuery, query, limit, offset).Scan(&mangas).Error

	if err == nil && len(mangas) > 0 {
		mangaIDs := make([]uint, len(mangas))
		for i := range mangas {
			mangaIDs[i] = mangas[i].ID
		}
		var tags []struct {
			MangaID uint
			models.Tag
		}
		r.db.Table("tags").
			Select("tags.*, manga_tags.manga_id").
			Joins("JOIN manga_tags ON manga_tags.tag_id = tags.id").
			Where("manga_tags.manga_id IN ?", mangaIDs).
			Scan(&tags)

		tagMap := make(map[uint][]models.Tag)
		for _, t := range tags {
			tagMap[t.MangaID] = append(tagMap[t.MangaID], t.Tag)
		}
		for i := range mangas {
			mangas[i].Tags = tagMap[mangas[i].ID]
		}

		var teams []struct {
			MangaID uint
			models.Team
		}
		r.db.Table("teams").
			Select("teams.*, mangas.id as manga_id").
			Joins("JOIN mangas ON mangas.team_id = teams.id").
			Where("mangas.id IN ?", mangaIDs).
			Scan(&teams)

		teamMap := make(map[uint]models.Team)
		for _, t := range teams {
			teamMap[t.MangaID] = t.Team
		}
		for i := range mangas {
			if t, ok := teamMap[mangas[i].ID]; ok {
				mangas[i].Team = &t
			}
		}
	}

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
		Preload("Team").
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
	// Increment view count asynchronously/simply
	r.db.Model(&chapter).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
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
		Preload("Team").
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

func (r *postgresMangaRepository) GetSimilarManga(mangaID uint, limit, offset int) ([]models.Manga, error) {
	var mangas []models.Manga
	query := `
WITH 
-- 1. Коефіцієнт Жаккара за тегами
tag_similarity AS (
    SELECT 
        target.manga_id as other_id,
        COUNT(*)::float / (
            (SELECT COUNT(*) FROM manga_tags WHERE manga_id = ?) + 
            (SELECT COUNT(*) FROM manga_tags WHERE manga_id = target.manga_id) - 
            COUNT(*)
        ) as jaccard_score
    FROM manga_tags base
    JOIN manga_tags target ON base.tag_id = target.tag_id
    WHERE base.manga_id = ? AND target.manga_id != ?
    GROUP BY target.manga_id
),
-- 2. Колаборативна схожість (люди, що читали цю, читали й іншу)
user_similarity AS (
    SELECT 
        target.manga_id as other_id,
        COUNT(*)::float / (SELECT COUNT(*) FROM user_manga_statuses WHERE manga_id = ?) as co_occurrence_score
    FROM user_manga_statuses base
    JOIN user_manga_statuses target ON base.user_id = target.user_id
    WHERE base.manga_id = ? AND target.manga_id != ?
    GROUP BY target.manga_id
)
SELECT m.*, COALESCE(mv.avg_rating, 0) as avg_rating, COALESCE(mv.chapter_count, 0) as chapters_count
FROM mangas m
LEFT JOIN tag_similarity ts ON ts.other_id = m.id
LEFT JOIN user_similarity us ON us.other_id = m.id
JOIN manga_stats_mv mv ON mv.manga_id = m.id
WHERE m.display_status = 'active'
ORDER BY (COALESCE(ts.jaccard_score, 0) * 0.6 + COALESCE(us.co_occurrence_score, 0) * 0.4) DESC
LIMIT ? OFFSET ?;`

	err := r.db.Raw(query, mangaID, mangaID, mangaID, mangaID, mangaID, mangaID, limit, offset).Scan(&mangas).Error
	if err == nil && len(mangas) > 0 {
		mangaIDs := make([]uint, len(mangas))
		for i := range mangas {
			mangaIDs[i] = mangas[i].ID
		}
		var tags []struct {
			MangaID uint
			models.Tag
		}
		r.db.Table("tags").
			Select("tags.*, manga_tags.manga_id").
			Joins("JOIN manga_tags ON manga_tags.tag_id = tags.id").
			Where("manga_tags.manga_id IN ?", mangaIDs).
			Scan(&tags)

		tagMap := make(map[uint][]models.Tag)
		for _, t := range tags {
			tagMap[t.MangaID] = append(tagMap[t.MangaID], t.Tag)
		}
		for i := range mangas {
			mangas[i].Tags = tagMap[mangas[i].ID]
		}

		// Also load teams for raw query results
		var teams []struct {
			MangaID uint
			models.Team
		}
		r.db.Table("teams").
			Select("teams.*, mangas.id as manga_id").
			Joins("JOIN mangas ON mangas.team_id = teams.id").
			Where("mangas.id IN ?", mangaIDs).
			Scan(&teams)

		teamMap := make(map[uint]models.Team)
		for _, t := range teams {
			teamMap[t.MangaID] = t.Team
		}
		for i := range mangas {
			if t, ok := teamMap[mangas[i].ID]; ok {
				mangas[i].Team = &t
			}
		}
	}
	return mangas, err
}

func (r *postgresMangaRepository) GetPersonalizedRecommendations(userID uint, limit int) ([]models.Manga, error) {
	var mangas []models.Manga
	query := `
WITH 
-- 1. Параметри для Байєсівського згладжування
constants AS (
    SELECT 
        AVG(avg_rating) as global_mean, 
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY rating_count) as min_votes_threshold
    FROM manga_stats_mv
),
-- 2. Зважений профіль інтересів користувача (Affinity Profile)
user_affinity AS (
    SELECT 
        mt.tag_id, 
        SUM(
            CASE 
                WHEN r.score IS NOT NULL THEN r.score - 5 -- Оцінка 10 дає +5, оцінка 1 дає -4
                WHEN ums.status = 'completed' THEN 3
                WHEN ums.status = 'reading' THEN 2
                WHEN rh.user_id IS NOT NULL THEN 1
                ELSE 0 
            END
        ) as affinity_score
    FROM manga_tags mt
    LEFT JOIN ratings r ON r.manga_id = mt.manga_id AND r.user_id = ?
    LEFT JOIN user_manga_statuses ums ON ums.manga_id = mt.manga_id AND ums.user_id = ?
    LEFT JOIN reading_histories rh ON rh.manga_id = mt.manga_id AND rh.user_id = ?
    WHERE r.user_id IS NOT NULL OR ums.user_id IS NOT NULL OR rh.user_id IS NOT NULL
    GROUP BY mt.tag_id
),
-- 3. Розрахунок персонального балу з Байєсівським згладжуванням
manga_scoring AS (
    SELECT 
        m.id as manga_id,
        -- Bayesian Smoothed Rating
        ((mv.rating_count * mv.avg_rating + c.min_votes_threshold * c.global_mean) / 
         (mv.rating_count + c.min_votes_threshold)) as smoothed_rating,
        -- Affinity Match
        COALESCE(SUM(ua.affinity_score), 0) as user_match_score
    FROM mangas m
    JOIN manga_stats_mv mv ON mv.manga_id = m.id
    CROSS JOIN constants c
    LEFT JOIN manga_tags mt ON mt.manga_id = m.id
    LEFT JOIN user_affinity ua ON ua.tag_id = mt.tag_id
    WHERE m.id NOT IN (SELECT manga_id FROM user_manga_statuses WHERE user_id = ?)
      AND m.display_status = 'active'
    GROUP BY m.id, mv.rating_count, mv.avg_rating, c.min_votes_threshold, c.global_mean
)
SELECT m.*, COALESCE(mv.avg_rating, 0) as avg_rating, COALESCE(mv.chapter_count, 0) as chapters_count
FROM mangas m
JOIN manga_scoring ms ON ms.manga_id = m.id
JOIN manga_stats_mv mv ON mv.manga_id = m.id
ORDER BY (ms.user_match_score * 0.7 + ms.smoothed_rating * 0.3) DESC
LIMIT ?;`

	err := r.db.Raw(query, userID, userID, userID, userID, limit).Scan(&mangas).Error
	if err == nil && len(mangas) > 0 {
		mangaIDs := make([]uint, len(mangas))
		for i := range mangas {
			mangaIDs[i] = mangas[i].ID
		}
		var tags []struct {
			MangaID uint
			models.Tag
		}
		r.db.Table("tags").
			Select("tags.*, manga_tags.manga_id").
			Joins("JOIN manga_tags ON manga_tags.tag_id = tags.id").
			Where("manga_tags.manga_id IN ?", mangaIDs).
			Scan(&tags)

		tagMap := make(map[uint][]models.Tag)
		for _, t := range tags {
			tagMap[t.MangaID] = append(tagMap[t.MangaID], t.Tag)
		}
		for i := range mangas {
			mangas[i].Tags = tagMap[mangas[i].ID]
		}

		// Also load teams for raw query results
		var teams []struct {
			MangaID uint
			models.Team
		}
		r.db.Table("teams").
			Select("teams.*, mangas.id as manga_id").
			Joins("JOIN mangas ON mangas.team_id = teams.id").
			Where("mangas.id IN ?", mangaIDs).
			Scan(&teams)

		teamMap := make(map[uint]models.Team)
		for _, t := range teams {
			teamMap[t.MangaID] = t.Team
		}
		for i := range mangas {
			if t, ok := teamMap[mangas[i].ID]; ok {
				mangas[i].Team = &t
			}
		}
	}
	return mangas, err
}

func (r *postgresMangaRepository) UpdateReadingHistory(userID, mangaID, chapterID uint) error {
	return r.db.Exec(`
		INSERT INTO reading_histories (user_id, manga_id, chapter_id, updated_at)
		VALUES (?, ?, ?, NOW())
		ON CONFLICT (user_id, manga_id) DO UPDATE SET
			chapter_id = EXCLUDED.chapter_id,
			updated_at = NOW()
	`, userID, mangaID, chapterID).Error
}
