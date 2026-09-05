package models

import "time"

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success   bool      `json:"success"`
	Token     string    `json:"token"`
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	Message   string    `json:"message"`
	ExpiresAt time.Time `json:"expires_at"`
}

type AdminSession struct {
	Token     string    `json:"token"`
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}
