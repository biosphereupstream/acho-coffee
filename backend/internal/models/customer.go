package models

import "time"

type Customer struct {
	ID            string     `json:"id"`
	FullName      string     `json:"full_name"`
	Email         string     `json:"email"`
	Phone         string     `json:"phone"`
	PreferredBrew string     `json:"preferred_brew"`
	LoyaltyTier   string     `json:"loyalty_tier"` // "retail", "b2b_bronze", "b2b_silver", "b2b_gold"
	TotalOrders   int        `json:"total_orders"`
	TotalSpentIDR int        `json:"total_spent_idr"`
	Tags          []string   `json:"tags"`
	Notes         string     `json:"notes"`
	IsActive      bool       `json:"is_active"`
	CreatedAt     time.Time  `json:"created_at"`
	LastOrderAt   *time.Time `json:"last_order_at,omitempty"`
}

type BulkCustomerEditRequest struct {
	CustomerIDs []string `json:"customer_ids"`
	SelectAll   bool     `json:"select_all"`
	TierFilter  string   `json:"tier_filter"` // optional when select_all is true
	Action      string   `json:"action"`      // "set_tier", "add_tag", "remove_tag", "set_active"
	SetTier     string   `json:"set_tier"`
	Tag         string   `json:"tag"`
	SetActive   *bool    `json:"set_active"`
}

type SendPromotionRequest struct {
	CustomerIDs     []string `json:"customer_ids"`
	SelectAll       bool     `json:"select_all"`
	TierFilter      string   `json:"tier_filter"` // optional when select_all is true
	PromoTitle      string   `json:"promo_title"`
	PromoCode       string   `json:"promo_code"`
	DiscountPercent int      `json:"discount_percent"` // Enforced max 10% for B2B promos
	Channel         string   `json:"channel"`          // "email", "whatsapp", "both"
	MessageTemplate string   `json:"message_template"`
	ValidUntil      string   `json:"valid_until"`
}

type PromotionBroadcast struct {
	ID              string    `json:"id"`
	PromoCode       string    `json:"promo_code"`
	Title           string    `json:"title"`
	DiscountPercent int       `json:"discount_percent"`
	RecipientsCount int       `json:"recipients_count"`
	Channel         string    `json:"channel"`
	MessagePreview  string    `json:"message_preview"`
	Status          string    `json:"status"` // "sent", "scheduled", "draft"
	SentAt          time.Time `json:"sent_at"`
	CreatedBy       string    `json:"created_by"`
}
