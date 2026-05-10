import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const warehouse = await user.db.warehouse.findUnique({
    where: { id: (await params).id },
  });

  if (!warehouse) {
    return error("Warehouse not found", 404);
  }

  return ok(warehouse);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, code, phone, email, address, city, state, country, isDefault } =
      updateSchema.parse(body);

    // Check warehouse exists
    const existing = await user.db.warehouse.findUnique({
      where: { id: (await params).id },
    });

    if (!existing) {
      return error("Warehouse not found", 404);
    }

    // Check if code conflicts with other warehouses
    if (code !== existing.code) {
      const conflict = await user.db.warehouse.findFirst({
        where: { code },
      });
      if (conflict) {
        return error("Warehouse with this code already exists", 400);
      }
    }

    // If setting as default, unset other defaults
    let data: any = {
      name,
      code,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
    };

    if (isDefault && !existing.isDefault) {
      // Unset all other defaults
      await user.db.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      data.isDefault = true;
    } else if (isDefault !== undefined) {
      data.isDefault = isDefault;
    }

    const updated = await user.db.warehouse.update({
      where: { id: (await params).id },
      data,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Warehouse update error:", error);
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    // Check warehouse exists
    const existing = await user.db.warehouse.findUnique({
      where: { id: (await params).id },
    });

    if (!existing) {
      return error("Warehouse not found", 404);
    }

    // Prevent deletion of default warehouse
    if (existing.isDefault) {
      return error("Cannot delete the default warehouse", 400);
    }

    // Check if warehouse has stock
    const stockCount = await user.db.productWarehouseStock.count({
      where: { warehouseId: (await params).id },
    });

    if (stockCount > 0) {
      return error(
        `Cannot delete warehouse with ${stockCount} product(s) in stock`,
        400
      );
    }

    await user.db.warehouse.delete({
      where: { id: (await params).id },
    });

    return ok({ message: "Warehouse deleted successfully" });
  } catch (error) {
    console.error("Warehouse deletion error:", error);
    return error("Internal server error", 500);
  }
}
