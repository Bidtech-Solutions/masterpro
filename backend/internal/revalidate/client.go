// Package revalidate memberi tahu frontend agar cache ISR diperbarui setelah data berubah (PRD §10.4).
package revalidate

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// Tag cache yang dipakai frontend (PRD §9.2).
const (
	TagPropertiesList = "properties:list"
	TagReference      = "reference"
)

// PropertyTag tag untuk satu listing.
func PropertyTag(slug string) string { return "property:" + slug }

// Client memanggil POST {frontend}/internal/revalidate.
type Client struct {
	baseURL string
	secret  string
	http    *http.Client
}

// New membuat klien.
func New(baseURL, secret string) *Client {
	return &Client{baseURL: baseURL, secret: secret, http: &http.Client{Timeout: 5 * time.Second}}
}

// Trigger mengirim revalidasi secara asinkron dengan 3 percobaan (backoff 1s, 2s, 4s).
// Kegagalan hanya dicatat di log — tidak menggagalkan request pengguna.
func (c *Client) Trigger(tags ...string) {
	if len(tags) == 0 {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		var err error
		for attempt, wait := 1, time.Second; attempt <= 3; attempt, wait = attempt+1, wait*2 {
			if err = c.send(ctx, tags); err == nil {
				return
			}
			select {
			case <-ctx.Done():
				return
			case <-time.After(wait):
			}
		}
		slog.Warn("revalidasi frontend gagal", "tags", tags, "error", err)
	}()
}

func (c *Client) send(ctx context.Context, tags []string) error {
	body, _ := json.Marshal(map[string][]string{"tags": tags})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/revalidate", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Revalidate-Secret", c.secret)
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	return nil
}
