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
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

type LoginTransitionContextValue = {
  isActive: boolean;
  startLoginTransition: (message?: string) => void;
  endLoginTransition: () => void;
};

const LoginTransitionContext = createContext<LoginTransitionContextValue | null>(null);

const DEFAULT_MESSAGE = "Signing you in…";

function isPostLoginPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/regintel");
}

export function LoginTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const startLoginTransition = useCallback((msg = DEFAULT_MESSAGE) => {
    setMessage(msg);
    setIsActive(true);
  }, []);

  const endLoginTransition = useCallback(() => {
    setIsActive(false);
  }, []);

  // Safety net: always dismiss once the user has landed in the app shell.
  useEffect(() => {
    if (isActive && isPostLoginPath(pathname)) {
      endLoginTransition();
    }
  }, [pathname, isActive, endLoginTransition]);

  const value = useMemo(
    () => ({ isActive, startLoginTransition, endLoginTransition }),
    [isActive, startLoginTransition, endLoginTransition]
  );

  return (
    <LoginTransitionContext.Provider value={value}>
      {children}
      {isActive ? (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" aria-hidden />
          <p className={cn("text-sm font-medium text-white/90")}>{message}</p>
        </div>
      ) : null}
    </LoginTransitionContext.Provider>
  );
}

export function useLoginTransition() {
  const ctx = useContext(LoginTransitionContext);
  return (
    ctx ?? {
      isActive: false,
      startLoginTransition: () => {},
      endLoginTransition: () => {},
    }
  );
}

/** Brief pause so the transition overlay is visible before navigation. */
export function loginRedirectDelay(ms = 650): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
