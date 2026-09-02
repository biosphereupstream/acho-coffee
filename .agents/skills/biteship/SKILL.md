---
name: biteship
description: >-
  Expert guidance for Biteship Logistics and Courier API integration in Indonesia.
  Covers area lookup (/v1/maps/areas), real-time multi-courier rates (/v1/rates/couriers),
  shipment creation (/v1/orders), courier pickup requests, real-time tracking (/v1/trackings/{id}),
  webhooks, and handling sandbox/insufficient balance edge cases.
---

# Biteship Logistics & Shipping Guide

Biteship is a unified multi-carrier logistics gateway in Indonesia that connects ecommerce platforms to JNE, J&T, SiCepat, AnterAja, GoSend, GrabExpress, Deliveree, and POS Indonesia via a single REST API.

## Base URL & Authentication
- **Base URL**: `https://api.biteship.com/v1`
- **Authentication**: Sent in header as `Authorization: <BITESHIP_API_KEY>` (no `Bearer` prefix required).

```ts
const res = await fetch("https://api.biteship.com/v1/maps/areas?countries=ID&input=Bandung&type=single", {
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.BITESHIP_API_KEY!,
  },
});
```

---

## Key Workflows & API Endpoints

### 1. Area Autocomplete & ID Lookup
- **Endpoint**: `GET /v1/maps/areas?countries=ID&input={query}&type=single`
- **Purpose**: Search cities, districts, or subdistricts and retrieve standardized Biteship `area_id` (e.g. `IDNP9IDNC22IDND2071IDZ40111`).
- **Response Format**:
  ```json
  {
    "success": true,
    "areas": [
      {
        "id": "IDNP9IDNC22IDND2071IDZ40111",
        "name": "Sumur Bandung, Bandung, Jawa Barat. 40111",
        "country_code": "ID",
        "administrative_division_level_1_name": "Jawa Barat",
        "administrative_division_level_2_name": "Bandung",
        "administrative_division_level_3_name": "Sumur Bandung",
        "postal_code": 40111
      }
    ]
  }
  ```

### 2. Real-Time Multi-Courier Rates
- **Endpoint**: `POST /v1/rates/couriers`
- **Payload**:
  ```json
  {
    "origin_area_id": "IDNP9IDNC22IDND2071IDZ40111",
    "destination_area_id": "IDNP6IDNC150IDND8239IDZ12190",
    "couriers": "jne,jnt,sicepat,anteraja",
    "items": [
      {
        "name": "Aceh Gayo Natural",
        "description": "Biji Kopi Sangrai",
        "value": 95000,
        "weight": 250,
        "quantity": 1
      }
    ]
  }
  ```
- **Response**: Array of `pricing` objects containing `company`, `courier_name`, `courier_code`, `price`, `duration`, and `service_type`.
- **Sandbox Caveat**: On test accounts with zero credit balance, Biteship returns `400 Bad Request` (`"No sufficient balance to call rates API. Please top up your balance"`). Applications should implement a graceful fallback to calculated rates so checkout is never blocked during testing.

### 3. Creating Shipments & Scheduling Courier Pickup
- **Endpoint**: `POST /v1/orders`
- **Key Parameters**:
  - `origin_contact_name`, `origin_contact_phone`, `origin_address`, `origin_area_id`.
  - `destination_contact_name`, `destination_contact_phone`, `destination_address`, `destination_area_id`.
  - `courier_company` (e.g. `jne`, `sicepat`, `jnt`).
  - `courier_type` (e.g. `reg`, `EZ`).
  - `delivery_type`: `"now"` (instant pickup) or `"scheduled"`.
  - `items`: array with `name`, `value`, `weight`, `quantity`.
- **Response**:
  - `id`: Biteship order ID.
  - `courier.waybill_id`: Official courier tracking number (Airway Bill / No. Resi).
  - `courier.tracking_url`: Public tracking page.

### 4. Real-Time Tracking & Webhooks
- **Tracking Query**: `GET /v1/trackings/{waybill_id}?courier_code={company}`
- **Webhook Events**:
  - `allocated`: Courier driver assigned.
  - `picking_up`: Driver en route to roastery.
  - `picked`: Package collected by courier.
  - `dropping_off`: En route to recipient.
  - `delivered`: Successfully received by customer.
  - `rejected` / `courier_not_found`: Exception handling required.

---

## Best Practices
1. **Always Cache Area Lookups**: Users typing in checkout triggers area searches; debounce inputs (300ms) to avoid rate limits.
2. **Item Weights**: Always specify weights in grams (`250` for a 250g bag of coffee).
3. **Graceful Fallback**: Keep a local rule-based rate calculation (e.g. based on package weight) in case carrier APIs or test balances are temporarily unavailable.
