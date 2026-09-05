package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"acho-backend/internal/models"
	"acho-backend/internal/services"
)

type AuthHandler struct {
	auth *services.AuthService
}

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Permintaan login tidak valid")
		return
	}

	session, err := h.auth.Authenticate(req.Username, req.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, models.LoginResponse{
		Success:   true,
		Token:     session.Token,
		Username:  session.Username,
		Role:      session.Role,
		Message:   "Login berhasil. Selamat datang di Panel Admin ACHO Coffee!",
		ExpiresAt: session.ExpiresAt,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	if token == "" {
		token = r.Header.Get("X-Admin-Key")
	}
	h.auth.RevokeSession(token)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Berhasil keluar dari sesi admin",
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimPrefix(token, "Bearer ")
	}

	session, ok := h.auth.ValidateSession(token)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah berakhir")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"authenticated": true,
		"username":      session.Username,
		"role":          session.Role,
		"expires_at":    session.ExpiresAt,
	})
}
