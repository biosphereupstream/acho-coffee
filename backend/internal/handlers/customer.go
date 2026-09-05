package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"acho-backend/internal/config"
	"acho-backend/internal/database"
	"acho-backend/internal/models"
	"acho-backend/internal/services"
	"github.com/go-chi/chi/v5"
)

type CustomerHandler struct {
	db    *database.Database
	promo *services.PromotionService
	cfg   *config.Config
}

func NewCustomerHandler(db *database.Database, promo *services.PromotionService, cfg *config.Config) *CustomerHandler {
	return &CustomerHandler{db: db, promo: promo, cfg: cfg}
}

func (h *CustomerHandler) List(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	tier := r.URL.Query().Get("tier")

	customers := h.db.ListCustomers(r.Context(), search, tier)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"customers": customers,
		"total":     len(customers),
	})
}

func (h *CustomerHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	customer, err := h.db.GetCustomer(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, customer)
}

func (h *CustomerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var customer models.Customer
	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	customer.ID = id

	updated, err := h.db.UpdateCustomer(r.Context(), customer)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

// BulkEdit handles Select All and multiple customer edits
func (h *CustomerHandler) BulkEdit(w http.ResponseWriter, r *http.Request) {
	var req models.BulkCustomerEditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if !req.SelectAll && len(req.CustomerIDs) == 0 {
		respondError(w, http.StatusBadRequest, "Pilih setidaknya satu pelanggan atau aktifkan Select All")
		return
	}

	updatedCount, err := h.db.BulkEditCustomers(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":       fmt.Sprintf("Berhasil memperbarui %d pelanggan", updatedCount),
		"updated_count": updatedCount,
	})
}

// SendPromotion handles creating and dispatching promotions to customers
func (h *CustomerHandler) SendPromotion(w http.ResponseWriter, r *http.Request) {
	var req models.SendPromotionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if !req.SelectAll && len(req.CustomerIDs) == 0 {
		respondError(w, http.StatusBadRequest, "Pilih setidaknya satu pelanggan penerima promosi")
		return
	}

	// Validate Discount: Enforces B2B max 10%
	tier := req.TierFilter
	if tier == "" && len(req.CustomerIDs) > 0 {
		// check first customer tier
		if c, err := h.db.GetCustomer(r.Context(), req.CustomerIDs[0]); err == nil {
			tier = c.LoyaltyTier
		}
	}
	validatedDiscount, err := h.promo.ValidateDiscount(tier, req.DiscountPercent)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	req.DiscountPercent = validatedDiscount

	// Generate promo code if not provided
	if strings.TrimSpace(req.PromoCode) == "" {
		req.PromoCode = h.promo.GeneratePromoCode("ACHO")
	} else {
		req.PromoCode = strings.ToUpper(strings.TrimSpace(req.PromoCode))
	}

	if req.PromoTitle == "" {
		req.PromoTitle = fmt.Sprintf("Voucher Spesial Diskon %d%%", req.DiscountPercent)
	}

	// Resolve recipients
	var targetCustomers []*models.Customer
	if req.SelectAll {
		targetCustomers = h.db.ListCustomers(r.Context(), "", req.TierFilter)
	} else {
		for _, id := range req.CustomerIDs {
			if c, err := h.db.GetCustomer(r.Context(), id); err == nil {
				targetCustomers = append(targetCustomers, c)
			}
		}
	}

	recipientCount := len(targetCustomers)
	if recipientCount == 0 {
		respondError(w, http.StatusBadRequest, "Tidak ada pelanggan yang cocok dengan target pengiriman promosi")
		return
	}

	// Generate previews for Email & WhatsApp
	sampleCustomerName := targetCustomers[0].FullName
	waPreview := h.promo.FormatWhatsAppMessage(
		sampleCustomerName,
		req.PromoCode,
		req.DiscountPercent,
		req.PromoTitle,
		req.MessageTemplate,
		req.ValidUntil,
		h.cfg.SiteURL,
	)
	emailPreview := h.promo.FormatEmailBody(
		sampleCustomerName,
		req.PromoCode,
		req.DiscountPercent,
		req.PromoTitle,
		req.MessageTemplate,
		req.ValidUntil,
		h.cfg.SiteURL,
	)

	// Record broadcast log
	broadcast := h.promo.CreateBroadcastRecord(req, recipientCount, "Admin ACHO")
	broadcast.MessagePreview = waPreview
	h.db.RecordPromotionBroadcast(r.Context(), broadcast)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":           fmt.Sprintf("Promosi berhasil dikirim ke %d pelanggan!", recipientCount),
		"promo_code":        req.PromoCode,
		"discount_percent":  req.DiscountPercent,
		"recipients_count":  recipientCount,
		"channel":           req.Channel,
		"whatsapp_template": waPreview,
		"email_template":    emailPreview,
		"broadcast":         broadcast,
	})
}

func (h *CustomerHandler) ListPromotions(w http.ResponseWriter, r *http.Request) {
	broadcasts := h.db.ListPromotionBroadcasts(r.Context())
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"promotions": broadcasts,
		"total":      len(broadcasts),
	})
}
