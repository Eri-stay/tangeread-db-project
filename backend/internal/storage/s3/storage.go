package s3

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	wherr "github.com/bohdanch-w/wheel/errors"
	"github.com/bohdanch-w/wheel/storage"
)

func NewMediaStorage(client *s3.Client, bucket, root string) *MediaStorage {
	return &MediaStorage{
		client: client,
		bucket: bucket,
		root:   strings.Trim(root, `/\`),
	}
}

type MediaStorage struct {
	client *s3.Client
	bucket string
	root   string
}

func (ms *MediaStorage) List(ctx context.Context, dir string, depth int) ([]string, error) {
	if depth <= 0 {
		panic("depth must be greater than 0")
	}

	prefix := filepath.ToSlash(filepath.Join(ms.root, dir))
	depth = strings.Count(prefix, "/") + depth

	s3Obj := &s3.ListObjectsV2Input{
		Bucket: aws.String(ms.bucket),
		Prefix: aws.String(prefix),
	}

	out, err := ms.client.ListObjectsV2(ctx, s3Obj)
	if err != nil {
		return nil, fmt.Errorf("s3 storage: list objects: %w", err)
	}

	if len(out.Contents) == 0 {
		return nil, storage.ErrRecordNotFound
	}

	files := make([]string, 0, len(out.Contents))

	for _, obj := range out.Contents {
		if obj.Key == nil {
			continue
		}

		if strings.Count(*obj.Key, "/") > depth {
			continue
		}

		files = append(files, strings.TrimPrefix(*obj.Key, ms.root))
	}

	return files, nil
}

func (ms *MediaStorage) Get(ctx context.Context, key string) (io.ReadCloser, error) {
	s3Obj := &s3.GetObjectInput{
		Bucket: aws.String(ms.bucket),
		Key:    aws.String(filepath.ToSlash(filepath.Join(ms.root, key))),
	}

	out, err := ms.client.GetObject(ctx, s3Obj)
	if err != nil {
		return nil, fmt.Errorf("s3 storage: get object: %w", err)
	}

	if out == nil || out.Body == nil {
		return nil, wherr.Error("s3 storage: get object: no body")
	}

	return out.Body, nil
}

func (ms *MediaStorage) Store(ctx context.Context, key string, data io.Reader) error {
	contentType := contentTypeByFilename(key)

	s3Obj := &s3.PutObjectInput{
		Bucket:      aws.String(ms.bucket),
		Key:         aws.String(filepath.ToSlash(filepath.Join(ms.root, key))),
		Body:        data,
		ContentType: contentType,
	}

	if contentType != nil {
		s3Obj.Metadata = map[string]string{"Content-Type": *contentType}
	}

	_, ok := data.(io.Seeker)
	if !ok {
		f, err := os.CreateTemp("", "")
		if err != nil {
			return fmt.Errorf("create temp file: %w", err)
		}

		if _, err := io.Copy(f, data); err != nil {
			f.Close()

			return fmt.Errorf("copy data: %w", err)
		}

		f.Close()

		f, err = os.Open(f.Name())
		if err != nil {
			return fmt.Errorf("open temp file: %w", err)
		}

		defer f.Close()

		s3Obj.Body = f

		defer os.Remove(f.Name())
	}

	out, err := ms.client.PutObject(ctx, s3Obj)
	if err != nil {
		return fmt.Errorf("s3 storage: put object: %w", err)
	}

	if out != nil {
		if out.ETag != nil {
			return nil
		}
	}

	return wherr.Error("s3 storage: put object: no meta")
}

func (ms *MediaStorage) Delete(ctx context.Context, key string) error {
	s3Obj := &s3.DeleteObjectInput{
		Bucket: aws.String(ms.bucket),
		Key:    aws.String(filepath.ToSlash(filepath.Join(ms.root, key))),
	}

	_, err := ms.client.DeleteObject(ctx, s3Obj)
	if err != nil {
		return fmt.Errorf("s3 storage: delete object: %w", err)
	}

	return nil
}

func contentTypeByFilename(filename string) *string {
	ext := filepath.Ext(filename)

	ext2mime := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".webp": "image/webp",
	}

	mime, ok := ext2mime[ext]
	if !ok {
		return nil
	}

	return &mime
}
