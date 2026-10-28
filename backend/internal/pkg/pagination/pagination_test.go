package pagination

import "testing"

func TestNewMeta(t *testing.T) {
	m := NewMeta(Params{Page: 2, PerPage: 12}, 25)
	if m.TotalPages != 3 || m.Total != 25 || m.Page != 2 {
		t.Fatalf("meta salah: %+v", m)
	}
	if NewMeta(Params{Page: 1, PerPage: 12}, 0).TotalPages != 0 {
		t.Fatal("total 0 harus 0 halaman")
	}
	if (Params{Page: 3, PerPage: 20}).Offset() != 40 {
		t.Fatal("offset salah")
	}
}
