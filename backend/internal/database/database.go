package database

import (
	"embed"
	"log"
	"sort"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

//go:embed sql/*.sql
var sqlFilesFS embed.FS

// DB holds the connected database instance
var DB *gorm.DB

// InitDB initializes the Postgres database connection and runs SQL migrations
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

	// Run SQL migrations instead of AutoMigrate
	RunSQLMigrations(DB)

	log.Println("Database migration completed successfully")
}

// RunSQLMigrations runs all SQL migration files in order
func RunSQLMigrations(db *gorm.DB) {
	log.Println("Running SQL migrations...")

	// Read directory contents from embedded filesystem
	entries, err := sqlFilesFS.ReadDir("sql")
	if err != nil {
		log.Printf("Error reading SQL directory: %v", err)
		return
	}

	// Collect and sort SQL files by name
	var sqlFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			sqlFiles = append(sqlFiles, entry.Name())
		}
	}
	sort.Strings(sqlFiles)

	// Execute each SQL file in order
	for _, fileName := range sqlFiles {
		content, err := sqlFilesFS.ReadFile("sql/" + fileName)
		if err != nil {
			log.Printf("Error reading SQL file %s: %v", fileName, err)
			continue
		}

		if err := db.Exec(string(content)).Error; err != nil {
			log.Printf("Error executing SQL file %s: %v", fileName, err)
		} else {
			log.Printf("Executed SQL migration: %s", fileName)
		}
	}

	log.Println("All SQL migrations completed")
}
