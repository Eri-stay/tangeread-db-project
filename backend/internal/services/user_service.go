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
	GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, error)
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

func (s *userService) GetHistory(userID uint, limit, offset int) ([]models.HistoryDTO, error) {
	historyList, err := s.userRepo.GetHistory(userID, limit, offset)
	if err != nil {
		return nil, err
	}

	loc, _ := time.LoadLocation("Europe/Kiev")
	for i := range historyList {
		historyList[i].TimeAgo = timeago.English.Format(historyList[i].UpdatedAt.In(loc))
		}

        return historyList, nil
}
