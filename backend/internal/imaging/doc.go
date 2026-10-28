// Package imaging — pipeline foto unggahan: validasi magic bytes, auto-orientasi EXIF,
// resize sisi terpanjang maks 2400 px, encode WebP kualitas 82, buang metadata (docs/PRD.md §10.6).
// Avatar: crop persegi 512 px.
//
// Status: BELUM DIIMPLEMENTASI. Library yang ditetapkan: github.com/disintegration/imaging,
// golang.org/x/image/webp (decode), github.com/gen2brain/webp (encode, tanpa cgo).
package imaging
