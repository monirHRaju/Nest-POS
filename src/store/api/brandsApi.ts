import { baseApi } from "./baseApi";

export interface Brand {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandListResponse {
  data: Brand[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BrandInput {
  name: string;
  slug?: string;
}

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<BrandListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/brands",
        params,
      }),
      providesTags: ["Brand"],
    }),

    getBrand: builder.query<Brand, string>({
      query: (id) => `/settings/brands/${id}`,
      providesTags: ["Brand"],
    }),

    createBrand: builder.mutation<Brand, BrandInput>({
      query: (data) => ({
        url: "/settings/brands",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Brand"],
    }),

    updateBrand: builder.mutation<Brand, { id: string; data: BrandInput }>({
      query: ({ id, data }) => ({
        url: `/settings/brands/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Brand"],
    }),

    deleteBrand: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/brands/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Brand"],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useGetBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi;
