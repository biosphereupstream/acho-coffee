package config

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	DirectDatabaseURL   string
	DataDir             string
	SupabaseURL         string
	SupabasePubKey      string
	SupabaseServiceKey  string
	R2AccountID         string
	R2AccessKeyID       string
	R2SecretAccessKey   string
	R2Bucket            string
	R2PublicURL         string
	CloudflareZoneID    string
	CloudflareAPIToken  string
	TurnstileSecret     string
	AdminEmails         []string
	AdminAPIKey         string
	SiteURL             string
	ResendAPIKey        string
}

func Load() *Config {
	// Try loading .env.local from parent directory (root repo) or current directory
	envPaths := []string{
		"../../.env.local",
		"../.env.local",
		".env.local",
		"../../.env",
		"../.env",
		".env",
	}

	for _, p := range envPaths {
		if abs, err := filepath.Abs(p); err == nil {
			if _, err := os.Stat(abs); err == nil {
				_ = godotenv.Load(abs)
				log.Printf("[Config] Loaded environment variables from %s", abs)
				break
			}
		}
	}

	port := getEnv("PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "")
	directURL := getEnv("DIRECT_DATABASE_URL", dbURL)
	dataDir := getEnv("ACHO_DATA_DIR", filepath.Join("..", ".data"))

	adminEmailsStr := getEnv("ADMIN_EMAILS", "biosphere.upstream@gmail.com,admin@acho.coffee")
	var adminEmails []string
	for _, em := range strings.Split(adminEmailsStr, ",") {
		trimmed := strings.TrimSpace(strings.ToLower(em))
		if trimmed != "" {
			adminEmails = append(adminEmails, trimmed)
		}
	}

	adminKey := getEnv("ADMIN_API_KEY", "acho_admin_secret_key_2026")

	return &Config{
		Port:               port,
		DatabaseURL:        dbURL,
		DirectDatabaseURL:  directURL,
		DataDir:            dataDir,
		SupabaseURL:        getEnv("NEXT_PUBLIC_SUPABASE_URL", "https://lhohaqrhcrghoqkczvbt.supabase.co"),
		SupabasePubKey:     getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		R2AccountID:        getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:      getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey:  getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2Bucket:           getEnv("R2_BUCKET", "acho-coffee"),
		R2PublicURL:        getEnv("R2_PUBLIC_URL", "https://pub-f1af8258ec514a03bd205cb70a0dbc05.r2.dev/acho-coffee"),
		CloudflareZoneID:   getEnv("CLOUDFLARE_ZONE_ID", ""),
		CloudflareAPIToken: getEnv("CLOUDFLARE_API_TOKEN", ""),
		TurnstileSecret:    getEnv("CLOUDFLARE_TURNSTILE_SECRET", ""),
		AdminEmails:        adminEmails,
		AdminAPIKey:        adminKey,
		SiteURL:            getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return defaultVal
}
