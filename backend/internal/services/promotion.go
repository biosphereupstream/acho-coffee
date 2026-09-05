package services

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"

	"acho-backend/internal/models"
)

type PromotionService struct {
	MaxB2BDiscountPercent int
}

func NewPromotionService() *PromotionService {
	return &PromotionService{
		MaxB2BDiscountPercent: 10, // Enforced requirement: skema diskon B2B maximal di 10%
	}
}

// ValidateDiscount validates discount against business rules (B2B max 10%)
func (s *PromotionService) ValidateDiscount(tier string, discountPercent int) (int, error) {
	if discountPercent <= 0 {
		return 0, fmt.Errorf("persentase diskon harus lebih dari 0%%")
	}

	isB2B := strings.HasPrefix(strings.ToLower(tier), "b2b") || tier == "all_b2b"
	if isB2B && discountPercent > s.MaxB2BDiscountPercent {
		return s.MaxB2BDiscountPercent, fmt.Errorf("diskon B2B dibatasi maksimal %d%% sesuai skema resmi ACHO Coffee", s.MaxB2BDiscountPercent)
	}

	if discountPercent > 50 {
		return 50, fmt.Errorf("diskon maksimal adalah 50%%")
	}

	return discountPercent, nil
}

// GeneratePromoCode generates unique promotional code
func (s *PromotionService) GeneratePromoCode(prefix string) string {
	if prefix == "" {
		prefix = "ACHO"
	}
	prefix = strings.ToUpper(strings.TrimSpace(prefix))

	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	result := make([]byte, 5)
	for i := 0; i < 5; i++ {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		result[i] = chars[num.Int64()]
	}

	return fmt.Sprintf("%s-%s", prefix, string(result))
}

// FormatWhatsAppMessage formats ready-to-send WhatsApp message for customer
func (s *PromotionService) FormatWhatsAppMessage(customerName, promoCode string, discountPercent int, title, customMsg, validUntil, siteURL string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Halo Kak *%s*! ☕\n\n", customerName))
	sb.WriteString(fmt.Sprintf("Kabar gembira dari *ACHO Coffee Roastery*!\n"))
	sb.WriteString(fmt.Sprintf("✨ *%s*\n\n", title))

	if customMsg != "" {
		sb.WriteString(fmt.Sprintf("%s\n\n", customMsg))
	} else {
		sb.WriteString("Nikmati penawaran spesial untuk pesanan biji kopi artisan dan minuman segar pilihan kami:\n\n")
	}

	sb.WriteString(fmt.Sprintf("🎁 *Diskon:* %d%%\n", discountPercent))
	sb.WriteString(fmt.Sprintf("🎟️ *Kode Voucher:* `%s`\n", promoCode))
	if validUntil != "" {
		sb.WriteString(fmt.Sprintf("⏳ *Berlaku hingga:* %s\n", validUntil))
	}

	sb.WriteString(fmt.Sprintf("\nPesan sekarang langsung di website resmi:\n%s/kopi?voucher=%s\n\n", siteURL, promoCode))
	sb.WriteString("Terima kasih telah menjadi bagian dari keluarga penikmat ACHO Coffee!")

	return sb.String()
}

// FormatEmailBody formats transactional promo email HTML / text
func (s *PromotionService) FormatEmailBody(customerName, promoCode string, discountPercent int, title, customMsg, validUntil, siteURL string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Halo %s,\n\n", customerName))
	sb.WriteString(fmt.Sprintf("%s\n\n", title))
	if customMsg != "" {
		sb.WriteString(fmt.Sprintf("%s\n\n", customMsg))
	}
	sb.WriteString(fmt.Sprintf("Gunakan kode voucher: %s untuk mendapatkan potongan harga %d%%.\n", promoCode, discountPercent))
	if validUntil != "" {
		sb.WriteString(fmt.Sprintf("Penawaran ini berlaku hingga %s.\n", validUntil))
	}
	sb.WriteString(fmt.Sprintf("\nKunjungi %s/kopi untuk mulai memesan.\n\nSalam hangat,\nTim ACHO Coffee", siteURL))
	return sb.String()
}

// CreateBroadcastRecord creates broadcast summary
func (s *PromotionService) CreateBroadcastRecord(req models.SendPromotionRequest, recipientCount int, createdBy string) *models.PromotionBroadcast {
	return &models.PromotionBroadcast{
		ID:              fmt.Sprintf("pbc-%d", time.Now().UnixNano()),
		PromoCode:       req.PromoCode,
		Title:           req.PromoTitle,
		DiscountPercent: req.DiscountPercent,
		RecipientsCount: recipientCount,
		Channel:         req.Channel,
		MessagePreview:  req.MessageTemplate,
		Status:          "sent",
		SentAt:          time.Now(),
		CreatedBy:       createdBy,
	}
}
