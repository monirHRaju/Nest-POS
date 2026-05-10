import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need direct (non-pooled) connection.
    // Set DIRECT_URL on Render/Neon for migrations; falls back to DATABASE_URL locally.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
