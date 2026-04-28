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
	ID           uint   `gorm:"primaryKey"`
	Email        string `gorm:"uniqueIndex;not null"`
	Username     string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
	AvatarURL    *string
	Role         UserRole `gorm:"type:varchar(20);not null;default:'reader'"`
	IsBanned     bool     `gorm:"not null;default:false"`
	BanReason    *string
	BanExpiresAt *time.Time
	BannedByID   *uint
	BannedBy     *User          `gorm:"foreignKey:BannedByID"`
	DeletedAt    gorm.DeletedAt `gorm:"index"`
	CreatedAt    time.Time
}

type Team struct {
	ID          uint    `gorm:"primaryKey"`
	Name        string  `gorm:"uniqueIndex;not null"`
	Description *string `gorm:"type:text"`
	CreatedAt   time.Time
	Members     []TeamMember
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
	UserID       uint         `gorm:"primaryKey"`
	TeamID       uint         `gorm:"primaryKey"`
	InternalRole InternalRole `gorm:"type:varchar(20);not null"`
	User         User
	Team         Team
}

type Manga struct {
	ID            uint   `gorm:"primaryKey"`
	TitleUa       string `gorm:"not null"`
	TitleOrig     *string
	Description   *string `gorm:"type:text"`
	CoverURL      *string
	Status        MangaStatus `gorm:"type:varchar(20);not null;default:'ongoing'"`
	Format        MangaFormat `gorm:"type:varchar(20);not null"`
	ReleaseYear   *int
	TeamID        *uint
	Team          *Team
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'"`
	CreatedAt     time.Time
	PublishedAt   *time.Time
	Tags          []Tag     `gorm:"many2many:manga_tags;"`
	Chapters      []Chapter `gorm:"foreignKey:MangaID;constraint:OnDelete:CASCADE;"`
}

type Tag struct {
	ID     uint   `gorm:"primaryKey"`
	NameUk string `gorm:"uniqueIndex;not null"`
	NameEn string `gorm:"uniqueIndex;not null"`
}

type Chapter struct {
	ID            uint `gorm:"primaryKey"`
	MangaID       uint `gorm:"uniqueIndex:idx_manga_chapter;not null"`
	Volume        *int
	ChapterNumber float64 `gorm:"uniqueIndex:idx_manga_chapter;type:decimal(6,2);not null"`
	Title         *string
	UploaderID    *uint
	Uploader      *User
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'"`
	ViewCount     int64         `gorm:"not null;default:0"`
	CreatedAt     time.Time
	PublishedAt   *time.Time
	PagesURL      *string `gorm:"not null"`
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
	ID            uint `gorm:"primaryKey"`
	UserID        *uint
	User          *User
	ChapterID     uint    `gorm:"not null"`
	Chapter       Chapter `gorm:"constraint:OnDelete:CASCADE;"`
	ParentID      *uint
	Parent        *Comment
	Content       string        `gorm:"type:text;not null"`
	DisplayStatus DisplayStatus `gorm:"type:varchar(20);not null;default:'active'"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
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
