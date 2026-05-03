import { baseApi } from "./baseApi";

export type PurchaseStatus = "PENDING" | "ORDERED" | "RECEIVED" | "CANCELED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type DiscountType = "FIXED" | "PERCENTAGE";

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitCost: string | number;
  quantity: string | number;
  receivedQty: string | number;
  discount: string | number;
  discountType: DiscountType;
  taxRate: string | number;
  taxAmount: string | number;
  subtotal: string | number;
  expiryDate: string | null;
  batchNumber: string | null;
}

export interface Purchase {
  id: string;
  tenantId: string;
  referenceNo: string;
  date: string;
  supplierId: string | null;
  supplier?: { id: string; name: string } | null;
  warehouseId: string;
  warehouse?: { id: string; name: string } | null;
  subtotal: string | number;
  orderTaxId: string | null;
  orderTaxAmount: string | number;
  discount: string | number;
  discountType: DiscountType;
  discountAmount: string | number;
  shippingCost: string | number;
  grandTotal: string | number;
  paidAmount: string | number;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  note: string | null;
  attachment: string | null;
  items?: PurchaseItem[];
  payments?: any[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseListResponse {
  data: Purchase[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PurchaseItemInput {
  productId: string;
  productName: string;
  productCode: string;
  unitCost: number;
  quantity: number;
  receivedQty?: number;
  discount?: number;
  discountType?: DiscountType;
  taxRate?: number;
  taxAmount?: number;
  subtotal: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
}

export interface PurchaseInput {
  date?: string;
  supplierId?: string | null;
  warehouseId: string;
  items: PurchaseItemInput[];
  subtotal: number;
  orderTaxId?: string | null;
  orderTaxAmount?: number;
  discount?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  shippingCost?: number;
  grandTotal: number;
  paidAmount?: number;
  status?: PurchaseStatus;
  note?: string | null;
  attachment?: string | null;
}

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<PurchaseListResponse, Record<string, any>>({
      query: (params) => ({ url: "/purchases", params }),
      providesTags: ["Purchase"],
    }),
    getPurchase: builder.query<Purchase, string>({
      query: (id) => `/purchases/${id}`,
      providesTags: ["Purchase"],
    }),
    createPurchase: builder.mutation<Purchase, PurchaseInput>({
      query: (data) => ({ url: "/purchases", method: "POST", body: data }),
      invalidatesTags: ["Purchase", "Product"],
    }),
    updatePurchase: builder.mutation<Purchase, { id: string; data: PurchaseInput }>({
      query: ({ id, data }) => ({ url: `/purchases/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Purchase", "Product"],
    }),
    deletePurchase: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/purchases/${id}`, method: "DELETE" }),
      invalidatesTags: ["Purchase"],
    }),
    receivePurchase: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/purchases/${id}/receive`, method: "POST" }),
      invalidatesTags: ["Purchase", "Product"],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useReceivePurchaseMutation,
} = purchasesApi;
