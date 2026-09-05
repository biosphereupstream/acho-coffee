package handlers

import (
	"net/http"

	"acho-backend/internal/database"
)

type DashboardHandler struct {
	db *database.Database
}

func NewDashboardHandler(db *database.Database) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats := h.db.GetDashboardStats(r.Context())
	respondJSON(w, http.StatusOK, stats)
}

func (h *DashboardHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	analytics := h.db.GetDashboardAnalytics(r.Context())
	respondJSON(w, http.StatusOK, analytics)
}
