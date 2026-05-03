"use client";

import { useRouter } from "next/navigation";
import { PurchaseForm } from "@/components/forms/PurchaseForm";
import { useCreatePurchaseMutation, PurchaseInput } from "@/store/api/purchasesApi";
import toast from "react-hot-toast";

export default function AddPurchasePage() {
  const router = useRouter();
  const [createPurchase, { isLoading }] = useCreatePurchaseMutation();

  const handleSubmit = async (data: PurchaseInput) => {
    try {
      await createPurchase(data).unwrap();
      toast.success("Purchase created");
      router.push("/purchases");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create purchase");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Add Purchase</h1>
      </div>
      <PurchaseForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
