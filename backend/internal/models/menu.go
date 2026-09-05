package models

import "time"

type MenuItem struct {
	ID             string    `json:"id"`
	Slug           string    `json:"slug"`
	Name           string    `json:"name"`
	Category       string    `json:"category"` // "beans", "drinks_botol_kale", "drinks_pet_can", "drinks_botol_1l", "drinks_pouch", "drinks_espresso_pouch"
	Type           string    `json:"type"`     // "single_origin", "blend", "beverage"
	Packaging      string    `json:"packaging"`
	Origin         string    `json:"origin"`
	Region         string    `json:"region"`
	Process        string    `json:"process"`
	AltitudeMeters string    `json:"altitude_meters"`
	Varietal       string    `json:"varietal"`
	TastingNotes   []string  `json:"tasting_notes"`
	Description    string    `json:"description"`
	Story          string    `json:"story"`
	PriceIDR       int       `json:"price_idr"`
	WeightGrams    int       `json:"weight_grams"`
	StockQuantity  int       `json:"stock_quantity"`
	ImageURL       string    `json:"image_url"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type BulkMenuEditRequest struct {
	ItemIDs        []string `json:"item_ids"`
	SelectAll      bool     `json:"select_all"`
	CategoryFilter string   `json:"category_filter"` // optional when select_all is true
	Action         string   `json:"action"`          // "price_adjust_percent", "price_adjust_fixed", "set_active", "set_category", "set_stock"
	AdjustPercent  float64  `json:"adjust_percent"`
	AdjustFixed    int      `json:"adjust_fixed"`
	SetActive      *bool    `json:"set_active"`
	SetCategory    string   `json:"set_category"`
	SetStock       *int     `json:"set_stock"`
}
