import { baseApi } from "./baseApi";

export type PromoType = "PERCENTAGE" | "FIXED";

export interface Promo {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: PromoType;
  value: string;
  minimumAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoListResponse {
  data: Promo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PromoInput {
  name: string;
  code: string;
  type: PromoType;
  value: number;
  minimumAmount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export const promosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPromos: builder.query<PromoListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/promos", params }),
      providesTags: ["Promo"],
    }),
    getPromo: builder.query<Promo, string>({
      query: (id) => `/settings/promos/${id}`,
      providesTags: ["Promo"],
    }),
    createPromo: builder.mutation<Promo, PromoInput>({
      query: (data) => ({ url: "/settings/promos", method: "POST", body: data }),
      invalidatesTags: ["Promo"],
    }),
    updatePromo: builder.mutation<Promo, { id: string; data: PromoInput }>({
      query: ({ id, data }) => ({ url: `/settings/promos/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Promo"],
    }),
    deletePromo: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/promos/${id}`, method: "DELETE" }),
      invalidatesTags: ["Promo"],
    }),
  }),
});

export const {
  useGetPromosQuery,
  useGetPromoQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeletePromoMutation,
} = promosApi;
