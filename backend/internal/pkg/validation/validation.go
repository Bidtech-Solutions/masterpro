// Package validation menyiapkan validator Gin (nama field JSON, aturan kustom) dan menerjemahkan
// error validasi menjadi apperror.FieldError berbahasa Indonesia (docs/API.md §3.4).
package validation

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/bidtech-solutions/masterpro/backend/internal/pkg/apperror"
)

var (
	phoneIDRe    = regexp.MustCompile(`^(\+62|62|0)8[0-9]{7,12}$`)
	whatsappIDRe = regexp.MustCompile(`^62[0-9]{8,13}$`)
)

// Setup mendaftarkan nama field JSON dan aturan kustom ke validator bawaan Gin. Panggil sekali saat start.
func Setup() error {
	v, ok := binding.Validator.Engine().(*validator.Validate)
	if !ok {
		return errors.New("validator gin tidak dikenali")
	}
	v.RegisterTagNameFunc(func(f reflect.StructField) string {
		name := strings.SplitN(f.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		if name == "" {
			name = strings.SplitN(f.Tag.Get("form"), ",", 2)[0]
		}
		return name
	})
	rules := map[string]validator.Func{
		"phone_id":    func(fl validator.FieldLevel) bool { return phoneIDRe.MatchString(fl.Field().String()) },
		"whatsapp_id": func(fl validator.FieldLevel) bool { return whatsappIDRe.MatchString(fl.Field().String()) },
		"password":    func(fl validator.FieldLevel) bool { return IsStrongPassword(fl.Field().String()) },
	}
	for tag, fn := range rules {
		if err := v.RegisterValidation(tag, fn); err != nil {
			return fmt.Errorf("register %s: %w", tag, err)
		}
	}
	return nil
}

// IsStrongPassword: 8–72 karakter, minimal satu huruf dan satu angka (API.md §9.4).
func IsStrongPassword(s string) bool {
	if len(s) < 8 || len(s) > 72 {
		return false
	}
	var letter, digit bool
	for _, r := range s {
		switch {
		case unicode.IsLetter(r):
			letter = true
		case unicode.IsDigit(r):
			digit = true
		}
	}
	return letter && digit
}

// FromBindError mengubah error dari c.ShouldBind* menjadi *apperror.Error.
func FromBindError(err error) *apperror.Error {
	var verrs validator.ValidationErrors
	if errors.As(err, &verrs) {
		details := make([]apperror.FieldError, 0, len(verrs))
		for _, fe := range verrs {
			details = append(details, translate(fe))
		}
		return apperror.Validation(details...)
	}
	var syntaxErr *json.SyntaxError
	var typeErr *json.UnmarshalTypeError
	switch {
	case errors.As(err, &typeErr):
		return apperror.Validation(apperror.FieldError{Field: typeErr.Field, Code: "oneof", Message: "Tipe data tidak sesuai"})
	case errors.As(err, &syntaxErr):
		return apperror.BadRequest("Format JSON tidak valid")
	default:
		return apperror.BadRequest("Permintaan tidak dapat dibaca")
	}
}

func translate(fe validator.FieldError) apperror.FieldError {
	field := fieldPath(fe)
	isString := fe.Kind() == reflect.String
	code, msg := fe.Tag(), "Nilai tidak valid"
	switch fe.Tag() {
	case "required":
		msg = "Wajib diisi"
	case "email":
		msg = "Format email tidak valid"
	case "min":
		if isString {
			code, msg = "min_length", "Minimal "+fe.Param()+" karakter"
		} else {
			msg = "Minimal " + fe.Param()
		}
	case "max":
		if isString {
			code, msg = "max_length", "Maksimal "+fe.Param()+" karakter"
		} else {
			msg = "Maksimal " + fe.Param()
		}
	case "oneof":
		msg = "Harus salah satu dari: " + strings.ReplaceAll(fe.Param(), " ", ", ")
	case "uuid", "uuid4", "uuid7":
		code, msg = "uuid", "Format ID tidak valid"
	case "url", "http_url":
		code, msg = "url", "Format URL tidak valid"
	case "phone_id":
		msg = "Nomor telepon Indonesia tidak valid"
	case "whatsapp_id":
		code, msg = "phone_id", "Nomor WhatsApp harus diawali 62, mis. 6281234567890"
	case "password":
		code, msg = "password_weak", "Password 8–72 karakter dan memuat huruf serta angka"
	case "eqfield":
		code, msg = "mismatch", "Konfirmasi tidak sama"
	}
	return apperror.FieldError{Field: field, Code: code, Message: msg}
}

// fieldPath menghasilkan nama field JSON tanpa nama struct teratas, mis. "images[2]".
func fieldPath(fe validator.FieldError) string {
	ns := fe.Namespace()
	if i := strings.Index(ns, "."); i >= 0 {
		return ns[i+1:]
	}
	return fe.Field()
}
