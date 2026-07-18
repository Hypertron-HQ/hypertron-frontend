"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type PendingNavContextValue = {
  markPending: (href: string) => void;
  isPending: (href: string) => boolean;
};

const PendingNavContext = createContext<PendingNavContextValue>({
  markPending: () => {},
  isPending: () => false,
});

function usePendingNavigationState(): PendingNavContextValue {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const markPending = useCallback((href: string) => {
    setPendingHref(href);
  }, []);

  const isPending = useCallback(
    (href: string) => pendingHref != null && pendingHref === href,
    [pendingHref]
  );

  return useMemo(() => ({ markPending, isPending }), [markPending, isPending]);
}

export function PendingNavProvider({ children }: { children: ReactNode }) {
  const value = usePendingNavigationState();
  return createElement(PendingNavContext.Provider, { value }, children);
}

export function usePendingNav() {
  return useContext(PendingNavContext);
}
