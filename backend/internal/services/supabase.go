package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"acho-backend/internal/config"
)

type SupabaseService struct {
	cfg        *config.Config
	httpClient *http.Client
}

type SupabaseUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func NewSupabaseService(cfg *config.Config) *SupabaseService {
	return &SupabaseService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

// VerifyToken verifies a Supabase Auth JWT token by calling Supabase auth user endpoint
func (s *SupabaseService) VerifyToken(ctx context.Context, token string) (*SupabaseUser, error) {
	token = strings.TrimPrefix(token, "Bearer ")
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, fmt.Errorf("empty auth token")
	}

	// If token matches AdminAPIKey, treat as super admin
	if token == s.cfg.AdminAPIKey {
		return &SupabaseUser{
			ID:    "system-admin",
			Email: s.cfg.AdminEmails[0],
			Role:  "admin",
		}, nil
	}

	reqURL := fmt.Sprintf("%s/auth/v1/user", strings.TrimRight(s.cfg.SupabaseURL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}

	apiKey := s.cfg.SupabasePubKey
	if s.cfg.SupabaseServiceKey != "" {
		apiKey = s.cfg.SupabaseServiceKey
	}
	req.Header.Set("apikey", apiKey)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token: status %d", resp.StatusCode)
	}

	var user SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// IsAdmin checks if email is an authorized admin
func (s *SupabaseService) IsAdmin(email string) bool {
	email = strings.ToLower(strings.TrimSpace(email))
	for _, admin := range s.cfg.AdminEmails {
		if strings.ToLower(admin) == email {
			return true
		}
	}
	return false
}

// Ping checks if Supabase REST API is responding
func (s *SupabaseService) Ping(ctx context.Context) (bool, int64) {
	start := time.Now()
	reqURL := fmt.Sprintf("%s/rest/v1/", strings.TrimRight(s.cfg.SupabaseURL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return false, 0
	}
	req.Header.Set("apikey", s.cfg.SupabasePubKey)

	resp, err := s.httpClient.Do(req)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return false, latency
	}
	defer resp.Body.Close()

	// 200 or 401 means server is alive and reachable
	return resp.StatusCode == 200 || resp.StatusCode == 401, latency
}
