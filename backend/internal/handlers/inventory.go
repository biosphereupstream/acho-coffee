package handlers

import (
	"encoding/json"
	"net/http"

	"acho-backend/internal/database"
	"acho-backend/internal/models"
	"github.com/go-chi/chi/v5"
)

type InventoryHandler struct {
	db *database.Database
}

func NewInventoryHandler(db *database.Database) *InventoryHandler {
	return &InventoryHandler{db: db}
}

func (h *InventoryHandler) List(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	items := h.db.ListInventory(r.Context(), category, search)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"items": items,
		"total": len(items),
	})
}

func (h *InventoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.db.GetInventoryItem(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, item)
}

func (h *InventoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var item models.InventoryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	created, err := h.db.CreateInventoryItem(r.Context(), item)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, created)
}

func (h *InventoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var item models.InventoryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	item.ID = id

	updated, err := h.db.UpdateInventoryItem(r.Context(), item)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

func (h *InventoryHandler) AdjustStock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.StockAdjustRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if req.ChangeAmount == 0 {
		respondError(w, http.StatusBadRequest, "change_amount tidak boleh bernilai 0")
		return
	}
	if req.ActionType == "" {
		req.ActionType = "manual_adjustment"
	}
	if req.CreatedBy == "" {
		req.CreatedBy = "Admin Roastery"
	}

	updated, err := h.db.AdjustStock(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Stok berhasil disesuaikan",
		"item":    updated,
	})
}

func (h *InventoryHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	logs := h.db.GetInventoryLogs(r.Context(), id)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"logs":  logs,
		"total": len(logs),
	})
}

func (h *InventoryHandler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	alerts := h.db.GetLowStockAlerts(r.Context())
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"alerts": alerts,
		"total":  len(alerts),
	})
}
