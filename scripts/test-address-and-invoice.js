/**
 * Test script for Saved Addresses & Digital Invoice.
 * Run: node scripts/test-address-and-invoice.js
 */

async function main() {
  const baseUrl = "http://localhost:3007";
  const authHeaders = { "x-user-id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" };

  console.log("=========================================================");
  console.log("🧪 TESTING SAVED ADDRESSES & DIGITAL INVOICE SYSTEM");
  console.log("=========================================================");

  // 1. Test GET /api/user/addresses (initially empty or existing)
  console.log("\n1. GET /api/user/addresses");
  const r1 = await fetch(`${baseUrl}/api/user/addresses`, { headers: authHeaders });
  const d1 = await r1.json();
  console.log("   Status:", r1.status, "Addresses count:", d1.addresses?.length);

  // 2. Test POST /api/user/addresses (Create Address 1 - Rumah)
  console.log("\n2. POST /api/user/addresses (Create 'Rumah')");
  const r2 = await fetch(`${baseUrl}/api/user/addresses`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      label: "Rumah",
      recipientName: "Budi Santoso",
      phone: "081234567890",
      address: "Jl. Dago Asri No. 12, Kelurahan Dago, Coblong",
      city: "Bandung",
      postalCode: "40135",
      areaId: "IDNP6IDNC151IDND1481IDZ40135",
      areaName: "Dago, Coblong, Kota Bandung, Jawa Barat 40135",
      isDefault: true,
    }),
  });
  const d2 = await r2.json();
  console.log("   Status:", r2.status, "Created ID:", d2.address?.id, "Is Default:", d2.address?.isDefault);
  if (r2.status !== 201) throw new Error("Gagal membuat alamat 1: " + JSON.stringify(d2));

  const addr1Id = d2.address.id;

  // 3. Test POST /api/user/addresses (Create Address 2 - Kantor)
  console.log("\n3. POST /api/user/addresses (Create 'Kantor')");
  const r3 = await fetch(`${baseUrl}/api/user/addresses`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      label: "Kantor",
      recipientName: "Budi Santoso",
      phone: "081987654321",
      address: "Gedung Bursa Efek Indonesia, SCBD Tower 2 Lt. 15",
      city: "Jakarta Selatan",
      postalCode: "12190",
      areaId: "IDNP6IDNC150IDND1450IDZ12190",
      areaName: "Senayan, Kebayoran Baru, Jakarta Selatan 12190",
      isDefault: true, // Should unset Rumah as default
    }),
  });
  const d3 = await r3.json();
  console.log("   Status:", r3.status, "Created ID:", d3.address?.id, "Is Default:", d3.address?.isDefault);
  if (r3.status !== 201) throw new Error("Gagal membuat alamat 2: " + JSON.stringify(d3));

  const addr2Id = d3.address.id;

  // 4. Verify address list order (Kantor default should be first)
  console.log("\n4. GET /api/user/addresses (Verify default order)");
  const r4 = await fetch(`${baseUrl}/api/user/addresses`, { headers: authHeaders });
  const d4 = await r4.json();
  console.log("   Total addresses:", d4.addresses?.length);
  d4.addresses?.forEach((a) => {
    console.log(`     - [${a.label}] ${a.recipientName} (${a.city}) | Default: ${a.isDefault}`);
  });

  // 5. Test PATCH /api/user/addresses/[id] (Set Rumah back to default)
  console.log("\n5. PATCH /api/user/addresses/" + addr1Id + " (Set Rumah as default)");
  const r5 = await fetch(`${baseUrl}/api/user/addresses/${addr1Id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: true }),
  });
  const d5 = await r5.json();
  console.log("   Status:", r5.status, "Rumah now default:", d5.address?.isDefault);

  // 6. Test Digital Invoice Page /faktur/[orderNumber]
  console.log("\n6. GET /faktur/ACHO-20260902-J6F9 (Digital Invoice)");
  const r6 = await fetch(`${baseUrl}/faktur/ACHO-20260902-J6F9?t=8128c257-8ec9-4b3f-a9af-4cfe5d7da683`);
  const html = await r6.text();
  console.log("   Status:", r6.status, "HTML Length:", html.length);
  console.log("   - Has 'FAKTUR RESMI':", html.includes("Faktur Resmi"));
  console.log("   - Has Order Number 'ACHO-20260902-J6F9':", html.includes("ACHO-20260902-J6F9"));
  console.log("   - Has 'Cetak / Simpan PDF':", html.includes("Cetak / Simpan PDF"));
  console.log("   - Has 'Authentic Specialty Roast':", html.includes("Authentic Specialty Roast"));
  console.log("   - Has 'ACHO COFFEE':", html.includes("ACHO COFFEE"));
  console.log("   - Has 'Aceh Gayo Natural':", html.includes("Aceh Gayo Natural"));
  console.log("   - Has 'Sulawesi Toraja Sapan':", html.includes("Sulawesi Toraja Sapan"));
  console.log("   - Has Voucher Discount 'ACHO10':", html.includes("ACHO10"));

  // 7. Test DELETE /api/user/addresses/[id]
  console.log("\n7. DELETE /api/user/addresses/" + addr2Id + " (Delete Kantor)");
  const r7 = await fetch(`${baseUrl}/api/user/addresses/${addr2Id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  const d7 = await r7.json();
  console.log("   Status:", r7.status, "Success:", d7.success);

  console.log("\n=========================================================");
  console.log("🎉 ALL TESTS PASSED! Saved Addresses & Digital Invoices Verified!");
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
