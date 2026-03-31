import { baseApi } from "./baseApi";

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WarehouseInput {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isDefault?: boolean;
}

export const warehousesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query<WarehouseListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/warehouses",
        params,
      }),
      providesTags: ["Warehouse"],
    }),

    getWarehouse: builder.query<Warehouse, string>({
      query: (id) => `/settings/warehouses/${id}`,
      providesTags: ["Warehouse"],
    }),

    createWarehouse: builder.mutation<Warehouse, WarehouseInput>({
      query: (data) => ({
        url: "/settings/warehouses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Warehouse"],
    }),

    updateWarehouse: builder.mutation<Warehouse, { id: string; data: WarehouseInput }>({
      query: ({ id, data }) => ({
        url: `/settings/warehouses/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Warehouse"],
    }),

    deleteWarehouse: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/warehouses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Warehouse"],
    }),
  }),
});

export const {
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehousesApi;
