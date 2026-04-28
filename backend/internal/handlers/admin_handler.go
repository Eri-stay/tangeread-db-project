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
