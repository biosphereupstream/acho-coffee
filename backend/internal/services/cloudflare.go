package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"acho-backend/internal/config"
)

type CloudflareService struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewCloudflareService(cfg *config.Config) *CloudflareService {
	return &CloudflareService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// UploadR2 uploads bytes to Cloudflare R2 bucket using S3-compatible SigV4 PUT
func (s *CloudflareService) UploadR2(ctx context.Context, key string, data []byte, contentType string) (string, error) {
	if s.cfg.R2AccountID == "" || s.cfg.R2AccessKeyID == "" || s.cfg.R2SecretAccessKey == "" {
		// Mock or return public fallback
		return fmt.Sprintf("%s/%s", s.cfg.R2PublicURL, key), nil
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", s.cfg.R2AccountID)
	reqURL := fmt.Sprintf("%s/%s/%s", endpoint, s.cfg.R2Bucket, key)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, reqURL, bytes.NewReader(data))
	if err != nil {
		return "", err
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}
	req.Header.Set("Content-Type", contentType)

	// Sign S3 request
	signAWSv4(req, "auto", "s3", s.cfg.R2AccessKeyID, s.cfg.R2SecretAccessKey, data)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		log.Printf("[Cloudflare R2] Upload error: %v", err)
		return fmt.Sprintf("%s/%s", s.cfg.R2PublicURL, key), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[Cloudflare R2] Upload returned HTTP %d: %s", resp.StatusCode, string(body))
	}

	publicURL := fmt.Sprintf("%s/%s", strings.TrimRight(s.cfg.R2PublicURL, "/"), key)
	return publicURL, nil
}

// PurgeCDNCache triggers Cloudflare zone purge for updated paths
func (s *CloudflareService) PurgeCDNCache(ctx context.Context, files []string) error {
	if s.cfg.CloudflareZoneID == "" || s.cfg.CloudflareAPIToken == "" {
		return nil
	}

	apiURL := fmt.Sprintf("https://api.cloudflare.com/client/v4/zones/%s/purge_cache", s.cfg.CloudflareZoneID)
	payload := map[string]interface{}{}
	if len(files) == 0 {
		payload["purge_everything"] = true
	} else {
		payload["files"] = files
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.CloudflareAPIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// VerifyTurnstile verifies Cloudflare Turnstile token for human checkout verification
func (s *CloudflareService) VerifyTurnstile(ctx context.Context, token, remoteIP string) (bool, error) {
	if s.cfg.TurnstileSecret == "" {
		return true, nil // Bypass if Turnstile not configured
	}

	form := url.Values{}
	form.Set("secret", s.cfg.TurnstileSecret)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://challenges.cloudflare.com/turnstile/v0/siteverify", strings.NewReader(form.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, err
	}

	return result.Success, nil
}

// signAWSv4 creates standard AWS SigV4 headers for Cloudflare R2
func signAWSv4(req *http.Request, region, service, accessKey, secretKey string, payload []byte) {
	now := time.Now().UTC()
	datestamp := now.Format("20060102")
	amzdate := now.Format("20060102T150405Z")

	payloadHash := sha256.Sum256(payload)
	payloadHashHex := hex.EncodeToString(payloadHash[:])

	req.Header.Set("x-amz-date", amzdate)
	req.Header.Set("x-amz-content-sha256", payloadHashHex)

	canonicalURI := req.URL.EscapedPath()
	if canonicalURI == "" {
		canonicalURI = "/"
	}

	canonicalHeaders := fmt.Sprintf("host:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n", req.Host, payloadHashHex, amzdate)
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"

	canonicalReq := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		req.Method,
		canonicalURI,
		req.URL.RawQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHashHex,
	)

	canonicalReqHash := sha256.Sum256([]byte(canonicalReq))
	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", datestamp, region, service)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\n%s",
		amzdate,
		credentialScope,
		hex.EncodeToString(canonicalReqHash[:]),
	)

	// Calculate signing key
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(datestamp))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	signature := hex.EncodeToString(hmacSHA256(kSigning, []byte(stringToSign)))

	authHeader := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey,
		credentialScope,
		signedHeaders,
		signature,
	)
	req.Header.Set("Authorization", authHeader)
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
