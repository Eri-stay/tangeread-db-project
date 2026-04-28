package services

import (
	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
)

type MangaService interface {
	GetMangaList(limit, offset int) ([]models.Manga, error)
	GetLatestUpdated(limit, offset int) ([]models.Manga, error)
	GetTrending(limit, offset int) ([]models.Manga, error)
	GetMangaByID(id uint) (*models.Manga, error)
	GetChapter(mangaID uint, chapterNum float64) (*models.Chapter, error)
}

type mangaService struct {
	mangaRepo repositories.MangaRepository
}

func NewMangaService(mangaRepo repositories.MangaRepository) MangaService {
	return &mangaService{mangaRepo: mangaRepo}
}

func (s *mangaService) GetMangaList(limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.GetAll(limit, offset)
}

func (s *mangaService) GetLatestUpdated(limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.GetLatestUpdated(limit, offset)
}

func (s *mangaService) GetTrending(limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.GetTrending(limit, offset)
}

func (s *mangaService) GetMangaByID(id uint) (*models.Manga, error) {
	return s.mangaRepo.GetByID(id)
}

func (s *mangaService) GetChapter(mangaID uint, chapterNum float64) (*models.Chapter, error) {
	return s.mangaRepo.GetChapter(mangaID, chapterNum)
}
