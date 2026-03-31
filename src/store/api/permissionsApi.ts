import { baseApi } from "./baseApi";

export interface PermissionGroup {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroupListResponse {
  data: PermissionGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PermissionGroupInput {
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
}

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissionGroups: builder.query<PermissionGroupListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/permissions", params }),
      providesTags: ["PermissionGroup"],
    }),

    getPermissionGroup: builder.query<PermissionGroup, string>({
      query: (id) => `/settings/permissions/${id}`,
      providesTags: ["PermissionGroup"],
    }),

    createPermissionGroup: builder.mutation<PermissionGroup, PermissionGroupInput>({
      query: (data) => ({ url: "/settings/permissions", method: "POST", body: data }),
      invalidatesTags: ["PermissionGroup"],
    }),

    updatePermissionGroup: builder.mutation<PermissionGroup, { id: string; data: PermissionGroupInput }>({
      query: ({ id, data }) => ({ url: `/settings/permissions/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["PermissionGroup"],
    }),

    deletePermissionGroup: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/permissions/${id}`, method: "DELETE" }),
      invalidatesTags: ["PermissionGroup"],
    }),
  }),
});

export const {
  useGetPermissionGroupsQuery,
  useGetPermissionGroupQuery,
  useCreatePermissionGroupMutation,
  useUpdatePermissionGroupMutation,
  useDeletePermissionGroupMutation,
} = permissionsApi;
