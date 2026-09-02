/**
 * End-to-end API test script for Multi-Item Cart & Voucher flow.
 * Run: node scripts/test-cart-flow.js
 */

const http = require("http");

async function main() {
  const baseUrl = "http://localhost:3007";
  console.log("==================================================");
  console.log("🧪 TESTING MULTI-ITEM CART & VOUCHER CHECKOUT API");
  console.log("==================================================");

  let cookie = "";

  // Helper fetch with cookie jar
  async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers["Cookie"] = cookie;
    const res = await fetch(baseUrl + path, { ...options, headers });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/([^;]+)/);
      if (match) cookie = match[1];
    }
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, text };
    }
  }

  // 1. Initial Cart (should be empty or array)
  console.log("\n1. GET /api/cart (Initial state)");
  const r1 = await apiFetch("/api/cart");
  console.log("   Status:", r1.status, "Items count:", r1.data.items?.length, "Subtotal:", r1.data.subtotal);

  // 2. Add first item (Gayo Natural)
  console.log("\n2. POST /api/cart (Add 2 bags of Gayo Natural)");
  const r2 = await apiFetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coffeeSlug: "gayo-natural",
      coffeeName: "Aceh Gayo Natural",
      roastProfileCode: "medium",
      roastProfileName: "Medium Roast",
      grindSize: "medium",
      quantity: 2,
      unitPriceIdr: 125000,
      weightGrams: 250,
    }),
  });
  console.log("   Status:", r2.status, "Total bags:", r2.data.totalCount, "Subtotal:", r2.data.subtotal);
  if (r2.status !== 200) throw new Error("Gagal menambahkan item 1 ke keranjang");

  const itemId1 = r2.data.item.id;

  // 3. Add second item (Toraja Sapan)
  console.log("\n3. POST /api/cart (Add 1 bag of Toraja Sapan)");
  const r3 = await apiFetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coffeeSlug: "toraja-sapan",
      coffeeName: "Sulawesi Toraja Sapan",
      roastProfileCode: "light",
      roastProfileName: "Light Roast",
      grindSize: "bean",
      quantity: 1,
      unitPriceIdr: 135000,
      weightGrams: 250,
    }),
  });
  console.log("   Status:", r3.status, "Total bags:", r3.data.totalCount, "Subtotal:", r3.data.subtotal, "Total weight:", r3.data.totalWeightGrams, "g");
  if (r3.status !== 200) throw new Error("Gagal menambahkan item 2 ke keranjang");

  // 4. Update quantity of item 1
  console.log("\n4. PATCH /api/cart/" + itemId1 + " (Update quantity to 3)");
  const r4 = await apiFetch("/api/cart/" + itemId1, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: 3 }),
  });
  console.log("   Status:", r4.status, "Total bags now:", r4.data.totalCount, "New Subtotal:", r4.data.subtotal);

  // 5. Test voucher validation
  console.log("\n5. Testing Voucher Validation (POST /api/vouchers/validate)");
  const v1 = await apiFetch("/api/vouchers/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "ACHO10", subtotal: r4.data.subtotal }),
  });
  console.log("   ACHO10 -> Valid:", v1.data.valid, "Discount:", v1.data.discountAmount, "Message:", v1.data.message);

  const v2 = await apiFetch("/api/vouchers/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "NGOPI20", subtotal: r4.data.subtotal }),
  });
  console.log("   NGOPI20 -> Valid:", v2.data.valid, "Discount:", v2.data.discountAmount, "Message:", v2.data.message);

  const v3 = await apiFetch("/api/vouchers/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "KODE_PALSU", subtotal: r4.data.subtotal }),
  });
  console.log("   KODE_PALSU -> Status:", v3.status, "Error:", v3.data.error);

  // 6. Checkout order placement
  console.log("\n6. Placing Order with Multi-Item Cart (POST /api/orders)");
  const orderRes = await apiFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Budi Santoso",
      customerEmail: "budi.test@acho.coffee",
      customerPhone: "081234567890",
      fulfillment: "delivery",
      shippingAddress: {
        name: "Budi Santoso",
        phone: "081234567890",
        address: "Jl. Dago Asri No. 12, Kelurahan Dago, Coblong",
        city: "Bandung",
        postalCode: "40135",
      },
      courierCompany: "JNE Regular",
      courierCode: "jne",
      shippingFee: 18000,
      subtotal: r4.data.subtotal,
      discountAmount: v1.data.discountAmount,
      voucherCode: "ACHO10",
      total: r4.data.subtotal + 18000 - v1.data.discountAmount,
      items: r4.data.items.map((i) => ({
        coffeeSlug: i.coffeeSlug,
        coffeeName: i.coffeeName,
        roastProfileCode: i.roastProfileCode,
        roastProfileName: i.roastProfileName,
        grindSize: i.grindSize,
        quantity: i.quantity,
        unitPriceIdr: i.unitPriceIdr,
      })),
    }),
  });

  console.log("   Order Creation Status:", orderRes.status);
  console.log("   Order Number:", orderRes.data.orderNumber);
  if (!orderRes.data.orderNumber) throw new Error("Order creation failed!");

  // 7. Verify cart is automatically cleared
  console.log("\n7. Verifying Cart Auto-Clear after Order Creation (GET /api/cart)");
  const rFinal = await apiFetch("/api/cart");
  console.log("   Status:", rFinal.status, "Cart items remaining:", rFinal.data.items?.length);

  if (rFinal.data.items?.length === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Cart automatically cleared after order placement.");
  } else {
    console.warn("⚠️ Cart still had items:", rFinal.data.items);
  }
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
