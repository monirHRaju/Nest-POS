import { baseApi } from "./baseApi";

export interface PriceGroup {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceGroupListResponse {
  data: PriceGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PriceGroupInput {
  name: string;
  description?: string;
}

export const priceGroupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPriceGroups: builder.query<PriceGroupListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/price-groups", params }),
      providesTags: ["PriceGroup"],
    }),
    getPriceGroup: builder.query<PriceGroup, string>({
      query: (id) => `/settings/price-groups/${id}`,
      providesTags: ["PriceGroup"],
    }),
    createPriceGroup: builder.mutation<PriceGroup, PriceGroupInput>({
      query: (data) => ({ url: "/settings/price-groups", method: "POST", body: data }),
      invalidatesTags: ["PriceGroup"],
    }),
    updatePriceGroup: builder.mutation<PriceGroup, { id: string; data: PriceGroupInput }>({
      query: ({ id, data }) => ({ url: `/settings/price-groups/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["PriceGroup"],
    }),
    deletePriceGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/price-groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["PriceGroup"],
    }),
  }),
});

export const {
  useGetPriceGroupsQuery,
  useGetPriceGroupQuery,
  useCreatePriceGroupMutation,
  useUpdatePriceGroupMutation,
  useDeletePriceGroupMutation,
} = priceGroupsApi;
