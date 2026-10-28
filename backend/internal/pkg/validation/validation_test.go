package validation

import "testing"

func TestIsStrongPassword(t *testing.T) {
	cases := map[string]bool{
		"Rahasia123": true,
		"abcdefgh":   false, // tanpa angka
		"12345678":   false, // tanpa huruf
		"a1":         false, // terlalu pendek
	}
	for in, want := range cases {
		if got := IsStrongPassword(in); got != want {
			t.Errorf("IsStrongPassword(%q) = %v", in, got)
		}
	}
	long := make([]byte, 73)
	for i := range long {
		long[i] = 'a'
	}
	long[0] = '1'
	if IsStrongPassword(string(long)) {
		t.Error("password > 72 karakter seharusnya ditolak (batas bcrypt)")
	}
}
