"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Send, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFreighter } from "@/hooks/useFreighter";
import { isValidStellarAddress } from "@/lib/stellar-address";
import { cn } from "@/utils";

type Status = "active" | "inactive" | "on_leave" | "pending" | "offboarded";
type Priority = "low" | "medium" | "high";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email?: string | null;
  walletAddress?: string | null;
  role: string;
  department: string;
  status: Status;
  priority: Priority;
  createdAt?: string;
};

type EmployeePayment = {
  id: string;
  amountXlm: string;
  note?: string | null;
  status: "completed" | "failed";
  payoutTxHash?: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = typeof params?.id === "string" ? params.id : "";
  const { publicKey } = useFreighter();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [totalPaidXlm, setTotalPaidXlm] = useState("0.0000000");
  const [savingDetails, setSavingDetails] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  /** Wallet last loaded from or saved to the server (POST payout uses DB, not draft form). */
  const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);

  const loadEmployee = useCallback(async () => {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G") || !employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSavedWalletAddress(null);
    try {
      const [employeeRes, paymentsRes] = await Promise.all([
        fetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
          cache: "no-store",
          credentials: "same-origin",
        }),
        fetch(`/api/employees/${encodeURIComponent(employeeId)}/payments`, {
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      const employeeJson = await employeeRes.json().catch(() => ({}));
      if (!employeeRes.ok) {
        throw new Error(
          typeof employeeJson?.error === "string" ? employeeJson.error : "Failed to load employee"
        );
      }
      const emp = employeeJson.employee as Employee;
      setEmployee(emp);
      const w = typeof emp.walletAddress === "string" ? emp.walletAddress.trim() : "";
      setSavedWalletAddress(w.length ? w : null);

      const paymentsJson = await paymentsRes.json().catch(() => ({}));
      if (paymentsRes.ok) {
        const list = Array.isArray(paymentsJson?.payments)
          ? (paymentsJson.payments as EmployeePayment[])
          : [];
        setPayments(list);
        setTotalPaidXlm(
          typeof paymentsJson?.totals?.paidXlm === "string"
            ? paymentsJson.totals.paidXlm
            : "0.0000000"
        );
      } else {
        setPayments([]);
        setTotalPaidXlm("0.0000000");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load employee");
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, publicKey]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  const completedCount = useMemo(
    () => payments.filter((p) => p.status === "completed").length,
    [payments]
  );

  const saveEmployeeDetails = async () => {
    if (!employee || !publicKey) return;
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(employee.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: employee.name,
          email: employee.email ?? null,
          employeeWalletAddress: employee.walletAddress ?? null,
          role: employee.role,
          department: employee.department,
          status: employee.status,
          priority: employee.priority,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Could not save details");
      }
      toast.success("Employee details updated");
      await loadEmployee();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save details");
    } finally {
      setSavingDetails(false);
    }
  };

  const payWalletReady = isValidStellarAddress(savedWalletAddress ?? "");

  const payNow = async () => {
    if (!employee || !publicKey || !payWalletReady) return;
    const amount = Number.parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(employee.id)}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amountXlm: amount.toString(),
          note: payNote.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Payment failed");
      }
      const payment = json?.payment as EmployeePayment | undefined;
      if (payment?.status === "failed") {
        toast.error("Payout failed. Logged in history with failed status.");
      } else {
        toast.success("Payment logged successfully");
      }
      setPayOpen(false);
      setPayAmount("");
      setPayNote("");
      await loadEmployee();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-white/40">Connect your wallet to view this page.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-white/40">Employee not found.</p>
        <Button onClick={() => router.push("/dashboard/employee-management")}>Back</Button>
      </div>
    );
  }

  return (
    <DashboardMain>
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-1 w-fit text-white/60 hover:text-white"
          onClick={() => router.push("/dashboard/employee-management")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Employee management
        </Button>

        <DashboardPageHeader
          eyebrow="Employee"
          title={employee?.name ?? "Employee details"}
          description={employee ? `${employee.employeeCode} · ${employee.role}` : "Loading..."}
          end={
            <Button
              size="sm"
              className="rounded-full border border-white/10 bg-foreground text-xs font-semibold text-background hover:opacity-90"
              disabled={!employee || loading || !payWalletReady}
              title={
                payWalletReady
                  ? undefined
                  : "Add a valid Stellar wallet (G…, 56 chars) on this profile and save to enable Pay now."
              }
              onClick={() => setPayOpen(true)}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Pay now
            </Button>
          }
        />

        {loading ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-white/40">
            Loading employee details...
          </div>
        ) : !employee ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-white/40">
            Employee not found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-white/[0.12] bg-white/[0.03]">
                <CardContent className="p-5">
                  <p className="text-xs text-white/40">Total paid</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalPaidXlm} XLM</p>
                </CardContent>
              </Card>
              <Card className="border-white/[0.12] bg-white/[0.03]">
                <CardContent className="p-5">
                  <p className="text-xs text-white/40">Completed payouts</p>
                  <p className="mt-1 text-2xl font-bold text-white">{completedCount}</p>
                </CardContent>
              </Card>
              <Card className="border-white/[0.12] bg-white/[0.03]">
                <CardContent className="p-5">
                  <p className="text-xs text-white/40">Last payment</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {payments[0] ? formatDate(payments[0].createdAt) : "No payments yet"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
              <Card className="border-white/[0.12] bg-white/[0.03]">
                <CardContent className="space-y-4 p-5">
                  <p className="text-sm font-medium text-white">Employee profile</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Name</Label>
                    <Input
                      value={employee.name}
                      onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                      className="h-9 border-white/[0.1] bg-white/[0.04]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Email</Label>
                    <Input
                      value={employee.email ?? ""}
                      onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                      className="h-9 border-white/[0.1] bg-white/[0.04]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Wallet address</Label>
                    <Input
                      value={employee.walletAddress ?? ""}
                      onChange={(e) =>
                        setEmployee({ ...employee, walletAddress: e.target.value })
                      }
                      className="h-9 border-white/[0.1] bg-white/[0.04]"
                      placeholder="G..."
                    />
                    <p className="text-[11px] text-white/35">
                      If set, Pay now attempts on-chain payout and records tx hash.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Role</Label>
                    <Input
                      value={employee.role}
                      onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                      className="h-9 border-white/[0.1] bg-white/[0.04]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Department</Label>
                    <Input
                      value={employee.department}
                      onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                      className="h-9 border-white/[0.1] bg-white/[0.04]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">Status</Label>
                      <Select
                        value={employee.status}
                        onValueChange={(v) =>
                          setEmployee({ ...employee, status: v as Status })
                        }
                      >
                        <SelectTrigger className="h-9 border-white/[0.1] bg-white/[0.04]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.1] bg-[#0f0f1a] text-white">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On leave</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="offboarded">Offboarded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/50">Priority</Label>
                      <Select
                        value={employee.priority}
                        onValueChange={(v) =>
                          setEmployee({ ...employee, priority: v as Priority })
                        }
                      >
                        <SelectTrigger className="h-9 border-white/[0.1] bg-white/[0.04]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.1] bg-[#0f0f1a] text-white">
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={saveEmployeeDetails} disabled={savingDetails} className="w-full">
                    {savingDetails ? "Saving..." : "Save details"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/[0.12] bg-white/[0.03]">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Payment history</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={!payWalletReady}
                      title={
                        payWalletReady
                          ? undefined
                          : "Save a valid employee wallet on this profile to enable payouts."
                      }
                      onClick={() => setPayOpen(true)}
                    >
                      <Wallet className="mr-1.5 h-3.5 w-3.5" />
                      Pay now
                    </Button>
                  </div>
                  {payments.length === 0 ? (
                    <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-6 text-sm text-white/35">
                      No payments yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.08]">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-white">{p.amountXlm} XLM</p>
                            <p className="text-xs text-white/45">{formatDate(p.createdAt)}</p>
                            {p.note ? <p className="text-xs text-white/40">{p.note}</p> : null}
                          </div>
                          <div className="text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                                p.status === "completed"
                                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                                  : "border-red-500/35 bg-red-500/10 text-red-300"
                              )}
                            >
                              {p.status === "completed" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {p.status}
                            </span>
                            {p.payoutTxHash ? (
                              <a
                                href={`https://stellar.expert/explorer/${(process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet") === "public" ? "public" : "testnet"}/tx/${p.payoutTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-200/80 hover:text-amber-100"
                              >
                                tx
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="border-white/15 bg-[#0a0f1b] text-white">
            <DialogHeader>
              <DialogTitle>Pay employee</DialogTitle>
              <DialogDescription className="text-white/45">
                Record payment and attempt payout if wallet is set on profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Amount (XLM)</Label>
                <Input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="h-9 border-white/[0.1] bg-white/[0.04]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Note</Label>
                <Textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Optional note (month salary, bonus, reimbursement...)"
                  className="min-h-[92px] border-white/[0.1] bg-white/[0.04]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button onClick={payNow} disabled={paying || !payWalletReady}>
                {paying ? "Processing..." : "Pay now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardMain>
  );
}
