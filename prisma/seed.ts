import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create super admin
  const superAdminPassword = await bcrypt.hash("superadmin123", 12);
  await prisma.superAdmin.upsert({
    where: { email: "super@nestpos.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@nestpos.com",
      password: superAdminPassword,
    },
  });

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "organic-agriculture" },
    update: {},
    create: {
      name: "Organic Agriculture Limited",
      slug: "organic-agriculture",
      email: "info@organic-agriculture.com",
      phone: "+880-1700-000000",
      address: "Dhaka, Bangladesh",
      currency: "BDT",
      currencySymbol: "৳",
      timezone: "Asia/Dhaka",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "MAIN" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Main Warehouse",
      code: "MAIN",
      address: "Dhaka, Bangladesh",
      isDefault: true,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@nestpos.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: "Admin",
      lastName: "User",
      email: "admin@nestpos.com",
      password: hashedPassword,
      role: "OWNER",
      warehouseId: warehouse.id,
    },
  });

  // Create walk-in customer
  await prisma.customer.upsert({
    where: { id: "walk-in-" + tenant.id },
    update: {},
    create: {
      id: "walk-in-" + tenant.id,
      tenantId: tenant.id,
      name: "Walk-in Customer",
      isWalkIn: true,
    },
  });

  // Create system settings
  await prisma.systemSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });

  // Create POS settings
  await prisma.pOSSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });

  // Create default currency
  await prisma.currency.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "BDT" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Bangladeshi Taka",
      code: "BDT",
      symbol: "৳",
      isDefault: true,
    },
  });

  // Create sample categories
  const vegetables = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "vegetables" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Vegetables",
      slug: "vegetables",
    },
  });

  const oil = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "oil" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Oil",
      slug: "oil",
    },
  });

  // Create sample brand
  const brand = await prisma.brand.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "australia-lintel-g-1" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "AUSTRALIA LINTEL G-1",
      slug: "australia-lintel-g-1",
    },
  });

  // Create units
  const pcs = await prisma.unit.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "PCS" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "PCS",
      shortName: "pc",
    },
  });

  const kg = await prisma.unit.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "KG" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "KG",
      shortName: "kg",
    },
  });

  // Create sample products
  const products = [
    { name: "Pui Shak (Pui Spinach)", code: "16132483", cost: 12, price: 40, cat: vegetables.id, unit: pcs.id },
    { name: "Flat Bean (Sheem)", code: "49145403", cost: 40, price: 60, cat: vegetables.id, unit: kg.id },
    { name: "Lettuce Leaves", code: "13798397", cost: 140, price: 250, cat: vegetables.id, unit: kg.id },
    { name: "Chichinga (Snake Gourd)", code: "19486898", cost: 45, price: 80, cat: vegetables.id, unit: kg.id },
    { name: "Misti Alu (Sweet Potato)", code: "12768944", cost: 35, price: 80, cat: vegetables.id, unit: kg.id },
    { name: "Jali Kumra (Water Pumpkin)", code: "12513409", cost: 25, price: 75, cat: vegetables.id, unit: pcs.id },
    { name: "Prima 1", code: "123456789", cost: 800, price: 830, cat: oil.id, unit: pcs.id },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: p.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: p.name,
        code: p.code,
        categoryId: p.cat,
        brandId: brand.id,
        unitId: p.unit,
        costPrice: p.cost,
        sellingPrice: p.price,
        alertQuantity: 5,
      },
    });

    await prisma.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: Math.floor(Math.random() * 50) + 10,
      },
    });
  }

  console.log("Seed completed!");
  console.log("Admin login:      admin@nestpos.com / admin123");
  console.log("SuperAdmin login: super@nestpos.com / superadmin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
