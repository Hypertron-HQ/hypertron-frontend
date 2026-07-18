"use client";

import { useState } from "react";
import { CheckCheck, Copy, ExternalLink } from "lucide-react";
import { privyHexSeedToStellarSecret } from "@/lib/stellar-key-convert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils";

type Props = {
  expectedPublicKey: string;
  themeClasses: {
    cardMeta: string;
    cardTitle: string;
    outlineBtn: string;
    dark: boolean;
    input?: string;
  };
};

export function PrivyFreighterImportHelper({ expectedPublicKey, themeClasses: t }: Props) {
  const [hexSeed, setHexSeed] = useState("");
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputCls = cn(
    "h-10 rounded-lg border font-mono text-xs shadow-none",
    t.dark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
      : "border-ui-border/80 bg-white text-neutral-900 placeholder:text-neutral-400"
  );

  const handleConvert = () => {
    setError(null);
    setSecretKey(null);
    const result = privyHexSeedToStellarSecret(hexSeed, expectedPublicKey);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSecretKey(result.secretKey);
  };

  const handleCopySecret = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4",
        t.dark ? "border-white/10 bg-white/[0.03]" : "border-ui-border/70 bg-neutral-50/50"
      )}
    >
      <div>
        <p className={cn("text-sm font-semibold", t.cardTitle)}>Import into Freighter</p>
        <p className={cn("mt-1 text-[11px] leading-relaxed", t.cardMeta)}>
          Privy exports a raw hex seed. Freighter needs a Stellar <code className="text-[10px]">S…</code>{" "}
          secret key. Paste your Privy hex seed below — conversion happens only in your browser and
          is never sent to our servers.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="privy-hex-seed" className={cn("text-xs", t.cardMeta)}>
          Privy hex seed
        </Label>
        <Input
          id="privy-hex-seed"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={hexSeed}
          onChange={(e) => {
            setHexSeed(e.target.value);
            setSecretKey(null);
            setError(null);
          }}
          placeholder="64-character hex from Privy export"
          className={inputCls}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleConvert}
        disabled={!hexSeed.trim()}
        className={cn("h-9 w-fit rounded-xl text-sm shadow-none", t.outlineBtn)}
      >
        Convert for Freighter
      </Button>

      {error ? <p className="text-[11px] text-red-400">{error}</p> : null}

      {secretKey ? (
        <div className="space-y-2">
          <p className={cn("text-xs font-medium text-emerald-500")}>
            Key matches your wallet. Copy the S… secret below.
          </p>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 font-mono text-xs break-all",
              t.dark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"
            )}
          >
            <span className="min-w-0 flex-1">{secretKey}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => void handleCopySecret()}
              aria-label="Copy Freighter secret key"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className={cn("text-[11px] leading-relaxed", t.cardMeta)}>
            In Freighter: Settings → Manage assets → Import secret key → paste the{" "}
            <code className="text-[10px]">S…</code> value above.
          </p>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium underline-offset-2 hover:underline",
              t.dark ? "text-blue-300" : "text-blue-600"
            )}
          >
            Open Freighter
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
