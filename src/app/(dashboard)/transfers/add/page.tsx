"use client";

import { useRouter } from "next/navigation";
import { TransferForm } from "@/components/forms/TransferForm";
import { useCreateTransferMutation, TransferInput } from "@/store/api/transfersApi";
import toast from "react-hot-toast";

export default function AddTransferPage() {
  const router = useRouter();
  const [createTransfer, { isLoading }] = useCreateTransferMutation();

  const handleSubmit = async (data: TransferInput) => {
    try {
      await createTransfer(data).unwrap();
      toast.success("Transfer created");
      router.push("/transfers");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Add Transfer</h1>
      </div>
      <TransferForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
