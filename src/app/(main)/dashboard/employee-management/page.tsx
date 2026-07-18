"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
  UserX,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronsLeft,
  ChevronsRight,
  Users,
  UserCheck,
  UserMinus,
  Download,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFreighter } from "@/hooks/useFreighter";
import { cn } from "@/utils";

type Status = "active" | "inactive" | "on_leave" | "pending" | "offboarded";
type Priority = "low" | "medium" | "high";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email?: string | null;
  walletAddress?: string | null;
  role: string;
  department: string;
  status: Status;
  priority: Priority;
}

const statusConfig: Record<Status, { label: string; icon: React.ElementType; pill: string }> = {
  active:     { label: "Active",      icon: CheckCircle2, pill: "bg-emerald-500/12 border-emerald-500/25 text-emerald-400" },
  inactive:   { label: "Inactive",    icon: XCircle,      pill: "bg-white/[0.05] border-white/[0.1] text-white/40" },
  on_leave:   { label: "On leave",    icon: Clock,        pill: "bg-amber-500/10 border-amber-500/25 text-amber-400" },
  pending:    { label: "Pending",     icon: Circle,       pill: "bg-blue-500/10 border-blue-500/25 text-blue-400" },
  offboarded: { label: "Offboarded",  icon: UserX,        pill: "bg-red-500/10 border-red-500/25 text-red-400/80" },
};

const priorityConfig: Record<Priority, { label: string; icon: React.ElementType; cls: string }> = {
  high:   { label: "High",   icon: ArrowUp,   cls: "text-red-400" },
  medium: { label: "Medium", icon: Minus,     cls: "text-amber-400" },
  low:    { label: "Low",    icon: ArrowDown, cls: "text-white/35" },
};

const deptColors: Record<string, string> = {
  Engineering: "border-sky-500/30 bg-sky-500/15 text-sky-200",
  Design:      "bg-pink-500/12 text-pink-300 border-pink-500/25",
  Operations:  "bg-blue-500/10 text-blue-300 border-blue-500/25",
  Support:     "bg-teal-500/10 text-teal-300 border-teal-500/25",
  Marketing:   "bg-orange-500/10 text-orange-300 border-orange-500/25",
  Finance:     "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
};

const ROWS_PER_PAGE = 10;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const avatarHues = [
  "bg-amber-500/20 text-amber-200",
  "bg-sky-500/20 text-sky-200",
  "bg-teal-500/15 text-teal-300",
  "bg-blue-500/15 text-blue-300",
  "bg-amber-500/10 text-amber-100/90",
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % avatarHues.length;
  return avatarHues[i];
}

export default function EmployeeManagementPage() {
  const router = useRouter();
  const { publicKey } = useFreighter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("active");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  const fetchEmployees = useCallback(async () => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) {
      setEmployees([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Failed to load employees");
      }
      const list = Array.isArray(json?.employees)
        ? json.employees.filter((e: unknown) => !!e && typeof e === "object")
        : [];
      setEmployees(list as Employee[]);
    } catch (e) {
      setEmployees([]);
      toast.error(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filtered = useMemo(() => {
    let list = employees;
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      list = list.filter((e) =>
        e.employeeCode.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((e) => e.priority === priorityFilter);
    return list;
  }, [employees, filter, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(paginated.map((e) => e.id)));
    else setSelected(new Set());
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    onLeave: employees.filter((e) => e.status === "on_leave").length,
    inactive: employees.filter((e) => e.status === "inactive" || e.status === "offboarded").length,
  }), [employees]);

  const addEmployee = async () => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) return;
    if (!newName.trim() || !newRole.trim() || !newDepartment.trim()) {
      toast.error("Name, role, and department are required");
      return;
    }
    setSavingAdd(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || null,
          employeeWalletAddress: newWalletAddress.trim() || null,
          role: newRole.trim(),
          department: newDepartment.trim(),
          status: newStatus,
          priority: newPriority,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Could not add employee");
      }
      setAddOpen(false);
      setNewName("");
      setNewRole("");
      setNewDepartment("");
      setNewEmail("");
      setNewWalletAddress("");
      setNewStatus("active");
      setNewPriority("medium");
      await fetchEmployees();
      toast.success("Employee added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add employee");
    } finally {
      setSavingAdd(false);
    }
  };

  const removeEmployees = async (ids: string[]) => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) return;
    if (ids.length === 0) return;
    try {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ids,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Could not remove employee(s)");
      }
      setSelected(new Set());
      await fetchEmployees();
      toast.success(ids.length > 1 ? "Employees removed" : "Employee removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove employee(s)");
    }
  };

  const patchEmployee = async (
    id: string,
    patch: Partial<Pick<Employee, "status" | "priority">>
  ) => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) return;
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Could not update employee");
      }
      await fetchEmployees();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update employee");
    }
  };

  const openEmployee = (employeeId: string) => {
    router.push(`/dashboard/employee-management/${encodeURIComponent(employeeId)}`);
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/40 text-center text-sm">Connect your wallet to view this page.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <DashboardMain>
      <div className="flex flex-col gap-6">

        <DashboardPageHeader
          eyebrow="Team"
          title="Employee management"
          description="Manage your team members and their roles."
          end={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEmployees()}
                disabled={loading}
                className="h-9 gap-1.5 rounded-full border-white/12 bg-white/[0.04] text-xs text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
              >
                <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-full border-white/12 bg-white/[0.04] text-xs text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-full border border-white/10 bg-foreground text-xs font-semibold text-background hover:opacity-90"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add employee
              </Button>
            </div>
          }
        />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",    value: stats.total,    icon: Users,      cls: "text-white/60",    bg: "bg-white/[0.05]" },
            { label: "Active",   value: stats.active,   icon: UserCheck,  cls: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "On leave", value: stats.onLeave,  icon: Clock,      cls: "text-amber-400",   bg: "bg-amber-500/10" },
            { label: "Inactive", value: stats.inactive, icon: UserMinus,  cls: "text-red-400/80",  bg: "bg-red-500/10" },
          ].map(({ label, value, icon: Icon, cls, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08]", bg)}>
                <Icon className={cn("h-4 w-4", cls)} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{value}</p>
                <p className="text-xs text-white/35 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-white/45">
              {loading ? "Loading team..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
            </p>
            {(filter || statusFilter !== "all" || priorityFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-white/50 hover:text-white"
                onClick={() => {
                  setFilter("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <Input
              placeholder="Search by name, role, ID…"
              className="pl-8 h-8 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-white/25 focus:ring-0 text-sm"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] bg-white/[0.04] border-white/[0.08] text-white text-sm focus:ring-0 focus:border-white/25 data-[placeholder]:text-white/30">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f1a] border-white/[0.1] text-white">
              <SelectItem value="all" className="text-sm text-white/70 focus:bg-white/10 focus:text-white">All status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-sm text-white/70 focus:bg-white/10 focus:text-white">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] bg-white/[0.04] border-white/[0.08] text-white text-sm focus:ring-0 focus:border-white/25 data-[placeholder]:text-white/30">
              <SelectValue placeholder="All priority" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f1a] border-white/[0.1] text-white">
              <SelectItem value="all" className="text-sm text-white/70 focus:bg-white/10 focus:text-white">All priority</SelectItem>
              {Object.entries(priorityConfig).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-sm text-white/70 focus:bg-white/10 focus:text-white">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-xs text-white/50">
                {selected.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 border border-red-500/20 px-2.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => removeEmployees(Array.from(selected))}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_140px_130px_100px_44px] items-center border-b border-white/[0.06] px-4 py-2.5">
            <div>
              <Checkbox
                checked={paginated.length > 0 && selected.size === paginated.length}
                onCheckedChange={(c) => toggleSelectAll(!!c)}
                aria-label="Select all"
                className="border-white/20"
              />
            </div>
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">Employee</span>
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">Department</span>
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">Status</span>
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">Priority</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {loading ? (
              <div className="space-y-2 px-4 py-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-white/25">No employees match your filters.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 rounded-full border-white/15 bg-white/[0.04]"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add first employee
                </Button>
              </div>
            ) : paginated.map((emp) => {
              const StatusIcon = statusConfig[emp.status].icon;
              const PriorityIcon = priorityConfig[emp.priority].icon;
              const isSelected = selected.has(emp.id);
              return (
                <div
                  key={emp.id}
                  className={cn(
                    "grid grid-cols-[40px_1fr_140px_130px_100px_44px] items-center px-4 py-3 transition-colors",
                    isSelected ? "bg-sky-500/[0.08]" : "hover:bg-white/[0.02]"
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(emp.id)}
                    aria-label={`Select ${emp.id}`}
                    className="border-white/20"
                  />

                  {/* Employee */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", avatarColor(emp.name))}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="truncate text-left text-sm font-medium text-white hover:text-amber-200"
                        onClick={() => openEmployee(emp.id)}
                      >
                        {emp.name}
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-white/25">{emp.employeeCode}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-[11px] text-white/40 truncate">{emp.role}</span>
                      </div>
                      {(emp.email || emp.walletAddress) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {emp.email && (
                            <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/45">
                              {emp.email}
                            </span>
                          )}
                          {emp.walletAddress && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300/80">
                              wallet linked
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      deptColors[emp.department] ?? "bg-white/[0.06] border-white/[0.1] text-white/50"
                    )}>
                      {emp.department}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      statusConfig[emp.status].pill
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[emp.status].label}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className={cn("flex items-center gap-1.5 text-sm", priorityConfig[emp.priority].cls)}>
                    <PriorityIcon className="h-3.5 w-3.5" />
                    <span className="text-[12px] font-medium">{priorityConfig[emp.priority].label}</span>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/25 hover:text-white hover:bg-white/[0.06]">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0f0f1a] border-white/[0.1] text-white min-w-[140px]">
                      <DropdownMenuItem
                        className="text-sm text-white/70 focus:bg-white/10 focus:text-white cursor-pointer"
                        onClick={() => openEmployee(emp.id)}
                      >
                        View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm text-white/70 focus:bg-white/10 focus:text-white cursor-pointer"
                        onClick={() => patchEmployee(emp.id, { status: "active" })}
                      >
                        Mark Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm text-white/70 focus:bg-white/10 focus:text-white cursor-pointer"
                        onClick={() => patchEmployee(emp.id, { status: "on_leave" })}
                      >
                        Mark On Leave
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm text-white/70 focus:bg-white/10 focus:text-white cursor-pointer"
                        onClick={() => patchEmployee(emp.id, { priority: "high" })}
                      >
                        Set Priority High
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm text-red-400/80 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                        onClick={() => removeEmployees([emp.id])}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            Showing {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} employees
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/[0.06]"
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors",
                    page === p
                      ? "bg-amber-500/15 font-medium text-amber-200"
                      : "text-white/35 hover:text-white hover:bg-white/[0.06]",
                    loading && "pointer-events-none opacity-50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/[0.06]"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="border-white/15 bg-[#0a0f1b] text-white">
            <DialogHeader>
              <DialogTitle>Add employee</DialogTitle>
              <DialogDescription className="text-white/45">
                Add a team member to your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="h-9 bg-white/[0.04] border-white/[0.1]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Role</Label>
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Backend Engineer"
                  className="h-9 bg-white/[0.04] border-white/[0.1]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Department</Label>
                <Input
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="h-9 bg-white/[0.04] border-white/[0.1]"
                />
              </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">Email (optional)</Label>
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-9 bg-white/[0.04] border-white/[0.1]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">Wallet address (optional)</Label>
                  <Input
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="G..."
                    className="h-9 bg-white/[0.04] border-white/[0.1]"
                  />
                </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Status)}>
                    <SelectTrigger className="h-9 bg-white/[0.04] border-white/[0.1]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f1a] border-white/[0.1] text-white">
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-white/80">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60">Priority</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                    <SelectTrigger className="h-9 bg-white/[0.04] border-white/[0.1]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f1a] border-white/[0.1] text-white">
                      {Object.entries(priorityConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-white/80">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addEmployee} disabled={savingAdd}>
                {savingAdd ? "Saving..." : "Add employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardMain>
  );
}
