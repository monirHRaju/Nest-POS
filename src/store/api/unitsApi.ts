import { baseApi } from "./baseApi";

export interface Unit {
  id: string;
  tenantId: string;
  name: string;
  shortName: string;
  baseUnit: string | null;
  operator: string | null;
  operationValue: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitListResponse {
  data: Unit[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UnitInput {
  name: string;
  shortName: string;
  baseUnit?: string | null;
  operator?: string | null;
  operationValue?: number | null;
}

export const unitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnits: builder.query<UnitListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/units",
        params,
      }),
      providesTags: ["Unit"],
    }),

    getUnit: builder.query<Unit, string>({
      query: (id) => `/settings/units/${id}`,
      providesTags: ["Unit"],
    }),

    createUnit: builder.mutation<Unit, UnitInput>({
      query: (data) => ({
        url: "/settings/units",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Unit"],
    }),

    updateUnit: builder.mutation<Unit, { id: string; data: UnitInput }>({
      query: ({ id, data }) => ({
        url: `/settings/units/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Unit"],
    }),

    deleteUnit: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Unit"],
    }),
  }),
});

export const {
  useGetUnitsQuery,
  useGetUnitQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitsApi;
