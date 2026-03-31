import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().min(1),
  referenceNo: z.string().min(1).max(100),
  warehouseId: z.string().cuid(),
  note: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const url = new URL(req.url);
  const warehouseId = url.searchParams.get("warehouseId") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const where: any = {
    ...(search ? { referenceNo: { contains: search, mode: "insensitive" } } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.stockCount.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    user.db.stockCount.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { date, referenceNo, warehouseId, note } = createSchema.parse(body);

    // Check reference uniqueness
    const existing = await user.db.stockCount.findFirst({ where: { referenceNo } });
    if (existing) return error("Reference number already exists", 400);

    // Get current warehouse stock to populate expected quantities
    const stocks = await user.db.productWarehouseStock.findMany({
      where: { warehouseId },
      select: { productId: true, quantity: true },
    });

    if (stocks.length === 0) {
      return error("No products found in this warehouse", 400);
    }

    const stockCount = await user.db.$transaction(async (tx) => {
      const sc = await tx.stockCount.create({
        data: {
          date: new Date(date),
          referenceNo,
          warehouseId,
          note: note || null,
          status: "PENDING",
          items: {
            create: stocks.map((s) => ({
              tenantId: user.tenantId,
              productId: s.productId,
              expectedQty: s.quantity,
              countedQty: null,
              difference: null,
            })),
          },
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      });

      return sc;
    });

    return ok(stockCount, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return error(err.issues[0]?.message || "Validation error", 400);
    console.error("Stock count creation error:", err);
    return error("Internal server error", 500);
  }
}
