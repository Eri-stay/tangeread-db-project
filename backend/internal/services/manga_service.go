package services

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
)

type MangaService interface {
	GetMangaList(limit int) ([]models.Manga, error)
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
