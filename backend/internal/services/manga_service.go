package services

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
	s3storage "github.com/eri-stay/tangeread-db-project/backend/internal/storage/s3"
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
	GetSimilarManga(mangaID uint, limit, offset int) ([]models.Manga, error)
	Search(query string, limit, offset int) ([]models.Manga, error)
	GetFiltered(filters repositories.MangaFilters, limit, offset int) ([]models.Manga, error)
	UpdateReadingHistory(userID, mangaID, chapterID uint) error
}

type mangaService struct {
	mangaRepo    repositories.MangaRepository
	mediaStorage *s3storage.MediaStorage
}

func NewMangaService(mangaRepo repositories.MangaRepository, mediaStorage *s3storage.MediaStorage) MangaService {
	return &mangaService{mangaRepo: mangaRepo, mediaStorage: mediaStorage}
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
	chapter, err := s.mangaRepo.GetChapter(mangaID, chapterNum)
	if err != nil {
		return nil, err
	}

	if chapter.PagesURL == nil || *chapter.PagesURL == "" {
		return chapter, nil
	}

	// Якщо в базі лежить повноцінний лінк (наприклад, заглушка Coming Soon)
	if strings.HasPrefix(*chapter.PagesURL, "http") {
		return chapter, nil // Віддаємо як є
	}

	// Якщо в базі шлях до папки (mangas/1/chapters/1/)
	// Викликаємо S3 List і перетворюємо шлях на список лінків
	files, err := s.mediaStorage.List(context.Background(), *chapter.PagesURL, 1)
	if err == nil {
		publicURL := os.Getenv("S3_PUBLIC_URL")
		var fullLinks []string
		for _, file := range files {
			// S3_PUBLIC_URL + tangeread-media/ (root) + file
			link := fmt.Sprintf("%s/tangeread-media/%s", strings.TrimSuffix(publicURL, "/"), strings.TrimPrefix(file, "/"))
			fullLinks = append(fullLinks, link)
		}
		pagesString := strings.Join(fullLinks, ",")
		chapter.PagesURL = &pagesString
	}

	return chapter, nil
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

func (s *mangaService) GetSimilarManga(mangaID uint, limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.GetSimilarManga(mangaID, limit, offset)
}

func (s *mangaService) Search(query string, limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.Search(query, limit, offset)
}

func (s *mangaService) GetFiltered(filters repositories.MangaFilters, limit, offset int) ([]models.Manga, error) {
	return s.mangaRepo.GetFiltered(filters, limit, offset)
}

func (s *mangaService) UpdateReadingHistory(userID, mangaID, chapterID uint) error {
	return s.mangaRepo.UpdateReadingHistory(userID, mangaID, chapterID)
}
