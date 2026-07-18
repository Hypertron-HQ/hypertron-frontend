"use client";

import Avvvatars from "avvvatars-react";
import { cn } from "@/utils";

/** Avvvatars shape for `value`, with Hypertron blue palette (overrides default hash colors). */
export function HubAvatar({
  value,
  size = 40,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hub-avatar-blue shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      <Avvvatars value={value} style="shape" size={size} />
    </div>
  );
}

/** Merchant mark on pay / checkout brand panel — uploaded logo or deterministic Avvvatar. */
export function PaymentBrandAvatar({
  businessName,
  logoUrl,
  seed,
  size = 36,
  className,
}: {
  businessName: string;
  logoUrl?: string | null;
  /** Stable id for Avvvatars when `logoUrl` is missing (e.g. link id or business name). */
  seed?: string;
  size?: number;
  className?: string;
}) {
  const src = logoUrl?.trim();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-xl object-cover shadow-sm ring-2 ring-white/20", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const avatarValue = (seed || businessName || "merchant").trim() || "merchant";
  return (
    <HubAvatar
      value={avatarValue}
      size={size}
      className={cn("rounded-xl shadow-sm ring-2 ring-white/20", className)}
    />
  );
}
