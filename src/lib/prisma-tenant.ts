import { prisma } from "./prisma";

// Tables that are NOT tenant-scoped
const GLOBAL_MODELS = new Set([
  "Plan",
  "SuperAdmin",
]);

// Models where tenantId filtering should be applied
type TenantScopedOperation =
  | "findFirst"
  | "findFirstOrThrow"
  | "findMany"
  | "findUnique"
  | "findUniqueOrThrow"
  | "count"
  | "aggregate"
  | "groupBy"
  | "create"
  | "createMany"
  | "update"
  | "updateMany"
  | "upsert"
  | "delete"
  | "deleteMany";

const READ_OPERATIONS = new Set<string>([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WRITE_OPERATIONS = new Set<string>([
  "create",
  "update",
  "upsert",
]);

const WRITE_MANY_OPERATIONS = new Set<string>([
  "createMany",
  "updateMany",
  "deleteMany",
]);

export function getTenantPrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || GLOBAL_MODELS.has(model)) {
          return query(args);
        }

        const op = operation as TenantScopedOperation;

        // Inject tenantId into WHERE for reads and deletes
        if (READ_OPERATIONS.has(op) || op === "delete" || WRITE_MANY_OPERATIONS.has(op)) {
          const a = args as Record<string, unknown>;
          a.where = { ...(a.where as object || {}), tenantId };
          return query(a);
        }

        // Inject tenantId into DATA for creates
        if (op === "create") {
          const a = args as Record<string, unknown>;
          a.data = { ...(a.data as object || {}), tenantId };
          return query(a);
        }

        // Inject tenantId into WHERE for updates, and DATA for upsert create
        if (op === "update") {
          const a = args as Record<string, unknown>;
          a.where = { ...(a.where as object || {}), tenantId };
          return query(a);
        }

        if (op === "upsert") {
          const a = args as Record<string, unknown>;
          a.where = { ...(a.where as object || {}), tenantId };
          a.create = { ...(a.create as object || {}), tenantId };
          return query(a);
        }

        return query(args);
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;
