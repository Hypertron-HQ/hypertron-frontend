"use client";

type CardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  tone: "blue" | "violet" | "emerald" | "amber";
};

const tones = {
  blue: {
    tint: "rgba(147, 197, 253, 0.08)",
    stroke: "rgba(147, 197, 253, 0.34)",
    text: "rgba(191, 219, 254, 0.68)",
  },
  violet: {
    tint: "rgba(196, 181, 253, 0.08)",
    stroke: "rgba(196, 181, 253, 0.34)",
    text: "rgba(221, 214, 254, 0.66)",
  },
  emerald: {
    tint: "rgba(134, 239, 172, 0.08)",
    stroke: "rgba(134, 239, 172, 0.34)",
    text: "rgba(187, 247, 208, 0.66)",
  },
  amber: {
    tint: "rgba(253, 211, 77, 0.07)",
    stroke: "rgba(253, 211, 77, 0.32)",
    text: "rgba(253, 230, 138, 0.66)",
  },
} as const;

const flow = {
  blue: "#8cb8e8",
  violet: "#b09de8",
  emerald: "#6ecf9a",
  amber: "#d4b06a",
} as const;

/** Card positions — single source of truth for routing. */
const box = {
  biz: { x: 48, y: 96, w: 122, h: 64 },
  cust: { x: 48, y: 188, w: 122, h: 64 },
  wallet: { x: 48, y: 292, w: 122, h: 64 },
  privy: { x: 48, y: 372, w: 122, h: 54 },
  fe: { x: 290, y: 132, w: 160, h: 86 },
  bff: { x: 506, y: 132, w: 160, h: 86 },
  srv: { x: 290, y: 238, w: 160, h: 78 },
  mongo: { x: 506, y: 334, w: 160, h: 64 },
  agent: { x: 790, y: 96, w: 128, h: 64 },
  stellar: { x: 790, y: 260, w: 128, h: 64 },
  cctp: { x: 790, y: 340, w: 128, h: 54 },
} as const;

function edge(b: { x: number; y: number; w: number; h: number }) {
  return {
    left: b.x,
    right: b.x + b.w,
    top: b.y,
    bottom: b.y + b.h,
    cx: b.x + b.w / 2,
    cy: b.y + b.h / 2,
  };
}

function Card({ x, y, w, h, title, subtitle, tone }: CardProps) {
  const color = tones[tone];

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#08080a" stroke="none" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={color.tint}
        stroke={color.stroke}
        strokeWidth={1.1}
      />
      <text x={x + 14} y={y + 26} fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.88)">
        {title}
      </text>
      <text x={x + 14} y={y + 42} fontSize={8.5} fill={color.text}>
        {subtitle}
      </text>
    </g>
  );
}

type ArrowProps = {
  points: [number, number][];
  color: string;
  markerId: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  dashed?: boolean;
};

function path(points: [number, number][]) {
  const [first, ...rest] = points;
  return rest.reduce((d, [x, y]) => `${d} L ${x} ${y}`, `M ${first[0]} ${first[1]}`);
}

function Arrow({ points, color, markerId, label, labelX, labelY, dashed }: ArrowProps) {
  return (
    <g>
      <path
        d={path(points)}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "5 5" : undefined}
        markerEnd={`url(#${markerId})`}
      />
      {label && labelX != null && labelY != null ? (
        <g>
          <rect
            x={labelX - 4}
            y={labelY - 9}
            width={label.length * 5.2 + 8}
            height={12}
            rx={3}
            fill="#08080a"
            opacity={0.92}
          />
          <text x={labelX} y={labelY} fontSize={8.5} fontWeight={500} fill={color}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

export function HypertronArchitectureDiagram() {
  const srcR = 170;
  /** Separate left corridors so vertical segments never stack. */
  const laneWeb = 206;
  const laneWallet = 220;
  const laneAuth = 234;
  const colGap = 478;
  /** Separate external corridors. */
  const extAi = 736;
  const extChain = 756;
  const extWallet = 776;
  /** Separate horizontal buses inside / below platform. */
  const rowBus = 228;
  const storeBus = 308;
  const walletBus = 452;
  /** BFF exit columns — orchestrate vs store never share an x. */
  const storeX = 668;

  const fe = edge(box.fe);
  const bff = edge(box.bff);
  const srv = edge(box.srv);
  const mongo = edge(box.mongo);
  const agent = edge(box.agent);
  const stellar = edge(box.stellar);
  const cctp = edge(box.cctp);
  const privyCy = box.privy.y + 27;
  const walletCy = box.wallet.y + 32;

  return (
    <figure className="my-6 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#050505] p-5">
      <figcaption className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        System topology
      </figcaption>

      <svg
        viewBox="0 0 960 560"
        className="w-full min-w-[760px]"
        role="img"
        aria-label="Clean Hypertron high level architecture diagram"
      >
        <defs>
          {(
            [
              ["arrow-blue", flow.blue],
              ["arrow-violet", flow.violet],
              ["arrow-emerald", flow.emerald],
              ["arrow-amber", flow.amber],
            ] as const
          ).map(([id, color]) => (
            <marker
              key={id}
              id={id}
              markerWidth="6"
              markerHeight="6"
              refX="5.5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={color} />
            </marker>
          ))}
          <pattern
            id="soft-stripes"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="white" strokeOpacity={0.025} strokeWidth="5" />
          </pattern>
        </defs>

        <rect
          x={250}
          y={54}
          width={450}
          height={360}
          rx={24}
          fill="url(#soft-stripes)"
          stroke="white"
          strokeOpacity={0.1}
          strokeWidth={1.2}
        />
        <text x={475} y={82} textAnchor="middle" fontSize={10} fontWeight={700} fill="white" opacity={0.48}>
          HYPERTRON PLATFORM
        </text>
        <text x={475} y={98} textAnchor="middle" fontSize={8.5} fill="white" opacity={0.3}>
          Next.js app, BFF, server libraries, and data
        </text>

        <text x={48} y={76} fontSize={8.5} fontWeight={600} fill="white" opacity={0.28}>
          REQUESTS
        </text>
        <Card {...box.biz} title="Business" subtitle="Dashboard" tone="blue" />
        <Card {...box.cust} title="Customer" subtitle="/pay link" tone="blue" />
        <Card {...box.wallet} title="Wallets" subtitle="Freighter, EVM, Solana" tone="emerald" />
        <Card {...box.privy} title="Privy" subtitle="Sign in" tone="amber" />

        <Card {...box.fe} title="Frontend" subtitle="Docs, dashboard, checkout" tone="blue" />
        <Card {...box.bff} title="BFF / API" subtitle="Auth, payments, vault" tone="blue" />
        <Card {...box.srv} title="Server libs" subtitle="Relayer, payout, Soroban" tone="violet" />
        <Card {...box.mongo} title="MongoDB" subtitle="Prisma data model" tone="violet" />

        <text x={790} y={76} fontSize={8.5} fontWeight={600} fill="white" opacity={0.28}>
          EXTERNAL
        </text>
        <Card {...box.agent} title="Agent workflow" subtitle="FastAPI + OpenAI" tone="violet" />
        <Card {...box.stellar} title="Stellar" subtitle="Horizon + Soroban" tone="emerald" />
        <Card {...box.cctp} title="CCTP" subtitle="USDC bridge" tone="emerald" />

        {/* Connectors on top — routed through gutters only, ending at box edges. */}
        <g aria-hidden="true">
          <Arrow
            points={[
              [srcR, box.biz.y + 32],
              [laneWeb, box.biz.y + 32],
              [laneWeb, fe.cy],
              [fe.left, fe.cy],
            ]}
            color={flow.blue}
            markerId="arrow-blue"
            label="web"
            labelX={laneWeb + 4}
            labelY={box.biz.y + 24}
          />
          <Arrow
            points={[
              [srcR, box.cust.y + 32],
              [laneWeb, box.cust.y + 32],
              [laneWeb, fe.cy - 14],
              [fe.left, fe.cy - 14],
            ]}
            color={flow.blue}
            markerId="arrow-blue"
            label="checkout"
            labelX={laneWeb + 4}
            labelY={box.cust.y + 24}
          />
          <Arrow
            points={[
              [fe.right, fe.cy],
              [colGap, fe.cy],
              [bff.left, bff.cy],
            ]}
            color={flow.blue}
            markerId="arrow-blue"
            label="API"
            labelX={colGap - 12}
            labelY={fe.cy - 10}
          />
          {/* Auth enters BFF from the left — no shared bottom vertical with store/orchestrate. */}
          <Arrow
            points={[
              [srcR, privyCy],
              [laneAuth, privyCy],
              [laneAuth, bff.cy + 8],
              [bff.left - 1, bff.cy + 8],
            ]}
            color={flow.amber}
            markerId="arrow-amber"
            label="auth"
            labelX={laneAuth + 4}
            labelY={privyCy - 8}
          />
          <Arrow
            points={[
              [bff.cx - 48, bff.bottom],
              [bff.cx - 48, rowBus],
              [srv.cx, rowBus],
              [srv.cx, srv.top - 1],
            ]}
            color={flow.violet}
            markerId="arrow-violet"
            label="orchestrate"
            labelX={bff.cx - 38}
            labelY={rowBus - 6}
          />
          <Arrow
            points={[
              [bff.right, bff.cy + 22],
              [storeX, bff.cy + 22],
              [storeX, storeBus],
              [mongo.cx, storeBus],
              [mongo.cx, mongo.top - 1],
            ]}
            color={flow.violet}
            markerId="arrow-violet"
            label="store"
            labelX={storeX + 4}
            labelY={storeBus - 6}
          />
          <Arrow
            points={[
              [bff.right, bff.cy - 10],
              [extAi, bff.cy - 10],
              [extAi, agent.cy],
              [agent.left, agent.cy],
            ]}
            color={flow.violet}
            markerId="arrow-violet"
            label="AI proxy"
            labelX={extAi + 4}
            labelY={agent.cy - 8}
          />
          <Arrow
            points={[
              [bff.right, bff.cy + 12],
              [extChain, bff.cy + 12],
              [extChain, stellar.cy],
              [stellar.left, stellar.cy],
            ]}
            color={flow.emerald}
            markerId="arrow-emerald"
            label="Stellar RPC"
            labelX={extChain + 4}
            labelY={stellar.cy - 8}
          />
          {/* Wallet uses its own left lane + lower bus + outer external corridor. */}
          <Arrow
            points={[
              [srcR, walletCy],
              [laneWallet, walletCy],
              [laneWallet, walletBus],
              [extWallet, walletBus],
              [extWallet, cctp.cy],
              [cctp.left, cctp.cy],
            ]}
            color={flow.emerald}
            markerId="arrow-emerald"
            dashed
            label="wallet signed tx"
            labelX={480}
            labelY={walletBus + 12}
          />
        </g>

        <g transform="translate(116 482)">
          <rect width={728} height={44} rx={12} fill="white" fillOpacity={0.02} stroke="white" strokeOpacity={0.06} />
          {(
            [
              [flow.blue, "web/API"],
              [flow.violet, "server/data"],
              [flow.emerald, "chain/wallet"],
              [flow.amber, "auth"],
            ] as const
          ).map(([color, label], i) => (
            <g key={label} transform={`translate(${46 + i * 166} 23)`}>
              <line x1={0} y1={0} x2={28} y2={0} stroke={color} strokeWidth={2} />
              <text x={38} y={3} fontSize={8.5} fill="white" opacity={0.58}>
                {label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </figure>
  );
}
