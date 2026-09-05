package database

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"acho-backend/internal/config"
	"acho-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	cfg       *config.Config
	pgPool    *pgxpool.Pool
	mu        sync.RWMutex
	isPG      bool
	pgLatency int64

	// In-memory / persistent file storage
	frontendConfig models.FrontendConfig
	menuItems      map[string]*models.MenuItem
	inventoryItems map[string]*models.InventoryItem
	inventoryLogs  []*models.InventoryLog
	customers      map[string]*models.Customer
	broadcasts     []*models.PromotionBroadcast
	orders         []*models.OrderSummary
}

func New(cfg *config.Config) (*Database, error) {
	db := &Database{
		cfg:            cfg,
		menuItems:      make(map[string]*models.MenuItem),
		inventoryItems: make(map[string]*models.InventoryItem),
		inventoryLogs:  make([]*models.InventoryLog, 0),
		customers:      make(map[string]*models.Customer),
		broadcasts:     make([]*models.PromotionBroadcast, 0),
		orders:         make([]*models.OrderSummary, 0),
	}

	// Try PostgreSQL connection with 3s timeout
	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		start := time.Now()
		pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
		if err == nil {
			if pingErr := pool.Ping(ctx); pingErr == nil {
				db.pgPool = pool
				db.isPG = true
				db.pgLatency = time.Since(start).Milliseconds()
				log.Printf("[Database] Connected to Supabase PostgreSQL (latency %dms)", db.pgLatency)
			} else {
				log.Printf("[Database] Supabase Postgres ping failed (%v), using resilient storage fallback", pingErr)
				pool.Close()
			}
		} else {
			log.Printf("[Database] Supabase Postgres pool error (%v), using resilient storage fallback", err)
		}
	}

	// Initialize default data & seed
	db.initDefaults()
	db.loadFromFile()
	if len(db.menuItems) == 0 {
		db.seedData()
		db.saveToFile()
	}

	return db, nil
}

func (db *Database) initDefaults() {
	db.frontendConfig = models.FrontendConfig{
		BannerEnabled:         true,
		BannerText:            "Gratis Ongkir se-Kota Bandung untuk pesanan minimal Rp 150.000",
		BannerLink:            "/kopi",
		AnnouncementText:      "Roasting batch segar setiap Selasa & Jumat. Biji kopi sangrai artisan & cold brew siap kirim.",
		ShopOpen:              true,
		ShopNotice:            "Buka setiap hari 08.00 - 20.00 WIB",
		B2BMaxDiscountPercent: 10, // Maksimal 10%
		OperatingHours:        "08:00 - 20:00 WIB",
		ContactWhatsApp:       "6281234567890",
		ContactEmail:          "hello@acho.coffee",
		FreeShippingThreshold: 150000,
		PickupSlots:           []string{"10:00 - 12:00", "13:00 - 15:00", "16:00 - 18:00"},
		UpdatedAt:             time.Now(),
	}
}

func (db *Database) storeFilePath() string {
	dir := db.cfg.DataDir
	_ = os.MkdirAll(dir, 0755)
	return filepath.Join(dir, "acho_backend_state.json")
}

func (db *Database) loadFromFile() {
	path := db.storeFilePath()
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}

	var state struct {
		FrontendConfig models.FrontendConfig            `json:"frontend_config"`
		MenuItems      map[string]*models.MenuItem      `json:"menu_items"`
		InventoryItems map[string]*models.InventoryItem `json:"inventory_items"`
		InventoryLogs  []*models.InventoryLog           `json:"inventory_logs"`
		Customers      map[string]*models.Customer      `json:"customers"`
		Broadcasts     []*models.PromotionBroadcast     `json:"broadcasts"`
		Orders         []*models.OrderSummary           `json:"orders"`
	}

	if err := json.Unmarshal(data, &state); err == nil {
		if state.FrontendConfig.BannerText != "" {
			db.frontendConfig = state.FrontendConfig
		}
		if len(state.MenuItems) > 0 {
			db.menuItems = state.MenuItems
		}
		if len(state.InventoryItems) > 0 {
			db.inventoryItems = state.InventoryItems
		}
		if len(state.InventoryLogs) > 0 {
			db.inventoryLogs = state.InventoryLogs
		}
		if len(state.Customers) > 0 {
			db.customers = state.Customers
		}
		if len(state.Broadcasts) > 0 {
			db.broadcasts = state.Broadcasts
		}
		if len(state.Orders) > 0 {
			db.orders = state.Orders
		}
		log.Printf("[Database] Restored %d menu items, %d inventory, %d customers from %s",
			len(db.menuItems), len(db.inventoryItems), len(db.customers), path)
	}
}

func (db *Database) saveToFile() {
	path := db.storeFilePath()
	state := struct {
		FrontendConfig models.FrontendConfig            `json:"frontend_config"`
		MenuItems      map[string]*models.MenuItem      `json:"menu_items"`
		InventoryItems map[string]*models.InventoryItem `json:"inventory_items"`
		InventoryLogs  []*models.InventoryLog           `json:"inventory_logs"`
		Customers      map[string]*models.Customer      `json:"customers"`
		Broadcasts     []*models.PromotionBroadcast     `json:"broadcasts"`
		Orders         []*models.OrderSummary           `json:"orders"`
	}{
		FrontendConfig: db.frontendConfig,
		MenuItems:      db.menuItems,
		InventoryItems: db.inventoryItems,
		InventoryLogs:  db.inventoryLogs,
		Customers:      db.customers,
		Broadcasts:     db.broadcasts,
		Orders:         db.orders,
	}

	if data, err := json.MarshalIndent(state, "", "  "); err == nil {
		_ = os.WriteFile(path, data, 0644)
	}
}

func (db *Database) Close() {
	if db.pgPool != nil {
		db.pgPool.Close()
	}
}
