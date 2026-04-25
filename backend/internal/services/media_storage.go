package services

import (
	"context"
	"io"
)

type MediaStorage interface {
	List(ctx context.Context, dir string, depth int) ([]string, error)
	Get(ctx context.Context, key string) (io.ReadCloser, error)
	Store(ctx context.Context, key string, data io.Reader) error
	Delete(ctx context.Context, key string) error
}
