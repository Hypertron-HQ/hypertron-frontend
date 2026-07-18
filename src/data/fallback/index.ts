import business from "./business.json";
import dashboardStats from "./dashboard-stats.json";
import events from "./events.json";
import paymentLinks from "./payment-links.json";
import balance from "./balance.json";
import withdrawals from "./withdrawals.json";

export const fallbackBusiness = business as {
  businessId: string;
  walletAddress: string;
  receiveAddress: string;
  selectedWidgets: string[];
  name: string;
  email: string;
};

export const fallbackDashboardStats = dashboardStats as {
  totalReceivedXlm: string;
  linkCount: number;
  completed: number;
  pending: number;
};

export const fallbackEvents = events.events as Array<{
  linkId: string;
  businessId: string;
  amount: string;
  workflowStage?: string;
  paidAt: string;
  commitmentId?: string;
}>;

export const fallbackPaymentLinks = paymentLinks.links as Array<{
  id: string;
  url: string;
  amount: string | null;
  purpose: string | null;
  clientName: string | null;
  workflowStage: string | null;
  linkMemo: string;
  paidAt: string | null;
  paymentTxHash: string | null;
  commitmentTxHash: string | null;
  createdAt: string;
}>;

export const fallbackBalance = balance as {
  virtualBalanceXlm: string;
  unspentCount: number;
};

export const fallbackWithdrawals = withdrawals.withdrawals as Array<{
  id: string;
  amount: string;
  recipientAddress: string;
  status: string;
  payoutTxHash: string | null;
  contractTxHash: string | null;
  createdAt: string;
}>;


/** Set true only for offline UI demos without MongoDB. Production: false. */
export const USE_MOCK_DASHBOARD_DATA = false;
