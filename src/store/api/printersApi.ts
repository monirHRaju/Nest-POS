import { baseApi } from "./baseApi";

export type PrinterType = "RECEIPT" | "BARCODE" | "KITCHEN" | "REPORT";
export type PrinterConnectionType = "USB" | "NETWORK" | "BLUETOOTH" | "BROWSER";

export interface Printer {
  id: string;
  tenantId: string;
  name: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  ipAddress: string | null;
  port: number | null;
  characterWidth: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterListResponse {
  data: Printer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PrinterInput {
  name: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  ipAddress?: string | null;
  port?: number | null;
  characterWidth?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export const printersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrinters: builder.query<PrinterListResponse, Record<string, any>>({
      query: (params) => ({ url: "/settings/printers", params }),
      providesTags: ["Printer"],
    }),
    getPrinter: builder.query<Printer, string>({
      query: (id) => `/settings/printers/${id}`,
      providesTags: ["Printer"],
    }),
    createPrinter: builder.mutation<Printer, PrinterInput>({
      query: (data) => ({ url: "/settings/printers", method: "POST", body: data }),
      invalidatesTags: ["Printer"],
    }),
    updatePrinter: builder.mutation<Printer, { id: string; data: PrinterInput }>({
      query: ({ id, data }) => ({ url: `/settings/printers/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Printer"],
    }),
    deletePrinter: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/settings/printers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Printer"],
    }),
  }),
});

export const {
  useGetPrintersQuery,
  useGetPrinterQuery,
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
  useDeletePrinterMutation,
} = printersApi;
