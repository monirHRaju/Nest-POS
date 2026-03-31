import { baseApi } from "./baseApi";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: string | null;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryListResponse, Record<string, any>>({
      query: (params) => ({
        url: "/settings/categories",
        params,
      }),
      providesTags: ["Category"],
    }),

    getCategory: builder.query<Category, string>({
      query: (id) => `/settings/categories/${id}`,
      providesTags: ["Category"],
    }),

    createCategory: builder.mutation<Category, CategoryInput>({
      query: (data) => ({
        url: "/settings/categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation<Category, { id: string; data: CategoryInput }>({
      query: ({ id, data }) => ({
        url: `/settings/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),

    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
