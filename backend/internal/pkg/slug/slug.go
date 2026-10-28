// Package slug membuat slug URL (PRD §7.3).
package slug

import (
	"crypto/rand"
	"math/big"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

const base36 = "0123456789abcdefghijklmnopqrstuvwxyz"

// Make mengubah teks menjadi kebab-case ASCII dengan panjang maksimum maxLen (0 = tanpa batas).
func Make(s string, maxLen int) string {
	var b strings.Builder
	dash := false
	for _, r := range norm.NFKD.String(strings.ToLower(s)) {
		switch {
		case r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r)):
			b.WriteRune(r)
			dash = false
		case unicode.Is(unicode.Mn, r):
			// buang tanda diakritik (é -> e)
		default:
			if !dash && b.Len() > 0 {
				b.WriteByte('-')
				dash = true
			}
		}
	}
	out := strings.TrimSuffix(b.String(), "-")
	if maxLen > 0 && len(out) > maxLen {
		out = strings.TrimSuffix(out[:maxLen], "-")
	}
	return out
}

// RandomSuffix menghasilkan n karakter base36 acak.
func RandomSuffix(n int) (string, error) {
	out := make([]byte, n)
	maxN := big.NewInt(int64(len(base36)))
	for i := range out {
		v, err := rand.Int(rand.Reader, maxN)
		if err != nil {
			return "", err
		}
		out[i] = base36[v.Int64()]
	}
	return string(out), nil
}

// ForProperty membuat slug listing: kebab(judul, 80) + "-" + 6 karakter acak.
func ForProperty(title string) (string, error) {
	suffix, err := RandomSuffix(6)
	if err != nil {
		return "", err
	}
	base := Make(title, 80)
	if base == "" {
		return suffix, nil
	}
	return base + "-" + suffix, nil
}
