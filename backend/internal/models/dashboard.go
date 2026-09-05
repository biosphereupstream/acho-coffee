package models

import "time"

type DashboardStats struct {
	TotalRevenueIDR      int64 `json:"total_revenue_idr"`
	TotalOrders          int   `json:"total_orders"`
	CompletedOrders      int   `json:"completed_orders"`
	PendingOrders        int   `json:"pending_orders"`
	ActiveCustomers      int   `json:"active_customers"`
	LowStockAlertsCount  int   `json:"low_stock_alerts_count"`
	BeansTotalSold       int   `json:"beans_total_sold"`
	BeveragesTotalSold   int   `json:"beverages_total_sold"`
}

type DailyRevenue struct {
	Date       string `json:"date"`
	RevenueIDR int64  `json:"revenue_idr"`
	OrderCount int    `json:"order_count"`
}

type CategorySalesMetric struct {
	Category        string  `json:"category"`
	DisplayName     string  `json:"display_name"`
	TotalQuantity   int     `json:"total_quantity"`
	TotalRevenueIDR int64   `json:"total_revenue_idr"`
	Percentage      float64 `json:"percentage"`
}

type TopSellingProduct struct {
	ID              string `json:"id"`
	Slug            string `json:"slug"`
	Name            string `json:"name"`
	Category        string `json:"category"`
	TotalQuantity   int    `json:"total_quantity"`
	TotalRevenueIDR int64  `json:"total_revenue_idr"`
}

type OrderSummary struct {
	ID             string    `json:"id"`
	OrderNumber    string    `json:"order_number"`
	CustomerName   string    `json:"customer_name"`
	CustomerEmail  string    `json:"customer_email"`
	Status         string    `json:"status"`
	Fulfillment    string    `json:"fulfillment"`
	Total          int       `json:"total"`
	ItemsCount     int       `json:"items_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type DashboardAnalytics struct {
	Stats             DashboardStats        `json:"stats"`
	RevenueHistory    []DailyRevenue        `json:"revenue_history"`
	CategoryBreakdown []CategorySalesMetric `json:"category_breakdown"`
	TopProducts       []TopSellingProduct   `json:"top_products"`
	RecentOrders      []OrderSummary        `json:"recent_orders"`
	LowStockItems     []InventoryItem       `json:"low_stock_items"`
}
