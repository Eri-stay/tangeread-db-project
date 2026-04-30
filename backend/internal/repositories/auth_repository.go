package repositories

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"gorm.io/gorm"
)

type AuthRepository interface {
	GetByEmail(email string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
	Create(user *models.User) error
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *authRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *authRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}
