import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, contactPerson, phone, city, address } = body;

    if (!businessName || !contactPerson || !phone || !city || !address) {
      return NextResponse.json(
        { error: "Field wajib harus diisi: businessName, contactPerson, phone, city, address" },
        { status: 400 }
      );
    }

    // Catat log sampel B2B untuk tim roastery
    console.log("[WHOLESALE_SAMPLE_REQUEST]", {
      timestamp: new Date().toISOString(),
      businessName,
      contactPerson,
      phone,
      email: body.email,
      city,
      address,
      espressoMachine: body.espressoMachine,
      monthlyEstimateKg: body.monthlyEstimateKg,
      samplePreferences: body.samplePreferences,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      message: "Permohonan sampel barista berhasil diterima oleh Biosphere Roast Works.",
    });
  } catch (error) {
    console.error("[WHOLESALE_SAMPLE_ERROR]", error);
    return NextResponse.json({ error: "Gagal memproses permohonan sampel." }, { status: 500 });
  }
}
