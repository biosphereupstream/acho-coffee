import { NextResponse } from "next/server";
import { updateOrderDetails, deleteOrder, bulkDeleteOrders } from "@/lib/store/orders";
import { checkAdminAuth } from "@/lib/admin-auth";
import type { OrderStatus } from "@/lib/types";

export async function PUT(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.orderNumber) {
      return NextResponse.json({ error: "orderNumber diperlukan" }, { status: 400 });
    }

    const updated = await updateOrderDetails(body.orderNumber, {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
      note: body.note,
      status: body.status as OrderStatus,
    });

    if (!updated) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal memperbarui pesanan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Bulk Delete
    if (Array.isArray(body.orderNumbers) && body.orderNumbers.length > 0) {
      const res = await bulkDeleteOrders(body.orderNumbers);
      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus ${res.deletedCount} pesanan`,
        deletedCount: res.deletedCount,
      });
    }

    // Single Delete
    if (body.orderNumber) {
      const ok = await deleteOrder(body.orderNumber);
      if (!ok) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan atau gagal dihapus" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `Pesanan ${body.orderNumber} berhasil dihapus` });
    }

    return NextResponse.json({ error: "orderNumber atau orderNumbers diperlukan" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menghapus pesanan" }, { status: 500 });
  }
}
