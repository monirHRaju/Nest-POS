import { baseApi } from "./baseApi";

export interface Biller {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  taxNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillerListResponse {
  data: Biller[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BillerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
}

export const billersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBillers: builder.query<BillerListResponse, Record<string, any>>({
      query: (params) => ({ url: "/billers", params }),
      providesTags: ["Biller"],
    }),
    getBiller: builder.query<Biller, string>({
      query: (id) => `/billers/${id}`,
      providesTags: ["Biller"],
    }),
    createBiller: builder.mutation<Biller, BillerInput>({
      query: (data) => ({ url: "/billers", method: "POST", body: data }),
      invalidatesTags: ["Biller"],
    }),
    updateBiller: builder.mutation<Biller, { id: string; data: BillerInput }>({
      query: ({ id, data }) => ({ url: `/billers/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Biller"],
    }),
    deleteBiller: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/billers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Biller"],
    }),
  }),
});

export const {
  useGetBillersQuery,
  useGetBillerQuery,
  useCreateBillerMutation,
  useUpdateBillerMutation,
  useDeleteBillerMutation,
} = billersApi;
