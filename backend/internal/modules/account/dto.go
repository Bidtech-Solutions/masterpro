package account

// UpdateProfileRequest payload untuk PATCH /account/profile (docs/API.md §9.1).
type UpdateProfileRequest struct {
	Name           *string `json:"name" binding:"omitempty,min=2,max=120"`
	Phone          *string `json:"phone" binding:"omitempty,max=20"`
	WhatsappNumber *string `json:"whatsapp_number"`
	Bio            *string `json:"bio"`
	ServiceArea    *string `json:"service_area" binding:"omitempty,max=160"`
}

// ChangePasswordRequest payload untuk PUT /account/password (docs/API.md §9.4).
type ChangePasswordRequest struct {
	CurrentPassword         string `json:"current_password" binding:"required"`
	NewPassword             string `json:"new_password" binding:"required,password"`
	NewPasswordConfirmation string `json:"new_password_confirmation" binding:"required,eqfield=NewPassword"`
}

