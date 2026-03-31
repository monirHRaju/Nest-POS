import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  showProductImages: z.boolean().default(true),
  showProductPrices: z.boolean().default(true),
  defaultCustomerId: z.string().optional().nullable(),
  autoFocusSearch: z.boolean().default(true),
  enableKeyboardShortcuts: z.boolean().default(true),
  enableHoldOrders: z.boolean().default(true),
  autoPrint: z.boolean().default(false),
  defaultPrinterId: z.string().optional().nullable(),
  receiptHeader: z.string().max(500).optional().nullable(),
  receiptFooter: z.string().max(500).optional().nullable(),
  showReceiptLogo: z.boolean().default(true),
  productsPerPage: z.number().int().min(8).max(100).default(24),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  // Note: Prisma camelCase for POSSettings is pOSSettings
  const settings = await user.db.pOSSettings.findFirst({});

  if (!settings) {
    return ok({
      showProductImages: true,
      showProductPrices: true,
      defaultCustomerId: null,
      autoFocusSearch: true,
      enableKeyboardShortcuts: true,
      enableHoldOrders: true,
      autoPrint: false,
      defaultPrinterId: null,
      receiptHeader: null,
      receiptFooter: null,
      showReceiptLogo: true,
      productsPerPage: 24,
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

    const settings = await user.db.pOSSettings.upsert({
      where: { tenantId: user.tenantId },
      update: data,
      create: { tenantId: user.tenantId, ...data },
    });

    return ok(settings);
  } catch (err) {
    if (err instanceof z.ZodError) return error("Validation error", 400);
    console.error("POS settings update error:", err);
    return error("Internal server error", 500);
  }
}
