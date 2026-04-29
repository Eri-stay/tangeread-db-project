package services

import (
	"errors"
	"time"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
	"github.com/xeonx/timeago"
)

type UserService interface {
	GetProfile(userID uint) (*models.User, error)
	UpdateProfile(userID uint, username string, avatarURL *string) (*models.User, error)
	SoftDeleteAccount(userID uint) error
	GetBookmarks(userID uint, limit, offset int) (map[string][]models.BookmarkDTO, map[string]int, error)
	GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, int64, error)
	GetMangaUserStatus(userID, mangaID uint) (status string, isFavorite bool, score int, lastChapter float64, err error)
	SetFavorite(userID, mangaID uint, isFavorite bool) error
	SetMangaStatus(userID, mangaID uint, status string) error
	RateManga(userID, mangaID uint, score int) error
	GetUserTeamID(userID uint) (uint, error)
}

type userService struct {
	userRepo repositories.UserRepository
}

func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetProfile(userID uint) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) UpdateProfile(userID uint, username string, avatarURL *string) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if username != "" && username != user.Username {
		existingUser, err := s.userRepo.GetByUsername(username)
		if err != nil {
			return nil, err
		}
		if existingUser != nil {
			return nil, errors.New("username already taken")
		}
		user.Username = username
	}

	if avatarURL != nil {
		user.AvatarURL = avatarURL
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userService) SoftDeleteAccount(userID uint) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	return s.userRepo.SoftDelete(userID)
}

func (s *userService) GetBookmarks(userID uint, limit, offset int) (map[string][]models.BookmarkDTO, map[string]int, error) {
	bookmarksList, err := s.userRepo.GetBookmarks(userID, limit, offset)
	if err != nil {
		return nil, nil, err
	}

	counts, err := s.userRepo.GetBookmarkCounts(userID)
	if err != nil {
		return nil, nil, err
	}

	result := map[string][]models.BookmarkDTO{
		"reading":   {},
		"completed": {},
		"planned":   {},
		"rereading": {},
		"on_hold":   {},
		"dropped":   {},
		"favorite":  {},
	}

	for _, b := range bookmarksList {
		if b.Status != "" {
			result[b.Status] = append(result[b.Status], b)
		}
		if b.IsFavorite {
			result["favorite"] = append(result["favorite"], b)
		}
	}

	return result, counts, nil
}

func (s *userService) GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, int64, error) {
	historyList, err := s.userRepo.GetHistory(userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	totalCount, err := s.userRepo.GetHistoryCount(userID)
	if err != nil {
		return nil, 0, err
	}

	loc, _ := time.LoadLocation("Europe/Kiev")
	for i := range historyList {
		historyList[i].TimeAgo = timeago.English.Format(historyList[i].UpdatedAt.In(loc))
	}

	return historyList, totalCount, nil
}

func (s *userService) GetMangaUserStatus(userID, mangaID uint) (string, bool, int, float64, error) {
	return s.userRepo.GetMangaUserStatus(userID, mangaID)
}

func (s *userService) SetFavorite(userID, mangaID uint, isFavorite bool) error {
	return s.userRepo.SetFavorite(userID, mangaID, isFavorite)
}

func (s *userService) SetMangaStatus(userID, mangaID uint, status string) error {
	return s.userRepo.SetMangaStatus(userID, mangaID, status)
}

func (s *userService) RateManga(userID, mangaID uint, score int) error {
	return s.userRepo.RateManga(userID, mangaID, score)
}

func (s *userService) GetUserTeamID(userID uint) (uint, error) {
	return s.userRepo.GetUserTeamID(userID)
}
