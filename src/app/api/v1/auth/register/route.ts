import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  companyName: z.string().min(2).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Generate slug from company name
    const baseSlug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug exists, append number if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Check if email is already used
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create tenant + owner user + default warehouse + settings in a transaction
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          slug,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        },
      });

      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: "Main Warehouse",
          code: "MAIN",
          isDefault: true,
        },
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          role: "OWNER",
        },
      });

      // Create walk-in customer
      await tx.customer.create({
        data: {
          tenantId: tenant.id,
          name: "Walk-in Customer",
          isWalkIn: true,
        },
      });

      // Create default settings
      await tx.systemSettings.create({
        data: { tenantId: tenant.id },
      });

      await tx.pOSSettings.create({
        data: { tenantId: tenant.id },
      });

      // Create default currency
      await tx.currency.create({
        data: {
          tenantId: tenant.id,
          name: "Bangladeshi Taka",
          code: "BDT",
          symbol: "৳",
          isDefault: true,
        },
      });
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
