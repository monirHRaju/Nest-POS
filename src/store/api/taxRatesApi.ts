import { baseApi } from "./baseApi";

export interface TaxRate {
  id: string;
  tenantId: string;
  name: string;
  rate: number;
  type: "PERCENTAGE" | "FIXED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRateListResponse {
  data: TaxRate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaxRateInput {
  name: string;
  rate: number;
  type: "PERCENTAGE" | "FIXED";
}

export const taxRatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxRates: builder.query<TaxRateListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/tax-rates",
        params,
      }),
      providesTags: ["TaxRate"],
    }),

    getTaxRate: builder.query<TaxRate, string>({
      query: (id) => `/settings/tax-rates/${id}`,
      providesTags: ["TaxRate"],
    }),

    createTaxRate: builder.mutation<TaxRate, TaxRateInput>({
      query: (data) => ({
        url: "/settings/tax-rates",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TaxRate"],
    }),

    updateTaxRate: builder.mutation<TaxRate, { id: string; data: TaxRateInput }>({
      query: ({ id, data }) => ({
        url: `/settings/tax-rates/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["TaxRate"],
    }),

    deleteTaxRate: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/tax-rates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TaxRate"],
    }),
  }),
});

export const {
  useGetTaxRatesQuery,
  useGetTaxRateQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useDeleteTaxRateMutation,
} = taxRatesApi;
