import { baseApi } from "./baseApi";

export type AdjustmentType = "ADDITION" | "SUBTRACTION";

export interface AdjustmentItem {
  id: string;
  productId: string;
  product?: { id: string; name: string; code: string; unit?: { shortName: string } | null };
  quantity: number;
}

export interface Adjustment {
  id: string;
  tenantId: string;
  referenceNo: string;
  date: string;
  warehouseId: string;
  warehouse?: { id: string; name: string };
  type: AdjustmentType;
  note?: string | null;
  items?: AdjustmentItem[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentListResponse {
  data: Adjustment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdjustmentItemInput {
  productId: string;
  quantity: number;
}

export interface AdjustmentInput {
  date: string;
  referenceNo: string;
  warehouseId: string;
  type: AdjustmentType;
  note?: string;
  items: AdjustmentItemInput[];
}

export const adjustmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdjustments: builder.query<AdjustmentListResponse, Record<string, any>>({
      query: (params) => ({ url: "/adjustments", params }),
      providesTags: ["Adjustment"],
    }),

    getAdjustment: builder.query<Adjustment, string>({
      query: (id) => `/adjustments/${id}`,
      providesTags: ["Adjustment"],
    }),

    createAdjustment: builder.mutation<Adjustment, AdjustmentInput>({
      query: (data) => ({ url: "/adjustments", method: "POST", body: data }),
      invalidatesTags: ["Adjustment", "Product"],
    }),
  }),
});

export const {
  useGetAdjustmentsQuery,
  useGetAdjustmentQuery,
  useCreateAdjustmentMutation,
} = adjustmentsApi;
