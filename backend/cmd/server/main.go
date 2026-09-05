package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"acho-backend/internal/config"
	"acho-backend/internal/database"
	"acho-backend/internal/handlers"
	"acho-backend/internal/middleware"
	"acho-backend/internal/services"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	log.Println("==================================================")
	log.Println("           ACHO COFFEE GO BACKEND SERVICE         ")
	log.Println("==================================================")

	// 1. Config
	cfg := config.Load()

	// 2. Database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Fatal: failed to initialize database: %v", err)
	}
	defer db.Close()

	// 3. Services
	cfService := services.NewCloudflareService(cfg)
	sbService := services.NewSupabaseService(cfg)
	promoService := services.NewPromotionService()

	// 4. Handlers
	configHandler := handlers.NewConfigHandler(db, cfService, sbService)
	dashHandler := handlers.NewDashboardHandler(db)
	invHandler := handlers.NewInventoryHandler(db)
	custHandler := handlers.NewCustomerHandler(db, promoService, cfg)
	menuHandler := handlers.NewMenuHandler(db, cfService)

	// 5. Router
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.CORS(cfg))

	// Health Check
	r.Get("/api/health", configHandler.Health)

	// Public / Hybrid endpoints
	r.Get("/api/config/frontend", configHandler.GetFrontendConfig)
	r.Get("/api/menu", menuHandler.List)
	r.Get("/api/menu/{id}", menuHandler.Get)

	// Admin Protected endpoints
	r.Group(func(admin chi.Router) {
		admin.Use(middleware.AdminAuth(cfg, sbService))

		// Database & Config
		admin.Get("/api/config/database", configHandler.GetDatabaseConfig)
		admin.Put("/api/config/frontend", configHandler.UpdateFrontendConfig)

		// Dashboard Detail
		admin.Get("/api/dashboard/stats", dashHandler.GetStats)
		admin.Get("/api/dashboard/analytics", dashHandler.GetAnalytics)

		// Inventory Management
		admin.Get("/api/inventory", invHandler.List)
		admin.Get("/api/inventory/alerts", invHandler.GetAlerts)
		admin.Post("/api/inventory", invHandler.Create)
		admin.Get("/api/inventory/{id}", invHandler.Get)
		admin.Put("/api/inventory/{id}", invHandler.Update)
		admin.Post("/api/inventory/{id}/adjust", invHandler.AdjustStock)
		admin.Get("/api/inventory/{id}/logs", invHandler.GetLogs)

		// Customer List & Bulk Actions
		admin.Get("/api/customers", custHandler.List)
		admin.Get("/api/customers/promotions", custHandler.ListPromotions)
		admin.Post("/api/customers/bulk-edit", custHandler.BulkEdit)
		admin.Post("/api/customers/send-promotion", custHandler.SendPromotion)
		admin.Get("/api/customers/{id}", custHandler.Get)
		admin.Put("/api/customers/{id}", custHandler.Update)

		// Menu Management & Bulk Actions
		admin.Post("/api/menu", menuHandler.Create)
		admin.Put("/api/menu/{id}", menuHandler.Update)
		admin.Delete("/api/menu/{id}", menuHandler.Delete)
		admin.Post("/api/menu/bulk-edit", menuHandler.BulkEdit)
		admin.Post("/api/menu/upload", menuHandler.UploadImage)
	})

	// Server start
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[Server] ACHO Coffee Backend listening on http://localhost%s", serverAddr)
		log.Printf("[Server] Admin endpoints ready with Supabase & Cloudflare integrations")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Listen error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[Server] Shutting down gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("[Server] ACHO Coffee Backend exited successfully.")
}
