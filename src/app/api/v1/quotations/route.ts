import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo } from "@/lib/services/purchaseService";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  subtotal: z.number().min(0),
});

const createSchema = z.object({
  date: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  status: z.enum(["PENDING", "SENT", "ACCEPTED", "REJECTED", "CONVERTED", "EXPIRED"]).default("PENDING"),
  note: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (search) {
    where.OR = [
      { referenceNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    user.db.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.quotation.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "quotation");

    const created = await user.db.quotation.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
        customerId: parsed.customerId || null,
        warehouseId: parsed.warehouseId || null,
        subtotal: parsed.subtotal,
        discount: parsed.discount,
        discountType: parsed.discountType,
        discountAmount: parsed.discountAmount,
        grandTotal: parsed.grandTotal,
        status: parsed.status,
        note: parsed.note,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            discount: it.discount,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            subtotal: it.subtotal,
          })),
        },
      } as any,
      include: { items: true },
    });

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error: " + JSON.stringify(e.issues), 400);
    console.error("Quotation create error:", e);
    return error("Internal server error", 500);
  }
}
