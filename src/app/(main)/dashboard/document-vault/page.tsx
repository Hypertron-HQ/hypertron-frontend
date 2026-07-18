"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderArchive, ShieldCheck } from "lucide-react";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { WorkspaceGenericContentSkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useFreighter } from "@/hooks/useFreighter";
import { cn } from "@/utils";

type VaultItem = {
  id: string;
  type: string;
  title: string;
  items: { id: string; text: string; done: boolean }[];
  createdAt: string;
};

export default function DocumentVaultPage() {
  const router = useRouter();
  const { publicKey } = useFreighter();
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/vault", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [publicKey]);

  return (
    <WorkspacePageShell breadcrumbs={workspaceHubBreadcrumbs("Document Vault")}>
      <div className="flex flex-col gap-6">
        {loading ? (
          <WorkspaceGenericContentSkeleton />
        ) : (
          <>
            <div>
              <h2 className={cn("text-xl font-semibold tracking-tight", t.pageHeading)}>
                Document vault
              </h2>
              <p className={cn("mt-1 text-sm", t.pageSubheading)}>
                Saved compliance checklists and other documents. Generate a new checklist from the
                Compliance Agent.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/dashboard/compliance-agent")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Open Compliance Agent
              </Button>
            </div>

            {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderArchive className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-muted-foreground">No saved checklists yet.</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Use the Compliance Agent to generate a regulatory checklist, then save it here.
              </p>
              <Button onClick={() => router.push("/dashboard/compliance-agent")}>
                Go to Compliance Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {items.map((vault) => (
              <Card key={vault.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{vault.title}</CardTitle>
                  <CardDescription>
                    Saved{" "}
                    {new Date(vault.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    {vault.type === "compliance_checklist" && " · Compliance checklist"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {vault.items.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 py-1 text-sm",
                          item.done && "text-muted-foreground"
                        )}
                      >
                        <Checkbox checked={item.done} disabled className="pointer-events-none" />
                        <span className={item.done ? "line-through" : ""}>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </WorkspacePageShell>
  );
}
