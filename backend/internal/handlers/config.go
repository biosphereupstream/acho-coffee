package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"acho-backend/internal/database"
	"acho-backend/internal/models"
	"acho-backend/internal/services"
)

type ConfigHandler struct {
	db *database.Database
	cf *services.CloudflareService
	sb *services.SupabaseService
}

func NewConfigHandler(db *database.Database, cf *services.CloudflareService, sb *services.SupabaseService) *ConfigHandler {
	return &ConfigHandler{db: db, cf: cf, sb: sb}
}

func (h *ConfigHandler) Health(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"service":   "acho-backend",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (h *ConfigHandler) GetDatabaseConfig(w http.ResponseWriter, r *http.Request) {
	dbConfig := h.db.GetDatabaseConfig(r.Context())

	// Also check Supabase ping
	sbAlive, sbLatency := h.sb.Ping(r.Context())

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"database": dbConfig,
		"supabase": map[string]interface{}{
			"alive":      sbAlive,
			"latency_ms": sbLatency,
			"endpoint":   "https://lhohaqrhcrghoqkczvbt.supabase.co",
		},
		"cloudflare": map[string]interface{}{
			"r2_configured": true,
			"r2_bucket":     "acho-coffee",
			"r2_public_url": "https://pub-f1af8258ec514a03bd205cb70a0dbc05.r2.dev/acho-coffee",
		},
	})
}

func (h *ConfigHandler) GetFrontendConfig(w http.ResponseWriter, r *http.Request) {
	cfg := h.db.GetFrontendConfig(r.Context())
	respondJSON(w, http.StatusOK, cfg)
}

func (h *ConfigHandler) UpdateFrontendConfig(w http.ResponseWriter, r *http.Request) {
	var input models.FrontendConfig
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	updated := h.db.UpdateFrontendConfig(r.Context(), input)

	// Purge CDN cache asynchronously so frontend gets updated values immediately
	go func() {
		_ = h.cf.PurgeCDNCache(r.Context(), []string{"/api/config/frontend"})
	}()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Konfigurasi frontend berhasil diperbarui",
		"config":  updated,
	})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
