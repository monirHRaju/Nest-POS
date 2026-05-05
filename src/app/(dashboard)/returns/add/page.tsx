"use client";

import { useRouter } from "next/navigation";
import { ReturnForm } from "@/components/forms/ReturnForm";
import { useCreateReturnMutation, ReturnInput } from "@/store/api/returnsApi";
import toast from "react-hot-toast";

export default function AddReturnPage() {
  const router = useRouter();
  const [createReturn, { isLoading }] = useCreateReturnMutation();

  const handleSubmit = async (data: ReturnInput) => {
    try {
      await createReturn(data).unwrap();
      toast.success("Return created — stock restored");
      router.push("/returns");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create return");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Add Return</h1>
      </div>
      <ReturnForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
