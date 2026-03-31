import { baseApi } from "./baseApi";

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  data: ExpenseCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export const expenseCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenseCategories: builder.query<CategoryListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/expense-categories", params }),
      providesTags: ["ExpenseCategory"],
    }),
    getExpenseCategory: builder.query<ExpenseCategory, string>({
      query: (id) => `/settings/expense-categories/${id}`,
      providesTags: ["ExpenseCategory"],
    }),
    createExpenseCategory: builder.mutation<ExpenseCategory, CategoryInput>({
      query: (data) => ({ url: "/settings/expense-categories", method: "POST", body: data }),
      invalidatesTags: ["ExpenseCategory"],
    }),
    updateExpenseCategory: builder.mutation<ExpenseCategory, { id: string; data: CategoryInput }>({
      query: ({ id, data }) => ({ url: `/settings/expense-categories/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["ExpenseCategory"],
    }),
    deleteExpenseCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/expense-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["ExpenseCategory"],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useGetExpenseCategoryQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} = expenseCategoriesApi;
