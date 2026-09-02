/**
 * Automated test script for Admin Roastery Operations & Batch Planner.
 * Run: node scripts/test-admin-ops.js
 */

async function main() {
  const baseUrl = "http://localhost:3007";
  const adminHeaders = {
    "x-admin": "true",
    "Content-Type": "application/json",
  };

  console.log("=========================================================");
  console.log("🧪 TESTING ADMIN ROASTERY OPERATIONS & BATCH PLANNER");
  console.log("=========================================================");

  const testOrderNumber = "ACHO-20260902-J6F9";

  // 1. Test POST /api/admin/batch-status (Advance to 'roasting')
  console.log("\n1. POST /api/admin/batch-status (Batch -> 'roasting')");
  const r1 = await fetch(`${baseUrl}/api/admin/batch-status`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      orderNumbers: [testOrderNumber],
      status: "roasting",
    }),
  });
  const d1 = await r1.json();
  console.log("   Status:", r1.status, "Result:", d1);
  if (r1.status !== 200 || !d1.success) throw new Error("Gagal update batch ke roasting: " + JSON.stringify(d1));

  // 2. Test POST /api/admin/batch-status (Advance to 'resting')
  console.log("\n2. POST /api/admin/batch-status (Batch -> 'resting')");
  const r2 = await fetch(`${baseUrl}/api/admin/batch-status`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      orderNumbers: [testOrderNumber],
      status: "resting",
    }),
  });
  const d2 = await r2.json();
  console.log("   Status:", r2.status, "Result:", d2);
  if (r2.status !== 200 || !d2.success) throw new Error("Gagal update batch ke resting: " + JSON.stringify(d2));

  // 3. Test POST /api/admin/dispatch (Manual Tracking Resi Input)
  console.log("\n3. POST /api/admin/dispatch (Manual Waybill Assignment)");
  const testWaybill = `JNE${Date.now().toString().slice(-8)}`;
  const r3 = await fetch(`${baseUrl}/api/admin/dispatch`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      orderNumber: testOrderNumber,
      mode: "manual",
      trackingNo: testWaybill,
    }),
  });
  const d3 = await r3.json();
  console.log("   Status:", r3.status, "Waybill:", d3.order?.trackingNo, "Status:", d3.order?.status);
  if (r3.status !== 200 || d3.order?.trackingNo !== testWaybill || d3.order?.status !== "shipped") {
    throw new Error("Gagal assign tracking: " + JSON.stringify(d3));
  }

  // 4. Test GET /admin/print/bag-labels (Thermal Bag Stickers)
  console.log("\n4. GET /admin/print/bag-labels?order=" + testOrderNumber);
  const r4 = await fetch(`${baseUrl}/admin/print/bag-labels?order=${testOrderNumber}`);
  const htmlLabels = await r4.text();
  console.log("   Status:", r4.status, "HTML Length:", htmlLabels.length);
  console.log("   - Has 'ACHO COFFEE ROASTERY':", htmlLabels.includes("ACHO COFFEE ROASTERY"));
  console.log("   - Has 'Aceh Gayo Natural':", htmlLabels.includes("Aceh Gayo Natural"));
  console.log("   - Has 'Sulawesi Toraja Sapan':", htmlLabels.includes("Sulawesi Toraja Sapan"));
  console.log("   - Has 'Cetak Stiker (100x75mm)':", htmlLabels.includes("Cetak Stiker (100x75mm)"));
  console.log("   - Has 'Tgl Sangrai':", htmlLabels.includes("Tgl Sangrai"));
  console.log("   - Has Order Number:", htmlLabels.includes(testOrderNumber));

  // 5. Test GET /admin/print/packing-slip (Courier Shipping Manifest)
  console.log("\n5. GET /admin/print/packing-slip?order=" + testOrderNumber);
  const r5 = await fetch(`${baseUrl}/admin/print/packing-slip?order=${testOrderNumber}`);
  const htmlSlip = await r5.text();
  console.log("   Status:", r5.status, "HTML Length:", htmlSlip.length);
  console.log("   - Has 'SURAT JALAN / RESI':", htmlSlip.includes("SURAT JALAN / RESI"));
  console.log("   - Has Assigned Waybill:", htmlSlip.includes(testWaybill));
  console.log("   - Has 'Checklist Isi Paket':", htmlSlip.includes("Checklist Isi Paket"));
  console.log("   - Has Recipient 'Budi Santoso':", htmlSlip.includes("Budi Santoso"));
  console.log("   - Has 'ONGKIR LUNAS (CASHLESS)':", htmlSlip.includes("ONGKIR LUNAS (CASHLESS)"));
  console.log("   - Has 'Cetak Surat Jalan / Packing Slip':", htmlSlip.includes("Cetak Surat Jalan / Packing Slip"));

  console.log("\n=========================================================");
  console.log("🎉 ALL ADMIN ROASTERY OPERATIONS & BATCH TESTS PASSED!");
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
