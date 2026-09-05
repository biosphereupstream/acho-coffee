package database

import (
	"fmt"
	"time"

	"acho-backend/internal/models"
)

func (db *Database) seedData() {
	now := time.Now()

	// 1. Roasted Beans (4 Artisan single origin / specialty)
	db.menuItems["biji-kopi-bio-natural"] = &models.MenuItem{
		ID:             "biji-kopi-bio-natural",
		Slug:           "biji-kopi-bio-natural",
		Name:           "Biji Kopi Bio-Natural (250g)",
		Category:       "beans",
		Type:           "single_origin",
		Packaging:      "250g Valve Bag",
		Origin:         "Jawa Barat",
		Region:         "Pangalengan, Bandung Selatan",
		Process:        "Bio-Natural Anaerobic",
		AltitudeMeters: "1450 - 1650 mdpl",
		Varietal:       "Typica, Ateng Super",
		TastingNotes:   []string{"Blackcurrant", "Brown Sugar", "Dark Cherry", "Winey Finish"},
		Description:    "Biji kopi arabika spesialti dengan proses fermentasi bio-natural anaerobik terkontrol. Menghasilkan aroma buah matang intens dan kemanisan yang bertahan lama.",
		Story:          "Dipetik langsung dari lereng Gunung Wayang Windu oleh mitra petani lokal Pangalengan.",
		PriceIDR:       95000,
		WeightGrams:    250,
		StockQuantity:  42,
		ImageURL:       "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
		IsActive:       true,
		CreatedAt:      now.AddDate(0, -1, 0),
		UpdatedAt:      now,
	}

	db.menuItems["biji-kopi-bio-honey"] = &models.MenuItem{
		ID:             "biji-kopi-bio-honey",
		Slug:           "biji-kopi-bio-honey",
		Name:           "Biji Kopi Bio-Honey (250g)",
		Category:       "beans",
		Type:           "single_origin",
		Packaging:      "250g Valve Bag",
		Origin:         "Jawa Barat",
		Region:         "Gunung Halu",
		Process:        "Bio-Honey Process",
		AltitudeMeters: "1400 - 1550 mdpl",
		Varietal:       "Sigararutang, Kartika",
		TastingNotes:   []string{"Honey Floral", "Red Apple", "Peach", "Clean Sweetness"},
		Description:    "Proses madu biologis yang mempertahankan sebagian mucilage manis selama penjemuran di raised beds. Menghadirkan rasa manis madu alami dan keasaman yang seimbang.",
		Story:          "Kemitraan langsung micro-lot Gunung Halu dengan kontrol fermentasi higienis.",
		PriceIDR:       95000,
		WeightGrams:    250,
		StockQuantity:  38,
		ImageURL:       "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
		IsActive:       true,
		CreatedAt:      now.AddDate(0, -1, 0),
		UpdatedAt:      now,
	}

	db.menuItems["biji-kopi-semi-washed"] = &models.MenuItem{
		ID:             "biji-kopi-semi-washed",
		Slug:           "biji-kopi-semi-washed",
		Name:           "Biji Kopi Semi Washed (250g)",
		Category:       "beans",
		Type:           "single_origin",
		Packaging:      "250g Valve Bag",
		Origin:         "Jawa Barat",
		Region:         "Ciwidey",
		Process:        "Wet Hulled (Semi Washed)",
		AltitudeMeters: "1500 - 1700 mdpl",
		Varietal:       "Ateng Super, Lini S",
		TastingNotes:   []string{"Citrus Lime", "Caramel", "Herbal Clean", "Milk Chocolate"},
		Description:    "Karakter klasik Jawa Barat yang bersih dengan keasaman jeruk nipis yang menyegarkan berpadu lembut dengan manisnya karamel.",
		Story:          "Ditanam di tanah vulkanik subur perkebunan Ciwidey dengan pengolahan basah presisi.",
		PriceIDR:       90000,
		WeightGrams:    250,
		StockQuantity:  45,
		ImageURL:       "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&q=80",
		IsActive:       true,
		CreatedAt:      now.AddDate(0, -1, 0),
		UpdatedAt:      now,
	}

	db.menuItems["biji-kopi-wine"] = &models.MenuItem{
		ID:             "biji-kopi-wine",
		Slug:           "biji-kopi-wine",
		Name:           "Biji Kopi Wine Fermentation (250g)",
		Category:       "beans",
		Type:           "single_origin",
		Packaging:      "250g Valve Bag",
		Origin:         "Aceh Gayo",
		Region:         "Bener Meriah",
		Process:        "Extended Wine Fermentation",
		AltitudeMeters: "1600 mdpl",
		Varietal:       "Gayo 1, Abyssinia",
		TastingNotes:   []string{"Ripe Grapes", "Fermented Wine", "Plum", "Heavy Body"},
		Description:    "Fermentasi lambat cherry kopi matang selama 30 hari menghasilkan kompleksitas aroma mirip anggur merah berkualitas tinggi dengan body tebal memikat.",
		Story:          "Lot eksklusif dari dataran tinggi Gayo yang diproduksi terbatas.",
		PriceIDR:       115000,
		WeightGrams:    250,
		StockQuantity:  15,
		ImageURL:       "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800&q=80",
		IsActive:       true,
		CreatedAt:      now.AddDate(0, -1, 0),
		UpdatedAt:      now,
	}

	// 2. Ready to Drink Beverages (Botol Kale, Pet Can, Botol 1L, Simplicity Pouch, Espresso Pouch)
	drinks := []struct {
		slug, name, cat, pack, proc string
		price, stock                int
		notes                       []string
		img                         string
	}{
		{"es-kopi-susu-gula-aren-kale", "Es Kopi Susu Gula Aren (Botol Kale 250ml)", "drinks_botol_kale", "Botol Kale 250ml", "Cold Brewed Espresso", 22000, 48, []string{"Espresso", "Susu Segar", "Gula Aren Organik"}, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80"},
		{"cold-brew-black-kale", "Signature Cold Brew Black (Botol Kale 250ml)", "drinks_botol_kale", "Botol Kale 250ml", "16h Cold Steep", 25000, 35, []string{"Single Origin", "Fruity", "Clean Finish"}, "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80"},
		{"es-kopi-susu-pandan-kale", "Es Kopi Susu Pandan Wangi (Botol Kale 250ml)", "drinks_botol_kale", "Botol Kale 250ml", "Espresso Blend", 24000, 30, []string{"Pandan Asli", "Creamy", "Aromatik"}, "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80"},
		{"matcha-latte-kale", "Kyoto Matcha Latte (Botol Kale 250ml)", "drinks_botol_kale", "Botol Kale 250ml", "Pure Uji Matcha", 28000, 25, []string{"Matcha Uji", "Fresh Milk", "Umami Sweet"}, "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&q=80"},

		{"es-kopi-susu-can", "Es Kopi Susu Gula Aren (Pet Can 250ml)", "drinks_pet_can", "Pet Can 250ml", "Sealed Nitrogen Nitro", 24000, 60, []string{"Gula Aren", "Nitro Velvety", "Susu Segar"}, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80"},
		{"cold-brew-lemonade-can", "Cold Brew Sparkling Lemonade (Pet Can 250ml)", "drinks_pet_can", "Pet Can 250ml", "Carbonated Cold Brew", 27000, 40, []string{"Fresh Lemon", "Sparkling Soda", "Cold Brew Gayo"}, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80"},
		{"nitro-cold-brew-can", "Nitro Cold Brew Black (Pet Can 250ml)", "drinks_pet_can", "Pet Can 250ml", "Nitrogen Infused", 28000, 50, []string{"Creamy Head", "Low Acid", "Velvety Cocoa"}, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80"},

		{"kopi-susu-literan", "Es Kopi Susu Keluarga (Botol 1 Liter)", "drinks_botol_1l", "Botol 1 Liter", "Party Pack Cold Brew", 85000, 20, []string{"Porsi 4-5 Gelas", "Gula Aren", "Susu Murni"}, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80"},
		{"cold-brew-literan", "Cold Brew Concentrate (Botol 1 Liter)", "drinks_botol_1l", "Botol 1 Liter", "24h Steep Concentrate", 95000, 18, []string{"Porsi 8-10 Servings", "Ekstrak Pekat", "Tahan 2 Minggu"}, "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80"},

		{"simplicity-pouch-aren", "Kopi Susu Aren Refill (Simplicity Pouch 1L)", "drinks_pouch", "Simplicity Pouch 1L", "Eco Friendly Pouch", 78000, 22, []string{"Kemasan Ekonomis", "Spout Cap", "Mudah Dituang"}, "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80"},
		{"espresso-base-pouch", "Espresso Base Concentrate (Pouch 500ml)", "drinks_espresso_pouch", "Espresso Pouch 500ml", "Triple Shot Extracted", 65000, 15, []string{"100% Arabika", "Siap Campur Susu/Air", "Kafein Kuat"}, "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80"},
	}

	for _, d := range drinks {
		db.menuItems[d.slug] = &models.MenuItem{
			ID:            d.slug,
			Slug:          d.slug,
			Name:          d.name,
			Category:      d.cat,
			Type:          "beverage",
			Packaging:     d.pack,
			Origin:        "Jawa Barat",
			Process:       d.proc,
			TastingNotes:  d.notes,
			Description:   fmt.Sprintf("Minuman siap minum berkualitas tinggi dikemas higienis dengan %s.", d.pack),
			PriceIDR:      d.price,
			WeightGrams:   250,
			StockQuantity: d.stock,
			ImageURL:      d.img,
			IsActive:      true,
			CreatedAt:     now.AddDate(0, -1, 0),
			UpdatedAt:     now,
		}
	}

	// 3. Inventory Items
	invItems := []models.InventoryItem{
		{ID: "inv-gb-frinsa", Code: "GB-FRN-01", Name: "Green Bean Java Frinsa Anaerobic", Category: "green_beans", CurrentStock: 85000, Unit: "grams", MinThreshold: 20000, CostPerUnitIDR: 120, Location: "Gudang Utama - Rak A1", BatchNumber: "LOT-2026-08A"},
		{ID: "inv-gb-gayo", Code: "GB-GYO-02", Name: "Green Bean Aceh Gayo Wine Lot", Category: "green_beans", CurrentStock: 12000, Unit: "grams", MinThreshold: 15000, CostPerUnitIDR: 150, Location: "Gudang Utama - Rak A2", BatchNumber: "LOT-2026-07W"}, // Low stock
		{ID: "inv-gb-ciwidey", Code: "GB-CWD-03", Name: "Green Bean Ciwidey Semi-Washed", Category: "green_beans", CurrentStock: 65000, Unit: "grams", MinThreshold: 25000, CostPerUnitIDR: 110, Location: "Gudang Utama - Rak A3", BatchNumber: "LOT-2026-08C"},
		{ID: "inv-pkg-kale", Code: "PKG-BOT-250", Name: "Botol Kale 250ml + Tutup Segel", Category: "packaging_bottle", CurrentStock: 450, Unit: "pcs", MinThreshold: 100, CostPerUnitIDR: 1800, Location: "Ruang Packaging - Rak P1", BatchNumber: "BTL-202608"},
		{ID: "inv-pkg-can", Code: "PKG-CAN-250", Name: "Pet Can 250ml + Easy Open End Lid", Category: "packaging_can", CurrentStock: 80, Unit: "pcs", MinThreshold: 150, CostPerUnitIDR: 2400, Location: "Ruang Packaging - Rak P2", BatchNumber: "CAN-202607"}, // Low stock
		{ID: "inv-pkg-bot1l", Code: "PKG-BOT-1000", Name: "Botol Kaca/PET 1 Liter", Category: "packaging_bottle", CurrentStock: 120, Unit: "pcs", MinThreshold: 50, CostPerUnitIDR: 4500, Location: "Ruang Packaging - Rak P3", BatchNumber: "B1L-202608"},
		{ID: "inv-pkg-bag250", Code: "PKG-BAG-250", Name: "Kraft Coffee Bag 250g One-Way Valve", Category: "packaging_pouch", CurrentStock: 340, Unit: "pcs", MinThreshold: 80, CostPerUnitIDR: 3200, Location: "Ruang Roasting - Meja B", BatchNumber: "KRF-202606"},
		{ID: "inv-pkg-bag1kg", Code: "PKG-BAG-1000", Name: "Wholesale Foil Bag 1kg (B2B)", Category: "packaging_pouch", CurrentStock: 25, Unit: "pcs", MinThreshold: 30, CostPerUnitIDR: 6500, Location: "Ruang Roasting - Meja B", BatchNumber: "BAG1K-202605"}, // Low stock
		{ID: "inv-ing-milk", Code: "ING-MILK-01", Name: "Fresh Milk Pasteurisasi Greenfield 1L", Category: "ingredient", CurrentStock: 35, Unit: "bottles", MinThreshold: 20, CostPerUnitIDR: 24000, Location: "Chiller 01", BatchNumber: "EXP-20260912"},
		{ID: "inv-ing-aren", Code: "ING-AREN-01", Name: "Sirup Gula Aren Organik Asli 5L", Category: "ingredient", CurrentStock: 12, Unit: "bottles", MinThreshold: 5, CostPerUnitIDR: 95000, Location: "Dapur Produksi - Rak D1", BatchNumber: "ARN-202608"},
	}

	for _, it := range invItems {
		it.UpdatedAt = now
		it.LastRestockedAt = now.AddDate(0, 0, -5)
		db.inventoryItems[it.ID] = &it
	}

	// 4. Customers (Retail & B2B Tiers)
	customers := []models.Customer{
		{ID: "cust-01", FullName: "Budi Santoso", Email: "budi.santoso@gmail.com", Phone: "081298765432", PreferredBrew: "V60 / Pour Over", LoyaltyTier: "retail", TotalOrders: 8, TotalSpentIDR: 760000, Tags: []string{"coffee-enthusiast", "weekly-buyer"}, Notes: "Suka roast level light-to-medium", IsActive: true, CreatedAt: now.AddDate(0, -6, 0)},
		{ID: "cust-02", FullName: "Kopi Kenangan Senja Cafe", Email: "purchasing@senjacafe.id", Phone: "081388776655", PreferredBrew: "Espresso Blend", LoyaltyTier: "b2b_gold", TotalOrders: 24, TotalSpentIDR: 18500000, Tags: []string{"cafe-partner", "b2b", "bulk-1kg"}, Notes: "Mitra Cafe Bandung Utara, diskon B2B max 10%", IsActive: true, CreatedAt: now.AddDate(0, -10, 0)},
		{ID: "cust-03", FullName: "Rina Wijaya", Email: "rina.wijaya@outlook.com", Phone: "081512345678", PreferredBrew: "Cold Brew Botol", LoyaltyTier: "retail", TotalOrders: 5, TotalSpentIDR: 390000, Tags: []string{"ready-to-drink", "promo-seeker"}, Notes: "Langganan Botol Kale", IsActive: true, CreatedAt: now.AddDate(0, -3, 0)},
		{ID: "cust-04", FullName: "Klinik Kopi Harapan", Email: "owner@klinikkopi.co.id", Phone: "081776543210", PreferredBrew: "Filter & Espresso", LoyaltyTier: "b2b_silver", TotalOrders: 14, TotalSpentIDR: 9200000, Tags: []string{"b2b", "recurring"}, Notes: "Jadwal kirim setiap Senin pagi", IsActive: true, CreatedAt: now.AddDate(0, -8, 0)},
		{ID: "cust-05", FullName: "Ahmad Fauzi", Email: "ahmad.fauzi@yahoo.com", Phone: "081911223344", PreferredBrew: "Japanese Iced", LoyaltyTier: "retail", TotalOrders: 2, TotalSpentIDR: 190000, Tags: []string{"new-customer"}, Notes: "Pembeli baru", IsActive: true, CreatedAt: now.AddDate(0, -1, 0)},
		{ID: "cust-06", FullName: "Space Coworking Space", Email: "fnb@spacework.id", Phone: "081233445566", PreferredBrew: "Cold Brew Literan", LoyaltyTier: "b2b_bronze", TotalOrders: 9, TotalSpentIDR: 4500000, Tags: []string{"office", "b2b"}, Notes: "Penyedia kopi kantor", IsActive: true, CreatedAt: now.AddDate(0, -5, 0)},
	}

	for _, c := range customers {
		lastOrder := now.AddDate(0, 0, -2)
		c.LastOrderAt = &lastOrder
		db.customers[c.ID] = &c
	}

	// 5. Sample Orders for Dashboard Analytics
	orders := []models.OrderSummary{
		{ID: "ord-101", OrderNumber: "ACHO-2026-00101", CustomerName: "Kopi Kenangan Senja Cafe", CustomerEmail: "purchasing@senjacafe.id", Status: "completed", Fulfillment: "delivery", Total: 1850000, ItemsCount: 6, CreatedAt: now.AddDate(0, 0, -1)},
		{ID: "ord-102", OrderNumber: "ACHO-2026-00102", CustomerName: "Budi Santoso", CustomerEmail: "budi.santoso@gmail.com", Status: "delivered", Fulfillment: "delivery", Total: 190000, ItemsCount: 2, CreatedAt: now.AddDate(0, 0, -2)},
		{ID: "ord-103", OrderNumber: "ACHO-2026-00103", CustomerName: "Rina Wijaya", CustomerEmail: "rina.wijaya@outlook.com", Status: "paid", Fulfillment: "pickup", Total: 96000, ItemsCount: 4, CreatedAt: now.AddDate(0, 0, -3)},
		{ID: "ord-104", OrderNumber: "ACHO-2026-00104", CustomerName: "Klinik Kopi Harapan", CustomerEmail: "owner@klinikkopi.co.id", Status: "roasting", Fulfillment: "delivery", Total: 1200000, ItemsCount: 4, CreatedAt: now.AddDate(0, 0, -4)},
		{ID: "ord-105", OrderNumber: "ACHO-2026-00105", CustomerName: "Ahmad Fauzi", CustomerEmail: "ahmad.fauzi@yahoo.com", Status: "completed", Fulfillment: "delivery", Total: 115000, ItemsCount: 1, CreatedAt: now.AddDate(0, 0, -5)},
		{ID: "ord-106", OrderNumber: "ACHO-2026-00106", CustomerName: "Space Coworking Space", CustomerEmail: "fnb@spacework.id", Status: "completed", Fulfillment: "delivery", Total: 475000, ItemsCount: 5, CreatedAt: now.AddDate(0, 0, -6)},
		{ID: "ord-107", OrderNumber: "ACHO-2026-00107", CustomerName: "Dewi Lestari", CustomerEmail: "dewi@gmail.com", Status: "completed", Fulfillment: "pickup", Total: 285000, ItemsCount: 3, CreatedAt: now.AddDate(0, 0, -7)},
	}

	for _, o := range orders {
		cp := o
		db.orders = append(db.orders, &cp)
	}
}
