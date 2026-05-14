import type { Permission } from "@/lib/permissions";

export interface MenuItem {
  label: string;
  href?: string;
  icon: string;
  permission?: Permission;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "Products",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    permission: "products.view",
    children: [
      { label: "List Products", href: "/products", icon: "", permission: "products.view" },
      { label: "Add Product", href: "/products/add", icon: "", permission: "products.create" },
      { label: "Import Products", href: "/products/import", icon: "", permission: "products.import" },
      { label: "Print Barcode/Label", href: "/products/barcode", icon: "", permission: "products.barcode" },
      { label: "Quantity Adjustments", href: "/products/adjustments", icon: "", permission: "products.adjustments" },
      { label: "Add Adjustment", href: "/products/adjustments/add", icon: "", permission: "products.adjustments" },
      { label: "Stock Counts", href: "/products/stock-count", icon: "", permission: "products.stock-count" },
      { label: "Count Stock", href: "/products/stock-count/add", icon: "", permission: "products.stock-count" },
    ],
  },
  {
    label: "Purchases",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    permission: "purchases.view",
    children: [
      { label: "List Purchases", href: "/purchases", icon: "", permission: "purchases.view" },
      { label: "Add Purchase", href: "/purchases/add", icon: "", permission: "purchases.create" },
    ],
  },
  {
    label: "Sales",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    permission: "sales.view",
    children: [
      { label: "POS Sales", href: "/pos", icon: "", permission: "sales.pos" },
      { label: "List Sales", href: "/sales", icon: "", permission: "sales.view" },
      { label: "Add Sale", href: "/sales/add", icon: "", permission: "sales.create" },
      { label: "Deliveries", href: "/sales/deliveries", icon: "", permission: "sales.deliveries" },
      { label: "List Gift Cards", href: "/sales/gift-cards", icon: "", permission: "sales.gift-cards" },
    ],
  },
  {
    label: "Returns",
    icon: "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z",
    permission: "returns.view",
    children: [
      { label: "List Returns", href: "/returns", icon: "", permission: "returns.view" },
      { label: "Add Return", href: "/returns/add", icon: "", permission: "returns.create" },
    ],
  },
  {
    label: "Transfers",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    permission: "transfers.view",
    children: [
      { label: "List Transfers", href: "/transfers", icon: "", permission: "transfers.view" },
      { label: "Add Transfer", href: "/transfers/add", icon: "", permission: "transfers.create" },
    ],
  },
  {
    label: "Quotations",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    permission: "quotations.view",
    children: [
      { label: "List Quotations", href: "/quotations", icon: "", permission: "quotations.view" },
      { label: "Add Quotation", href: "/quotations/add", icon: "", permission: "quotations.create" },
    ],
  },
  {
    label: "Expenses",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    permission: "expenses.view",
    children: [
      { label: "List Expenses", href: "/expenses", icon: "", permission: "expenses.view" },
      { label: "Add Expense", href: "/expenses/add", icon: "", permission: "expenses.create" },
    ],
  },
  {
    label: "HR",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    children: [
      { label: "List Users", href: "/hr/users", icon: "", permission: "hr.users" },
      { label: "Add User", href: "/hr/users/add", icon: "", permission: "hr.users" },
      { label: "List Billers", href: "/hr/billers", icon: "", permission: "hr.billers" },
      { label: "Add Biller", href: "/hr/billers/add", icon: "", permission: "hr.billers" },
      { label: "List Customers", href: "/hr/customers", icon: "", permission: "hr.customers" },
      { label: "Add Customer", href: "/hr/customers/add", icon: "", permission: "hr.customers" },
      { label: "List Suppliers", href: "/hr/suppliers", icon: "", permission: "hr.suppliers" },
      { label: "Add Supplier", href: "/hr/suppliers/add", icon: "", permission: "hr.suppliers" },
    ],
  },
  {
    label: "Reports",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    permission: "reports.view",
    children: [
      { label: "All Reports", href: "/reports", icon: "" },
      { label: "Sales Report", href: "/reports/sales", icon: "", permission: "reports.sales" },
      { label: "Daily Sales", href: "/reports/daily-sales", icon: "", permission: "reports.sales" },
      { label: "Monthly Sales", href: "/reports/monthly-sales", icon: "", permission: "reports.sales" },
      { label: "Purchases Report", href: "/reports/purchases", icon: "", permission: "reports.purchases" },
      { label: "Daily Purchases", href: "/reports/daily-purchases", icon: "", permission: "reports.purchases" },
      { label: "Monthly Purchases", href: "/reports/monthly-purchases", icon: "", permission: "reports.purchases" },
      { label: "Suppliers Report", href: "/reports/suppliers", icon: "" },
      { label: "Customers Report", href: "/reports/customers", icon: "" },
      { label: "Stock Report", href: "/reports/stock", icon: "", permission: "reports.stock" },
      { label: "Product Quantity Alerts", href: "/reports/quantity-alerts", icon: "", permission: "reports.stock" },
      { label: "Warehouse Stock Chart", href: "/reports/warehouse-stock", icon: "", permission: "reports.stock" },
      { label: "Adjustments Report", href: "/reports/adjustments", icon: "" },
      { label: "Best Sellers", href: "/reports/best-sellers", icon: "" },
      { label: "Payments Report", href: "/reports/payments", icon: "", permission: "reports.payments" },
      { label: "Profit and/or Loss", href: "/reports/profit-loss", icon: "", permission: "reports.profit-loss" },
      { label: "Staff Report", href: "/reports/staff", icon: "" },
      { label: "Register Report", href: "/reports/register", icon: "" },
      { label: "Categories Report", href: "/reports/categories", icon: "" },
      { label: "Brands Report", href: "/reports/brands", icon: "" },
      { label: "Tax Report", href: "/reports/tax", icon: "", permission: "reports.tax" },
      { label: "Expenses Report", href: "/reports/expenses", icon: "", permission: "reports.expenses" },
    ],
  },
  {
    label: "Settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    permission: "settings.view",
    children: [
      { label: "System Settings", href: "/settings/system", icon: "", permission: "settings.edit" },
      { label: "POS Settings", href: "/settings/pos", icon: "", permission: "settings.edit" },
      { label: "Categories", href: "/settings/categories", icon: "" },
      { label: "Brands", href: "/settings/brands", icon: "" },
      { label: "Units", href: "/settings/units", icon: "" },
      { label: "Expense Categories", href: "/settings/expense-categories", icon: "" },
      { label: "Warehouses", href: "/settings/warehouses", icon: "" },
      { label: "Group Permissions", href: "/settings/permissions", icon: "", permission: "settings.permissions" },
      { label: "Tax Rates", href: "/settings/tax-rates", icon: "" },
      { label: "Change Logo", href: "/settings/logo", icon: "", permission: "settings.edit" },
      { label: "Promos", href: "/settings/promos", icon: "" },
      { label: "List Printers", href: "/settings/printers", icon: "" },
      { label: "Add Printer", href: "/settings/printers/add", icon: "" },
      { label: "Currencies", href: "/settings/currencies", icon: "" },
      { label: "Customer Groups", href: "/settings/customer-groups", icon: "" },
      { label: "Price Groups", href: "/settings/price-groups", icon: "" },
      { label: "Variants", href: "/settings/variants", icon: "" },
      { label: "Email Templates", href: "/settings/email-templates", icon: "", permission: "settings.edit" },
      { label: "Site Logs", href: "/settings/site-logs", icon: "", permission: "settings.edit" },
      { label: "Backups", href: "/settings/backups", icon: "", permission: "settings.backups" },
      { label: "Billing & Plan", href: "/settings/billing", icon: "" },
    ],
  },
];
