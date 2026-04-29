package repositories

import (
	"errors"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByID(id uint) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
	Update(user *models.User) error
	SoftDelete(id uint) error
	Restore(id uint) error
	GetBookmarks(userID uint, limit, offset int) ([]models.BookmarkDTO, error)
	GetBookmarkCounts(userID uint) (map[string]int, error)
	GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, error)
	GetHistoryCount(userID uint) (int64, error)
	GetMangaUserStatus(userID, mangaID uint) (status string, isFavorite bool, score int, lastChapter float64, err error)
	SetFavorite(userID, mangaID uint, isFavorite bool) error
	SetMangaStatus(userID, mangaID uint, status string) error
	RateManga(userID, mangaID uint, score int) error
	GetUserTeamID(userID uint) (uint, error)
}

type postgresUserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *postgresUserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *postgresUserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *postgresUserRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *postgresUserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *postgresUserRepository) SoftDelete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *postgresUserRepository) Restore(id uint) error {
	return r.db.Unscoped().Model(&models.User{}).Where("id = ?", id).Update("deleted_at", nil).Error
}

func (r *postgresUserRepository) GetBookmarks(userID uint, limit, offset int) ([]models.BookmarkDTO, error) {
	var bookmarks []models.BookmarkDTO
	query := `
SELECT 
m.id as id, 
m.title_ua as title, 
COALESCE(m.cover_url, '') as cover_image, 
COALESCE(ra.score, 0) as rating,
COALESCE(c.chapter_number, 0) as last_read_chapter,
COALESCE(ms.chapter_count, 0) as total_chapters,
ums.created_at::text as added_date,
ums.status as status,
ums.is_favorite as is_favorite
FROM user_manga_statuses ums
JOIN mangas m ON ums.manga_id = m.id
LEFT JOIN ratings ra ON ra.user_id = ums.user_id AND ra.manga_id = m.id
LEFT JOIN reading_histories rh ON rh.user_id = ums.user_id AND rh.manga_id = m.id
LEFT JOIN chapters c ON c.id = rh.chapter_id
LEFT JOIN manga_stats_mv ms ON ms.manga_id = m.id
WHERE ums.user_id = ?
ORDER BY ums.created_at DESC
LIMIT ? OFFSET ?
`
	err := r.db.Raw(query, userID, limit, offset).Scan(&bookmarks).Error
	return bookmarks, err
}

func (r *postgresUserRepository) GetBookmarkCounts(userID uint) (map[string]int, error) {
	type result struct {
		Status string
		Count  int
	}
	var results []result
	err := r.db.Table("user_manga_statuses").
		Select("status, count(*) as count").
		Where("user_id = ?", userID).
		Group("status").
		Scan(&results).Error

	counts := make(map[string]int)
	for _, res := range results {
		counts[res.Status] = res.Count
	}
	return counts, err
}

func (r *postgresUserRepository) GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, error) {
	var history []models.HistoryDTO
	query := `
SELECT 
rh.chapter_id as id,
m.id as manga_id,
m.title_ua as manga_title,
COALESCE(m.cover_url, '') as cover_image,
c.chapter_number as chapter_number,
rh.updated_at as updated_at
FROM reading_histories rh
JOIN mangas m ON rh.manga_id = m.id
JOIN chapters c ON rh.chapter_id = c.id
WHERE rh.user_id = ?
ORDER BY rh.updated_at DESC
LIMIT ? OFFSET ?
`
	err := r.db.Raw(query, userID, limit, offset).Scan(&history).Error
	return history, err
}

func (r *postgresUserRepository) GetHistoryCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Table("reading_histories").Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *postgresUserRepository) GetMangaUserStatus(userID, mangaID uint) (string, bool, int, float64, error) {
	var userStatus models.UserMangaStatus
	err := r.db.Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&userStatus).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", false, 0, 0, err
	}

	var rating models.Rating
	errRating := r.db.Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&rating).Error
	if errRating != nil && !errors.Is(errRating, gorm.ErrRecordNotFound) {
		return string(userStatus.Status), userStatus.IsFavorite, 0, 0, errRating
	}

	var lastChapter float64
	query := `
		SELECT c.chapter_number 
		FROM reading_histories rh
		JOIN chapters c ON rh.chapter_id = c.id
		WHERE rh.user_id = ? AND rh.manga_id = ?
	`
	r.db.Raw(query, userID, mangaID).Scan(&lastChapter)

	return string(userStatus.Status), userStatus.IsFavorite, rating.Score, lastChapter, nil
}
func (r *postgresUserRepository) SetFavorite(userID, mangaID uint, isFavorite bool) error {
	var status models.UserMangaStatus
	err := r.db.Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&status).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = models.UserMangaStatus{
				UserID:     userID,
				MangaID:    mangaID,
				Status:     models.ListStatusPlanned,
				IsFavorite: isFavorite,
			}
			return r.db.Create(&status).Error
		}
		return err
	}
	return r.db.Model(&status).Update("is_favorite", isFavorite).Error
}

func (r *postgresUserRepository) SetMangaStatus(userID, mangaID uint, status string) error {
	var userStatus models.UserMangaStatus
	err := r.db.Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&userStatus).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			userStatus = models.UserMangaStatus{
				UserID:     userID,
				MangaID:    mangaID,
				Status:     models.ListStatus(status),
				IsFavorite: false,
			}
			return r.db.Create(&userStatus).Error
		}
		return err
	}
	return r.db.Model(&userStatus).Update("status", status).Error
}

func (r *postgresUserRepository) RateManga(userID, mangaID uint, score int) error {
	var rating models.Rating
	err := r.db.Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&rating).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			rating = models.Rating{
				UserID:  userID,
				MangaID: mangaID,
				Score:   score,
			}
			return r.db.Create(&rating).Error
		}
		return err
	}
	return r.db.Model(&rating).Update("score", score).Error
}

func (r *postgresUserRepository) GetUserTeamID(userID uint) (uint, error) {
	var membership models.TeamMember
	err := r.db.Where("user_id = ?", userID).First(&membership).Error
	if err != nil {
		return 0, err
	}
	return membership.TeamID, nil
}
