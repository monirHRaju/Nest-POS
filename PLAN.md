# Nest-POS: Multi-Tenant SaaS POS Application — Complete Implementation Plan

## Context

Building a production-grade SaaS Point of Sale system from scratch, modeled after Stock Manager Advance (Tecdiary). The application serves businesses like Organic Agriculture Limited — managing inventory, sales, purchases, expenses, and reporting across multiple branches. Each client (tenant) can have multiple warehouses/branches. Hardware integration (receipt printers, barcode scanners) is required. The project repo is empty — starting fresh.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, PostgreSQL, Redux Toolkit + RTK Query, Tailwind CSS + DaisyUI, NextAuth.js v5

---

## Architecture

### Multi-Tenancy: Shared DB + Row-Level Isolation
- Single PostgreSQL database, every tenant-scoped table has `tenantId` column
- Prisma Client Extension auto-injects `tenantId` on all queries
- PostgreSQL Row-Level Security as safety net
- Global tables (Plan, SuperAdmin) have no tenantId

### High-Level Stack
```
Browser (Dashboard / POS / Customer Display)
    ↓
Next.js 15 App Router
  ├── Server Components (data fetching)
  ├── API Route Handlers /api/v1/* (RTK Query)
  ├── Server Actions (form mutations)
  ├── Service Layer (business logic)
  └── Prisma Client (tenant-scoped)
         ↓
PostgreSQL  +  Redis (jobs/cache)  +  S3/R2 (files)
```

### Directory Structure
```
nest-pos/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Login, Register, Forgot Password
│   │   ├── (dashboard)/               # Admin layout with sidebar
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Dashboard home
│   │   │   ├── products/
│   │   │   ├── purchases/
│   │   │   ├── sales/
│   │   │   ├── returns/
│   │   │   ├── transfers/
│   │   │   ├── quotations/
│   │   │   ├── expenses/
│   │   │   ├── hr/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── (pos)/                     # Full-screen POS (no sidebar)
│   │   │   └── pos/page.tsx
│   │   ├── (customer-display)/        # Customer-facing bill display
│   │   │   └── display/[sessionId]/page.tsx
│   │   ├── (super-admin)/             # SaaS platform admin
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── v1/                    # All versioned API routes
│   │   │   └── webhooks/stripe/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # DataTable, Modal, Buttons, etc.
│   │   ├── layout/                    # Sidebar, Topbar, Breadcrumb
│   │   ├── forms/                     # ProductForm, SaleForm, etc.
│   │   ├── pos/                       # POS-specific components
│   │   ├── dashboard/                 # Overview cards, charts
│   │   └── reports/                   # Report filters, tables, charts
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── prisma-tenant.ts           # Tenant-scoped extension
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── permissions.ts             # RBAC definitions
│   │   ├── validators/                # Zod schemas per module
│   │   ├── services/                  # Business logic per module
│   │   └── hooks/                     # useBarcodeScanner, usePrinter, etc.
│   ├── store/
│   │   ├── store.ts
│   │   ├── provider.tsx
│   │   ├── slices/                    # cartSlice, uiSlice
│   │   └── api/                       # RTK Query API slices
│   ├── middleware.ts                   # Auth, tenant resolution, subscription
│   └── types/                         # TypeScript definitions
├── public/
├── docker-compose.yml                  # Postgres + Redis
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Database Schema (Prisma)

### Multi-Tenancy & SaaS Tables

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Tenant** | Organization/client | name, slug (subdomain), customDomain, logo, currency, timezone, planId, subscriptionStatus, trialEndsAt, maxUsers/Warehouses/Products |
| **Plan** | Subscription tiers | name, monthlyPrice, yearlyPrice, stripePriceIds, limits, features (JSON) |
| **SuperAdmin** | Platform admins (no tenantId) | email, password, name |

### Users & Permissions

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Tenant users | firstName, lastName, email, password, role (OWNER/ADMIN/MANAGER/USER), groupId, warehouseId, isActive |
| **PermissionGroup** | Role-based permissions | name, permissions (JSON: `{"products.view": true, ...}`) |

### Products & Inventory

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Category** | Product categories (self-referencing parent/child) | name, slug, parentId, image |
| **Brand** | Product brands | name, slug, image |
| **Unit** | Measurement units with conversion | name, shortName, baseUnit, operator, operationValue |
| **Variant** | Variant types (Size, Color) | name, values (string[]) |
| **Product** | Central product entity | name, code (unique/tenant), type, categoryId, brandId, unitId, costPrice, sellingPrice, taxId, taxMethod, alertQuantity, images, hasVariants |
| **ProductVariant** | Per-variant SKU | productId, variantId, name, code, additionalCost/Price |
| **ProductWarehouseStock** | Stock per product per warehouse | productId, warehouseId, quantity — unique(productId, warehouseId) |
| **TaxRate** | Tax rates | name, rate, type (PERCENTAGE/FIXED) |

### Transactions

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Sale** | Sales transactions | referenceNo, date, customerId, billerId, warehouseId, grandTotal, status, paymentStatus, source (POS/WEB) |
| **SaleItem** | Line items | saleId, productId, unitPrice, quantity, discount, taxAmount, subtotal |
| **Purchase** | Purchase orders | referenceNo, supplierId, warehouseId, grandTotal, status (PENDING/ORDERED/RECEIVED) |
| **PurchaseItem** | Line items | purchaseId, productId, unitCost, quantity, receivedQty, expiryDate |
| **Return** | Sales returns | referenceNo, saleId, customerId, grandTotal, reason |
| **ReturnItem** | Returned items | returnId, productId, quantity, unitPrice |
| **Transfer** | Inter-warehouse moves | referenceNo, fromWarehouseId, toWarehouseId, status, shippingCost |
| **TransferItem** | Transferred items | transferId, productId, quantity |
| **Quotation** | Price quotes (no stock impact) | referenceNo, customerId, expiryDate, status, convertible to Sale |
| **QuotationItem** | Quote line items | quotationId, productId, unitPrice, quantity |
| **Payment** | Polymorphic payments | referenceNo, saleId/purchaseId/returnId, amount, method (CASH/CARD/CHEQUE/BANK/GIFT_CARD/MOBILE) |

### Other Entities

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Expense** | Business expenses | date, categoryId, amount, warehouseId, note, attachment |
| **ExpenseCategory** | Expense classification | name, description |
| **Adjustment** | Stock adjustments | referenceNo, warehouseId, type (ADDITION/SUBTRACTION), note |
| **AdjustmentItem** | Adjusted items | adjustmentId, productId, quantity |
| **StockCount** | Physical inventory counts | warehouseId, status (PENDING/IN_PROGRESS/COMPLETED) |
| **StockCountItem** | Count details | stockCountId, productId, expectedQty, countedQty |
| **Delivery** | Sale deliveries | saleId, status (PACKING/DELIVERING/DELIVERED), trackingNumber, address |
| **GiftCard** | Gift cards | cardNumber (unique), value, balance, expiryDate |
| **Promo** | Promotional discounts | name, code, type, value, minAmount, startDate, endDate |
| **Warehouse** | Branches/locations | name, code, address, phone, isDefault |
| **Biller** | Billing entities | name, email, company, taxNumber |
| **Customer** | Customers | name, email, phone, address, customerGroupId, rewardPoints, deposit |
| **Supplier** | Suppliers | name, email, phone, company, taxNumber |
| **CustomerGroup** | Customer tiers | name, discountPercent |
| **PriceGroup** | Named pricing tiers | name, description |
| **Printer** | POS printers | name, type (RECEIPT/BARCODE), connectionType, ipAddress, charWidth |
| **Currency** | Supported currencies | name, code, symbol, exchangeRate |
| **SystemSettings** | Tenant settings (1:1) | invoicePrefix, receiptPrefix, defaultTaxRate, dateFormat |
| **POSSettings** | POS config (1:1) | showImages, showPrices, autoFocus, autoPrint, receiptHeader/Footer |
| **EmailTemplate** | Email templates | slug, subject, body (HTML with variables) |
| **SiteLog** | Audit trail | userId, action, entity, entityId, details (JSON), ipAddress |
| **Backup** | Data exports | filename, status, url, size |

---

## Module-by-Module Feature Breakdown

### Module 1: Products

**List Products** — DataTable with columns: Image, Code, Product Name, Brand, Category, Buy Price, Sale Price, Stock, Unit, Alert Quantity, Actions. Server-side pagination/sorting/filtering. Search by name/code. Filter by category, brand, warehouse. Bulk actions: delete, export CSV, print barcodes. Products below alertQuantity show warning badge.

**Add/Edit Product** — Form sections: Basic Info (name, code, type, barcode symbology), Classification (category, brand, unit), Pricing (cost, selling, wholesale, minimum), Tax (rate, method: inclusive/exclusive), Stock (alert quantity), Images (upload to S3), Variants (toggle, add combinations with individual pricing/SKU), Description. Validates code uniqueness per tenant. Creates ProductWarehouseStock (qty=0) for all warehouses.

**Import Products** — CSV/Excel upload. Template download. Preview parsed data. Row-level validation. Background import via job queue for large files. Progress indicator.

**Print Barcode/Label** — Select products, choose label size, configure content (name, code, price, barcode image). Preview grid. Print via browser or PDF. Uses `jsbarcode`.

**Quantity Adjustments** — Select warehouse, type (Addition/Subtraction), add products with quantities, reason. Updates ProductWarehouseStock.

**Stock Counts** — Create count for warehouse. System populates expected quantities. User enters counted. On finalize: auto-generates adjustments to reconcile. Status: Pending → In Progress → Completed.

---

### Module 2: Purchases

**List Purchases** — DataTable: Reference, Date, Supplier, Warehouse, Status, Grand Total, Payment Status, Actions.

**Add/Edit Purchase** — Header (date, supplier, warehouse), Items table (product search, cost, qty, tax, discount), Footer (subtotal, order tax, shipping, grand total), Payment (method, amount), Notes + attachments. Status: PENDING → ORDERED → RECEIVED. **Stock increases only on RECEIVED.** Payment status auto-calculated from payments vs grand total.

---

### Module 3: Sales & POS

**List Sales** — DataTable: Reference, Date, Customer, Biller, Warehouse, Grand Total, Payment Status, Sale Status, Source (POS/Web), Actions (view/edit/print receipt/email).

**Add Sale (non-POS)** — Same structure as Purchase form but with Customer, Biller, selling prices, gift card payment option.

**POS Interface** (Most Critical Module) — Full-screen layout, NO sidebar.

| Area | Components |
|------|------------|
| **Top Bar** | Warehouse select, Customer select (Walk-in default), Search bar (barcode/name scan), Menu |
| **Left (60%)** | Product grid with images, Category/Subcategory/Brand filter tabs, virtual scrolling |
| **Right (40%)** | Cart (item name, price, qty +/-, subtotal, remove), Order summary (items, subtotal, tax, discount, total), Action buttons (Hold, Reset, Pay) |

**POS Sale Flow:**
1. Select warehouse (defaults to user's assigned)
2. Select customer (defaults to Walk-in)
3. Scan barcode or search → adds to cart (increments qty if exists)
4. Adjust quantities, apply item/order discounts, apply promo code
5. Click Pay → Payment modal (multi-method: cash with change calc, card, gift card, mobile)
6. Submit → Creates Sale + SaleItems + Payments, decrements stock
7. Print receipt (auto or prompt based on settings)
8. Cart clears for next customer

**Redux Cart Slice:** items[], customerId, warehouseId, orderTax, discount, heldOrders[]. Actions: addItem, removeItem, updateQuantity, setDiscount, holdOrder, recallOrder, clearCart.

**Keyboard Shortcuts:** Ctrl+Enter → Pay, Esc → Cancel, auto-focus search when idle.

**Barcode Scanner Hook:** Listens for rapid keystrokes (<50ms apart) ending with Enter → treats as barcode scan → lookup product → add to cart → play sound.

**Deliveries** — List linked to sales. Update status: Packing → Delivering → Delivered. Track shipping info.

**Gift Cards** — CRUD with balance tracking. Create (generate unique number, set value). Use as payment method in POS. View transaction history.

---

### Module 4: Returns

**List Returns** — DataTable: Reference, Date, Customer, Original Sale Ref, Grand Total, Status.

**Add Return** — Select original Sale → auto-populates items → select items/quantities to return (cannot exceed sold qty) → reason → refund method. **Stock increases for returned items.** Payment record created for refund.

---

### Module 5: Transfers

**List/Add Transfer** — From Warehouse → To Warehouse, add products with quantities, shipping cost. Validates source has sufficient stock. Status: PENDING → SENT → COMPLETED. **Decreases source stock, increases destination stock.**

---

### Module 6: Quotations

**List/Add Quotation** — Same form as Sale but **does NOT affect stock**. Has expiryDate. Status: PENDING → SENT → ACCEPTED/REJECTED/CONVERTED/EXPIRED. **"Convert to Sale"** action creates Sale pre-populated from quotation.

---

### Module 7: Expenses

**List/Add Expense** — Date, Category (ExpenseCategory), Amount, Warehouse, Note, Attachment upload. Filterable by date range, category, warehouse. Used in Profit/Loss calculation.

---

### Module 8: HR / People

| Entity | Key Features |
|--------|-------------|
| **Users** | CRUD with roles (OWNER/ADMIN/MANAGER/USER), permission group assignment, default warehouse, avatar. Plan-based user limit enforcement |
| **Billers** | CRUD: name, email, company, tax number |
| **Customers** | CRUD with customer group, reward points, deposit balance. Purchase history, customer statement |
| **Suppliers** | CRUD with purchase history, supplier statement |

---

### Module 9: Reports & Analytics (20+ Reports)

All reports share: date range picker, warehouse filter, CSV/PDF export, chart visualization (Recharts).

| Report | Key Metrics | Chart |
|--------|------------|-------|
| Sales Report | Total sales, items sold, tax, revenue | Line over time |
| Daily Sales | Sales grouped by day | Bar |
| Monthly Sales | Sales grouped by month | Bar |
| Purchases Report | Total purchases, costs | Line |
| Daily/Monthly Purchases | Grouped by period | Bar |
| Suppliers Report | Purchases per supplier | Horizontal bar |
| Customers Report | Sales per customer, top customers | Horizontal bar |
| Stock Report | Current stock by warehouse/product with value | Table |
| Product Quantity Alerts | Products below threshold | Table (red rows) |
| Warehouse Stock Chart | Distribution across warehouses | Stacked bar/pie |
| Adjustments Report | All adjustments with net impact | Table |
| Best Sellers | Top N products by qty or revenue | Bar |
| Payments Report | By method, date range | Pie + table |
| **Profit & Loss** | Revenue - COGS - Expenses = Profit | Summary cards |
| Staff Report | Sales per staff member | Bar |
| Register Report | Cash register open/close, expected vs actual | Table |
| Categories Report | Sales/stock by category | Pie |
| Brands Report | Sales/stock by brand | Pie |
| Tax Report | Tax collected vs paid | Summary + table |
| Expenses Report | By category, trend | Pie + line |

---

### Module 10: Settings & Configuration

| Setting | Details |
|---------|---------|
| **System Settings** | Company info, currency, timezone, date format, invoice/receipt prefixes, default tax |
| **POS Settings** | Display options, auto-focus, keyboard shortcuts, receipt header/footer, auto-print, default printer |
| **Categories** | Hierarchical CRUD (parent/child), images, drag-and-drop ordering |
| **Brands** | CRUD with images |
| **Units** | CRUD with conversion (base unit, operator, value) |
| **Expense Categories** | CRUD |
| **Warehouses** | CRUD with plan limit enforcement |
| **Group Permissions** | Checkbox matrix: rows = modules, columns = actions (view/create/edit/delete) |
| **Tax Rates** | CRUD: name, rate, type |
| **Change Logo** | Upload, crop, preview → S3 |
| **Promos** | CRUD: code, discount type/value, date range, min amount |
| **Printers** | CRUD: name, type, connection, IP/port, test print |
| **Currencies** | CRUD: name, code, symbol, exchange rate |
| **Customer Groups** | CRUD with default discount % |
| **Price Groups** | CRUD |
| **Variants** | CRUD: name, values array |
| **Email Templates** | Edit subject/body with variable placeholders, preview |
| **Site Logs** | Read-only audit trail, filterable by user/action/entity/date |
| **Backups** | Trigger export, list past backups, download (plan-gated) |

---

### Module 11: Dashboard

- **4 Overview Cards**: Today's Sales, Purchases, Returns, Expenses (with % change)
- **Overview Chart**: Stock value by cost/price, tax, expenses (Recharts bar)
- **Best Sellers Chart**: Top 10 products (horizontal bar)
- **Latest Five**: Tabbed section — Sales, Quotations, Purchases, Transfers, Customers, Suppliers

---

### Module 12: Customer Display

- **Route**: `/(customer-display)/display/[sessionId]/page.tsx`
- **Left**: Bill items (Product, Price, Qty, Subtotal), totals
- **Right**: Promotional carousel (images/text from Settings)
- **Sync**: BroadcastChannel API (same browser) or SSE (separate device)

---

### Module 13: SaaS Super-Admin Panel

- **Tenant Management**: List/view/activate/deactivate/impersonate tenants
- **Plan Management**: CRUD subscription plans, configure limits, Stripe price IDs
- **Subscriptions**: Revenue metrics, renewals, failed payments
- **Platform Analytics**: Total tenants, MRR/ARR, growth charts
- **Stripe Flow**: Trial → Plan selection → Checkout → Webhook handling

---

## Authentication & Authorization

**NextAuth.js v5** with Credentials provider. JWT sessions embedding tenantId, userId, role, warehouseId, permissions.

**Middleware** (`src/middleware.ts`): Auth guard → Tenant resolution (subdomain/custom domain) → Subscription check → Route protection.

**RBAC**: Permission keys like `products.view`, `sales.pos`, `reports.profit-loss`. Server: `requirePermission()` helper. Client: `usePermission()` hook + `<PermissionGate>` component. Role hierarchy: OWNER > ADMIN > MANAGER > USER.

---

## Hardware Integration

**Barcode Scanner** — HID keyboard device. `useBarcodeScanner` hook detects rapid keystrokes (<50ms) ending with Enter. Lookup product by code → add to cart → audio feedback. Works with all USB/Bluetooth scanners — no drivers needed.

**Receipt Printer** — Strategy A (default): Browser print with thermal CSS (80mm/58mm). Strategy B (advanced): Web USB API for direct ESC/POS commands. Strategy C (enterprise): Network print via local proxy. Configurable per-printer in Settings.

**Barcode/Label Printer** — `jsbarcode` for barcode generation. Standard label sizes. Print via browser or PDF (`jspdf`).

---

## Dependencies

**Core**: prisma, @prisma/client, next-auth@beta, @auth/prisma-adapter, @reduxjs/toolkit, react-redux, zod, daisyui, bcryptjs, date-fns, recharts, @tanstack/react-table, react-hook-form, @hookform/resolvers, react-hot-toast, papaparse, jspdf, jspdf-autotable, jsbarcode, sharp, uuid

**Infrastructure**: bullmq, ioredis (jobs), @aws-sdk/client-s3 (files), stripe (billing), resend (email)

**Dev**: docker-compose (Postgres + Redis), @types/*, eslint, prettier

---

## Implementation Phases

### Phase 0: Foundation (Week 1-2)
- [ ] Initialize Next.js 15 project with TypeScript, Tailwind, DaisyUI
- [ ] Docker Compose for PostgreSQL + Redis
- [ ] Complete Prisma schema + initial migration + seed script
- [ ] Prisma client singleton + tenant extension
- [ ] NextAuth v5 config + auth pages (login/register)
- [ ] Middleware (auth guard, tenant resolution)
- [ ] Redux store + RTK Query base setup
- [ ] Dashboard layout (Sidebar, Topbar, Breadcrumb)
- [ ] Core UI components (Button, Input, Modal, Select)
- **Milestone**: User can register tenant, login, see dashboard shell

### Phase 1: Settings & Reference Data (Week 3-4)
- [ ] DataTable component (pagination, sorting, filtering, export)
- [ ] All reference data CRUD: Categories, Brands, Units, Warehouses, Tax Rates, Expense Categories, Currencies, Customer/Price Groups, Variants
- [ ] System Settings + POS Settings pages
- [ ] Permission Groups + RBAC enforcement
- [ ] Logo upload with S3
- **Milestone**: All configuration data manageable, permissions working

### Phase 2: Products & Inventory (Week 5-6)
- [ ] Product CRUD (list, add, edit, delete) with API + service layer
- [ ] Image upload to S3
- [ ] Variant support
- [ ] CSV import (with background jobs)
- [ ] Barcode/label printing
- [ ] Quantity adjustments
- [ ] Stock counts
- **Milestone**: Products fully managed, stock tracked per warehouse

### Phase 3: HR / People (Week 7)
- [ ] Users CRUD with roles/permissions
- [ ] Customers CRUD with groups/rewards
- [ ] Suppliers CRUD
- [ ] Billers CRUD
- **Milestone**: All people entities manageable

### Phase 4: Purchases (Week 8)
- [ ] Purchase CRUD with status workflow
- [ ] Stock increase on RECEIVED status
- [ ] Payment recording
- **Milestone**: Purchases recorded, stock increases on receive

### Phase 5: Sales & POS (Week 9-11) — Most Critical
- [ ] Sale CRUD (non-POS)
- [ ] Redux cart slice
- [ ] POS full-screen layout
- [ ] Product grid with category/brand tabs
- [ ] Cart component with qty controls
- [ ] Barcode scanner hook
- [ ] Customer selector
- [ ] Payment modal (multi-method, change calculation)
- [ ] Hold/recall orders
- [ ] Keyboard shortcuts
- [ ] Receipt generation + browser print
- [ ] Gift cards
- [ ] Deliveries
- **Milestone**: Full POS functional, barcode scanning, receipts printing

### Phase 6: Returns, Transfers, Quotations, Expenses (Week 12-13)
- [ ] Returns (linked to sales, stock reversal, refund)
- [ ] Transfers (inter-warehouse, stock movement)
- [ ] Quotations (no stock impact, convert to sale)
- [ ] Expenses CRUD
- **Milestone**: All transactional modules complete

### Phase 7: Dashboard & Reports (Week 14-15)
- [ ] Dashboard overview cards + charts + latest five
- [ ] Report service with aggregation queries
- [ ] All 20+ report types with charts
- [ ] CSV/PDF export
- **Milestone**: Full analytics and reporting

### Phase 8: Customer Display & Hardware (Week 16)
- [ ] Customer display page
- [ ] BroadcastChannel sync + SSE fallback
- [ ] Promo carousel
- [ ] Web USB printer integration
- [ ] Printer settings + test print
- **Milestone**: Customer display real-time, hardware tested

### Phase 9: SaaS Layer (Week 17-18)
- [ ] Tenant registration flow
- [ ] Subdomain + custom domain routing
- [ ] Stripe integration (plans/checkout/webhooks)
- [ ] Plan limit enforcement
- [ ] Super-admin panel
- [ ] Trial expiry handling
- **Milestone**: Full SaaS platform operational

### Phase 10: Polish & Production (Week 19-20)
- [ ] Email templates
- [ ] Site logs + audit trail
- [ ] Backups
- [ ] Mobile responsiveness + tablet POS mode
- [ ] Performance optimization
- [ ] Error handling + loading states
- [ ] Security audit
- [ ] Production deployment (Vercel + managed DB + R2)
- **Milestone**: Production-ready SaaS POS

---

## Verification & Testing

- **Unit tests**: Service layer functions (stock calculations, tax, totals)
- **Integration tests**: API routes with test database
- **E2E tests**: Critical flows — POS sale, purchase receive, returns
- **Manual testing**: Barcode scanner with physical device, receipt printing on thermal printer, customer display on second monitor
- **Multi-tenant testing**: Create 2+ tenants, verify complete data isolation
- **Performance**: Load test DataTable with 10K+ products, POS with 50+ cart items
