package services

import (
	"errors"
	"os"
	"time"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(email, username, password string) (*models.User, string, error)
	Login(email, password string) (*models.User, string, error)
}

type authService struct {
	authRepo repositories.AuthRepository
}

func NewAuthService(authRepo repositories.AuthRepository) AuthService {
	return &authService{authRepo: authRepo}
}

func (s *authService) Register(email, username, password string) (*models.User, string, error) {
	// 1. Check if email exists
	existingUser, err := s.authRepo.GetByEmail(email)
	if err != nil {
		return nil, "", err
	}
	if existingUser != nil {
		return nil, "", errors.New("email already registered")
	}

	// 2. Check if username exists
	existingUsername, err := s.authRepo.GetByUsername(username)
	if err != nil {
		return nil, "", err
	}
	if existingUsername != nil {
		return nil, "", errors.New("username already taken")
	}

	// 3. Hash password using bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	// 4. Create user
	user := &models.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(hashedPassword),
		Role:         models.UserRoleReader, // Default role
	}

	if err := s.authRepo.Create(user); err != nil {
		return nil, "", err
	}

	// 5. Generate token to automatically log the user in
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 14).Unix(),
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "fallback_secret_key"
	}

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return nil, "", err
	}

	return user, tokenString, nil
}

func (s *authService) Login(email, password string) (*models.User, string, error) {
	// 1. Find user by email
	user, err := s.authRepo.GetByEmail(email)
	if err != nil {
		return nil, "", err
	}
	if user == nil {
		return nil, "", errors.New("invalid email or password")
	}

	if user.IsBanned {
		return nil, "", errors.New("ваш акаунт було заблоковано")
	}

	// 2. Compare provided password with hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	// 3. Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 14).Unix(),
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "fallback_secret_key" // fallback for local dev
	}

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return nil, "", err
	}

	return user, tokenString, nil
}
