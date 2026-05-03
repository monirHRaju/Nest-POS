import { baseApi } from "./baseApi";

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxNumber: string | null;
  customerGroupId: string | null;
  customerGroup?: { id: string; name: string; discountPercent: number } | null;
  rewardPoints: number;
  deposit: number;
  isWalkIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  customerGroupId?: string | null;
  rewardPoints?: number;
  deposit?: number;
  isActive?: boolean;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerListResponse, Record<string, any>>({
      query: (params) => ({ url: "/customers", params }),
      providesTags: ["Customer"],
    }),
    getCustomer: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customer"],
    }),
    createCustomer: builder.mutation<Customer, CustomerInput>({
      query: (data) => ({ url: "/customers", method: "POST", body: data }),
      invalidatesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: CustomerInput }>({
      query: ({ id, data }) => ({ url: `/customers/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Customer"],
    }),
    deleteCustomer: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
