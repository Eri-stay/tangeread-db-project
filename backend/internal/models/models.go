package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	UserRoleReader    UserRole = "reader"
	UserRoleAuthor    UserRole = "author"
	UserRoleModerator UserRole = "moderator"
	UserRoleAdmin     UserRole = "admin"
)

type InternalRole string

const (
	InternalRoleLeader     InternalRole = "leader"
	InternalRoleTranslator InternalRole = "translator"
	InternalRoleCleaner    InternalRole = "cleaner"
	InternalRoleTyper      InternalRole = "typer"
	InternalRoleEditor     InternalRole = "editor"
)

type MangaStatus string

const (
	MangaStatusOngoing   MangaStatus = "ongoing"
	MangaStatusCompleted MangaStatus = "completed"
	MangaStatusHiatus    MangaStatus = "hiatus"
	MangaStatusCancelled MangaStatus = "cancelled"
)

type MangaFormat string

const (
	FormatManga  MangaFormat = "manga"
	FormatManhwa MangaFormat = "manhwa"
	FormatManhua MangaFormat = "manhua"
	FormatComic  MangaFormat = "comic"
	FormatOEL    MangaFormat = "oel"
)

type ListStatus string

const (
	ListStatusReading   ListStatus = "reading"
	ListStatusCompleted ListStatus = "completed"
	ListStatusPlanned   ListStatus = "planned"
	ListStatusRereading ListStatus = "rereading"
	ListStatusOnHold    ListStatus = "on_hold"
	ListStatusDropped   ListStatus = "dropped"
)

type DisplayStatus string

const (
	DisplayStatusActive        DisplayStatus = "active"
	DisplayStatusDeletedByUser DisplayStatus = "deleted_by_user"
	DisplayStatusHiddenByMod   DisplayStatus = "hidden_by_mod"
)

type AdminActionType string

const (
	AdminActionHideManga     AdminActionType = "hide_manga"
	AdminActionHideComment   AdminActionType = "hide_comment"
	AdminActionEditManga     AdminActionType = "edit_manga"
	AdminActionEditComment   AdminActionType = "edit_comment"
	AdminActionBanUser       AdminActionType = "ban_user"
	AdminActionUnbanUser     AdminActionType = "unban_user"
	AdminActionDeleteChapter AdminActionType = "delete_chapter"
	AdminActionApproveTeam   AdminActionType = "approve_team"
	AdminActionRejectTeam    AdminActionType = "reject_team"
	AdminActionRestore       AdminActionType = "restore"
)

type TeamApplicationStatus string

const (
	TeamApplicationPending  TeamApplicationStatus = "pending"
	TeamApplicationApproved TeamApplicationStatus = "approved"
	TeamApplicationRejected TeamApplicationStatus = "rejected"
)

// --- Models ---

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	AvatarURL    *string        `json:"avatar_url"`
	Role         UserRole       `gorm:"type:varchar(20);not null;default:'reader'" json:"role"`
	IsBanned     bool           `gorm:"not null;default:false" json:"is_banned"`
	BanReason    *string        `json:"ban_reason,omitempty"`
	BanExpiresAt *time.Time     `json:"ban_expires_at,omitempty"`
	BannedByID   *uint          `json:"banned_by_id,omitempty"`
	BannedBy     *User          `gorm:"foreignKey:BannedByID" json:"banned_by,omitempty"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
}

type Team struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Name        string  `gorm:"uniqueIndex;not null" json:"name"`
	Description *string `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	Members     []TeamMember `json:"members,omitempty"`
}

type TeamApplication struct {
	ID              uint                  `gorm:"primaryKey"`
	Name            string                `gorm:"not null"`
	Description     *string               `gorm:"type:text"`
	AppliedByID     uint                  `gorm:"not null"`
	AppliedBy       User                  `gorm:"foreignKey:AppliedByID"`
	Status          TeamApplicationStatus `gorm:"type:varchar(20);not null;default:'pending'"`
	ReviewedByID    *uint
	ReviewedBy      *User   `gorm:"foreignKey:ReviewedByID"`
	RejectionReason *string `gorm:"type:text"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type TeamMember struct {
	UserID       uint         `gorm:"primaryKey;autoIncrement:false"`
	TeamID       uint         `gorm:"not null"`
	InternalRole InternalRole `gorm:"type:varchar(20);not null"`
	User         User
	Team         Team
}

type Manga struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	TitleUa       string `gorm:"not null" json:"title_ua"`
	TitleOrig     *string `json:"title_orig"`
	Description   *string `gorm:"type:text" json:"description"`
	CoverURL      *string `json:"cover_url"`
	Status        MangaStatus `gorm:"type:varchar(20);not null;default:'ongoing'" json:"status"`
	Format        MangaFormat `gorm:"type:varchar(20);not null" json:"format"`
	ReleaseYear   *int `json:"release_year"`
	TeamID        *uint `json:"team_id"`
	Team          *Team `json:"team"`
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'" json:"display_status"`
	CreatedAt     time.Time `json:"created_at"`
	PublishedAt   *time.Time `json:"published_at"`
	Tags          []Tag     `gorm:"many2many:manga_tags;" json:"tags"`
	Chapters      []Chapter `gorm:"foreignKey:MangaID;constraint:OnDelete:CASCADE;" json:"chapters"`
	AvgRating     float64   `json:"avg_rating" gorm:"->"`     // Read-only field
	ChaptersCount int       `json:"chapters_count" gorm:"->"` // Read-only field
}

type Tag struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	NameUk string `gorm:"uniqueIndex;not null" json:"name_uk"`
	NameEn string `gorm:"uniqueIndex;not null" json:"name_en"`
}

type Chapter struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	MangaID       uint          `gorm:"uniqueIndex:idx_manga_chapter;not null" json:"manga_id"`
	Volume        *int          `json:"volume"`
	ChapterNumber float64       `gorm:"uniqueIndex:idx_manga_chapter;type:decimal(6,2);not null" json:"chapter_number"`
	Title         *string       `json:"title"`
	UploaderID    *uint         `json:"uploader_id"`
	Uploader      *User         `json:"uploader"`
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'" json:"display_status"`
	ViewCount     int64         `gorm:"not null;default:0" json:"view_count"`
	CreatedAt     time.Time     `json:"created_at"`
	PublishedAt   *time.Time    `json:"published_at"`
	PagesURL      *string       `gorm:"not null" json:"pages_url"`
}

type ReadingHistory struct {
	UserID    uint `gorm:"primaryKey"`
	MangaID   uint `gorm:"primaryKey"`
	ChapterID uint `gorm:"not null"`
	UpdatedAt time.Time
	User      User    `gorm:"constraint:OnDelete:CASCADE;"`
	Manga     Manga   `gorm:"constraint:OnDelete:CASCADE;"`
	Chapter   Chapter `gorm:"constraint:OnDelete:CASCADE;"`
}

type UserMangaStatus struct {
	UserID     uint       `gorm:"primaryKey"`
	MangaID    uint       `gorm:"primaryKey"`
	Status     ListStatus `gorm:"type:varchar(20);not null"`
	IsFavorite bool       `gorm:"not null;default:false"`
	CreatedAt  time.Time
	User       User  `gorm:"constraint:OnDelete:CASCADE;"`
	Manga      Manga `gorm:"constraint:OnDelete:CASCADE;"`
}

type Rating struct {
	UserID    uint `gorm:"primaryKey"`
	MangaID   uint `gorm:"primaryKey"`
	Score     int  `gorm:"check:score >= 1 AND score <= 10;not null"`
	CreatedAt time.Time
	User      User  `gorm:"constraint:OnDelete:CASCADE;"`
	Manga     Manga `gorm:"constraint:OnDelete:CASCADE;"`
}

type Comment struct {
	ID            uint `gorm:"primaryKey" json:"id"`
	UserID        *uint `json:"user_id"`
	User          *User `json:"user"`
	ChapterID     uint    `gorm:"not null" json:"chapter_id"`
	Chapter       *Chapter `json:"chapter" gorm:"constraint:OnDelete:CASCADE;"`
	ParentID      *uint `json:"parent_id"`
	Parent        *Comment `json:"parent"`
	Content       string        `gorm:"type:text;not null" json:"content"`
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'" json:"display_status"`
	CreatedAt     time.Time `json:"created_at"`
}

type AdminLog struct {
	ID              uint            `gorm:"primaryKey"`
	AdminID         uint            `gorm:"not null"`
	Admin           User            `gorm:"foreignKey:AdminID"`
	ActionType      AdminActionType `gorm:"type:varchar(20)"`
	Reason          *string         `gorm:"type:text"`
	TargetUserID    *uint
	TargetUser      *User `gorm:"foreignKey:TargetUserID"`
	TargetMangaID   *uint
	TargetManga     *Manga `gorm:"foreignKey:TargetMangaID"`
	TargetChapterID *uint
	TargetChapter   *Chapter `gorm:"foreignKey:TargetChapterID"`
	TargetCommentID *uint
	TargetComment   *Comment `gorm:"foreignKey:TargetCommentID"`
	CreatedAt       time.Time
}
