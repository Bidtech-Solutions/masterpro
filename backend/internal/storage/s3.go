// Package storage membungkus akses object storage RustFS (S3-compatible) lewat minio-go (PRD §10.7).
package storage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Client operasi storage yang dipakai modul lain.
type Client struct {
	mc        *minio.Client
	bucket    string
	region    string
	publicURL string
}

// Config parameter koneksi.
type Config struct {
	Endpoint, AccessKey, SecretKey, Bucket, Region, PublicURL string
	UseSSL                                                    bool
}

// New membuat klien. Tidak melakukan koneksi jaringan.
func New(cfg Config) (*Client, error) {
	mc, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:        credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure:       cfg.UseSSL,
		Region:       cfg.Region,
		BucketLookup: minio.BucketLookupPath,
	})
	if err != nil {
		return nil, fmt.Errorf("storage client: %w", err)
	}
	return &Client{mc: mc, bucket: cfg.Bucket, region: cfg.Region, publicURL: cfg.PublicURL}, nil
}

// publicReadPolicy: objek boleh dibaca anonim, tanpa izin ListBucket (PRD §10.7).
const publicReadPolicy = `{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`

// EnsureBucket memastikan bucket ada dan berkebijakan baca publik. Mencoba ulang karena RustFS
// mungkin belum siap saat backend start.
func (c *Client) EnsureBucket(ctx context.Context) error {
	var lastErr error
	for attempt := 1; attempt <= 10; attempt++ {
		lastErr = c.ensureBucketOnce(ctx)
		if lastErr == nil {
			return nil
		}
		slog.Warn("storage belum siap, mencoba lagi", "attempt", attempt, "error", lastErr)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Duration(attempt) * time.Second):
		}
	}
	return fmt.Errorf("ensure bucket %s: %w", c.bucket, lastErr)
}

func (c *Client) ensureBucketOnce(ctx context.Context) error {
	exists, err := c.mc.BucketExists(ctx, c.bucket)
	if err != nil {
		return err
	}
	if !exists {
		if err := c.mc.MakeBucket(ctx, c.bucket, minio.MakeBucketOptions{Region: c.region}); err != nil {
			return err
		}
		slog.Info("bucket dibuat", "bucket", c.bucket)
	}
	return c.mc.SetBucketPolicy(ctx, c.bucket, fmt.Sprintf(publicReadPolicy, c.bucket))
}

// Ping memeriksa ketersediaan storage (health check).
func (c *Client) Ping(ctx context.Context) error {
	_, err := c.mc.BucketExists(ctx, c.bucket)
	return err
}

// Put menyimpan objek immutable (Cache-Control satu tahun).
func (c *Client) Put(ctx context.Context, key, contentType string, r io.Reader, size int64) error {
	_, err := c.mc.PutObject(ctx, c.bucket, key, r, size, minio.PutObjectOptions{
		ContentType:  contentType,
		CacheControl: "public, max-age=31536000, immutable",
	})
	if err != nil {
		return fmt.Errorf("put %s: %w", key, err)
	}
	return nil
}

// Delete menghapus objek. Objek yang tidak ada tidak dianggap error.
func (c *Client) Delete(ctx context.Context, key string) error {
	if err := c.mc.RemoveObject(ctx, c.bucket, key, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("delete %s: %w", key, err)
	}
	return nil
}

// URL publik untuk object key (MEDIA_PUBLIC_URL + "/" + key).
func (c *Client) URL(key string) string {
	return URL(c.publicURL, key)
}

// URL membentuk URL publik; nil bila key kosong.
func URL(publicURL, key string) string {
	if key == "" {
		return ""
	}
	return publicURL + "/" + key
}
