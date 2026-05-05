"use client";

import { useRouter } from "next/navigation";
import { SaleForm } from "@/components/forms/SaleForm";
import { useCreateSaleMutation, SaleInput } from "@/store/api/salesApi";
import toast from "react-hot-toast";

export default function AddSalePage() {
  const router = useRouter();
  const [createSale, { isLoading }] = useCreateSaleMutation();

  const handleSubmit = async (data: SaleInput) => {
    try {
      await createSale(data).unwrap();
      toast.success("Sale created");
      router.push("/sales");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create sale");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Add Sale</h1>
      </div>
      <SaleForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
