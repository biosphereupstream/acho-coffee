package services

import (
	"testing"

	"acho-backend/internal/config"
)

func TestAuthenticateAdmin(t *testing.T) {
	cfg := &config.Config{
		AdminUsername: "admin",
		AdminPassword: "acho_admin_2026",
	}
	auth := NewAuthService(cfg)

	// Valid login
	sess, err := auth.Authenticate("admin", "acho_admin_2026")
	if err != nil {
		t.Fatalf("Expected login to succeed, got error: %v", err)
	}
	if sess.Token == "" {
		t.Fatalf("Expected non-empty token")
	}

	// Validate session
	valSess, ok := auth.ValidateSession(sess.Token)
	if !ok || valSess == nil {
		t.Fatalf("Expected session to be valid")
	}

	// Invalid password
	_, err = auth.Authenticate("admin", "wrong_password")
	if err == nil {
		t.Fatalf("Expected error for wrong password")
	}

	// Invalid username
	_, err = auth.Authenticate("unknown_user", "acho_admin_2026")
	if err == nil {
		t.Fatalf("Expected error for wrong username")
	}

	// Logout / Revoke
	auth.RevokeSession(sess.Token)
	_, ok = auth.ValidateSession(sess.Token)
	if ok {
		t.Fatalf("Expected session to be invalid after revocation")
	}
}
