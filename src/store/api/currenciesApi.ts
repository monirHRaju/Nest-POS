import { baseApi } from "./baseApi";

export interface Currency {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyListResponse {
  data: Currency[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CurrencyInput {
  name: string;
  code: string;
  symbol: string;
  exchangeRate?: number;
}

export const currenciesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrencies: builder.query<CurrencyListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/currencies", params }),
      providesTags: ["Currency"],
    }),
    getCurrency: builder.query<Currency, string>({
      query: (id) => `/settings/currencies/${id}`,
      providesTags: ["Currency"],
    }),
    createCurrency: builder.mutation<Currency, CurrencyInput>({
      query: (data) => ({ url: "/settings/currencies", method: "POST", body: data }),
      invalidatesTags: ["Currency"],
    }),
    updateCurrency: builder.mutation<Currency, { id: string; data: CurrencyInput }>({
      query: ({ id, data }) => ({ url: `/settings/currencies/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Currency"],
    }),
    deleteCurrency: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/currencies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Currency"],
    }),
  }),
});

export const {
  useGetCurrenciesQuery,
  useGetCurrencyQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
} = currenciesApi;
