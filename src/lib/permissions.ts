import { UserRole } from "@/generated/prisma/client";

export const PERMISSIONS = {
  // Products
  "products.view": "View Products",
  "products.create": "Create Products",
  "products.edit": "Edit Products",
  "products.delete": "Delete Products",
  "products.import": "Import Products",
  "products.barcode": "Print Barcodes",
  "products.adjustments": "Manage Adjustments",
  "products.stock-count": "Manage Stock Counts",

  // Purchases
  "purchases.view": "View Purchases",
  "purchases.create": "Create Purchases",
  "purchases.edit": "Edit Purchases",
  "purchases.delete": "Delete Purchases",

  // Sales
  "sales.view": "View Sales",
  "sales.create": "Create Sales",
  "sales.edit": "Edit Sales",
  "sales.delete": "Delete Sales",
  "sales.pos": "Access POS",
  "sales.deliveries": "Manage Deliveries",
  "sales.gift-cards": "Manage Gift Cards",

  // Returns
  "returns.view": "View Returns",
  "returns.create": "Create Returns",
  "returns.edit": "Edit Returns",
  "returns.delete": "Delete Returns",

  // Transfers
  "transfers.view": "View Transfers",
  "transfers.create": "Create Transfers",
  "transfers.edit": "Edit Transfers",
  "transfers.delete": "Delete Transfers",

  // Quotations
  "quotations.view": "View Quotations",
  "quotations.create": "Create Quotations",
  "quotations.edit": "Edit Quotations",
  "quotations.delete": "Delete Quotations",

  // Expenses
  "expenses.view": "View Expenses",
  "expenses.create": "Create Expenses",
  "expenses.edit": "Edit Expenses",
  "expenses.delete": "Delete Expenses",

  // HR
  "hr.users": "Manage Users",
  "hr.customers": "Manage Customers",
  "hr.suppliers": "Manage Suppliers",
  "hr.billers": "Manage Billers",

  // Reports
  "reports.view": "View Reports",
  "reports.sales": "Sales Reports",
  "reports.purchases": "Purchase Reports",
  "reports.profit-loss": "Profit & Loss Report",
  "reports.stock": "Stock Reports",
  "reports.payments": "Payment Reports",
  "reports.expenses": "Expense Reports",
  "reports.tax": "Tax Reports",

  // Settings
  "settings.view": "View Settings",
  "settings.edit": "Edit Settings",
  "settings.users": "Manage User Settings",
  "settings.permissions": "Manage Permissions",
  "settings.backups": "Manage Backups",
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Role hierarchy: higher roles inherit all permissions of lower roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
};

// Minimum role required for each permission (if not set, defaults to USER)
const ROLE_DEFAULTS: Partial<Record<Permission, UserRole>> = {
  "settings.edit": "ADMIN",
  "settings.users": "ADMIN",
  "settings.permissions": "OWNER",
  "settings.backups": "ADMIN",
  "hr.users": "ADMIN",
  "products.delete": "MANAGER",
  "sales.delete": "MANAGER",
  "purchases.delete": "MANAGER",
};

export function hasPermission(
  userRole: UserRole,
  permission: Permission,
  groupPermissions?: Record<string, boolean>
): boolean {
  // OWNER has all permissions
  if (userRole === "OWNER") return true;

  // Check group-specific override first
  if (groupPermissions && permission in groupPermissions) {
    return groupPermissions[permission];
  }

  // Check role hierarchy
  const requiredRole = ROLE_DEFAULTS[permission] || "USER";
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function requirePermission(
  userRole: UserRole,
  permission: Permission,
  groupPermissions?: Record<string, boolean>
): void {
  if (!hasPermission(userRole, permission, groupPermissions)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
}
