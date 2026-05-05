import { baseApi } from "./baseApi";

export type QuotationStatus = "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "CONVERTED" | "EXPIRED";
export type DiscountType = "FIXED" | "PERCENTAGE";

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: string | number;
  quantity: string | number;
  discount: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  subtotal: string | number;
}

export interface Quotation {
  id: string;
  referenceNo: string;
  date: string;
  expiryDate: string | null;
  customerId: string | null;
  customer?: { id: string; name: string } | null;
  warehouseId: string | null;
  subtotal: string | number;
  discount: string | number;
  discountType: DiscountType;
  discountAmount: string | number;
  grandTotal: string | number;
  status: QuotationStatus;
  note: string | null;
  items?: QuotationItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface QuotationInput {
  date?: string;
  expiryDate?: string | null;
  customerId?: string | null;
  warehouseId?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    unitPrice: number;
    quantity: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  grandTotal: number;
  status?: QuotationStatus;
  note?: string | null;
}

export const quotationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query<{ data: Quotation[]; total: number; page: number; pageSize: number }, Record<string, any>>({
      query: (params) => ({ url: "/quotations", params }),
      providesTags: ["Quotation"],
    }),
    getQuotation: builder.query<Quotation, string>({
      query: (id) => `/quotations/${id}`,
      providesTags: ["Quotation"],
    }),
    createQuotation: builder.mutation<Quotation, QuotationInput>({
      query: (data) => ({ url: "/quotations", method: "POST", body: data }),
      invalidatesTags: ["Quotation"],
    }),
    updateQuotation: builder.mutation<Quotation, { id: string; data: QuotationInput }>({
      query: ({ id, data }) => ({ url: `/quotations/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Quotation"],
    }),
    deleteQuotation: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/quotations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Quotation"],
    }),
    convertQuotation: builder.mutation<{ saleId: string; referenceNo: string; message: string }, string>({
      query: (id) => ({ url: `/quotations/${id}/convert`, method: "POST" }),
      invalidatesTags: ["Quotation", "Sale", "Product"],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useConvertQuotationMutation,
} = quotationsApi;
