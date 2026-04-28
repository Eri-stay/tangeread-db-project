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

