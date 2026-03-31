import { baseApi } from "./baseApi";

export interface Variant {
  id: string;
  tenantId: string;
  name: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantListResponse {
  data: Variant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VariantInput {
  name: string;
  values: string[];
}

export const variantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVariants: builder.query<VariantListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/variants",
        params,
      }),
      providesTags: ["Variant"],
    }),

    getVariant: builder.query<Variant, string>({
      query: (id) => `/settings/variants/${id}`,
      providesTags: ["Variant"],
    }),

    createVariant: builder.mutation<Variant, VariantInput>({
      query: (data) => ({
        url: "/settings/variants",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Variant"],
    }),

    updateVariant: builder.mutation<Variant, { id: string; data: VariantInput }>({
      query: ({ id, data }) => ({
        url: `/settings/variants/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Variant"],
    }),

    deleteVariant: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/variants/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Variant"],
    }),
  }),
});

export const {
  useGetVariantsQuery,
  useGetVariantQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = variantsApi;
