package auth

import (
	"os"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/security"
)

func TestMain(m *testing.M) {
	security.BcryptCost = bcrypt.MinCost // test cepat; produksi tetap 12
	os.Exit(m.Run())
}
