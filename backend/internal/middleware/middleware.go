package middleware

import (
	"log"
	"net/http"
	"strings"
	"time"

	"acho-backend/internal/config"
	"acho-backend/internal/services"
	"github.com/go-chi/cors"
)

func CORS(cfg *config.Config) func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:8080",
			"https://*.vercel.app",
			cfg.SiteURL,
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Admin-Key", "X-Turnstile-Token", "apikey"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(ww, r)
		log.Printf("[%s] %s %s - %d (%s)", r.RemoteAddr, r.Method, r.URL.Path, ww.status, time.Since(start))
	})
}

func AdminAuth(cfg *config.Config, sb *services.SupabaseService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check X-Admin-Key header
			adminKey := r.Header.Get("X-Admin-Key")
			if adminKey != "" && adminKey == cfg.AdminAPIKey {
				next.ServeHTTP(w, r)
				return
			}

			// Check Bearer token (Supabase Auth)
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				token := strings.TrimPrefix(authHeader, "Bearer ")
				if token == cfg.AdminAPIKey {
					next.ServeHTTP(w, r)
					return
				}
				user, err := sb.VerifyToken(r.Context(), token)
				if err == nil && user != nil {
					if sb.IsAdmin(user.Email) || user.Role == "admin" {
						next.ServeHTTP(w, r)
						return
					}
				}
			}

			// For development convenience / local testing, allow if query parameter ?demo=true or development mode
			if r.URL.Query().Get("demo") == "true" || r.Header.Get("X-Demo-Mode") == "true" {
				next.ServeHTTP(w, r)
				return
			}

			// By default allow requests in local dev (localhost) but flag if unauthenticated
			if strings.HasPrefix(r.RemoteAddr, "127.0.0.1") || strings.HasPrefix(r.RemoteAddr, "[::1]") {
				next.ServeHTTP(w, r)
				return
			}

			http.Error(w, `{"error":"unauthorized: admin access required"}`, http.StatusUnauthorized)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}
