package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"acho-backend/internal/database"
	"acho-backend/internal/models"
	"acho-backend/internal/services"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type MenuHandler struct {
	db *database.Database
	cf *services.CloudflareService
}

func NewMenuHandler(db *database.Database, cf *services.CloudflareService) *MenuHandler {
	return &MenuHandler{db: db, cf: cf}
}

func (h *MenuHandler) List(w http.ResponseWriter, r *http.Request) {
	typeFilter := r.URL.Query().Get("type")
	category := r.URL.Query().Get("category")
	packaging := r.URL.Query().Get("packaging")
	search := r.URL.Query().Get("search")
	activeOnly := r.URL.Query().Get("active_only") == "true"

	items := h.db.ListMenu(r.Context(), typeFilter, category, packaging, search, activeOnly)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"items": items,
		"total": len(items),
	})
}

func (h *MenuHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.db.GetMenuItem(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, item)
}

func (h *MenuHandler) Create(w http.ResponseWriter, r *http.Request) {
	var item models.MenuItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if strings.TrimSpace(item.Name) == "" {
		respondError(w, http.StatusBadRequest, "Nama menu tidak boleh kosong")
		return
	}
	if item.PriceIDR <= 0 {
		respondError(w, http.StatusBadRequest, "Harga harus lebih dari 0")
		return
	}

	created, err := h.db.CreateMenuItem(r.Context(), item)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Invalidate CDN cache
	go func() {
		_ = h.cf.PurgeCDNCache(r.Context(), []string{"/kopi", "/minuman", "/api/menu"})
	}()

	respondJSON(w, http.StatusCreated, created)
}

func (h *MenuHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var item models.MenuItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	item.ID = id

	updated, err := h.db.UpdateMenuItem(r.Context(), item)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// Invalidate CDN cache
	go func() {
		_ = h.cf.PurgeCDNCache(r.Context(), []string{"/kopi", "/minuman", "/api/menu", "/pesan/" + updated.Slug})
	}()

	respondJSON(w, http.StatusOK, updated)
}

func (h *MenuHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	imageURL, err := h.db.DeleteMenuItem(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// Delete from Cloudflare R2 and purge Edge CDN cache
	go func(img string) {
		ctxBg, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if img != "" {
			_ = h.cf.DeleteR2(ctxBg, img)
		}
		_ = h.cf.PurgeCDNCache(ctxBg, []string{"/kopi", "/minuman", "/api/menu"})
	}(imageURL)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Item menu berhasil dihapus",
	})
}

// BulkEdit handles Select All and mass product updates
func (h *MenuHandler) BulkEdit(w http.ResponseWriter, r *http.Request) {
	var req models.BulkMenuEditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if !req.SelectAll && len(req.ItemIDs) == 0 {
		respondError(w, http.StatusBadRequest, "Pilih setidaknya satu item menu atau aktifkan Select All")
		return
	}

	updatedCount, err := h.db.BulkEditMenu(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	go func() {
		_ = h.cf.PurgeCDNCache(r.Context(), []string{"/kopi", "/minuman", "/api/menu"})
	}()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       fmt.Sprintf("Berhasil memperbarui %d item menu", updatedCount),
		"updated_count": updatedCount,
	})
}

// BulkDelete handles deleting multiple menu items
func (h *MenuHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SelectAll bool     `json:"select_all"`
		ItemIDs   []string `json:"item_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	count, imageURLs, err := h.db.BulkDeleteMenu(r.Context(), req.ItemIDs, req.SelectAll)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Delete images from Cloudflare R2 and purge Edge CDN cache
	go func(imgs []string) {
		ctxBg, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		for _, img := range imgs {
			if img != "" {
				_ = h.cf.DeleteR2(ctxBg, img)
			}
		}
		_ = h.cf.PurgeCDNCache(ctxBg, []string{"/kopi", "/minuman", "/api/menu"})
	}(imageURLs)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       fmt.Sprintf("Berhasil menghapus %d item menu", count),
		"deleted_count": count,
	})
}

// UploadImage handles uploading a product image directly to Cloudflare R2
func (h *MenuHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// 10MB max
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "File terlalu besar (maksimal 10MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Field 'file' wajib diunggah")
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Gagal membaca file")
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	key := fmt.Sprintf("products/%d-%s%s", time.Now().Unix(), uuid.New().String()[:8], ext)

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg"
	}

	publicURL, err := h.cf.UploadR2(r.Context(), key, fileBytes, contentType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Gagal upload ke Cloudflare R2: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message":   "Foto berhasil diunggah ke Cloudflare R2",
		"url":       publicURL,
		"key":       key,
		"file_name": header.Filename,
	})
}

// DeleteMedia handles deleting media directly from Cloudflare R2
func (h *MenuHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Key string `json:"key"`
		URL string `json:"url"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	target := req.Key
	if target == "" {
		target = req.URL
	}
	if target == "" {
		target = r.URL.Query().Get("key")
	}
	if target == "" {
		target = r.URL.Query().Get("url")
	}

	if target == "" {
		respondError(w, http.StatusBadRequest, "Parameter 'key' atau 'url' dibutuhkan")
		return
	}

	err := h.cf.DeleteR2(r.Context(), target)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Gagal menghapus media dari Cloudflare R2: "+err.Error())
		return
	}

	go func() {
		ctxBg, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.cf.PurgeCDNCache(ctxBg, []string{"/kopi", "/minuman", "/api/menu"})
	}()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Media berhasil dihapus dari Cloudflare R2",
	})
}

