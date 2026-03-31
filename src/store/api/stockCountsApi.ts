import { baseApi } from "./baseApi";

export type StockCountStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface StockCountItem {
  id: string;
  productId: string;
  product?: { id: string; name: string; code: string; unit?: { shortName: string } | null };
  expectedQty: number;
  countedQty: number | null;
  difference: number | null;
}

export interface StockCount {
  id: string;
  tenantId: string;
  referenceNo: string;
  date: string;
  warehouseId: string;
  warehouse?: { id: string; name: string };
  status: StockCountStatus;
  note?: string | null;
  items?: StockCountItem[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface StockCountListResponse {
  data: StockCount[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StockCountInput {
  date: string;
  referenceNo: string;
  warehouseId: string;
  note?: string;
}

export const stockCountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStockCounts: builder.query<StockCountListResponse, Record<string, any>>({
      query: (params) => ({ url: "/stock-counts", params }),
      providesTags: ["StockCount"],
    }),

    getStockCount: builder.query<StockCount, string>({
      query: (id) => `/stock-counts/${id}`,
      providesTags: ["StockCount"],
    }),

    createStockCount: builder.mutation<StockCount, StockCountInput>({
      query: (data) => ({ url: "/stock-counts", method: "POST", body: data }),
      invalidatesTags: ["StockCount"],
    }),

    updateStockCountItems: builder.mutation<{ message: string }, { id: string; items: { id: string; countedQty: number }[] }>({
      query: ({ id, items }) => ({
        url: `/stock-counts/${id}`,
        method: "PUT",
        body: { action: "update_items", items },
      }),
      invalidatesTags: ["StockCount"],
    }),

    finalizeStockCount: builder.mutation<{ message: string; adjustmentsCreated: boolean }, string>({
      query: (id) => ({
        url: `/stock-counts/${id}`,
        method: "PUT",
        body: { action: "finalize" },
      }),
      invalidatesTags: ["StockCount", "Adjustment", "Product"],
    }),
  }),
});

export const {
  useGetStockCountsQuery,
  useGetStockCountQuery,
  useCreateStockCountMutation,
  useUpdateStockCountItemsMutation,
  useFinalizeStockCountMutation,
} = stockCountsApi;
