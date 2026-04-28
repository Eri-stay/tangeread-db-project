package database

import (
	"log"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB holds the connected database instance
var DB *gorm.DB

// InitDB initializes the Postgres database connection and runs auto-migrations
func InitDB(dsn string) {
	var err error

	// Connect to PostgreSQL database
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established")

	// Run AutoMigrate for all models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Team{},
		&models.TeamApplication{},
		&models.TeamMember{},
		&models.Tag{},
		&models.Manga{}, // Automatically handles the manga_tags join table
		&models.Chapter{},
		&models.ReadingHistory{},
		&models.UserMangaStatus{},
		&models.Rating{},
		&models.Comment{},
		&models.AdminLog{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	log.Println("Database migration completed successfully")

	// Run manual migrations for indices and triggers
	RunManualMigrations(DB)

	// Seed dummy data if needed
	SeedDefaultUsers(DB)
	SeedFakeManga(DB)
}

// RunManualMigrations applies custom SQL extensions, indices, and triggers.
func RunManualMigrations(db *gorm.DB) {
	log.Println("Running manual SQL migrations (Trigrams, GIN indices, Triggers)...")

	// 1. Enable pg_trgm extension for fuzzy search
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`).Error; err != nil {
		log.Printf("Warning: failed to create pg_trgm extension: %v", err)
	}

	// 2. Create GIN indices for trigram fuzzy search
	ginIndices := []string{
		`CREATE INDEX IF NOT EXISTS idx_mangas_title_ua_trgm ON mangas USING gin (title_ua gin_trgm_ops);`,
		`CREATE INDEX IF NOT EXISTS idx_mangas_title_orig_trgm ON mangas USING gin (title_orig gin_trgm_ops);`,
	}

	for _, query := range ginIndices {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("Warning: failed to execute GIN index query: %v", err)
		}
	}

	// 3. Create B-Tree indices for frequently sorted/filtered fields
	bTreeIndices := []string{
		`CREATE INDEX IF NOT EXISTS idx_mangas_status ON mangas (status);`,
		`CREATE INDEX IF NOT EXISTS idx_mangas_display_status ON mangas (display_status);`,
	}

	for _, query := range bTreeIndices {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("Warning: failed to execute B-Tree index query: %v", err)
		}
	}

	mvSQL0 := `
	DROP TRIGGER IF EXISTS trg_update_manga_avg_rating ON ratings;
	DROP FUNCTION IF EXISTS update_manga_avg_rating_func();
	`
	if err := db.Exec(mvSQL0).Error; err != nil {
		log.Printf("Error dropping trigger: %v", err)
	}

	// 4. Update Materialized View for statistics
	log.Println("Updating Materialized View: manga_stats_mv...")

	// Drop old view with cascade
	db.Exec(`DROP MATERIALIZED VIEW IF EXISTS manga_stats_mv CASCADE;`)

	// Create new view with chapter_count
	createMVSQL := `
	CREATE MATERIALIZED VIEW manga_stats_mv AS
	SELECT 
		m.id AS manga_id,
		CAST(COALESCE(AVG(r.score), 0) AS DOUBLE PRECISION) AS avg_rating,
		COUNT(DISTINCT r.user_id) AS rating_count,
		COUNT(DISTINCT c.id) AS chapter_count
	FROM mangas m
	LEFT JOIN ratings r ON r.manga_id = m.id
	LEFT JOIN chapters c ON c.manga_id = m.id AND c.display_status = 'active'
	GROUP BY m.id;`

	if err := db.Exec(createMVSQL).Error; err != nil {
		log.Printf("!!! CRITICAL ERROR creating manga_stats_mv: %v", err)
	}

	// Re-create the unique index for concurrent refreshes
	if err := db.Exec(`CREATE UNIQUE INDEX idx_manga_stats_mv_manga_id ON manga_stats_mv (manga_id);`).Error; err != nil {
		log.Printf("Error creating index on MV: %v", err)
	}

	log.Println("Manual SQL migrations completed")
}

// SeedFakeManga inserts 5 dummy mangas if the table is empty
func SeedFakeManga(db *gorm.DB) {
	var count int64
	db.Model(&models.Manga{}).Count(&count)
	if count > 0 {
		log.Println("Mangas table is not empty, skipping seeding")
		return
	}

	desc1 := "Це епічна історія про подорож у невідоме..."
	desc2 := "Темне фентезі, де головний герой втрачає все."
	cover1 := "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80"
	cover2 := "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80"
	cover3 := "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
	cover4 := "https://images.unsplash.com/photo-1604073926896-ce89428b5e59?w=800&q=80"
	cover5 := "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80"

	mangas := []models.Manga{
		{
			TitleUa:       "Початок після кінця",
			Description:   &desc1,
			CoverURL:      &cover1,
			Status:        models.MangaStatusOngoing,
			DisplayStatus: models.DisplayStatusActive,
		},
		{
			TitleUa:       "Підняття рівня наодинці",
			Description:   &desc2,
			CoverURL:      &cover2,
			Status:        models.MangaStatusCompleted,
			DisplayStatus: models.DisplayStatusActive,
		},
		{
			TitleUa:       "Берсерк",
			Description:   &desc2,
			CoverURL:      &cover3,
			Status:        models.MangaStatusHiatus,
			DisplayStatus: models.DisplayStatusActive,
		},
		{
			TitleUa:       "Людина-бензопила",
			Description:   &desc1,
			CoverURL:      &cover4,
			Status:        models.MangaStatusOngoing,
			DisplayStatus: models.DisplayStatusActive,
		},
		{
			TitleUa:       "Магічна битва",
			Description:   &desc1,
			CoverURL:      &cover5,
			Status:        models.MangaStatusOngoing,
			DisplayStatus: models.DisplayStatusActive,
		},
	}

	if err := db.Create(&mangas).Error; err != nil {
		log.Printf("Failed to seed fake manga: %v", err)
		return
	}

	log.Println("Successfully seeded 5 fake mangas")
}

// SeedDefaultUsers creates default admin, moderators, and authors if they do not exist
func SeedDefaultUsers(db *gorm.DB) {
	defaultUsers := []struct {
		Username string
		Email    string
		Password string
		Role     models.UserRole
	}{
		{"admin", "admin@gmail.com", "admin", models.UserRoleAdmin},
		{"moderator1", "moderator1@gmail.com", "moderator1", models.UserRoleModerator},
		{"moderator2", "moderator2@gmail.com", "moderator2", models.UserRoleModerator},
		{"moderator3", "moderator3@gmail.com", "moderator3", models.UserRoleModerator},
		{"author1", "author1@gmail.com", "author1", models.UserRoleAuthor},
		{"author2", "author2@gmail.com", "author2", models.UserRoleAuthor},
		{"author3", "author3@gmail.com", "author3", models.UserRoleAuthor},
	}

	for _, u := range defaultUsers {
		var count int64
		db.Model(&models.User{}).Where("email = ?", u.Email).Count(&count)
		if count == 0 {
			hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("Failed to hash password for user %s: %v", u.Username, err)
				continue
			}

			newUser := models.User{
				Username:     u.Username,
				Email:        u.Email,
				PasswordHash: string(hash),
				Role:         u.Role,
			}
			if err := db.Create(&newUser).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Username, err)
			} else {
				log.Printf("Seeded user: %s (%s)", u.Username, u.Role)
			}
		}
	}
}
