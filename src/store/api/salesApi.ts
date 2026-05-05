import { baseApi } from "./baseApi";
import { PaymentMethod } from "./paymentsApi";

export type SaleStatus = "PENDING" | "COMPLETED" | "CANCELED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type SaleSource = "POS" | "WEB" | "API";
export type DiscountType = "FIXED" | "PERCENTAGE";

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  variantName: string | null;
  unitPrice: string | number;
  quantity: string | number;
  discount: string | number;
  discountType: DiscountType;
  taxRate: string | number;
  taxAmount: string | number;
  subtotal: string | number;
}

export interface Sale {
  id: string;
  tenantId: string;
  referenceNo: string;
  date: string;
  customerId: string | null;
  customer?: { id: string; name: string } | null;
  billerId: string | null;
  biller?: { id: string; name: string } | null;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  warehouseId: string;
  warehouse?: { id: string; name: string };
  subtotal: string | number;
  orderTaxId: string | null;
  orderTaxAmount: string | number;
  discount: string | number;
  discountType: DiscountType;
  discountAmount: string | number;
  shippingCost: string | number;
  grandTotal: string | number;
  paidAmount: string | number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  source: SaleSource;
  note: string | null;
  staffNote: string | null;
  items?: SaleItem[];
  payments?: any[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface SaleListResponse {
  data: Sale[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SaleItemInput {
  productId: string;
  productName: string;
  productCode: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  discount?: number;
  discountType?: DiscountType;
  taxRate?: number;
  taxAmount?: number;
  subtotal: number;
}

export interface SalePaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  cardNumber?: string | null;
  chequeNumber?: string | null;
  bankName?: string | null;
  transactionRef?: string | null;
  giftCardId?: string | null;
  note?: string | null;
}

export interface SaleInput {
  date?: string;
  customerId?: string | null;
  billerId?: string | null;
  warehouseId: string;
  items: SaleItemInput[];
  payments?: SalePaymentInput[];
  subtotal: number;
  orderTaxId?: string | null;
  orderTaxAmount?: number;
  discount?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  shippingCost?: number;
  grandTotal: number;
  status?: SaleStatus;
  source?: SaleSource;
  note?: string | null;
  staffNote?: string | null;
}

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<SaleListResponse, Record<string, any>>({
      query: (params) => ({ url: "/sales", params }),
      providesTags: ["Sale"],
    }),
    getSale: builder.query<Sale, string>({
      query: (id) => `/sales/${id}`,
      providesTags: ["Sale"],
    }),
    createSale: builder.mutation<Sale, SaleInput>({
      query: (data) => ({ url: "/sales", method: "POST", body: data }),
      invalidatesTags: ["Sale", "Product", "Payment"],
    }),
    updateSale: builder.mutation<Sale, { id: string; data: { status?: SaleStatus; note?: string | null; staffNote?: string | null } }>({
      query: ({ id, data }) => ({ url: `/sales/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Sale", "Product"],
    }),
    deleteSale: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/sales/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sale"],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} = salesApi;
