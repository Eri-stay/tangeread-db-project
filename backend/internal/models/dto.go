package models

import "time"

type BookmarkDTO struct {
ID              uint    `json:"id"`
Title           string  `json:"title"`
CoverImage      string  `json:"coverImage"`
Rating          int     `json:"rating"`
LastReadChapter float64 `json:"lastReadChapter"`
TotalChapters   int     `json:"totalChapters"`
AddedDate       string  `json:"addedDate"`
Status          string  `json:"status"`
IsFavorite      bool    `json:"isFavorite"`
}

type HistoryDTO struct {
ID            uint      `json:"id"`
MangaID       uint      `json:"mangaId"`
MangaTitle    string    `json:"mangaTitle"`
CoverImage    string    `json:"coverImage"`
ChapterNumber float64   `json:"chapterNumber"`
UpdatedAt     time.Time `json:"_"`
TimeAgo       string    `json:"timeAgo"`
}

type TeamApplicationDTO struct {
	ID              uint      `json:"id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description"`
	Status          string    `json:"status"`
	RejectionReason *string   `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	ApplicantID     uint      `json:"applicant_id"`
	ApplicantName   string    `json:"applicant_name"`
	ApplicantAvatar *string   `json:"applicant_avatar"`
}

