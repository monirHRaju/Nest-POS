import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  invoicePrefix: z.string().max(20).default("INV-"),
  salePrefix: z.string().max(20).default("SALE-"),
  purchasePrefix: z.string().max(20).default("PUR-"),
  returnPrefix: z.string().max(20).default("RET-"),
  transferPrefix: z.string().max(20).default("TRF-"),
  quotationPrefix: z.string().max(20).default("QUO-"),
  expensePrefix: z.string().max(20).default("EXP-"),
  adjustmentPrefix: z.string().max(20).default("ADJ-"),
  stockCountPrefix: z.string().max(20).default("SC-"),
  paymentPrefix: z.string().max(20).default("PAY-"),
  defaultTaxRate: z.number().min(0).max(100).default(0),
  allowNegativeStock: z.boolean().default(false),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const settings = await user.db.systemSettings.findFirst({});

  // Return defaults if not yet configured
  if (!settings) {
    return ok({
      invoicePrefix: "INV-",
      salePrefix: "SALE-",
      purchasePrefix: "PUR-",
      returnPrefix: "RET-",
      transferPrefix: "TRF-",
      quotationPrefix: "QUO-",
      expensePrefix: "EXP-",
      adjustmentPrefix: "ADJ-",
      stockCountPrefix: "SC-",
      paymentPrefix: "PAY-",
      defaultTaxRate: 0,
      allowNegativeStock: false,
    });
  }

  return ok(settings);
}

export async function PUT(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const settings = await user.db.systemSettings.upsert({
      where: { tenantId: user.tenantId },
      update: data,
      create: { tenantId: user.tenantId, ...data },
    });

    return ok(settings);
  } catch (err) {
    if (err instanceof z.ZodError) return error("Validation error", 400);
    console.error("System settings update error:", err);
    return error("Internal server error", 500);
  }
}
