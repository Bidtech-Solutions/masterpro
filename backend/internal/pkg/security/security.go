// Package security berisi primitif keamanan: hash password (bcrypt), JWT access token,
// dan token acak untuk refresh token (PRD §10.5).
package security

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// BcryptCost sesuai PRD §10.5. Variabel (bukan konstanta) hanya agar test dapat menurunkannya.
var BcryptCost = 12

const (
	jwtIssuer   = "masterpro-api"
	jwtAudience = "masterpro-dashboard"
)

// ErrTokenExpired dikembalikan saat access token kedaluwarsa (klien harus refresh).
var ErrTokenExpired = errors.New("token expired")

// ErrTokenInvalid dikembalikan untuk token rusak/tanda tangan salah.
var ErrTokenInvalid = errors.New("token invalid")

// HashPassword menghasilkan hash bcrypt.
func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), BcryptCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(b), nil
}

// CheckPassword membandingkan password dengan hash (constant-time).
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// Claims adalah klaim access token.
type Claims struct {
	Role string `json:"role"`
	// SID = family_id refresh token (satu sesi login, tetap sama saat rotasi).
	SID string `json:"sid"`
	jwt.RegisteredClaims
}

// TokenIssuer menandatangani dan memverifikasi access token HS256.
type TokenIssuer struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

// NewTokenIssuer membuat issuer. secret minimal 32 byte.
func NewTokenIssuer(secret string, ttl time.Duration) (*TokenIssuer, error) {
	if len(secret) < 32 {
		return nil, errors.New("JWT secret minimal 32 karakter")
	}
	return &TokenIssuer{secret: []byte(secret), ttl: ttl, now: time.Now}, nil
}

// TTL durasi access token.
func (t *TokenIssuer) TTL() time.Duration { return t.ttl }

// Issue membuat access token untuk user & sesi. Mengembalikan token dan waktu kedaluwarsa.
func (t *TokenIssuer) Issue(userID, role, sessionID string) (string, time.Time, error) {
	now := t.now()
	exp := now.Add(t.ttl)
	claims := Claims{
		Role: role,
		SID:  sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    jwtIssuer,
			Audience:  jwt.ClaimStrings{jwtAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(t.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign jwt: %w", err)
	}
	return signed, exp, nil
}

// Parse memverifikasi token. Mengembalikan ErrTokenExpired atau ErrTokenInvalid saat gagal.
func (t *TokenIssuer) Parse(token string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(token, claims,
		func(*jwt.Token) (any, error) { return t.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(jwtIssuer),
		jwt.WithAudience(jwtAudience),
		jwt.WithTimeFunc(t.now),
	)
	switch {
	case errors.Is(err, jwt.ErrTokenExpired):
		return nil, ErrTokenExpired
	case err != nil:
		return nil, ErrTokenInvalid
	case claims.Subject == "" || claims.SID == "":
		return nil, ErrTokenInvalid
	}
	return claims, nil
}

// RandomToken menghasilkan token acak base64url (tanpa padding) dari n byte.
func RandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("random token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// HashToken menghasilkan SHA-256 hex untuk disimpan di DB.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// EqualConstantTime membandingkan dua string tanpa kebocoran waktu.
func EqualConstantTime(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
