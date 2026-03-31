"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import {
  useGetProductQuery,
  useUpdateProductMutation,
  ProductInput,
} from "@/store/api/productsApi";
import toast from "react-hot-toast";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: product, isLoading: isLoadingProduct } = useGetProductQuery(params.id);
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const handleSubmit = async (data: ProductInput) => {
    try {
      await updateProduct({ id: params.id, data }).unwrap();
      toast.success("Product updated successfully");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to update product");
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-base-content/60">Product not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>
      <ProductForm product={product} onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
