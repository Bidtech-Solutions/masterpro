package validation

import "testing"

func TestIsStrongPassword(t *testing.T) {
	cases := map[string]bool{
		"Rahasia123!": true,
		"MasterPro@9": true,
		"Rahasia123":  false, // tanpa karakter spesial
		"rahasia123!": false, // tanpa huruf besar
		"RAHASIA123!": false, // tanpa huruf kecil
		"abcdefgh!A":  false, // tanpa angka
		"12345678!":   false, // tanpa huruf
		"Aa1!":        false, // terlalu pendek (< 8)
	}
	for in, want := range cases {
		if got := IsStrongPassword(in); got != want {
			t.Errorf("IsStrongPassword(%q) = %v, want %v", in, got, want)
		}
	}
	long := make([]byte, 73)
	for i := range long {
		long[i] = 'a'
	}
	long[0] = 'A'
	long[1] = '1'
	long[2] = '!'
	if IsStrongPassword(string(long)) {
		t.Error("password > 72 karakter seharusnya ditolak")
	}
}
