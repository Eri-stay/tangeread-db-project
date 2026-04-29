package handlers

import (
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
),
ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (ORDER BY count DESC) AS rn
  FROM tag_counts
)
SELECT name, count
FROM ranked
WHERE rn <= 10

UNION ALL

SELECT 'other...' AS name, COALESCE(SUM(count), 0)
FROM ranked
WHERE rn > 10

ORDER BY count DESC;
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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
	if err := h.checkAdmin(c); err != nil {
		return
	}

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
