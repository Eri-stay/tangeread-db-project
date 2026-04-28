package services

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
)

type MangaService interface {
	GetMangaList(limit int) ([]models.Manga, error)
	GetLatestUpdated(limit int) ([]models.Manga, error)
	GetTrending(limit int) ([]models.Manga, error)
}

type mangaService struct {
	mangaRepo repositories.MangaRepository
}

func NewMangaService(mangaRepo repositories.MangaRepository) MangaService {
	return &mangaService{mangaRepo: mangaRepo}
}

func (s *mangaService) GetMangaList(limit int) ([]models.Manga, error) {
	return s.mangaRepo.GetAll(limit)
}

func (s *mangaService) GetLatestUpdated(limit int) ([]models.Manga, error) {
	return s.mangaRepo.GetLatestUpdated(limit)
}

func (s *mangaService) GetTrending(limit int) ([]models.Manga, error) {
	return s.mangaRepo.GetTrending(limit)
}
