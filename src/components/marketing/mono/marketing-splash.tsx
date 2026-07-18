"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";
import { LandingLoadingScreen } from "./landing-loading-screen";

type MarketingSplashProps = {
  children: ReactNode;
};

export function MarketingSplash({ children }: MarketingSplashProps) {
  const [showSplash, setShowSplash] = useState(true);
  const onComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {children}
      <AnimatePresence>
        {showSplash ? <LandingLoadingScreen key="marketing-splash" onComplete={onComplete} /> : null}
      </AnimatePresence>
    </>
  );
}
