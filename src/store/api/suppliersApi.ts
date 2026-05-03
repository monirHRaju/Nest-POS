import { baseApi } from "./baseApi";

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  company: string | null;
  taxNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  data: Supplier[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  company?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
}

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<SupplierListResponse, Record<string, any>>({
      query: (params) => ({ url: "/suppliers", params }),
      providesTags: ["Supplier"],
    }),
    getSupplier: builder.query<Supplier, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: ["Supplier"],
    }),
    createSupplier: builder.mutation<Supplier, SupplierInput>({
      query: (data) => ({ url: "/suppliers", method: "POST", body: data }),
      invalidatesTags: ["Supplier"],
    }),
    updateSupplier: builder.mutation<Supplier, { id: string; data: SupplierInput }>({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Supplier"],
    }),
    deleteSupplier: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Supplier"],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
