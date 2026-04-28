package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"gorm.io/gorm"

	"github.com/eri-stay/tangeread-db-project/backend/internal/database"
	"github.com/eri-stay/tangeread-db-project/backend/internal/handlers"
	"github.com/eri-stay/tangeread-db-project/backend/internal/repositories"
	"github.com/eri-stay/tangeread-db-project/backend/internal/services"
	s3storage "github.com/eri-stay/tangeread-db-project/backend/internal/storage/s3"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func startBackgroundTasks(db *gorm.DB) {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := db.Exec("REFRESH MATERIALIZED VIEW CONCURRENTLY manga_stats_mv").Error; err != nil {
					log.Printf("Background: Failed to refresh manga_stats_mv: %v", err)
				}
			}
		}
	}()
}

func main() {
	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		godotenv.Load("../../.env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Fallback DSN for local development
		dsn = "host=localhost user=postgres password=postgres dbname=tangeread_c port=5432 sslmode=disable"
	}

	// 2. Initialize Database and run migrations
	database.InitDB(dsn)

	// Start background workers
	startBackgroundTasks(database.DB)

	// 3. Initialize Repositories
	userRepo := repositories.NewUserRepository(database.DB)
	mangaRepo := repositories.NewMangaRepository(database.DB)

	// 4. Initialize Services
	authService := services.NewAuthService(userRepo)
	userService := services.NewUserService(userRepo)
	mangaService := services.NewMangaService(mangaRepo)

	// 5. Initialize S3 Storage
	s3Bucket := os.Getenv("S3_BUCKET")
	s3Region := os.Getenv("S3_REGION")
	s3Endpoint := os.Getenv("S3_ENDPOINT")
	s3AccessKey := os.Getenv("S3_ACCESS_KEY_ID")
	s3SecretKey := os.Getenv("S3_SECRET_ACCESS_KEY")

	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(s3Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(s3AccessKey, s3SecretKey, "")),
	)
	if err != nil {
		log.Fatalf("unable to load AWS config: %v", err)
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if s3Endpoint != "" {
			o.BaseEndpoint = aws.String(s3Endpoint)
			o.UsePathStyle = true
		}
	})

	mediaStorage := s3storage.NewMediaStorage(s3Client, s3Bucket, "tangeread-media")
	log.Printf("S3 Media Storage initialized for bucket: %s", s3Bucket)

	_ = mediaStorage // Prevent unused variable error for now until injected

	// 6. Initialize Handlers
	_, currentFile, _, _ := runtime.Caller(0)
	// seed.py lives two directories up from cmd/api/main.go
	seedScript := filepath.Join(filepath.Dir(currentFile), "..", "..", "..", "seed.py")
	seedScript = filepath.Clean(seedScript)

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService, mediaStorage)
	mangaHandler := handlers.NewMangaHandler(mangaService)
	adminHandler := handlers.NewAdminHandler(database.DB, seedScript)

	// 7. Setup Gin Router
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:  []string{"*"},
		AllowMethods:  []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"*"},
		ExposeHeaders: []string{"*"},
	}))

	// 8. Setup Routes
	api := r.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		manga := api.Group("/manga")
		{
			manga.GET("", mangaHandler.GetMangaList)
			manga.GET("/latest", mangaHandler.GetLatestUpdated)
			manga.GET("/trending", mangaHandler.GetTrending)
			manga.GET("/:id", mangaHandler.GetMangaByID)
			manga.GET("/:id/chapters/:number", mangaHandler.GetChapter)
		}

		// Admin routes (JWT required + admin role check inside handler)
		admin := api.Group("/admin")
		admin.Use(handlers.JWTMiddleware())
		{
			admin.POST("/seed", adminHandler.RunSeed)
			admin.DELETE("/seed", adminHandler.DeleteSeed)
			admin.GET("/stats", adminHandler.GetPlatformStats)
			admin.GET("/genre-stats", adminHandler.GetGenreStats)
			admin.GET("/registration-stats", adminHandler.GetRegistrationStats)
			admin.GET("/team-stats", adminHandler.GetTeamStats)
		}

		// Protected routes
		users := api.Group("/users")
		users.Use(handlers.JWTMiddleware()) // Apply JWT middleware
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
			users.GET("/bookmarks", userHandler.GetBookmarks)
			users.GET("/history", userHandler.GetHistory)
			users.POST("/avatar", userHandler.UploadAvatar)
			users.DELETE("/account", userHandler.SoftDeleteAccount)
		}
	}

	// 9. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
