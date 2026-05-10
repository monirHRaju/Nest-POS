import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || "admin@nestpos.com";
  const password = process.argv[3] || "admin123";

  const hash = await bcrypt.hash(password, 12);

  // Try regular user first
  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, isActive: true },
    });
    console.log(`✓ Reset password for user ${email}`);
    console.log(`  Verify: ${await bcrypt.compare(password, hash)}`);
    return;
  }

  // Try super admin
  const sa = await prisma.superAdmin.findFirst({ where: { email } });
  if (sa) {
    await prisma.superAdmin.update({
      where: { id: sa.id },
      data: { password: hash, isActive: true },
    });
    console.log(`✓ Reset password for super admin ${email}`);
    return;
  }

  console.log(`✗ No user or super admin with email ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
