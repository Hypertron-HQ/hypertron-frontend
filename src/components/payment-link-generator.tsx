"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentLinkGeneratorProps {
  creatorPublicKey: string;
  onCreated?: () => void;
}

export function PaymentLinkGenerator({ creatorPublicKey, onCreated }: PaymentLinkGeneratorProps) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [link, setLink] = useState<string | null>(null);

  function handleCreate() {
    if (!amount) return;
    const dest = destinationAddress.trim() || creatorPublicKey;
    const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();
    params.set("amount", amount.trim());
    if (memo.trim()) params.set("memo", memo.trim());
    params.set("dest", dest);
    const url = `${base}/pay/${id}?${params.toString()}`;
    setLink(url);
    onCreated?.();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-md">
      <h2 className="text-lg font-medium text-foreground">Create payment link</h2>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (XLM or USDC)</Label>
        <Input
          id="amount"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="memo">Memo (optional)</Label>
        <Input
          id="memo"
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Invoice #123"
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="destination">Recipient address (optional, defaults to you)</Label>
        <Input
          id="destination"
          type="text"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          placeholder="G..."
          className="bg-background font-mono text-sm"
        />
      </div>
      <Button onClick={handleCreate}>
        Generate link
      </Button>
      {link && (
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-sm text-muted-foreground">Payment link:</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm break-all hover:underline"
          >
            {link}
          </a>
        </div>
      )}
    </div>
  );
}
