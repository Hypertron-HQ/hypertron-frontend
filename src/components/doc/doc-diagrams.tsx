"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";
import { ArrowRight, ChevronDown, Circle, GitBranch } from "lucide-react";
import { githubTree } from "@/lib/doc/doc-github";

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function DocSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24 pt-12 first:pt-0">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="mt-2 scroll-mt-24 text-2xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function DocP({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-white/70">{children}</p>;
}

export function DocBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1 text-[15px] leading-7 text-white/70">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocNote({
  variant = "info",
  children,
}: {
  variant?: "info" | "tip" | "warn";
  children: ReactNode;
}) {
  const tones = {
    info: "border-blue-500/20 bg-blue-500/[0.06] text-blue-100/90",
    tip: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100/90",
    warn: "border-amber-500/25 bg-amber-500/[0.06] text-amber-100/90",
  } as const;
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[variant])}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layered architecture stack                                          */
/* ------------------------------------------------------------------ */

type Layer = {
  label: string;
  sub?: string;
  items: string[];
  tone?: "white" | "blue" | "violet" | "emerald" | "amber";
};

const LAYER_TONES = {
  white: "border-white/12 bg-white/[0.05]",
  blue: "border-blue-500/25 bg-blue-500/[0.07]",
  violet: "border-violet-500/25 bg-violet-500/[0.07]",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.07]",
  amber: "border-amber-500/25 bg-amber-500/[0.07]",
} as const;

export function LayerStack({ layers }: { layers: Layer[] }) {
  return (
    <div className="my-6 space-y-2.5">
      {layers.map((layer, i) => (
        <div key={layer.label}>
          <div
            className={cn(
              "rounded-2xl border px-4 py-3.5 backdrop-blur-sm",
              LAYER_TONES[layer.tone ?? "white"],
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-semibold text-white">{layer.label}</p>
              {layer.sub ? (
                <p className="text-[11px] uppercase tracking-wide text-white/40">{layer.sub}</p>
              ) : null}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {layer.items.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-medium text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          {i < layers.length - 1 ? (
            <div className="flex justify-center py-1 text-white/25">
              <ChevronDown className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Module cards                                                        */
/* ------------------------------------------------------------------ */

type ModuleCard = {
  title: string;
  tag?: string;
  tone?: "blue" | "violet" | "emerald" | "amber";
  points: ReactNode[];
  /** Repo folder path on GitHub, e.g. `frontend/src/app/api`. */
  githubPath?: string;
};

const CARD_DOTS = {
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
} as const;

export function ModuleGrid({ modules }: { modules: ModuleCard[] }) {
  return (
    <div className="my-5 grid gap-3 sm:grid-cols-2">
      {modules.map((m) => (
        <div
          key={m.title}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", CARD_DOTS[m.tone ?? "blue"])} />
            <p className="text-sm font-semibold text-white">{m.title}</p>
            {m.githubPath ? (
              <a
                href={githubTree(m.githubPath)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] font-medium text-blue-400/85 transition-colors hover:text-blue-300"
              >
                GitHub ↗
              </a>
            ) : null}
            {m.tag ? (
              <span
                className={cn(
                  "rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50",
                  m.githubPath ? "" : "ml-auto",
                )}
              >
                {m.tag}
              </span>
            ) : null}
          </div>
          <ul className="mt-3 space-y-1.5">
            {m.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-6 text-white/65">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Flowchart (vertical, with optional decision branch)                 */
/* ------------------------------------------------------------------ */

type FlowNode =
  | { kind: "start" | "end"; label: string }
  | { kind: "process"; label: string; sub?: string }
  | { kind: "onchain"; label: string; sub?: string }
  | { kind: "decision"; label: string }
  | { kind: "branch"; left: { label: string; nodes: FlowNode[] }; right: { label: string; nodes: FlowNode[] } };

function FlowBox({ node }: { node: Exclude<FlowNode, { kind: "branch" }> }) {
  if (node.kind === "start" || node.kind === "end") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-2 text-sm font-semibold text-emerald-100">
        <Circle className="h-3 w-3 fill-emerald-400 text-emerald-400" />
        {node.label}
      </div>
    );
  }
  if (node.kind === "decision") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/[0.08] px-4 py-2.5 text-sm font-semibold text-amber-100">
        <GitBranch className="h-3.5 w-3.5" />
        {node.label}
      </div>
    );
  }
  const onchain = node.kind === "onchain";
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border px-4 py-3 text-center backdrop-blur-sm",
        onchain
          ? "border-blue-500/30 bg-blue-500/[0.08]"
          : "border-white/12 bg-white/[0.05]",
      )}
    >
      <p className={cn("text-sm font-medium", onchain ? "text-blue-100" : "text-white")}>
        {node.label}
      </p>
      {"sub" in node && node.sub ? (
        <p className="mt-0.5 text-[11px] text-white/45">{node.sub}</p>
      ) : null}
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center py-1.5 text-white/25">
      <ChevronDown className="h-4 w-4" />
    </div>
  );
}

function FlowList({ nodes }: { nodes: FlowNode[] }) {
  return (
    <>
      {nodes.map((node, i) => (
        <div key={i} className="flex flex-col items-center">
          {node.kind === "branch" ? (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {[node.left, node.right].map((b, bi) => (
                <div
                  key={bi}
                  className="rounded-2xl border border-white/[0.07] bg-black/20 p-3"
                >
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">
                    {b.label}
                  </p>
                  <div className="flex flex-col items-center">
                    <FlowList nodes={b.nodes} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <FlowBox node={node} />
          )}
          {i < nodes.length - 1 ? <FlowConnector /> : null}
        </div>
      ))}
    </>
  );
}

export function FlowChart({ title, nodes }: { title?: string; nodes: FlowNode[] }) {
  return (
    <figure className="my-6 rounded-2xl border border-white/[0.08] bg-black/30 p-5">
      {title ? (
        <figcaption className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {title}
        </figcaption>
      ) : null}
      <div className="flex flex-col items-center">
        <FlowList nodes={nodes} />
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Sequence diagram                                                    */
/* ------------------------------------------------------------------ */

type SeqStep = {
  from: string;
  to: string;
  label: string;
  kind?: "sync" | "return" | "self";
};

const ACTOR_COLORS = [
  "border-blue-500/30 bg-blue-500/[0.1] text-blue-100",
  "border-violet-500/30 bg-violet-500/[0.1] text-violet-100",
  "border-emerald-500/30 bg-emerald-500/[0.1] text-emerald-100",
  "border-amber-500/30 bg-amber-500/[0.1] text-amber-100",
  "border-pink-500/30 bg-pink-500/[0.1] text-pink-100",
  "border-cyan-500/30 bg-cyan-500/[0.1] text-cyan-100",
];

export function SequenceDiagram({
  title,
  actors,
  steps,
}: {
  title?: string;
  actors: string[];
  steps: SeqStep[];
}) {
  const colorOf = (actor: string) => ACTOR_COLORS[actors.indexOf(actor) % ACTOR_COLORS.length];

  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 p-5">
      {title ? (
        <figcaption className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {title}
        </figcaption>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-1.5">
        {actors.map((actor) => (
          <span
            key={actor}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold",
              colorOf(actor),
            )}
          >
            {actor}
          </span>
        ))}
      </div>

      <ol className="relative space-y-3 border-l border-white/10 pl-5">
        {steps.map((step, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-black text-[9px] font-bold text-white/60">
              {i + 1}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", colorOf(step.from))}>
                {step.from}
              </span>
              <ArrowRight
                className={cn(
                  "h-3 w-3",
                  step.kind === "return" ? "text-white/30" : "text-white/50",
                )}
              />
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", colorOf(step.to))}>
                {step.to}
              </span>
            </div>
            <p
              className={cn(
                "mt-1 text-[13px] leading-6",
                step.kind === "return" ? "italic text-white/45" : "text-white/70",
              )}
            >
              {step.label}
            </p>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-white/[0.04]">
            {head.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white/50"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-white/[0.06]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3.5 py-2.5 align-top text-white/70">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="break-all rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-blue-200">
      {children}
    </code>
  );
}

/* ------------------------------------------------------------------ */
/* Status / roadmap list                                               */
/* ------------------------------------------------------------------ */

type StatusItem = { label: string; status: "done" | "wip" | "planned"; note?: string };

const STATUS_META = {
  done: { dot: "bg-emerald-400", text: "text-emerald-300", label: "Shipped" },
  wip: { dot: "bg-amber-400", text: "text-amber-300", label: "In progress" },
  planned: { dot: "bg-white/40", text: "text-white/45", label: "Planned" },
} as const;

export function StatusList({ items }: { items: StatusItem[] }) {
  return (
    <div className="my-5 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
      {items.map((item) => {
        const meta = STATUS_META[item.status];
        return (
          <div key={item.label} className="flex items-start gap-3 px-4 py-3">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-white/85">{item.label}</p>
              {item.note ? <p className="mt-0.5 text-[12px] text-white/45">{item.note}</p> : null}
            </div>
            <span className={cn("shrink-0 text-[11px] font-semibold uppercase tracking-wide", meta.text)}>
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
