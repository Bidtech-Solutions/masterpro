package slug

import (
	"regexp"
	"testing"
)

func TestMake(t *testing.T) {
	cases := map[string]string{
		"Rumah Minimalis 2 Lantai di Batam Centre": "rumah-minimalis-2-lantai-di-batam-centre",
		"  Ruko — Nagoya!! ":                       "ruko-nagoya",
		"Café Résidence":                           "cafe-residence",
		"":                                         "",
	}
	for in, want := range cases {
		if got := Make(in, 0); got != want {
			t.Errorf("Make(%q) = %q, ingin %q", in, got, want)
		}
	}
	if got := Make("abc def ghi", 5); got != "abc-d" {
		t.Errorf("batas panjang: %q", got)
	}
	if got := Make("abcd efgh", 5); got != "abcd" {
		t.Errorf("tidak boleh berakhir dengan '-': %q", got)
	}
}

func TestForProperty(t *testing.T) {
	s, err := ForProperty("Rumah Minimalis")
	if err != nil {
		t.Fatal(err)
	}
	if !regexp.MustCompile(`^rumah-minimalis-[0-9a-z]{6}$`).MatchString(s) {
		t.Fatalf("format slug salah: %q", s)
	}
}
