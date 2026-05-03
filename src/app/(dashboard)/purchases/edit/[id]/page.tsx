"use client";

import { useRouter, useParams } from "next/navigation";
import { PurchaseForm } from "@/components/forms/PurchaseForm";
import { useGetPurchaseQuery, useUpdatePurchaseMutation, PurchaseInput } from "@/store/api/purchasesApi";
import toast from "react-hot-toast";

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: purchase, isLoading } = useGetPurchaseQuery(params.id);
  const [updatePurchase, { isLoading: isSaving }] = useUpdatePurchaseMutation();

  const handleSubmit = async (data: PurchaseInput) => {
    try {
      await updatePurchase({ id: params.id, data }).unwrap();
      toast.success("Purchase updated");
      router.push("/purchases");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to update purchase");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  }
  if (!purchase) return <div>Not found</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Edit Purchase — {purchase.referenceNo}</h1>
      </div>
      <PurchaseForm purchase={purchase} onSubmit={handleSubmit} loading={isSaving} />
    </div>
  );
}
