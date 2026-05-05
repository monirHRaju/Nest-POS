import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo } from "@/lib/services/purchaseService";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().optional(),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  warehouseId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const warehouseId = url.searchParams.get("warehouseId") || undefined;
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { referenceNo: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const [data, total] = await Promise.all([
    user.db.expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.expense.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "expense");

    const item = await user.db.expense.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        categoryId: parsed.categoryId,
        amount: parsed.amount,
        warehouseId: parsed.warehouseId || null,
        note: parsed.note,
        attachment: parsed.attachment,
      } as any,
      include: { category: true, warehouse: true },
    });

    return ok(item, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Expense create error:", e);
    return error("Internal server error", 500);
  }
}
