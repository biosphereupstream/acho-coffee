package models

import "time"

type FrontendConfig struct {
	BannerEnabled         bool     `json:"banner_enabled"`
	BannerText            string   `json:"banner_text"`
	BannerLink            string   `json:"banner_link"`
	AnnouncementText      string   `json:"announcement_text"`
	ShopOpen              bool     `json:"shop_open"`
	ShopNotice            string   `json:"shop_notice"`
	B2BMaxDiscountPercent int      `json:"b2b_max_discount_percent"`
	OperatingHours        string   `json:"operating_hours"`
	ContactWhatsApp       string   `json:"contact_whatsapp"`
	ContactEmail          string   `json:"contact_email"`
	FreeShippingThreshold int      `json:"free_shipping_threshold"`
	PickupSlots           []string `json:"pickup_slots"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type DatabaseConfig struct {
	Connected        bool      `json:"connected"`
	Provider         string    `json:"provider"`
	Host             string    `json:"host"`
	DatabaseName     string    `json:"database_name"`
	LatencyMs        int64     `json:"latency_ms"`
	OpenConnections  int       `json:"open_connections"`
	IdleConnections  int       `json:"idle_connections"`
	TablesCount      int       `json:"tables_count"`
	TotalProducts    int       `json:"total_products"`
	TotalOrders      int       `json:"total_orders"`
	TotalCustomers   int       `json:"total_customers"`
	CheckedAt        time.Time `json:"checked_at"`
}
