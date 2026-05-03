import { baseApi } from "./baseApi";

export type PaymentMethod = "CASH" | "CARD" | "CHEQUE" | "BANK_TRANSFER" | "GIFT_CARD" | "MOBILE_PAYMENT" | "OTHER";

export interface Payment {
  id: string;
  referenceNo: string;
  date: string;
  saleId: string | null;
  purchaseId: string | null;
  returnId: string | null;
  amount: string | number;
  paymentMethod: PaymentMethod;
  cardNumber: string | null;
  chequeNumber: string | null;
  bankName: string | null;
  transactionRef: string | null;
  giftCardId: string | null;
  note: string | null;
  createdAt: string;
}

export interface PaymentInput {
  date?: string;
  saleId?: string | null;
  purchaseId?: string | null;
  returnId?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  cardNumber?: string | null;
  chequeNumber?: string | null;
  bankName?: string | null;
  transactionRef?: string | null;
  giftCardId?: string | null;
  note?: string | null;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<{ data: Payment[]; total: number }, Record<string, any>>({
      query: (params) => ({ url: "/payments", params }),
      providesTags: ["Payment"],
    }),
    createPayment: builder.mutation<Payment, PaymentInput>({
      query: (data) => ({ url: "/payments", method: "POST", body: data }),
      invalidatesTags: ["Payment", "Purchase", "Sale", "Return"],
    }),
    deletePayment: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/payments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Payment", "Purchase", "Sale", "Return"],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
} = paymentsApi;
