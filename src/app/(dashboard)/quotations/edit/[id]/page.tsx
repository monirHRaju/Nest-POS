"use client";

import { useRouter, useParams } from "next/navigation";
import { QuotationForm } from "@/components/forms/QuotationForm";
import { useGetQuotationQuery, useUpdateQuotationMutation, QuotationInput } from "@/store/api/quotationsApi";
import toast from "react-hot-toast";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: quotation, isLoading } = useGetQuotationQuery(params.id);
  const [updateQuotation, { isLoading: isSaving }] = useUpdateQuotationMutation();

  const handleSubmit = async (data: QuotationInput) => {
    try {
      await updateQuotation({ id: params.id, data }).unwrap();
      toast.success("Updated");
      router.push("/quotations");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to update");
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  if (!quotation) return <div>Not found</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
        <h1 className="text-2xl font-bold">Edit Quotation — {quotation.referenceNo}</h1>
      </div>
      <QuotationForm quotation={quotation} onSubmit={handleSubmit} loading={isSaving} />
    </div>
  );
}
