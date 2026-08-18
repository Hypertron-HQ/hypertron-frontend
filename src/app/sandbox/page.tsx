import type { Metadata } from "next";
import { SandboxShell } from "@/components/sandbox/sandbox-shell";

export const metadata: Metadata = {
  title: "Sandbox · Hypertron",
  description:
    "Explore a demo Hypertron workspace with sample overview, payments, treasury, and settings data.",
};

export default function SandboxPage() {
  return <SandboxShell />;
}
