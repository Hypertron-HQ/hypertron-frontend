"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils";

type CreateWorkspaceNavContextValue = {
  pending: boolean;
  goToCreateWorkspace: () => void;
};

const CreateWorkspaceNavContext = createContext<CreateWorkspaceNavContextValue | null>(null);

export function CreateWorkspaceNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pathname === "/CreateWorkspace" || pathname.startsWith("/CreateWorkspace/")) {
      setPending(false);
    }
  }, [pathname]);

  const goToCreateWorkspace = useCallback(() => {
    setPending(true);
    router.push("/CreateWorkspace");
  }, [router]);

  const value = useMemo(
    () => ({ pending, goToCreateWorkspace }),
    [pending, goToCreateWorkspace]
  );

  return (
    <CreateWorkspaceNavContext.Provider value={value}>{children}</CreateWorkspaceNavContext.Provider>
  );
}

export function useCreateWorkspaceNav() {
  const ctx = useContext(CreateWorkspaceNavContext);
  if (!ctx) {
    throw new Error("useCreateWorkspaceNav must be used within CreateWorkspaceNavProvider");
  }
  return ctx;
}

type CreateWorkspaceButtonProps = ButtonProps & {
  label?: string;
};

export function CreateWorkspaceButton({
  className,
  label = "Create Workspace",
  variant = "purple",
  ...props
}: CreateWorkspaceButtonProps) {
  const { pending, goToCreateWorkspace } = useCreateWorkspaceNav();

  return (
    <Button
      type="button"
      variant={variant}
      disabled={pending || props.disabled}
      onClick={goToCreateWorkspace}
      className={cn(className)}
      {...props}
    >
      {pending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
      )}
      {label}
    </Button>
  );
}
