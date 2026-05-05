import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo } from "@/lib/services/purchaseService";
import { applyReturnStock } from "@/lib/services/stockService";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  subtotal: z.number().min(0),
});

const createSchema = z.object({
  date: z.string().optional(),
  saleId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().min(0),
  grandTotal: z.number().min(0),
  status: z.enum(["PENDING", "COMPLETED", "CANCELED"]).default("COMPLETED"),
  reason: z.string().optional().nullable(),
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
      { sale: { referenceNo: { contains: search, mode: "insensitive" } } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    user.db.return.findMany({
      where,
      include: {
        sale: { select: { id: true, referenceNo: true, warehouseId: true } },
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.return.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const sale = await user.db.sale.findUnique({
      where: { id: parsed.saleId },
      include: { items: true },
    });
    if (!sale) return error("Sale not found", 404);

    // Validate qty doesn't exceed sold qty per product (consider previous returns)
    const previousReturns = await user.db.return.findMany({
      where: { saleId: parsed.saleId, status: { not: "CANCELED" } },
      include: { items: true },
    });
    for (const item of parsed.items) {
      const sold = sale.items
        .filter((si) => si.productId === item.productId)
        .reduce((sum, si) => sum + Number(si.quantity), 0);
      const alreadyReturned = previousReturns
        .flatMap((r) => r.items.filter((ri) => ri.productId === item.productId))
        .reduce((sum, ri) => sum + Number(ri.quantity), 0);
      const remaining = sold - alreadyReturned;
      if (item.quantity > remaining) {
        return error(`"${item.productName}": cannot return ${item.quantity}, only ${remaining} remaining`, 400);
      }
    }

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "return");

    const created = await user.db.return.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        saleId: parsed.saleId,
        customerId: parsed.customerId || null,
        subtotal: parsed.subtotal,
        grandTotal: parsed.grandTotal,
        status: parsed.status,
        reason: parsed.reason,
        note: parsed.note,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        },
      } as any,
      include: { items: true, sale: true },
    });

    if (parsed.status === "COMPLETED") {
      await applyReturnStock(user.tenantId, created.id, sale.warehouseId, 1);
    }

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error: " + JSON.stringify(e.issues), 400);
    console.error("Return create error:", e);
    return error("Internal server error", 500);
  }
}
