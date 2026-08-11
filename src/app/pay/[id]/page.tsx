"use client";

import { useParams } from "next/navigation";
import { PaymentCheckout } from "@/components/pay/payment-checkout";

export default function PayPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  if (!id) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F8FAFC] text-sm text-slate-500">
        Missing payment link.
      </div>
    );
  }

  return <PaymentCheckout linkId={id} />;
}
