// Package apperror mendefinisikan error aplikasi dengan kode stabil sesuai docs/API.md §3.3.
//
// Handler mengembalikan *Error ke response.Error; error lain dianggap INTERNAL_ERROR.
package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// Kode error API (docs/API.md §3.3). Jangan menambah kode tanpa memperbarui API.md.
const (
	CodeBadRequest                = "BAD_REQUEST"
	CodeUnauthenticated           = "UNAUTHENTICATED"
	CodeTokenExpired              = "TOKEN_EXPIRED"
	CodeInvalidCredentials        = "INVALID_CREDENTIALS" //nolint:gosec // kode error, bukan kredensial
	CodeRefreshInvalid            = "REFRESH_INVALID"
	CodeInvalidCurrentPassword    = "INVALID_CURRENT_PASSWORD"
	CodeForbidden                 = "FORBIDDEN"
	CodeAccountInactive           = "ACCOUNT_INACTIVE"
	CodeCSRFHeaderMissing         = "CSRF_HEADER_MISSING"
	CodeNotFound                  = "NOT_FOUND"
	CodeEmailTaken                = "EMAIL_TAKEN"
	CodeInvalidStatusTransition   = "INVALID_STATUS_TRANSITION"
	CodeLastActiveAdmin           = "LAST_ACTIVE_ADMIN"
	CodePayloadTooLarge           = "PAYLOAD_TOO_LARGE"
	CodeUnsupportedMediaType      = "UNSUPPORTED_MEDIA_TYPE"
	CodeValidation                = "VALIDATION_ERROR"
	CodePublishRequirementsNotMet = "PUBLISH_REQUIREMENTS_NOT_MET"
	CodeImageLimitExceeded        = "IMAGE_LIMIT_EXCEEDED"
	CodeImageTooSmall             = "IMAGE_TOO_SMALL"
	CodeCannotDeactivateSelf      = "CANNOT_DEACTIVATE_SELF"
	CodeTypeNotAllowedForListing  = "TYPE_NOT_ALLOWED_FOR_LISTING"
	CodeExportTooLarge            = "EXPORT_TOO_LARGE"
	CodeRateLimited               = "RATE_LIMITED"
	CodeInternal                  = "INTERNAL_ERROR"
	CodeServiceUnavailable        = "SERVICE_UNAVAILABLE"
)

// FieldError adalah satu entri `error.details[]`.
type FieldError struct {
	Field   string `json:"field"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Error adalah error yang aman ditampilkan ke klien.
type Error struct {
	Status  int          `json:"-"`
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Details []FieldError `json:"details,omitempty"`
	// RetryAfter (detik) diisi untuk RATE_LIMITED.
	RetryAfter int `json:"-"`
	// Cause tidak pernah dikirim ke klien; hanya untuk log.
	Cause error `json:"-"`
}

func (e *Error) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Cause)
	}
	return e.Code + ": " + e.Message
}

func (e *Error) Unwrap() error { return e.Cause }

// New membuat error dengan status, kode, dan pesan.
func New(status int, code, message string) *Error {
	return &Error{Status: status, Code: code, Message: message}
}

// WithDetails mengembalikan salinan error dengan details.
func (e *Error) WithDetails(details ...FieldError) *Error {
	c := *e
	c.Details = details
	return &c
}

// As mengekstrak *Error dari err (termasuk error yang dibungkus).
func As(err error) (*Error, bool) {
	var e *Error
	ok := errors.As(err, &e)
	return e, ok
}

// Is memeriksa apakah err memiliki kode tertentu.
func Is(err error, code string) bool {
	e, ok := As(err)
	return ok && e.Code == code
}

// Konstruktor umum.

func BadRequest(msg string) *Error { return New(http.StatusBadRequest, CodeBadRequest, msg) }
func Unauthenticated() *Error {
	return New(http.StatusUnauthorized, CodeUnauthenticated, "Silakan masuk terlebih dahulu")
}
func TokenExpired() *Error { return New(http.StatusUnauthorized, CodeTokenExpired, "Sesi kedaluwarsa") }
func Forbidden() *Error    { return New(http.StatusForbidden, CodeForbidden, "Anda tidak memiliki akses") }
func NotFound(what string) *Error {
	return New(http.StatusNotFound, CodeNotFound, what+" tidak ditemukan")
}
func Conflict(code, msg string) *Error { return New(http.StatusConflict, code, msg) }

func Validation(details ...FieldError) *Error {
	return New(http.StatusUnprocessableEntity, CodeValidation, "Data yang dikirim tidak valid").WithDetails(details...)
}

func RateLimited(retryAfter int) *Error {
	e := New(http.StatusTooManyRequests, CodeRateLimited, "Terlalu banyak permintaan, coba lagi nanti")
	e.RetryAfter = retryAfter
	return e
}

func Internal(cause error) *Error {
	e := New(http.StatusInternalServerError, CodeInternal, "Terjadi kesalahan pada server")
	e.Cause = cause
	return e
}

func Unavailable(msg string, cause error) *Error {
	e := New(http.StatusServiceUnavailable, CodeServiceUnavailable, msg)
	e.Cause = cause
	return e
}
