package handlers

import (
	"errors"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"time"

	"github.com/eri-stay/tangeread-db-project/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db         *gorm.DB
	seedScript string // absolute path to seed.py
}

func NewAdminHandler(db *gorm.DB, seedScript string) *AdminHandler {
	return &AdminHandler{db: db, seedScript: seedScript}
}

// RunSeed — POST /api/admin/seed  (admin only)
// Runs seed.py using the system Python interpreter.
func (h *AdminHandler) RunSeed(c *gin.Context) {

	interpreters := []string{"python", "py", "python3"}
	if runtime.GOOS != "windows" {
		interpreters = []string{"python3", "python"}
	}

	var out []byte
	var err error
	var success bool

	for _, interpreter := range interpreters {
		cmd := exec.Command(interpreter, h.seedScript)
		cmd.Dir = filepath.Dir(h.seedScript)
		// Ensure Python uses UTF-8 for output on Windows
		cmd.Env = append(os.Environ(), "PYTHONIOENCODING=utf-8")
		out, err = cmd.CombinedOutput()
		if err == nil {
			success = true
			break
		}
		// If the error is that the interpreter itself wasn't found, try the next one
		if exitErr, ok := err.(*exec.Error); ok && exitErr.Err == exec.ErrNotFound {
			continue
		}
		// If it's a script error (exit code != 0), stop and report it
		break
	}

	if !success {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Seeding failed",
			"detail": string(out),
			"os_err": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Seeding completed successfully",
		"output":  string(out),
	})
}

// DeleteSeed — DELETE /api/admin/seed  (admin only)
// Truncates all data tables (except users with role admin/moderator).
func (h *AdminHandler) DeleteSeed(c *gin.Context) {

	tables := []string{
		"admin_logs",
		"comments",
		"ratings",
		"user_manga_statuses",
		"reading_histories",
		"chapters",
		"manga_tags",
		"mangas",
		"tags",
		"team_members",
		"teams",
	}

	// Also delete non-admin/moderator users that were seeded
	for _, table := range tables {
		if err := h.db.Exec("TRUNCATE TABLE " + table + " CASCADE").Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":  "Failed to truncate table: " + table,
				"detail": err.Error(),
			})
			return
		}
	}

	// Remove seeded readers/authors, keep admin & moderator accounts
	if err := h.db.Exec(
		"DELETE FROM users WHERE role NOT IN ('admin', 'moderator') AND email LIKE '%@test.com'",
	).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clean seeded users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All seeded data deleted"})
}

// checkAdmin verifies that the requesting user has admin role.
func (h *AdminHandler) checkAdmin(c *gin.Context) error {
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin only"})
		return os.ErrPermission
	}
	return nil
}

// GetPlatformStats — GET /api/admin/stats  (admin only)
// Returns general platform statistics.
func (h *AdminHandler) GetPlatformStats(c *gin.Context) {

	type platformStats struct {
		TotalUsers         int `json:"totalUsers"`
		TotalTeams         int `json:"totalTeams"`
		TotalManga         int `json:"totalManga"`
		TotalChapters      int `json:"totalChapters"`
		TotalPages         int `json:"totalPages"`
		NewUsersThisWeek   int `json:"newUsersThisWeek"`
		NewMangaThisMonth  int `json:"newMangaThisMonth"`
		UsersGrowthPercent int `json:"usersGrowthPercent"`
		MangaGrowthPercent int `json:"mangaGrowthPercent"`
	}

	stats := platformStats{}

	// Total users (not banned, not deleted)
	err := h.db.Raw(`
		SELECT COUNT(*) FROM users WHERE is_banned = FALSE AND deleted_at IS NULL
	`).Scan(&stats.TotalUsers).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Total teams (approved)
	err = h.db.Raw(`
		SELECT COUNT(*) FROM teams
	`).Scan(&stats.TotalTeams).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Total manga
	err = h.db.Raw(`
		SELECT COUNT(*) FROM mangas
	`).Scan(&stats.TotalManga).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Total chapters
	err = h.db.Raw(`
		SELECT COUNT(*) FROM chapters
	`).Scan(&stats.TotalChapters).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Total pages (sum of page_count in chapters)
	err = h.db.Raw(`
		SELECT COALESCE(SUM(array_length(string_to_array(pages_url, ','), 1)), 0) FROM chapters
	`).Scan(&stats.TotalPages).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// New users this week
	err = h.db.Raw(`
		SELECT COUNT(*) FROM users
		WHERE created_at > NOW() - INTERVAL '7 days'
		AND is_banned = FALSE AND deleted_at IS NULL
	`).Scan(&stats.NewUsersThisWeek).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// New manga this month
	err = h.db.Raw(`
		SELECT COUNT(*) FROM mangas
		WHERE created_at > NOW() - INTERVAL '30 days'
	`).Scan(&stats.NewMangaThisMonth).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate users growth percentage
	var lastWeekCount int
	err = h.db.Raw(`
		SELECT COUNT(*) FROM users
		WHERE created_at > NOW() - INTERVAL '14 days'
		AND created_at <= NOW() - INTERVAL '7 days'
		AND is_banned = FALSE AND deleted_at IS NULL
	`).Scan(&lastWeekCount).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if lastWeekCount > 0 {
		stats.UsersGrowthPercent = (stats.NewUsersThisWeek * 100) / lastWeekCount
	}

	// Calculate manga growth percentage
	var lastMonthCount int
	err = h.db.Raw(`
		SELECT COUNT(*) FROM mangas
		WHERE created_at > NOW() - INTERVAL '60 days'
		AND created_at <= NOW() - INTERVAL '30 days'
	`).Scan(&lastMonthCount).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if lastMonthCount > 0 {
		stats.MangaGrowthPercent = (stats.NewMangaThisMonth * 100) / lastMonthCount
	}

	c.JSON(http.StatusOK, stats)
}

// GetGenreStats — GET /api/admin/genre-stats  (admin only)
// Returns genre popularity based on bookmarks/statuses.
func (h *AdminHandler) GetGenreStats(c *gin.Context) {

	type genreStat struct {
		Name  string `json:"name"`
		Value int    `json:"value"`
	}

	rows, err := h.db.Raw(`
WITH tag_counts AS (
  SELECT
    t.id,
    t.name_uk AS name,
    COUNT(*) AS count
  FROM tags t
  -- WHERE category == 'genre'
  JOIN manga_tags mt ON mt.tag_id = t.id
  JOIN user_manga_statuses ums ON ums.manga_id = mt.manga_id
  GROUP BY t.id, t.name_uk
)
SELECT name, count
FROM tag_counts
ORDER BY count DESC, name ASC;
	`).Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var stats []genreStat
	for rows.Next() {
		var gs genreStat
		if err := rows.Scan(&gs.Name, &gs.Value); err != nil {
			continue
		}
		stats = append(stats, gs)
	}

	if stats == nil {
		stats = []genreStat{}
	}

	c.JSON(http.StatusOK, stats)
}

// GetRegistrationStats — GET /api/admin/registration-stats  (admin only)
// Returns user registration counts by month.
func (h *AdminHandler) GetRegistrationStats(c *gin.Context) {

	type regStat struct {
		Month string `json:"month"`
		Count int    `json:"count"`
	}

	rows, err := h.db.Raw(`
		SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count
		FROM users
		WHERE created_at > NOW() - INTERVAL '6 months'
		AND is_banned = FALSE AND deleted_at IS NULL
		GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Mon')
		ORDER BY MIN(created_at)
	`).Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var stats []regStat
	for rows.Next() {
		var rs regStat
		if err := rows.Scan(&rs.Month, &rs.Count); err != nil {
			continue
		}
		stats = append(stats, rs)
	}

	if stats == nil {
		stats = []regStat{}
	}

	c.JSON(http.StatusOK, stats)
}

// GetTeamStats — GET /api/admin/team-stats  (admin only)
// Returns team rankings by chapters and views.
func (h *AdminHandler) GetTeamStats(c *gin.Context) {

	type teamStat struct {
		Rank              int    `json:"rank"`
		TeamName          string `json:"teamName"`
		ChaptersPublished int    `json:"chaptersPublished"`
		TotalViews        int    `json:"totalViews"`
		Badge             string `json:"badge,omitempty"`
	}

	rows, err := h.db.Raw(`
		SELECT
			t.name as team_name,
			COUNT(c.id) as chapters_count,
			COALESCE(SUM(c.view_count), 0) as total_views
		FROM teams t
		LEFT JOIN mangas m ON m.team_id = t.id
		LEFT JOIN chapters c ON c.manga_id = m.id
		GROUP BY t.id, t.name
		ORDER BY chapters_count DESC, total_views DESC
		LIMIT 10
	`).Rows()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var stats []teamStat
	rank := 1
	for rows.Next() {
		var ts teamStat
		var teamName string
		if err := rows.Scan(&teamName, &ts.ChaptersPublished, &ts.TotalViews); err != nil {
			continue
		}
		ts.TeamName = teamName
		ts.Rank = rank

		// Assign badges to top 3
		if rank == 1 {
			ts.Badge = "gold"
		} else if rank == 2 {
			ts.Badge = "silver"
		} else if rank == 3 {
			ts.Badge = "bronze"
		}

		stats = append(stats, ts)
		rank++
	}

	if stats == nil {
		stats = []teamStat{}
	}

	c.JSON(http.StatusOK, stats)
}

// GetTeamApplications — GET /api/admin/team-applications  (admin only)
// Returns a list of all team applications, with optional ?status= filter.
func (h *AdminHandler) GetTeamApplications(c *gin.Context) {

	status := c.Query("status") // empty = all

	var apps []models.TeamApplicationDTO
	query := h.db.Table("team_applications ta").
		Select(`ta.id, ta.name, ta.description, ta.status,
                ta.rejection_reason, ta.created_at,
                ta.applied_by_id AS applicant_id,
                u.username AS applicant_name,
                u.avatar_url AS applicant_avatar`).
		Joins("JOIN users u ON u.id = ta.applied_by_id").
		Order("ta.created_at DESC")

	if status != "" {
		query = query.Where("ta.status = ?", status)
	}

	if err := query.Scan(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if apps == nil {
		apps = []models.TeamApplicationDTO{}
	}

	c.JSON(http.StatusOK, gin.H{"data": apps, "total": len(apps)})
}

// ApproveTeamApplication — POST /api/admin/team-applications/:id/approve  (admin only)
// Atomically: approves the application, creates the team, adds applicant as leader,
// promotes the applicant to 'author' role, and writes an admin log entry.
func (h *AdminHandler) ApproveTeamApplication(c *gin.Context) {

	appID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	adminID := c.MustGet("user_id").(uint)

	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		// 1. Load and guard
		var app models.TeamApplication
		if err := tx.First(&app, appID).Error; err != nil {
			return err
		}
		if app.Status != models.TeamApplicationPending {
			return errors.New("application is not pending")
		}

		// 2. Approve the application
		now := time.Now()
		if err := tx.Model(&app).Updates(map[string]any{
			"status":         models.TeamApplicationApproved,
			"reviewed_by_id": adminID,
			"updated_at":     now,
		}).Error; err != nil {
			return err
		}

		// 3. Create the team
		team := models.Team{
			Name:        app.Name,
			Description: app.Description,
		}
		if err := tx.Create(&team).Error; err != nil {
			return err
		}

		// 4. Add applicant as team leader
		member := models.TeamMember{
			UserID:       app.AppliedByID,
			TeamID:       team.ID,
			InternalRole: models.InternalRoleLeader,
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		// 5. Promote applicant to 'author' role
		if err := tx.Model(&models.User{}).Where("id = ?", app.AppliedByID).
			Update("role", models.UserRoleAuthor).Error; err != nil {
			return err
		}

		return nil
	})

	if txErr != nil {
		if txErr.Error() == "application is not pending" {
			c.JSON(http.StatusConflict, gin.H{"error": txErr.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": txErr.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application approved"})
}

// RejectTeamApplication — POST /api/admin/team-applications/:id/reject  (admin only)
// Body: { "reason": "string" } (required)
func (h *AdminHandler) RejectTeamApplication(c *gin.Context) {

	appID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}

	adminID := c.MustGet("user_id").(uint)

	var body struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required"})
		return
	}

	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		// 1. Load and guard
		var app models.TeamApplication
		if err := tx.First(&app, appID).Error; err != nil {
			return err
		}
		if app.Status != models.TeamApplicationPending {
			return errors.New("application is not pending")
		}

		// 2. Reject with reason
		now := time.Now()
		if err := tx.Model(&app).Updates(map[string]any{
			"status":           models.TeamApplicationRejected,
			"reviewed_by_id":   adminID,
			"rejection_reason": body.Reason,
			"updated_at":       now,
		}).Error; err != nil {
			return err
		}

		return nil
	})

	if txErr != nil {
		if txErr.Error() == "application is not pending" {
			c.JSON(http.StatusConflict, gin.H{"error": txErr.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": txErr.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application rejected"})
}

// BanUser — POST /api/admin/users/:id/ban
func (h *AdminHandler) BanUser(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	targetID := c.Param("id")

	var input struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminIDUint := adminID.(uint)
	if err := h.db.Model(&models.User{}).Where("id = ?", targetID).Updates(map[string]interface{}{
		"is_banned":    true,
		"ban_reason":   input.Reason,
		"banned_by_id": adminIDUint,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ban user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User banned successfully"})
}

// UnbanUser — POST /api/admin/users/:id/unban
func (h *AdminHandler) UnbanUser(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	targetID := c.Param("id")
	adminIDUint := adminID.(uint)

	// Set is_banned to false, but we temporarily set banned_by_id to adminIDUint 
	// so the DB trigger knows who unbanned them. The trigger will NULL it out!
	if err := h.db.Model(&models.User{}).Where("id = ?", targetID).Updates(map[string]interface{}{
		"is_banned":    false,
		"banned_by_id": adminIDUint,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unban user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User unbanned successfully"})
}

// ChangeUserRole — POST /api/admin/users/:id/role
func (h *AdminHandler) ChangeUserRole(c *gin.Context) {
	targetID := c.Param("id")

	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", targetID).Update("role", input.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}
