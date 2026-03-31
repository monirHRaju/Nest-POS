import { baseApi } from "./baseApi";

export interface CustomerGroup {
  id: string;
  tenantId: string;
  name: string;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupListResponse {
  data: CustomerGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GroupInput {
  name: string;
  discountPercent?: number;
}

export const customerGroupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerGroups: builder.query<GroupListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/customer-groups", params }),
      providesTags: ["CustomerGroup"],
    }),
    getCustomerGroup: builder.query<CustomerGroup, string>({
      query: (id) => `/settings/customer-groups/${id}`,
      providesTags: ["CustomerGroup"],
    }),
    createCustomerGroup: builder.mutation<CustomerGroup, GroupInput>({
      query: (data) => ({ url: "/settings/customer-groups", method: "POST", body: data }),
      invalidatesTags: ["CustomerGroup"],
    }),
    updateCustomerGroup: builder.mutation<CustomerGroup, { id: string; data: GroupInput }>({
      query: ({ id, data }) => ({ url: `/settings/customer-groups/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["CustomerGroup"],
    }),
    deleteCustomerGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/customer-groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["CustomerGroup"],
    }),
  }),
});

export const {
  useGetCustomerGroupsQuery,
  useGetCustomerGroupQuery,
  useCreateCustomerGroupMutation,
  useUpdateCustomerGroupMutation,
  useDeleteCustomerGroupMutation,
} = customerGroupsApi;
