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
	GetAuthorProjects(authorID uint) ([]models.Manga, error)
	CreateManga(manga *models.Manga, tagIDs []uint) error
	UpdateManga(manga *models.Manga, tagIDs []uint) error
	CreateChapter(chapter *models.Chapter) error
	GetRecommendations(userID uint, limit int) ([]models.Manga, error)
	GetSimilarManga(mangaID uint, limit int) ([]models.Manga, error)
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

func (s *mangaService) GetAuthorProjects(authorID uint) ([]models.Manga, error) {
	return s.mangaRepo.GetByAuthorID(authorID)
}

func (s *mangaService) CreateManga(manga *models.Manga, tagIDs []uint) error {
	return s.mangaRepo.Create(manga, tagIDs)
}

func (s *mangaService) UpdateManga(manga *models.Manga, tagIDs []uint) error {
	return s.mangaRepo.Update(manga, tagIDs)
}

func (s *mangaService) CreateChapter(chapter *models.Chapter) error {
	return s.mangaRepo.CreateChapter(chapter)
}

func (s *mangaService) GetRecommendations(userID uint, limit int) ([]models.Manga, error) {
	return s.mangaRepo.GetPersonalizedRecommendations(userID, limit)
}

func (s *mangaService) GetSimilarManga(mangaID uint, limit int) ([]models.Manga, error) {
	return s.mangaRepo.GetSimilarManga(mangaID, limit)
}
