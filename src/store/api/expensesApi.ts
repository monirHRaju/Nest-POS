import { baseApi } from "./baseApi";

export interface Expense {
  id: string;
  referenceNo: string;
  date: string;
  categoryId: string;
  category?: { id: string; name: string };
  amount: string | number;
  warehouseId: string | null;
  warehouse?: { id: string; name: string } | null;
  note: string | null;
  attachment: string | null;
  createdAt: string;
}

export interface ExpenseInput {
  date?: string;
  categoryId: string;
  amount: number;
  warehouseId?: string | null;
  note?: string | null;
  attachment?: string | null;
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<{ data: Expense[]; total: number; page: number; pageSize: number }, Record<string, any>>({
      query: (params) => ({ url: "/expenses", params }),
      providesTags: ["Expense"],
    }),
    getExpense: builder.query<Expense, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: ["Expense"],
    }),
    createExpense: builder.mutation<Expense, ExpenseInput>({
      query: (data) => ({ url: "/expenses", method: "POST", body: data }),
      invalidatesTags: ["Expense"],
    }),
    updateExpense: builder.mutation<Expense, { id: string; data: ExpenseInput }>({
      query: ({ id, data }) => ({ url: `/expenses/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Expense"],
    }),
    deleteExpense: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Expense"],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
