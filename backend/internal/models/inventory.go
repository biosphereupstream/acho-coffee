package models

import "time"

type InventoryItem struct {
	ID              string    `json:"id"`
	Code            string    `json:"code"`
	Name            string    `json:"name"`
	Category        string    `json:"category"` // "green_beans", "roasted_beans", "packaging_bottle", "packaging_can", "packaging_pouch", "ingredient", "merchandise"
	CurrentStock    int       `json:"current_stock"`
	Unit            string    `json:"unit"` // "grams", "pcs", "bottles", "cans", "pouches"
	MinThreshold    int       `json:"min_threshold"`
	CostPerUnitIDR  int       `json:"cost_per_unit_idr"`
	Location        string    `json:"location"`
	BatchNumber     string    `json:"batch_number"`
	LastRestockedAt time.Time `json:"last_restocked_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type InventoryLog struct {
	ID              string    `json:"id"`
	InventoryItemID string    `json:"inventory_item_id"`
	ItemName        string    `json:"item_name"`
	ChangeAmount    int       `json:"change_amount"`
	BalanceAfter    int       `json:"balance_after"`
	ActionType      string    `json:"action_type"` // "restock", "roast_deduction", "sale_deduction", "damage_spoil", "manual_adjustment"
	Reason          string    `json:"reason"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
}

type StockAdjustRequest struct {
	ChangeAmount int    `json:"change_amount"`
	ActionType   string `json:"action_type"`
	Reason       string `json:"reason"`
	CreatedBy    string `json:"created_by"`
}
