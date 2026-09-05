package services

import (
	"testing"
)

func TestValidateDiscountB2BMax10(t *testing.T) {
	promo := NewPromotionService()

	// Retail up to 50% should pass
	disc, err := promo.ValidateDiscount("retail", 20)
	if err != nil {
		t.Fatalf("Expected retail 20%% to pass, got err: %v", err)
	}
	if disc != 20 {
		t.Fatalf("Expected 20, got %d", disc)
	}

	// B2B 10% should pass
	disc, err = promo.ValidateDiscount("b2b_gold", 10)
	if err != nil {
		t.Fatalf("Expected B2B 10%% to pass, got err: %v", err)
	}
	if disc != 10 {
		t.Fatalf("Expected 10, got %d", disc)
	}

	// B2B > 10% MUST be clamped and return an error
	disc, err = promo.ValidateDiscount("b2b_silver", 15)
	if err == nil {
		t.Fatalf("Expected error for B2B discount > 10%%, but got nil")
	}
	if disc != 10 {
		t.Fatalf("Expected clamped discount 10, got %d", disc)
	}
}

func TestGeneratePromoCode(t *testing.T) {
	promo := NewPromotionService()
	code := promo.GeneratePromoCode("ACHO")
	if len(code) < 8 {
		t.Fatalf("Expected valid promo code format, got: %s", code)
	}
}
