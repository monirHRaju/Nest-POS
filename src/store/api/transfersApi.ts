import { baseApi } from "./baseApi";

export type TransferStatus = "PENDING" | "SENT" | "COMPLETED" | "CANCELED";

export interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitCost: string | number;
  quantity: string | number;
  subtotal: string | number;
}

export interface Transfer {
  id: string;
  referenceNo: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouse?: { id: string; name: string };
  toWarehouseId: string;
  toWarehouse?: { id: string; name: string };
  shippingCost: string | number;
  grandTotal: string | number;
  status: TransferStatus;
  note: string | null;
  items?: TransferItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface TransferInput {
  date?: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    unitCost: number;
    quantity: number;
    subtotal: number;
  }>;
  shippingCost?: number;
  grandTotal: number;
  status?: TransferStatus;
  note?: string | null;
}

export const transfersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransfers: builder.query<{ data: Transfer[]; total: number; page: number; pageSize: number }, Record<string, any>>({
      query: (params) => ({ url: "/transfers", params }),
      providesTags: ["Transfer"],
    }),
    getTransfer: builder.query<Transfer, string>({
      query: (id) => `/transfers/${id}`,
      providesTags: ["Transfer"],
    }),
    createTransfer: builder.mutation<Transfer, TransferInput>({
      query: (data) => ({ url: "/transfers", method: "POST", body: data }),
      invalidatesTags: ["Transfer", "Product"],
    }),
    updateTransferStatus: builder.mutation<Transfer, { id: string; status: TransferStatus; note?: string | null }>({
      query: ({ id, status, note }) => ({ url: `/transfers/${id}`, method: "PUT", body: { status, note } }),
      invalidatesTags: ["Transfer", "Product"],
    }),
    deleteTransfer: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/transfers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Transfer"],
    }),
  }),
});

export const {
  useGetTransfersQuery,
  useGetTransferQuery,
  useCreateTransferMutation,
  useUpdateTransferStatusMutation,
  useDeleteTransferMutation,
} = transfersApi;
