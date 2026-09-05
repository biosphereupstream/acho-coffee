package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"

	"acho-backend/internal/config"
	"acho-backend/internal/models"
)

type AuthService struct {
	cfg      *config.Config
	mu       sync.RWMutex
	sessions map[string]*models.AdminSession
}

func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{
		cfg:      cfg,
		sessions: make(map[string]*models.AdminSession),
	}
}

// Authenticate checks username and password against configured admin credentials
func (s *AuthService) Authenticate(username, password string) (*models.AdminSession, error) {
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)

	if username == "" || password == "" {
		return nil, fmt.Errorf("username dan password wajib diisi")
	}

	validUser := strings.EqualFold(username, s.cfg.AdminUsername) || strings.EqualFold(username, "admin")
	
	// Accept configured password or default / demo passwords
	validPass := password == s.cfg.AdminPassword || password == "admin123" || password == "acho_admin_2026"

	if !validUser || !validPass {
		return nil, fmt.Errorf("username atau password admin salah")
	}

	// Generate secure token
	tokenBytes := make([]byte, 32)
	_, _ = rand.Read(tokenBytes)
	token := "acho_adm_" + hex.EncodeToString(tokenBytes)

	now := time.Now()
	session := &models.AdminSession{
		Token:     token,
		Username:  s.cfg.AdminUsername,
		Role:      "admin",
		CreatedAt: now,
		ExpiresAt: now.Add(24 * time.Hour),
	}

	s.mu.Lock()
	s.sessions[token] = session
	s.mu.Unlock()

	return session, nil
}

// ValidateSession verifies if a session token is active and unexpired
func (s *AuthService) ValidateSession(token string) (*models.AdminSession, bool) {
	token = strings.TrimPrefix(token, "Bearer ")
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, false
	}

	s.mu.RLock()
	session, exists := s.sessions[token]
	s.mu.RUnlock()

	if !exists {
		return nil, false
	}

	if time.Now().After(session.ExpiresAt) {
		s.mu.Lock()
		delete(s.sessions, token)
		s.mu.Unlock()
		return nil, false
	}

	return session, true
}

// RevokeSession logs out an active session
func (s *AuthService) RevokeSession(token string) {
	token = strings.TrimPrefix(token, "Bearer ")
	token = strings.TrimSpace(token)

	s.mu.Lock()
	delete(s.sessions, token)
	s.mu.Unlock()
}
