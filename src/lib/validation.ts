import { z } from "zod";

export const orderItemSchema = z.object({
  coffeeSlug: z.string().min(2),
  coffeeName: z.string().min(2),
  roastProfileCode: z.string().min(2),
  roastProfileName: z.string().min(2),
  grindSize: z.enum(["bean", "fine", "medium", "coarse"]),
  quantity: z.number().int().min(1).max(20),
  unitPriceIdr: z.number().int().min(0),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Nama minimal 2 karakter"),
  customerEmail: z.string().email("Format email tidak valid"),
  customerPhone: z.string().min(8, "Nomor telepon tidak valid"),
  note: z.string().max(500).optional(),
  fulfillment: z.enum(["pickup", "delivery"]),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pickupSlot: z.string().optional(),
  shippingAddress: z
    .object({
      name: z.string().min(2),
      phone: z.string().min(8),
      address: z.string().min(10, "Alamat terlalu pendek"),
      city: z.string().min(2),
      postalCode: z.string().optional(),
      areaId: z.string().optional(),
    })
    .optional(),
  courierCompany: z.string().optional(),
  courierCode: z.string().optional(),
  shippingFee: z.number().int().min(0).default(0),
  subtotal: z.number().int().min(0),
  total: z.number().int().min(0),
  items: z.array(orderItemSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
