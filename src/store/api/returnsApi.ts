import { baseApi } from "./baseApi";

export type ReturnStatus = "PENDING" | "COMPLETED" | "CANCELED";

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: string | number;
  quantity: string | number;
  subtotal: string | number;
}

export interface SalesReturn {
  id: string;
  referenceNo: string;
  date: string;
  saleId: string;
  sale?: { id: string; referenceNo: string; warehouseId: string; items?: any[] };
  customerId: string | null;
  customer?: { id: string; name: string } | null;
  subtotal: string | number;
  grandTotal: string | number;
  status: ReturnStatus;
  reason: string | null;
  note: string | null;
  items?: ReturnItem[];
  payments?: any[];
  _count?: { items: number };
  createdAt: string;
}

export interface ReturnInput {
  date?: string;
  saleId: string;
  customerId?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  grandTotal: number;
  status?: ReturnStatus;
  reason?: string | null;
  note?: string | null;
}

export const returnsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReturns: builder.query<{ data: SalesReturn[]; total: number; page: number; pageSize: number }, Record<string, any>>({
      query: (params) => ({ url: "/returns", params }),
      providesTags: ["Return"],
    }),
    getReturn: builder.query<SalesReturn, string>({
      query: (id) => `/returns/${id}`,
      providesTags: ["Return"],
    }),
    createReturn: builder.mutation<SalesReturn, ReturnInput>({
      query: (data) => ({ url: "/returns", method: "POST", body: data }),
      invalidatesTags: ["Return", "Product", "Sale"],
    }),
    deleteReturn: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/returns/${id}`, method: "DELETE" }),
      invalidatesTags: ["Return", "Product"],
    }),
  }),
});

export const { useGetReturnsQuery, useGetReturnQuery, useCreateReturnMutation, useDeleteReturnMutation } = returnsApi;
