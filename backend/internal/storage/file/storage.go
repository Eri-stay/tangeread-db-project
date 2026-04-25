package files

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/bohdanch-w/wheel/storage"
)

func NewMediaStorage(baseDir string) (*MediaStorage, error) {
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("base dir doesn't exist: %s", baseDir)
	}

	return &MediaStorage{
		baseDir: baseDir,
	}, nil
}

type MediaStorage struct {
	baseDir string
}

func (ms *MediaStorage) List(ctx context.Context, dir string, depth int) ([]string, error) {
	if depth <= 0 {
		panic("depth must be greater than 0")
	}

	files := make([]string, 0)
	dir = filepath.Join(ms.baseDir, dir)

	depth += strings.Count(dir, string(os.PathSeparator))

	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(ms.baseDir, path)
		if err != nil {
			return fmt.Errorf("get relative path: %w", err)
		}

		if d.IsDir() {
			if strings.Count(path, string(os.PathSeparator)) > depth {
				return filepath.SkipDir
			}

			return nil
		}

		files = append(files, filepath.ToSlash(filepath.Join("/", rel)))

		return nil
	})
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, storage.ErrRecordNotFound
		}

		return nil, fmt.Errorf("walk dir: %w", err)
	}

	return files, nil
}

func (ms *MediaStorage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	path := filepath.Join(ms.baseDir, key)

	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open file: %w", err)
	}

	return f, nil
}

func (ms *MediaStorage) Store(ctx context.Context, key string, data io.Reader) error {
	path := filepath.Join(ms.baseDir, key)

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("create dir: %w", err)
	}

	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}

	defer f.Close()

	if _, err := io.Copy(f, data); err != nil {
		return fmt.Errorf("copy data: %w", err)
	}

	return nil
}

func (ms *MediaStorage) Delete(ctx context.Context, key string) error {
	path := filepath.Join(ms.baseDir, key)

	if err := os.Remove(path); err != nil {
		return fmt.Errorf("remove file: %w", err)
	}

	return nil
}
