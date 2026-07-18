"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Filter,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { SectionInfo, usePaymentsStyles } from "@/components/dashboard/payments/payments-shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils";

type CustomerStatus = "Active" | "New" | "At risk" | "Churned";
type CustomerFilter = "all" | "active" | "new" | "high-value";

type Customer = {
  id: string;
  name: string;
  email: string;
  wallet: string;
  totalPaid: number;
  lastPayment: string;
  payments: number;
  status: CustomerStatus;
  since: string;
};

const CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "Riya Sharma",
    email: "riya@designco.io",
    wallet: "GABC…7K2M",
    totalPaid: 4200,
    lastPayment: "May 28, 2026",
    payments: 8,
    status: "Active",
    since: "Jan 2026",
  },
  {
    id: "2",
    name: "Acme Corp",
    email: "billing@acme.io",
    wallet: "GBCD…9P4Q",
    totalPaid: 12500,
    lastPayment: "May 27, 2026",
    payments: 24,
    status: "Active",
    since: "Oct 2025",
  },
  {
    id: "3",
    name: "Zara Ali",
    email: "zara@freelance.dev",
    wallet: "GDEF…3R8S",
    totalPaid: 890,
    lastPayment: "May 26, 2026",
    payments: 3,
    status: "New",
    since: "May 2026",
  },
  {
    id: "4",
    name: "Neha Gupta",
    email: "neha@startup.xyz",
    wallet: "GHIJ…1T6U",
    totalPaid: 2100,
    lastPayment: "Apr 12, 2026",
    payments: 5,
    status: "At risk",
    since: "Feb 2026",
  },
  {
    id: "5",
    name: "Marcus Lee",
    email: "marcus@agency.com",
    wallet: "GKLM…5V2W",
    totalPaid: 6800,
    lastPayment: "May 20, 2026",
    payments: 14,
    status: "Active",
    since: "Nov 2025",
  },
  {
    id: "6",
    name: "CloudHost Inc",
    email: "ap@cloudhost.io",
    wallet: "GNOP…8X4Y",
    totalPaid: 320,
    lastPayment: "Mar 1, 2026",
    payments: 2,
    status: "Churned",
    since: "Dec 2025",
  },
];

const STATUS_STYLES: Record<CustomerStatus, { light: string; dark: string }> = {
  Active: {
    light: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dark: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  },
  New: {
    light: "border-blue-200 bg-blue-50 text-blue-700",
    dark: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  },
  "At risk": {
    light: "border-amber-200 bg-amber-50 text-amber-700",
    dark: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  },
  Churned: {
    light: "border-slate-200 bg-slate-50 text-slate-500",
    dark: "border-white/10 bg-white/5 text-slate-400",
  },
};

function CustomerStatusBadge({ status, dark }: { status: CustomerStatus; dark: boolean }) {
  const styles = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", dark ? styles.dark : styles.light)}>
      {status}
    </Badge>
  );
}

function avatarColor(name: string) {
  const colors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export function PaymentsCustomersTab() {
  const { theme } = useDashboardTheme();
  const { t, inputCls, labelCls, sectionTitle, cardCls } = usePaymentsStyles(theme);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [sortBy, setSortBy] = useState<"recent" | "value" | "name">("recent");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWallet, setNewWallet] = useState("");

  const filtered = useMemo(() => {
    let list = [...CUSTOMERS];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.wallet.toLowerCase().includes(q)
      );
    }
    if (filter === "active") list = list.filter((c) => c.status === "Active");
    if (filter === "new") list = list.filter((c) => c.status === "New");
    if (filter === "high-value") list = list.filter((c) => c.totalPaid >= 5000);
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "value") return b.totalPaid - a.totalPaid;
      return new Date(b.lastPayment).getTime() - new Date(a.lastPayment).getTime();
    });
    return list;
  }, [search, filter, sortBy]);

  const stats = useMemo(
    () => ({
      total: CUSTOMERS.length,
      active: CUSTOMERS.filter((c) => c.status === "Active").length,
      newThisMonth: CUSTOMERS.filter((c) => c.status === "New").length,
      atRisk: CUSTOMERS.filter((c) => c.status === "At risk").length,
    }),
    []
  );

  function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setShowAddForm(false);
    setNewName("");
    setNewEmail("");
    setNewWallet("");
  }

  return (
    <div className={cardCls}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", t.pageHeading)}>
            Customers
          </h1>
          <p className={cn("mt-1 text-sm", t.pageSubheading)}>
            Manage contacts, view payment history, and track customer health.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="h-10 shrink-0 gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Customer"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, hint: "All customers" },
          { label: "Active", value: stats.active, hint: "Paid in last 30d" },
          { label: "New", value: stats.newThisMonth, hint: "This month" },
          { label: "At risk", value: stats.atRisk, hint: "Needs follow-up" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-lg border px-4 py-3",
              t.dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/50"
            )}
          >
            <p className={cn("text-xs", t.pageSubheading)}>{stat.label}</p>
            <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", t.pageHeading)}>{stat.value}</p>
            <p className={cn("mt-0.5 text-[10px]", t.cardMuted)}>{stat.hint}</p>
          </div>
        ))}
      </div>

      {showAddForm ? (
        <form
          onSubmit={handleAddCustomer}
          className={cn(
            "mb-6 rounded-xl border p-5",
            t.dark ? "border-blue-500/30 bg-blue-500/5" : "border-blue-200 bg-blue-50/40"
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <h2 className={sectionTitle}>New Customer</h2>
            <SectionInfo className={t.cardMuted} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="new-name" className={labelCls}>
                Full name
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Doe"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email" className={labelCls}>
                Email
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@company.io"
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-wallet" className={labelCls}>
                Wallet <span className={cn("font-normal", t.pageSubheading)}>(optional)</span>
              </Label>
              <Input
                id="new-wallet"
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                placeholder="G…"
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-500">
              Save Customer
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", t.cardMuted)} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or wallet…"
            className={cn(inputCls, "pl-9")}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={cn("absolute right-3 top-1/2 -translate-y-1/2", t.cardMuted)}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as CustomerFilter)}>
            <SelectTrigger className={cn("h-9 w-[130px] gap-2 text-sm", t.selectTrigger)}>
              <Filter className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={t.selectContent}>
              <SelectItem value="all" className={t.selectItem}>All</SelectItem>
              <SelectItem value="active" className={t.selectItem}>Active</SelectItem>
              <SelectItem value="new" className={t.selectItem}>New</SelectItem>
              <SelectItem value="high-value" className={t.selectItem}>High value</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className={cn("h-9 w-[130px] gap-2 text-sm", t.selectTrigger)}>
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={t.selectContent}>
              <SelectItem value="recent" className={t.selectItem}>Recent</SelectItem>
              <SelectItem value="value" className={t.selectItem}>Highest value</SelectItem>
              <SelectItem value="name" className={t.selectItem}>Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center",
            t.dark ? "border-white/15 bg-white/[0.02]" : "border-slate-200 bg-slate-50/30"
          )}
        >
          <User className={cn("h-10 w-10", t.cardMuted)} />
          <p className={cn("mt-3 text-sm font-medium", t.pageHeading)}>No customers found</p>
          <p className={cn("mt-1 max-w-xs text-sm", t.pageSubheading)}>
            {search ? "Try a different search term or clear filters." : "Add your first customer to get started."}
          </p>
          {search ? (
            <Button type="button" variant="outline" className={cn("mt-4", t.outlineBtn)} onClick={() => setSearch("")}>
              Clear search
            </Button>
          ) : (
            <Button type="button" className="mt-4 bg-blue-600 text-white hover:bg-blue-500" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Customer
            </Button>
          )}
        </div>
      ) : (
        <div className={cn("overflow-hidden rounded-xl border", t.dark ? "border-white/10" : "border-slate-200")}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className={cn(t.dark ? "border-white/10 hover:bg-transparent" : "border-slate-100 hover:bg-transparent")}>
                <TableHead className={cn("w-[30%] px-3 text-xs font-medium", t.pageSubheading)}>Customer</TableHead>
                <TableHead className={cn("hidden w-[22%] px-3 text-xs font-medium md:table-cell", t.pageSubheading)}>Contact</TableHead>
                <TableHead className={cn("hidden w-[14%] px-3 text-xs font-medium lg:table-cell", t.pageSubheading)}>Wallet</TableHead>
                <TableHead className={cn("w-[14%] px-3 text-xs font-medium", t.pageSubheading)}>Total paid</TableHead>
                <TableHead className={cn("hidden w-[14%] px-3 text-xs font-medium sm:table-cell", t.pageSubheading)}>Last payment</TableHead>
                <TableHead className={cn("w-[12%] px-3 text-xs font-medium", t.pageSubheading)}>Status</TableHead>
                <TableHead className="w-10 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    t.dark ? "border-white/10 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50/80"
                  )}
                >
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColor(customer.name))}>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-medium", t.pageHeading)}>{customer.name}</p>
                        <p className={cn("text-[11px]", t.pageSubheading)}>Since {customer.since}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-3 py-3 md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Mail className={cn("h-3.5 w-3.5 shrink-0", t.cardMuted)} />
                      <span className={cn("truncate text-sm", t.pageSubheading)}>{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-3 py-3 lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Wallet className={cn("h-3.5 w-3.5 shrink-0", t.cardMuted)} />
                      <span className={cn("font-mono text-xs", t.pageSubheading)}>{customer.wallet}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div>
                      <p className={cn("text-sm font-semibold tabular-nums", t.pageHeading)}>
                        ${customer.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className={cn("text-[11px]", t.pageSubheading)}>{customer.payments} payments</p>
                    </div>
                  </TableCell>
                  <TableCell className={cn("hidden px-3 py-3 text-sm sm:table-cell", t.pageSubheading)}>
                    {customer.lastPayment}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <CustomerStatusBadge status={customer.status} dark={t.dark} />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            t.menuBtn
                          )}
                          aria-label={`Actions for ${customer.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={cn("min-w-[160px] rounded-xl border", t.menuContent)}>
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                          Send payment
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                          Create payment link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={t.menuSeparator} />
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px] text-red-500", t.menuItem)}>
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 ? (
        <p className={cn("mt-3 text-center text-xs", t.pageSubheading)}>
          Showing {filtered.length} of {CUSTOMERS.length} customers
        </p>
      ) : null}
    </div>
  );
}
