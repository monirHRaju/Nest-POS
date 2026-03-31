import { baseApi } from "./baseApi";

export type ProductType = "STANDARD" | "DIGITAL" | "SERVICE" | "COMBO";
export type TaxMethod = "INCLUSIVE" | "EXCLUSIVE";

export interface WarehouseStock {
  warehouseId: string;
  warehouse?: { id: string; name: string };
  quantity: number;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: ProductType;
  barcodeSymbology: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  brandId?: string | null;
  brand?: { id: string; name: string } | null;
  unitId?: string | null;
  unit?: { id: string; name: string; shortName: string } | null;
  taxId?: string | null;
  tax?: { id: string; name: string; rate: number } | null;
  taxMethod: TaxMethod;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  minimumPrice?: number | null;
  alertQuantity: number;
  description?: string | null;
  image?: string | null;
  images: string[];
  hasVariants: boolean;
  hasSerialNumber: boolean;
  isBatchTracking: boolean;
  isActive: boolean;
  warehouseStocks?: WarehouseStock[];
  totalStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductInput {
  name: string;
  code: string;
  type?: ProductType;
  barcodeSymbology?: string;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  taxId?: string | null;
  taxMethod?: TaxMethod;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  minimumPrice?: number | null;
  alertQuantity?: number;
  description?: string | null;
  image?: string | null;
  images?: string[];
  hasVariants?: boolean;
  hasSerialNumber?: boolean;
  isBatchTracking?: boolean;
  isActive?: boolean;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductListResponse, Record<string, any>>({
      query: (params) => ({ url: "/products", params }),
      providesTags: ["Product"],
    }),

    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: ["Product"],
    }),

    createProduct: builder.mutation<Product, ProductInput>({
      query: (data) => ({ url: "/products", method: "POST", body: data }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation<Product, { id: string; data: ProductInput }>({
      query: ({ id, data }) => ({ url: `/products/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product"],
    }),

    importProducts: builder.mutation<{ imported: number; skipped: number; errors: string[] }, { rows: any[] }>({
      query: (data) => ({ url: "/products/import", method: "POST", body: data }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useImportProductsMutation,
} = productsApi;
