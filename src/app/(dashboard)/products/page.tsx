"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import {
  Product,
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
} from "@/store/api/productsApi";
import { useGetCategoriesQuery } from "@/store/api/categoriesApi";
import { useGetBrandsQuery } from "@/store/api/brandsApi";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");

  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryParams: Record<string, any> = { page, pageSize, search };
  if (categoryId) queryParams.categoryId = categoryId;
  if (brandId) queryParams.brandId = brandId;
  if (typeFilter) queryParams.type = typeFilter;
  if (isActiveFilter !== "") queryParams.isActive = isActiveFilter;

  const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);
  const { data: categoriesData } = useGetCategoriesQuery({ pageSize: 200 });
  const { data: brandsData } = useGetBrandsQuery({ pageSize: 200 });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();

  const handleDuplicate = async (product: Product) => {
    try {
      await createProduct({
        name: `Copy of ${product.name}`,
        code: `${product.code}-copy`,
        type: product.type,
        barcodeSymbology: product.barcodeSymbology,
        categoryId: product.categoryId,
        brandId: product.brandId,
        unitId: product.unitId,
        taxId: product.taxId,
        taxMethod: product.taxMethod,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        wholesalePrice: product.wholesalePrice,
        minimumPrice: product.minimumPrice,
        alertQuantity: product.alertQuantity,
        description: product.description,
        image: product.image,
        images: product.images,
        hasVariants: product.hasVariants,
        hasSerialNumber: product.hasSerialNumber,
        isBatchTracking: product.isBatchTracking,
        isActive: product.isActive,
      }).unwrap();
      toast.success("Product duplicated");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to duplicate");
    }
  };

  const formatPrice = (val: number) =>
    Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns: ColumnDef<Product>[] = [
    {
      id: "image",
      header: "Image",
      cell: ({ row }) =>
        row.original.image ? (
          <img
            src={row.original.image}
            alt={row.original.name}
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-base-200 flex items-center justify-center text-base-content/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Product Name",
    },
    {
      id: "brand",
      header: "Brand",
      cell: ({ row }) => row.original.brand?.name || "—",
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "—",
    },
    {
      accessorKey: "costPrice",
      header: "Buy Price",
      cell: ({ getValue }) => formatPrice(getValue() as number),
    },
    {
      accessorKey: "sellingPrice",
      header: "Sale Price",
      cell: ({ getValue }) => formatPrice(getValue() as number),
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const totalStock = row.original.totalStock ?? 0;
        const alertQty = Number(row.original.alertQuantity);
        const isLow = totalStock <= alertQty;
        return (
          <span className={`badge ${isLow ? "badge-warning" : "badge-ghost"}`}>
            {Number(totalStock).toFixed(0)}
          </span>
        );
      },
    },
    {
      id: "unit",
      header: "Unit",
      cell: ({ row }) => row.original.unit?.shortName || "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="dropdown dropdown-end">
          <button tabIndex={0} className="btn btn-sm btn-ghost">
            ⋮ Actions
          </button>
          <ul tabIndex={0} className="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 w-44 p-1 shadow border border-base-200">
            <li>
              <button onClick={() => setDetailsProduct(row.original)}>Product Details</button>
            </li>
            <li>
              <Link href={`/products/edit/${row.original.id}`}>Edit Product</Link>
            </li>
            <li>
              <button onClick={() => handleDuplicate(row.original)}>Duplicate</button>
            </li>
            <li>
              <Link href={`/products/print-labels?productId=${row.original.id}`}>Print Label</Link>
            </li>
            <li>
              <button
                onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
                className="text-error"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and inventory"
        actions={
          <div className="flex gap-2">
            <Link href="/products/import" className="btn btn-outline btn-sm">
              Import
            </Link>
            <Link href="/products/print-labels" className="btn btn-outline btn-sm">
              Print Labels
            </Link>
            <Link href="/products/add" className="btn btn-primary btn-sm">
              + Add Product
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="select select-bordered select-sm"
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categoriesData?.data.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="select select-bordered select-sm"
          value={brandId}
          onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
        >
          <option value="">All Brands</option>
          {brandsData?.data.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="select select-bordered select-sm"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="STANDARD">Standard</option>
          <option value="DIGITAL">Digital</option>
          <option value="SERVICE">Service</option>
          <option value="COMBO">Combo</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={isActiveFilter}
          onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="">Active & Inactive</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        loading={isLoading || isFetching}
        exportFilename="products"
        searchPlaceholder="Search by name or code..."
      />

      {detailsProduct && (
        <ProductDetailsModal
          product={detailsProduct}
          open={!!detailsProduct}
          onClose={() => setDetailsProduct(null)}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Product"
        message="Are you sure? This cannot be undone. Products with existing stock cannot be deleted."
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteProduct(deleteId).unwrap();
            toast.success("Product deleted");
            setShowDeleteConfirm(false);
            setDeleteId(null);
          } catch (err: any) {
            toast.error(err.data?.error || "Failed to delete");
          }
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        confirmText="Delete"
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
