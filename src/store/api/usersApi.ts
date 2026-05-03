import { baseApi } from "./baseApi";

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "USER";

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  groupId: string | null;
  warehouseId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  group?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
}

export interface UserListResponse {
  data: AppUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string | null;
  role: UserRole;
  groupId?: string | null;
  warehouseId?: string | null;
  isActive?: boolean;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserListResponse, Record<string, any>>({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
    }),
    getUser: builder.query<AppUser, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["User"],
    }),
    createUser: builder.mutation<AppUser, UserInput>({
      query: (data) => ({ url: "/users", method: "POST", body: data }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation<AppUser, { id: string; data: UserInput }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
