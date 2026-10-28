package security

import (
	"errors"
	"testing"
	"time"
)

const secret = "0123456789abcdef0123456789abcdef0123456789abcdef"

func TestPasswordHashRoundTrip(t *testing.T) {
	h, err := HashPassword("Rahasia123")
	if err != nil {
		t.Fatal(err)
	}
	if !CheckPassword(h, "Rahasia123") {
		t.Fatal("password benar ditolak")
	}
	if CheckPassword(h, "rahasia123") {
		t.Fatal("password salah diterima")
	}
}

func TestTokenIssueAndParse(t *testing.T) {
	iss, err := NewTokenIssuer(secret, 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	tok, exp, err := iss.Issue("user-1", "admin", "sess-1")
	if err != nil {
		t.Fatal(err)
	}
	if time.Until(exp) <= 14*time.Minute {
		t.Fatalf("exp terlalu cepat: %v", exp)
	}
	c, err := iss.Parse(tok)
	if err != nil {
		t.Fatal(err)
	}
	if c.Subject != "user-1" || c.Role != "admin" || c.SID != "sess-1" {
		t.Fatalf("klaim tidak sesuai: %+v", c)
	}
}

func TestTokenExpiredAndTampered(t *testing.T) {
	iss, _ := NewTokenIssuer(secret, time.Minute)
	past := time.Now().Add(-time.Hour)
	iss.now = func() time.Time { return past }
	tok, _, _ := iss.Issue("u", "agent", "s")
	iss.now = time.Now
	if _, err := iss.Parse(tok); !errors.Is(err, ErrTokenExpired) {
		t.Fatalf("ingin ErrTokenExpired, dapat %v", err)
	}

	other, _ := NewTokenIssuer(secret+"x", time.Minute)
	tok2, _, _ := other.Issue("u", "agent", "s")
	if _, err := iss.Parse(tok2); !errors.Is(err, ErrTokenInvalid) {
		t.Fatalf("ingin ErrTokenInvalid, dapat %v", err)
	}
}

func TestShortSecretRejected(t *testing.T) {
	if _, err := NewTokenIssuer("pendek", time.Minute); err == nil {
		t.Fatal("secret pendek seharusnya ditolak")
	}
}

func TestRandomTokenAndHash(t *testing.T) {
	a, _ := RandomToken(32)
	b, _ := RandomToken(32)
	if a == b || len(a) != 43 {
		t.Fatalf("token acak tidak valid: %q %q", a, b)
	}
	if h1, h2 := HashToken(a), HashToken(a); len(h1) != 64 || h1 != h2 {
		t.Fatal("hash token tidak deterministik / panjang salah")
	}
}
