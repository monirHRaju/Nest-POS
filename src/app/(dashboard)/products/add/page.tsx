"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { useCreateProductMutation, ProductInput } from "@/store/api/productsApi";
import toast from "react-hot-toast";

export default function AddProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleSubmit = async (data: ProductInput) => {
    try {
      await createProduct(data).unwrap();
      toast.success("Product created successfully");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create product");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>
      <ProductForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
