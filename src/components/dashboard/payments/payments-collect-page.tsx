"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { PaymentsCollectTab } from "@/components/dashboard/payments/payments-collect-tab";
import { PaymentsCustomersTab } from "@/components/dashboard/payments/payments-customers-tab";
import { PaymentsSendTab } from "@/components/dashboard/payments/payments-send-tab";
import { PaymentsSubscriptionsTab } from "@/components/dashboard/payments/payments-subscriptions-tab";
import {
  PaymentTabsNav,
  PaymentsSidebar,
  isPaymentTabEnabled,
  type PaymentTabId,
  PAYMENT_TABS,
} from "@/components/dashboard/payments/payments-shared";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

const VALID_TABS = new Set<string>(PAYMENT_TABS.map((t) => t.id));

function parseTab(value: string | null, isDemo: boolean): PaymentTabId {
  if (value && VALID_TABS.has(value)) {
    const tab = value as PaymentTabId;
    if (isPaymentTabEnabled(tab, isDemo)) return tab;
  }
  return "collect";
}

interface PaymentsCollectPageProps {
  businessId: string;
}

export function PaymentsCollectPage({ businessId }: PaymentsCollectPageProps) {
  const { theme } = useDashboardTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDemo, demoPath } = useDemoMode();
  const paymentsBase = demoPath("/dashboard/payment-links");
  const tabFromUrl = parseTab(searchParams.get("tab"), isDemo);
  const [activeTab, setActiveTab] = useState<PaymentTabId>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (!raw || isPaymentTabEnabled(raw as PaymentTabId, isDemo)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const qs = params.toString();
    router.replace(qs ? `${paymentsBase}?${qs}` : paymentsBase, {
      scroll: false,
    });
  }, [router, searchParams, isDemo, paymentsBase]);

  const handleTabChange = useCallback(
    (tab: PaymentTabId) => {
      if (!isPaymentTabEnabled(tab, isDemo)) return;
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "collect") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${paymentsBase}?${qs}` : paymentsBase, {
        scroll: false,
      });
    },
    [router, searchParams, isDemo, paymentsBase]
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PaymentTabsNav activeTab={activeTab} onTabChange={handleTabChange} theme={theme} />

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        {activeTab === "collect" ? <PaymentsCollectTab businessId={businessId} /> : null}
        {activeTab === "send" ? <PaymentsSendTab businessId={businessId} /> : null}
        {activeTab === "subscriptions" ? <PaymentsSubscriptionsTab /> : null}
        {activeTab === "customers" ? <PaymentsCustomersTab /> : null}
        <PaymentsSidebar tab={activeTab} theme={theme} businessId={businessId} />
      </div>
    </div>
  );
}
