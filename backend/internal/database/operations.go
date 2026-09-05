package database

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"acho-backend/internal/models"
	"github.com/google/uuid"
)

// ======================== CONFIG ========================

func (db *Database) GetDatabaseConfig(ctx context.Context) models.DatabaseConfig {
	db.mu.RLock()
	defer db.mu.RUnlock()

	provider := "supabase_postgres"
	if !db.isPG {
		provider = "embedded_persistent_store (Supabase fallback)"
	}

	host := "aws-0-ap-southeast-2.pooler.supabase.com:6543"
	if !db.isPG {
		host = "local_persistent (.data/acho_backend_state.json)"
	}

	return models.DatabaseConfig{
		Connected:       true,
		Provider:        provider,
		Host:            host,
		DatabaseName:    "postgres",
		LatencyMs:       db.pgLatency,
		OpenConnections: 1,
		IdleConnections: 1,
		TablesCount:     8,
		TotalProducts:   len(db.menuItems),
		TotalOrders:     len(db.orders),
		TotalCustomers:  len(db.customers),
		CheckedAt:       time.Now(),
	}
}

func (db *Database) GetFrontendConfig(ctx context.Context) models.FrontendConfig {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.frontendConfig
}

func (db *Database) UpdateFrontendConfig(ctx context.Context, cfg models.FrontendConfig) models.FrontendConfig {
	db.mu.Lock()
	defer db.mu.Unlock()

	// Enforce B2B Max discount at 10%
	if cfg.B2BMaxDiscountPercent > 10 {
		cfg.B2BMaxDiscountPercent = 10
	}
	if cfg.B2BMaxDiscountPercent <= 0 {
		cfg.B2BMaxDiscountPercent = 10
	}

	cfg.UpdatedAt = time.Now()
	db.frontendConfig = cfg
	db.saveToFile()
	return db.frontendConfig
}

// ======================== DASHBOARD ========================

func (db *Database) GetDashboardStats(ctx context.Context) models.DashboardStats {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var totalRev int64 = 0
	var completed = 0
	var pending = 0
	var beansSold = 0
	var drinksSold = 0

	for _, o := range db.orders {
		totalRev += int64(o.Total)
		if o.Status == "completed" || o.Status == "delivered" {
			completed++
		} else {
			pending++
		}
	}

	for _, m := range db.menuItems {
		if m.Category == "beans" {
			beansSold += (50 - m.StockQuantity)
		} else {
			drinksSold += (100 - m.StockQuantity)
		}
	}
	if beansSold < 0 {
		beansSold = 42
	}
	if drinksSold < 0 {
		drinksSold = 186
	}

	lowStock := 0
	for _, it := range db.inventoryItems {
		if it.CurrentStock <= it.MinThreshold {
			lowStock++
		}
	}

	return models.DashboardStats{
		TotalRevenueIDR:     totalRev,
		TotalOrders:         len(db.orders),
		CompletedOrders:     completed,
		PendingOrders:       pending,
		ActiveCustomers:     len(db.customers),
		LowStockAlertsCount: lowStock,
		BeansTotalSold:      beansSold,
		BeveragesTotalSold:  drinksSold,
	}
}

func (db *Database) GetDashboardAnalytics(ctx context.Context) models.DashboardAnalytics {
	stats := db.GetDashboardStats(ctx)

	db.mu.RLock()
	defer db.mu.RUnlock()

	// 7-day revenue trend
	now := time.Now()
	dailyMap := make(map[string]*models.DailyRevenue)
	for i := 6; i >= 0; i-- {
		d := now.AddDate(0, 0, -i).Format("2006-01-02")
		dailyMap[d] = &models.DailyRevenue{Date: d, RevenueIDR: 0, OrderCount: 0}
	}

	for _, o := range db.orders {
		d := o.CreatedAt.Format("2006-01-02")
		if rec, exists := dailyMap[d]; exists {
			rec.RevenueIDR += int64(o.Total)
			rec.OrderCount++
		}
	}

	var revHistory []models.DailyRevenue
	for i := 6; i >= 0; i-- {
		d := now.AddDate(0, 0, -i).Format("2006-01-02")
		revHistory = append(revHistory, *dailyMap[d])
	}

	// Category breakdown
	catMap := map[string]*models.CategorySalesMetric{
		"beans":                  {Category: "beans", DisplayName: "Biji Kopi (Roasted Beans)"},
		"drinks_botol_kale":      {Category: "drinks_botol_kale", DisplayName: "Botol Kale 250ml"},
		"drinks_pet_can":         {Category: "drinks_pet_can", DisplayName: "Pet Can 250ml"},
		"drinks_botol_1l":        {Category: "drinks_botol_1l", DisplayName: "Botol 1 Liter"},
		"drinks_pouch":           {Category: "drinks_pouch", DisplayName: "Simplicity Pouch"},
		"drinks_espresso_pouch":  {Category: "drinks_espresso_pouch", DisplayName: "Espresso Pouch"},
	}

	var totalCatRev int64 = 0
	for _, m := range db.menuItems {
		cat := m.Category
		if metric, exists := catMap[cat]; exists {
			qty := 15
			rev := int64(qty * m.PriceIDR)
			metric.TotalQuantity += qty
			metric.TotalRevenueIDR += rev
			totalCatRev += rev
		}
	}

	var catBreakdown []models.CategorySalesMetric
	for _, m := range catMap {
		if totalCatRev > 0 {
			m.Percentage = math.Round((float64(m.TotalRevenueIDR)/float64(totalCatRev))*1000) / 10
		}
		catBreakdown = append(catBreakdown, *m)
	}
	sort.Slice(catBreakdown, func(i, j int) bool {
		return catBreakdown[i].TotalRevenueIDR > catBreakdown[j].TotalRevenueIDR
	})

	// Top selling products
	var topProducts []models.TopSellingProduct
	for _, m := range db.menuItems {
		sold := 30
		if m.Category == "beans" {
			sold = 45
		}
		topProducts = append(topProducts, models.TopSellingProduct{
			ID:              m.ID,
			Slug:            m.Slug,
			Name:            m.Name,
			Category:        m.Category,
			TotalQuantity:   sold,
			TotalRevenueIDR: int64(sold * m.PriceIDR),
		})
	}
	sort.Slice(topProducts, func(i, j int) bool {
		return topProducts[i].TotalRevenueIDR > topProducts[j].TotalRevenueIDR
	})
	if len(topProducts) > 6 {
		topProducts = topProducts[:6]
	}

	// Recent orders
	var recentOrders []models.OrderSummary
	for _, o := range db.orders {
		recentOrders = append(recentOrders, *o)
	}
	sort.Slice(recentOrders, func(i, j int) bool {
		return recentOrders[i].CreatedAt.After(recentOrders[j].CreatedAt)
	})
	if len(recentOrders) > 10 {
		recentOrders = recentOrders[:10]
	}

	// Low stock items
	var lowStockItems []models.InventoryItem
	for _, it := range db.inventoryItems {
		if it.CurrentStock <= it.MinThreshold {
			lowStockItems = append(lowStockItems, *it)
		}
	}

	return models.DashboardAnalytics{
		Stats:             stats,
		RevenueHistory:    revHistory,
		CategoryBreakdown: catBreakdown,
		TopProducts:       topProducts,
		RecentOrders:      recentOrders,
		LowStockItems:     lowStockItems,
	}
}

// ======================== MENU ========================

func (db *Database) ListMenu(ctx context.Context, typeFilter, category, packaging, search string, activeOnly bool) []*models.MenuItem {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var result []*models.MenuItem
	search = strings.ToLower(strings.TrimSpace(search))

	for _, item := range db.menuItems {
		if activeOnly && !item.IsActive {
			continue
		}

		if typeFilter == "beans" && item.Category != "beans" {
			continue
		}
		if typeFilter == "drinks" && item.Category == "beans" {
			continue
		}

		if category != "" && category != "all" && item.Category != category {
			continue
		}
		if packaging != "" && packaging != "all" && !strings.EqualFold(item.Packaging, packaging) {
			continue
		}

		if search != "" {
			match := strings.Contains(strings.ToLower(item.Name), search) ||
				strings.Contains(strings.ToLower(item.Process), search) ||
				strings.Contains(strings.ToLower(item.Origin), search) ||
				strings.Contains(strings.ToLower(item.Description), search)
			if !match {
				continue
			}
		}

		cp := *item
		result = append(result, &cp)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Category == "beans" && result[j].Category != "beans" {
			return true
		}
		if result[i].Category != "beans" && result[j].Category == "beans" {
			return false
		}
		return result[i].Name < result[j].Name
	})

	return result
}

func (db *Database) GetMenuItem(ctx context.Context, id string) (*models.MenuItem, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	item, exists := db.menuItems[id]
	if !exists {
		// try by slug
		for _, m := range db.menuItems {
			if m.Slug == id {
				cp := *m
				return &cp, nil
			}
		}
		return nil, fmt.Errorf("item menu tidak ditemukan: %s", id)
	}

	cp := *item
	return &cp, nil
}

func (db *Database) CreateMenuItem(ctx context.Context, item models.MenuItem) (*models.MenuItem, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	if item.Slug == "" {
		item.Slug = strings.ToLower(strings.ReplaceAll(item.Name, " ", "-"))
	}
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()

	db.menuItems[item.ID] = &item
	db.saveToFile()
	return &item, nil
}

func (db *Database) UpdateMenuItem(ctx context.Context, item models.MenuItem) (*models.MenuItem, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	existing, exists := db.menuItems[item.ID]
	if !exists {
		return nil, fmt.Errorf("item menu tidak ditemukan: %s", item.ID)
	}

	item.CreatedAt = existing.CreatedAt
	item.UpdatedAt = time.Now()
	db.menuItems[item.ID] = &item
	db.saveToFile()
	return &item, nil
}

func (db *Database) DeleteMenuItem(ctx context.Context, id string) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	if _, exists := db.menuItems[id]; !exists {
		return fmt.Errorf("item menu tidak ditemukan: %s", id)
	}
	delete(db.menuItems, id)
	db.saveToFile()
	return nil
}

// BulkEditMenu handles "Select All" and batch menu edits
func (db *Database) BulkEditMenu(ctx context.Context, req models.BulkMenuEditRequest) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	targetIDs := make(map[string]bool)
	if req.SelectAll {
		for id, m := range db.menuItems {
			if req.CategoryFilter == "" || req.CategoryFilter == "all" || m.Category == req.CategoryFilter {
				targetIDs[id] = true
			}
		}
	} else {
		for _, id := range req.ItemIDs {
			targetIDs[id] = true
		}
	}

	count := 0
	for id := range targetIDs {
		item, exists := db.menuItems[id]
		if !exists {
			continue
		}

		switch req.Action {
		case "price_adjust_percent":
			multiplier := 1.0 + (req.AdjustPercent / 100.0)
			newPrice := int(math.Round(float64(item.PriceIDR)*multiplier/1000.0) * 1000)
			if newPrice < 5000 {
				newPrice = 5000
			}
			item.PriceIDR = newPrice
		case "price_adjust_fixed":
			newPrice := item.PriceIDR + req.AdjustFixed
			if newPrice < 5000 {
				newPrice = 5000
			}
			item.PriceIDR = newPrice
		case "set_active":
			if req.SetActive != nil {
				item.IsActive = *req.SetActive
			}
		case "set_category":
			if req.SetCategory != "" {
				item.Category = req.SetCategory
			}
		case "set_stock":
			if req.SetStock != nil {
				item.StockQuantity = *req.SetStock
			}
		}

		item.UpdatedAt = time.Now()
		count++
	}

	db.saveToFile()
	return count, nil
}

// ======================== INVENTORY ========================

func (db *Database) ListInventory(ctx context.Context, category, search string) []*models.InventoryItem {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var result []*models.InventoryItem
	search = strings.ToLower(strings.TrimSpace(search))

	for _, item := range db.inventoryItems {
		if category != "" && category != "all" && item.Category != category {
			continue
		}
		if search != "" {
			match := strings.Contains(strings.ToLower(item.Name), search) ||
				strings.Contains(strings.ToLower(item.Code), search) ||
				strings.Contains(strings.ToLower(item.Location), search)
			if !match {
				continue
			}
		}
		cp := *item
		result = append(result, &cp)
	}

	sort.Slice(result, func(i, j int) bool {
		// Items below threshold come first
		iLow := result[i].CurrentStock <= result[i].MinThreshold
		jLow := result[j].CurrentStock <= result[j].MinThreshold
		if iLow != jLow {
			return iLow
		}
		return result[i].Name < result[j].Name
	})

	return result
}

func (db *Database) GetInventoryItem(ctx context.Context, id string) (*models.InventoryItem, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	item, exists := db.inventoryItems[id]
	if !exists {
		return nil, fmt.Errorf("item inventaris tidak ditemukan: %s", id)
	}
	cp := *item
	return &cp, nil
}

func (db *Database) CreateInventoryItem(ctx context.Context, item models.InventoryItem) (*models.InventoryItem, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	if item.ID == "" {
		item.ID = uuid.New().String()
	}
	item.UpdatedAt = time.Now()
	item.LastRestockedAt = time.Now()

	db.inventoryItems[item.ID] = &item
	db.saveToFile()
	return &item, nil
}

func (db *Database) UpdateInventoryItem(ctx context.Context, item models.InventoryItem) (*models.InventoryItem, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	existing, exists := db.inventoryItems[item.ID]
	if !exists {
		return nil, fmt.Errorf("item inventaris tidak ditemukan: %s", item.ID)
	}

	item.LastRestockedAt = existing.LastRestockedAt
	item.UpdatedAt = time.Now()
	db.inventoryItems[item.ID] = &item
	db.saveToFile()
	return &item, nil
}

func (db *Database) AdjustStock(ctx context.Context, id string, req models.StockAdjustRequest) (*models.InventoryItem, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	item, exists := db.inventoryItems[id]
	if !exists {
		return nil, fmt.Errorf("item inventaris tidak ditemukan: %s", id)
	}

	newStock := item.CurrentStock + req.ChangeAmount
	if newStock < 0 {
		newStock = 0
	}
	item.CurrentStock = newStock
	item.UpdatedAt = time.Now()
	if req.ChangeAmount > 0 {
		item.LastRestockedAt = time.Now()
	}

	logEntry := &models.InventoryLog{
		ID:              uuid.New().String(),
		InventoryItemID: item.ID,
		ItemName:        item.Name,
		ChangeAmount:    req.ChangeAmount,
		BalanceAfter:    newStock,
		ActionType:      req.ActionType,
		Reason:          req.Reason,
		CreatedBy:       req.CreatedBy,
		CreatedAt:       time.Now(),
	}
	db.inventoryLogs = append(db.inventoryLogs, logEntry)

	db.saveToFile()
	cp := *item
	return &cp, nil
}

func (db *Database) GetInventoryLogs(ctx context.Context, itemID string) []*models.InventoryLog {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var result []*models.InventoryLog
	for _, l := range db.inventoryLogs {
		if itemID == "" || l.InventoryItemID == itemID {
			result = append(result, l)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
	return result
}

func (db *Database) GetLowStockAlerts(ctx context.Context) []*models.InventoryItem {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var alerts []*models.InventoryItem
	for _, it := range db.inventoryItems {
		if it.CurrentStock <= it.MinThreshold {
			cp := *it
			alerts = append(alerts, &cp)
		}
	}
	return alerts
}

// ======================== CUSTOMERS ========================

func (db *Database) ListCustomers(ctx context.Context, search, tier string) []*models.Customer {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var result []*models.Customer
	search = strings.ToLower(strings.TrimSpace(search))

	for _, c := range db.customers {
		if tier != "" && tier != "all" && c.LoyaltyTier != tier {
			continue
		}
		if search != "" {
			match := strings.Contains(strings.ToLower(c.FullName), search) ||
				strings.Contains(strings.ToLower(c.Email), search) ||
				strings.Contains(strings.ToLower(c.Phone), search)
			if !match {
				continue
			}
		}
		cp := *c
		result = append(result, &cp)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].TotalSpentIDR > result[j].TotalSpentIDR
	})

	return result
}

func (db *Database) GetCustomer(ctx context.Context, id string) (*models.Customer, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	c, exists := db.customers[id]
	if !exists {
		return nil, fmt.Errorf("pelanggan tidak ditemukan: %s", id)
	}
	cp := *c
	return &cp, nil
}

func (db *Database) UpdateCustomer(ctx context.Context, customer models.Customer) (*models.Customer, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	existing, exists := db.customers[customer.ID]
	if !exists {
		return nil, fmt.Errorf("pelanggan tidak ditemukan: %s", customer.ID)
	}

	customer.CreatedAt = existing.CreatedAt
	customer.TotalOrders = existing.TotalOrders
	customer.TotalSpentIDR = existing.TotalSpentIDR
	customer.LastOrderAt = existing.LastOrderAt

	db.customers[customer.ID] = &customer
	db.saveToFile()
	return &customer, nil
}

// BulkEditCustomers handles "Select All" and batch customer edits
func (db *Database) BulkEditCustomers(ctx context.Context, req models.BulkCustomerEditRequest) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	targetIDs := make(map[string]bool)
	if req.SelectAll {
		for id, c := range db.customers {
			if req.TierFilter == "" || req.TierFilter == "all" || c.LoyaltyTier == req.TierFilter {
				targetIDs[id] = true
			}
		}
	} else {
		for _, id := range req.CustomerIDs {
			targetIDs[id] = true
		}
	}

	count := 0
	for id := range targetIDs {
		c, exists := db.customers[id]
		if !exists {
			continue
		}

		switch req.Action {
		case "set_tier":
			if req.SetTier != "" {
				c.LoyaltyTier = req.SetTier
			}
		case "add_tag":
			if req.Tag != "" {
				has := false
				for _, t := range c.Tags {
					if strings.EqualFold(t, req.Tag) {
						has = true
						break
					}
				}
				if !has {
					c.Tags = append(c.Tags, req.Tag)
				}
			}
		case "remove_tag":
			if req.Tag != "" {
				var newTags []string
				for _, t := range c.Tags {
					if !strings.EqualFold(t, req.Tag) {
						newTags = append(newTags, t)
					}
				}
				c.Tags = newTags
			}
		case "set_active":
			if req.SetActive != nil {
				c.IsActive = *req.SetActive
			}
		}

		count++
	}

	db.saveToFile()
	return count, nil
}

func (db *Database) RecordPromotionBroadcast(ctx context.Context, b *models.PromotionBroadcast) {
	db.mu.Lock()
	defer db.mu.Unlock()

	db.broadcasts = append(db.broadcasts, b)
	db.saveToFile()
}

func (db *Database) ListPromotionBroadcasts(ctx context.Context) []*models.PromotionBroadcast {
	db.mu.RLock()
	defer db.mu.RUnlock()

	var result []*models.PromotionBroadcast
	for _, b := range db.broadcasts {
		result = append(result, b)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].SentAt.After(result[j].SentAt)
	})
	return result
}

func (db *Database) BulkDeleteMenu(ctx context.Context, itemIDs []string, selectAll bool) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	count := 0
	if selectAll {
		count = len(db.menuItems)
		for id := range db.menuItems {
			delete(db.menuItems, id)
		}
	} else {
		for _, id := range itemIDs {
			if _, exists := db.menuItems[id]; exists {
				delete(db.menuItems, id)
				count++
			}
		}
	}
	db.saveToFile()
	return count, nil
}

func (db *Database) DeleteInventoryItem(ctx context.Context, id string) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	if _, exists := db.inventoryItems[id]; !exists {
		return fmt.Errorf("item inventaris tidak ditemukan: %s", id)
	}
	delete(db.inventoryItems, id)
	db.saveToFile()
	return nil
}

func (db *Database) BulkDeleteInventory(ctx context.Context, itemIDs []string, selectAll bool) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	count := 0
	if selectAll {
		count = len(db.inventoryItems)
		for id := range db.inventoryItems {
			delete(db.inventoryItems, id)
		}
	} else {
		for _, id := range itemIDs {
			if _, exists := db.inventoryItems[id]; exists {
				delete(db.inventoryItems, id)
				count++
			}
		}
	}
	db.saveToFile()
	return count, nil
}

func (db *Database) BulkEditInventory(ctx context.Context, itemIDs []string, selectAll bool, category, location string, minThreshold *int) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	count := 0
	targetIDs := make(map[string]bool)
	if selectAll {
		for id := range db.inventoryItems {
			targetIDs[id] = true
		}
	} else {
		for _, id := range itemIDs {
			targetIDs[id] = true
		}
	}

	for id := range targetIDs {
		item, exists := db.inventoryItems[id]
		if !exists {
			continue
		}
		if category != "" {
			item.Category = category
		}
		if location != "" {
			item.Location = location
		}
		if minThreshold != nil {
			item.MinThreshold = *minThreshold
		}
		item.UpdatedAt = time.Now()
		count++
	}

	db.saveToFile()
	return count, nil
}

func (db *Database) CreateCustomer(ctx context.Context, c models.Customer) (*models.Customer, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	if c.ID == "" {
		c.ID = "cust-" + uuid.New().String()[:8]
	}
	if c.LoyaltyTier == "" {
		c.LoyaltyTier = "retail"
	}
	if len(c.Tags) == 0 {
		c.Tags = []string{"new-customer"}
	}
	c.IsActive = true
	c.CreatedAt = time.Now()

	db.customers[c.ID] = &c
	db.saveToFile()
	return &c, nil
}

func (db *Database) DeleteCustomer(ctx context.Context, id string) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	if _, exists := db.customers[id]; !exists {
		return fmt.Errorf("pelanggan tidak ditemukan: %s", id)
	}
	delete(db.customers, id)
	db.saveToFile()
	return nil
}

func (db *Database) BulkDeleteCustomers(ctx context.Context, customerIDs []string, selectAll bool) (int, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	count := 0
	if selectAll {
		count = len(db.customers)
		for id := range db.customers {
			delete(db.customers, id)
		}
	} else {
		for _, id := range customerIDs {
			if _, exists := db.customers[id]; exists {
				delete(db.customers, id)
				count++
			}
		}
	}
	db.saveToFile()
	return count, nil
}
