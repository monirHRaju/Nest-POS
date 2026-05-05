"use client";

import { useRouter } from "next/navigation";
import { QuotationForm } from "@/components/forms/QuotationForm";
import { useCreateQuotationMutation, QuotationInput } from "@/store/api/quotationsApi";
import toast from "react-hot-toast";

export default function AddQuotationPage() {
  const router = useRouter();
  const [createQuotation, { isLoading }] = useCreateQuotationMutation();

  const handleSubmit = async (data: QuotationInput) => {
    try {
      await createQuotation(data).unwrap();
      toast.success("Quotation created");
      router.push("/quotations");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Add Quotation</h1>
      </div>
      <QuotationForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
