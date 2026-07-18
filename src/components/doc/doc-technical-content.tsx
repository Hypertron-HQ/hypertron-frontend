"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DocBullets,
  DocNote,
  DocP,
  DocTable,
  FlowChart,
  ModuleGrid,
  Mono,
  SequenceDiagram,
  StatusList,
} from "./doc-diagrams";
import { HypertronArchitectureDiagram } from "./doc-architecture-diagram";
import { githubBlob, githubTree } from "@/lib/doc/doc-github";
import { technicalHref } from "@/lib/doc/doc-technical-pages";
import {
  getExplorerAddressUrl,
  isValidExplorerAddress,
} from "@/lib/stellar-explorer";
import { TESTNET_CONTRACTS } from "@/lib/doc/testnet-contracts";

const githubLinkClass =
  "text-blue-400/90 underline decoration-blue-400/30 underline-offset-2 transition-colors hover:text-blue-300 hover:decoration-blue-300/50";

function GhTree({ path, children }: { path: string; children: ReactNode }) {
  return (
    <a href={githubTree(path)} target="_blank" rel="noopener noreferrer" className={githubLinkClass}>
      {children}
    </a>
  );
}

function GhFile({ path, children }: { path: string; children: ReactNode }) {
  return (
    <a href={githubBlob(path)} target="_blank" rel="noopener noreferrer" className={githubLinkClass}>
      {children}
    </a>
  );
}

function ExplorerMono({
  address,
  network = "testnet",
}: {
  address: string;
  network?: "testnet" | "public";
}) {
  if (!isValidExplorerAddress(address)) {
    return (
      <span title="Invalid Stellar address (checksum failed). Fix the ID in env or redeploy.">
        <Mono>{address}</Mono>
      </span>
    );
  }

  return (
    <a
      href={getExplorerAddressUrl(address, network)}
      target="_blank"
      rel="noopener noreferrer"
      className={githubLinkClass}
      title={`View on StellarExpert (${network})`}
    >
      <Mono>{address}</Mono>
    </a>
  );
}

function ModuleHeading({ id, title, githubPath }: { id: string; title: string; githubPath: string }) {
  return (
    <div className="flex scroll-mt-20 flex-wrap items-center gap-x-3 gap-y-1 pt-3">
      <h3 id={id} className="text-base font-semibold text-white">
        {title}
      </h3>
      <GhTree path={githubPath}>
        <span className="text-xs font-medium">View on GitHub ↗</span>
      </GhTree>
    </div>
  );
}

const POOL_ACCOUNT = TESTNET_CONTRACTS.paymentPool;

function OverviewContent() {
  return (
    <div className="space-y-4">
      <DocP>
        Hypertron is a B2B operations layer for private, workflow native payments on Stellar.
        It combines a payments and onboarding dashboard, a privacy settlement pool, a
        cross chain USDC bridge, and an agent workflow layer for compliance and regulatory
        intelligence. The platform is split into three independently deployable tiers plus
        the Stellar network.
      </DocP>
      <ModuleGrid
        modules={[
          {
            title: "Web app + BFF",
            tag: "Next.js",
            tone: "blue",
            githubPath: "frontend",
            points: [
              "Next.js 14 App Router (Vercel)",
              "Marketing site, dashboard, public checkout",
              "44 Route Handlers act as the backend for frontend",
            ],
          },
          {
            title: "Agent workflow",
            tag: "FastAPI",
            tone: "violet",
            githubPath: "ai-analyzer",
            points: [
              "Python FastAPI service on Render",
              "RegIntel RAG, Compliance Agent, scrapers",
              "Regulation News Sniper + widget recommender",
            ],
          },
          {
            title: "Soroban contracts",
            tag: "Rust",
            tone: "emerald",
            githubPath: "contracts/poolmanager",
            points: [
              "PoolManager privacy pool (Poseidon + BN254)",
              "Commitment / nullifier registry",
              "Deployed to Stellar testnet",
            ],
          },
          {
            title: "Stellar network",
            tag: "L1",
            tone: "amber",
            points: [
              "Classic payments via Horizon",
              "Soroban smart contracts (Protocol 25 / X Ray)",
              "Circle CCTP native USDC",
            ],
          },
        ]}
      />
      <DocNote variant="warn">
        Most flows currently target <strong>Stellar testnet</strong>. Private settlement is{" "}
        <strong>operational privacy</strong> (Phase&nbsp;1) with a stubbed ZK verifier — not
        full cryptographic privacy yet. See{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("privacy-payments")}>
          Privacy payments
        </Link>{" "}
        for the Nethermind migration plan. <strong>Not audited</strong>; do not use with real
        funds yet.
      </DocNote>
    </div>
  );
}

function ArchitectureContent() {
  return (
    <div className="space-y-4">
      <DocP>
        The browser talks to a single Next.js deployment. Route Handlers own all
        authentication, the data model, and orchestration of Stellar/Soroban operations,
        and proxy AI workloads to the agent workflow service. Wallets sign transactions
        client side; secrets and the pool live server side or on chain.
      </DocP>
      <HypertronArchitectureDiagram />
      <DocP>
        The diagram above shows how traffic enters from businesses, customers, and wallets;
        how the Next.js BFF orchestrates auth, payments, and compliance; and where data
        lands in MongoDB, the agent workflow service, and the Stellar network.
      </DocP>
    </div>
  );
}

function ModulesContent() {
  return (
    <div className="space-y-4">
      <DocP>
        Three modules make up the system: the frontend (which also hosts the BFF backend),
        the agent workflow service, and the on chain smart contracts.
      </DocP>

      <ModuleHeading id="frontend" title="Frontend" githubPath="frontend/src/app" />
      <DocP>
        Next.js 14 App Router with four route groups. State is mostly React context plus{" "}
        <Mono>fetch</Mono>; React Query is used on the bridge. UI is Radix + a shadcn style
        system with framer motion.
      </DocP>
      <DocTable
        head={["Route group", "Purpose"]}
        rows={[
          [
            <GhTree key="marketing" path="frontend/src/app/(marketing)">
              <Mono>(marketing)</Mono>
            </GhTree>,
            "Public site: home, pricing, features, docs",
          ],
          [
            <GhTree key="main" path="frontend/src/app/(main)">
              <Mono>(main)</Mono>
            </GhTree>,
            "Authenticated workspace hub + dashboard (wallet gated)",
          ],
          [
            <GhTree key="pay" path="frontend/src/app/pay">
              <Mono>pay/[id]</Mono>
            </GhTree>,
            "Public Stellar checkout for payment links",
          ],
          [
            <GhTree key="demo" path="frontend/src/app/demo">
              <Mono>demo</Mono>
            </GhTree>,
            "Unauthenticated sandbox with mock session/data",
          ],
          [
            <GhTree key="api" path="frontend/src/app/api">
              <Mono>api</Mono>
            </GhTree>,
            "Route Handlers (BFF): auth, payments, vault, AI proxies",
          ],
        ]}
      />
      <DocP>Key dashboard surfaces:</DocP>
      <DocBullets
        items={[
          <><strong>Payments</strong>: create/collect payment links, send outbound payments.</>,
          <><strong>Treasury</strong>: pooled balances and withdrawals.</>,
          <><strong>Secure Vault</strong>: Soroban commitment pool (privacy beta).</>,
          <><strong>Bridge</strong>: Circle CCTP USDC across Ethereum, Avalanche, Solana, Stellar.</>,
          <><strong>Compliance Agent / RegIntel / RNS</strong>: AI compliance analysis and regulatory news.</>,
          <><strong>Employees, Templates, Billing</strong>: workspace operations.</>,
        ]}
      />

      <ModuleHeading id="backend" title="Backend (BFF + services)" githubPath="frontend/src/lib" />
      <ModuleGrid
        modules={[
          {
            title: "Next.js Route Handlers",
            tone: "blue",
            githubPath: "frontend/src/app/api",
            points: [
              "Session auth via signed HMAC cookies",
              "Prisma CRUD against MongoDB",
              "Orchestrates Stellar / Soroban server libs",
              "Proxies AI calls to agent workflow",
            ],
          },
          {
            title: "Server libraries",
            tone: "violet",
            githubPath: "frontend/src/lib",
            points: [
              <>
                <GhFile path="frontend/src/lib/relayer.ts">relayer.ts</GhFile>,{" "}
                <GhFile path="frontend/src/lib/payout-server.ts">payout-server.ts</GhFile>
              </>,
              <>
                <GhFile path="frontend/src/lib/fee-sponsor-server.ts">fee-sponsor-server.ts</GhFile> (CAP 40
                fee bump)
              </>,
              <>
                <GhFile path="frontend/src/lib/soroban-commit-server.ts">soroban-commit-server.ts</GhFile>,{" "}
                <GhFile path="frontend/src/lib/soroban-poolmanager.ts">soroban-poolmanager.ts</GhFile>
              </>,
              <>
                <GhFile path="frontend/src/lib/virtual-balance.ts">virtual-balance.ts</GhFile>,{" "}
                <GhFile path="frontend/src/lib/vault.ts">vault.ts</GhFile> +{" "}
                <GhFile path="frontend/src/lib/vault-crypto.ts">vault-crypto.ts</GhFile>
              </>,
            ],
          },
          {
            title: "Agent workflow (FastAPI)",
            tone: "violet",
            githubPath: "ai-analyzer",
            points: [
              "RegIntel RAG pipeline over MongoDB",
              "Compliance Agent (multi modal)",
              "8 regulatory scrapers (OFAC, SEC, MiCA, GDPR…)",
              "OpenAI gpt-4o-mini / gpt-4o",
            ],
          },
          {
            title: "Express demo stub",
            tag: "Legacy",
            tone: "amber",
            githubPath: "backend",
            points: [
              "soroban-escrow-backend on :4000",
              "In memory payment link demo",
              "Not used in production path",
            ],
          },
        ]}
      />

      <ModuleHeading id="contracts-ref" title="Smart contracts" githubPath="contracts/poolmanager" />
      <DocP>
        A single Soroban contract, <strong>PoolManager</strong> (Rust, soroban-sdk 25), runs
        the privacy pool. It uses Poseidon hashing and BN254 scalars from Stellar&rsquo;s
        X Ray primitives. Source lives in{" "}
        <GhTree path="contracts/poolmanager">
          <Mono>contracts/poolmanager</Mono>
        </GhTree>
        . See{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("contracts")}>
          Smart contracts &amp; deployments
        </Link>{" "}
        for the full interface and addresses.
      </DocP>
    </div>
  );
}

function ProtocolsContent() {
  return (
    <div className="space-y-4">
      <DocTable
        head={["Protocol", "Role", "Where"]}
        rows={[
          ["Stellar Horizon", "Classic XLM/USDC payments, payment link settlement", "stellar-payment.ts, horizon.ts"],
          ["Soroban (Protocol 25)", "Privacy pool smart contract execution", "PoolManager, soroban-*.ts"],
          ["Poseidon / BN254 (X Ray)", "ZK friendly commitment hashing", "PoolManager (CAP 0074)"],
          ["Circle CCTP", "Native USDC burn and mint bridge", "lib/bridge/* + @circle-fin/bridge-kit"],
          ["Privy", "Email / social / embedded wallet auth", "privy-*.ts, /api/auth/privy/*"],
          ["SEP 53", "Stellar wallet message signing sign in", "sep53-verify.ts, /api/auth/*"],
          ["OpenAI", "Compliance + regulatory intelligence", "Agent workflow, /api/compliance/generate"],
          ["wagmi / viem, Solana web3", "EVM & Solana wallet connectivity for the bridge", "bridge-providers.tsx"],
        ]}
      />
      <DocNote variant="info">
        Fee sponsorship uses a Stellar <strong>CAP 40 fee bump</strong>: payers sign the inner
        payment, a sponsor account wraps it so the sponsor pays the network fee. The API
        rejects inner transactions whose destination, amount, or memo hash don&rsquo;t match
        the link.
      </DocNote>
    </div>
  );
}

function DataModelContent() {
  return (
    <div className="space-y-4">
      <DocP>
        Prisma is the ORM over <strong>MongoDB</strong> (<Mono>relationMode = &quot;prisma&quot;</Mono>).
        Identity is wallet or Privy based; businesses own all payment and compliance data.
      </DocP>
      <DocTable
        head={["Model", "Purpose"]}
        rows={[
          [<span key="app-user"><Mono>AppUser</Mono> / <Mono>Membership</Mono></span>, "Privy users and their RBAC role on a business"],
          [<Mono key="business">Business</Mono>, "Workspace: profile, tier, widgets, vault config"],
          [<Mono key="linked-wallet">LinkedWallet</Mono>, "Stellar wallets bound to a business"],
          [<Mono key="auth-challenge">AuthChallenge</Mono>, "One time SEP 53 sign in challenges (10 min TTL)"],
          [<Mono key="payment-link">PaymentLink</Mono>, "Collect links + attribution memo + ZK nullifier"],
          [<Mono key="pending-memo">PendingPaymentMemo</Mono>, "Dark pool one time memo hash for attribution"],
          [<span key="outgoing"><Mono>OutgoingPayment</Mono> / <Mono>Withdrawal</Mono></span>, "Pool payouts and spent nullifiers"],
          [<Mono key="employee">BusinessEmployee(Payment)</Mono>, "Team roster and payroll history"],
          [<Mono key="vault-item">DocumentVaultItem</Mono>, "Saved compliance checklists / documents"],
        ]}
      />
    </div>
  );
}

function FlowsContent() {
  return (
    <div className="space-y-4">
      <DocP>
        The four core flows below cover collecting a private payment, withdrawing from the
        pool, bridging USDC across chains, and running an AI compliance analysis.
      </DocP>

      <h3 id="flow-payment" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        1. Payment link &amp; private attribution
      </h3>
      <FlowChart
        title="Flowchart: collect a payment"
        nodes={[
          { kind: "start", label: "Business creates payment link" },
          { kind: "process", label: "Link stored", sub: "amount, currency, unique memo, pool address" },
          { kind: "process", label: "Customer opens /pay/[id]", sub: "connects Freighter" },
          { kind: "decision", label: "Fee sponsor configured?" },
          {
            kind: "branch",
            left: {
              label: "Yes, sponsored",
              nodes: [
                { kind: "process", label: "prepare-pay → SHA-256 memo hash" },
                { kind: "process", label: "Payer signs inner tx" },
                { kind: "onchain", label: "Sponsor fee bumps & submits", sub: "sponsor pays network fee" },
              ],
            },
            right: {
              label: "No, classic",
              nodes: [
                { kind: "process", label: "Payer signs & submits" },
                { kind: "onchain", label: "Classic payment to pool", sub: "memo attributes the link" },
              ],
            },
          },
          { kind: "process", label: "Horizon event detected", sub: "relayer / status poll" },
          { kind: "onchain", label: "PoolManager.commit(secret, nullifier, amount)", sub: "Poseidon leaf stored" },
          { kind: "process", label: "Virtual balance updated" },
          { kind: "end", label: "Dashboard shows Paid ✓" },
        ]}
      />
      <SequenceDiagram
        title="Sequence: payment attribution"
        actors={["Customer", "Pay page", "API", "Pool", "Soroban", "Dashboard"]}
        steps={[
          { from: "Customer", to: "Pay page", label: "Open link, connect Freighter" },
          { from: "Pay page", to: "API", label: "POST prepare-pay → memo hash" },
          { from: "Pay page", to: "Pool", label: "Submit XLM/USDC payment (memo)" },
          { from: "API", to: "API", label: "Detect Horizon payment, match memo", kind: "self" },
          { from: "API", to: "Soroban", label: "commit(secret, nullifier, amount, token)" },
          { from: "Soroban", to: "API", label: "CommitResult { leaf, root }", kind: "return" },
          { from: "API", to: "Dashboard", label: "Update virtual balance → Paid ✓" },
        ]}
      />

      <h3 id="flow-withdraw" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        2. Private withdrawal
      </h3>
      <SequenceDiagram
        title="Sequence: withdraw from pool"
        actors={["Business", "API", "Soroban", "Relayer", "Recipient"]}
        steps={[
          { from: "Business", to: "API", label: "Request withdrawal (amount, recipient)" },
          { from: "API", to: "API", label: "Validate virtual balance, select nullifiers", kind: "self" },
          { from: "API", to: "Soroban", label: "withdraw(recipient, nullifiers, proof, root)" },
          { from: "Soroban", to: "Soroban", label: "Mark nullifiers spent (double spend guard)", kind: "self" },
          { from: "Soroban", to: "API", label: "ok", kind: "return" },
          { from: "API", to: "Relayer", label: "Route payout via ephemeral wallet(s)" },
          { from: "Relayer", to: "Recipient", label: "Final transfer (unlinkable, jittered)" },
        ]}
      />
      <DocNote variant="warn">
        The on chain ZK proof is currently a <strong>stub</strong> (rejects empty proofs only).
        ASP approval + the nullifier registry are the active security controls until the
        Groth16 / BN254 verifier lands. See{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("privacy-payments")}>
          Privacy payments
        </Link>{" "}
        for the full privacy model, Nethermind reference, and migration plan.
      </DocNote>

      <h3 id="flow-bridge" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        3. Cross chain USDC bridge (CCTP)
      </h3>
      <SequenceDiagram
        title="Sequence: burn & mint"
        actors={["User", "Source chain", "Circle", "Dest chain"]}
        steps={[
          { from: "User", to: "Source chain", label: "Approve USDC spend" },
          { from: "User", to: "Source chain", label: "Burn USDC → emit message" },
          { from: "Source chain", to: "Circle", label: "Message observed" },
          { from: "Circle", to: "Source chain", label: "Attestation (~1 to 5 min)", kind: "return" },
          { from: "User", to: "Dest chain", label: "Submit attestation → mint native USDC" },
          { from: "Dest chain", to: "User", label: "USDC received", kind: "return" },
        ]}
      />

      <h3 id="flow-compliance" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        4. AI compliance analysis
      </h3>
      <SequenceDiagram
        title="Sequence: compliance agent"
        actors={["Dashboard", "API", "Agent workflow", "OpenAI", "MongoDB"]}
        steps={[
          { from: "Dashboard", to: "API", label: "Upload context → /api/compliance-agent/analyze" },
          { from: "API", to: "Agent workflow", label: "Proxy multipart with session guard" },
          { from: "Agent workflow", to: "MongoDB", label: "Retrieve RegIntel chunks (RAG)" },
          { from: "Agent workflow", to: "OpenAI", label: "Analyze with gpt-4o / gpt-4o-mini" },
          { from: "OpenAI", to: "Agent workflow", label: "Roadmap, licenses, controls", kind: "return" },
          { from: "Agent workflow", to: "Dashboard", label: "Structured compliance report", kind: "return" },
        ]}
      />
    </div>
  );
}

function ContractsContent() {
  const { poolManager, cctp } = TESTNET_CONTRACTS;

  return (
    <div className="space-y-4">
      <DocP>
        <strong>PoolManager</strong> locks tokens on <Mono>commit</Mono> and pays out on{" "}
        <Mono>withdraw</Mono>. The leaf is <Mono>Poseidon(secret, nullifier, amount)</Mono>;
        a rolling Poseidon accumulator tracks the root. An ASP compliance layer
        (approve/block) gates deposits, with admin pause and protocol fees. This is a{" "}
        <strong>Phase&nbsp;1 PoC</strong>; real ZK settlement will use{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("privacy-payments")}>
          Nethermind&rsquo;s pool integration
        </Link>
        .
      </DocP>
      <DocTable
        head={["Function", "Type", "Description"]}
        rows={[
          [<Mono key="initialize">initialize</Mono>, "admin", "Set admin, fee recipient, fee bps (one time)"],
          [<Mono key="commit">commit</Mono>, "core", "Deposit tokens, store Poseidon leaf + nullifier"],
          [<Mono key="withdraw">withdraw</Mono>, "core", "Reveal nullifiers + proof, pay recipient (batch)"],
          [<Mono key="set-asp">set_asp / approve / block</Mono>, "admin", "KYB whitelist + sanctions blocklist"],
          [<Mono key="pause">pause / unpause / set_fee</Mono>, "admin", "Emergency stop and fee control"],
          [<Mono key="get-state">get_state / is_nullifier_spent</Mono>, "view", "Pool root, size, config and nullifier status"],
        ]}
      />
      <DocP>
        Live Stellar testnet addresses. Click any address to open it on{" "}
        <a
          href="https://stellar.expert/explorer/testnet"
          target="_blank"
          rel="noopener noreferrer"
          className={githubLinkClass}
        >
          StellarExpert (testnet)
        </a>
        :
      </DocP>
      <DocTable
        head={["Contract / account", "Role", "Address", "Status"]}
        rows={[
          ["PoolManager", "ZK commitment pool", <ExplorerMono key="pm" address={poolManager} />, "Live"],
          ["Payment pool account", "Receives link payments", <ExplorerMono key="pool" address={POOL_ACCOUNT} />, "Live"],
          [
            "CCTP Token Messenger",
            "Burn / mint USDC",
            <ExplorerMono key="tm" address={cctp.tokenMessengerMinter} />,
            "Circle testnet",
          ],
          [
            "CCTP Message Transmitter",
            "Cross chain messages",
            <ExplorerMono key="mt" address={cctp.messageTransmitter} />,
            "Circle testnet",
          ],
          [
            "CCTP Forwarder",
            "Inbound Stellar mints",
            <ExplorerMono key="fw" address={cctp.cctpForwarder} />,
            "Circle testnet",
          ],
          [
            "USDC (Soroban)",
            "Bridged USDC on Stellar",
            <ExplorerMono key="usdc" address={cctp.usdc} />,
            "Circle testnet",
          ],
        ]}
      />
      <DocNote variant="info">
        PoolManager holds live testnet commitments. Only redeploy via{" "}
        <Mono>contracts/deploy-testnet.sh</Mono> when WASM changes; then update{" "}
        <Mono>NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID</Mono> and{" "}
        <Mono>src/lib/doc/testnet-contracts.ts</Mono>. Redeploying creates a new empty pool.
      </DocNote>
    </div>
  );
}

function RoadmapContent() {
  return (
    <div className="space-y-4">
      <DocP>
        The payments, attribution, virtual balance, and bridge flows are shipped. Privacy
        today is <strong>operational</strong> (relayer + hash memos + server bookkeeping);
        cryptographic ZK settlement is planned via integration with{" "}
        <a
          href="https://github.com/NethermindEth/stellar-private-payments"
          target="_blank"
          rel="noopener noreferrer"
          className={githubLinkClass}
        >
          Nethermind&rsquo;s Stellar privacy pool
        </a>
        . See{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("privacy-payments")}>
          Privacy payments
        </Link>{" "}
        for the full migration plan.
      </DocP>
      <StatusList
        items={[
          { label: "Payment link attribution + dark pool memo hashing", status: "done" },
          { label: "Fee sponsorship (CAP 40 fee bump)", status: "done" },
          { label: "Relayer path (hide payer from merchant)", status: "done" },
          { label: "Commitment + nullifier registry (PoolManager PoC)", status: "done" },
          { label: "Virtual balance engine + treasury withdrawals", status: "done" },
          { label: "Cross chain USDC bridge (Circle CCTP)", status: "done" },
          { label: "AI compliance agent + RegIntel + RNS", status: "done" },
          {
            label: "Nethermind pool + Groth16 verifier integration (opt-in ZK path)",
            status: "planned",
            note: "Replaces stub PoolManager for real privacy",
          },
          { label: "Browser WASM prover on private checkout", status: "planned" },
          { label: "ASP Merkle trees + in-circuit membership proofs", status: "planned" },
          { label: "Batch withdrawal + multi pool routing", status: "planned" },
          { label: "EscrowEngine wiring into payment links", status: "planned" },
          { label: "MoneyGram on ramp payment method", status: "planned" },
          { label: "Security audit + mainnet launch", status: "planned", note: "Required before real funds use" },
        ]}
      />
    </div>
  );
}

function PrivacyPaymentsContent() {
  return (
    <div className="space-y-4">
      <h3 id="privacy-overview" className="scroll-mt-20 pt-1 text-base font-semibold text-white">
        Overview
      </h3>
      <DocP>
        Hypertron ships an <strong>opt-in private settlement</strong> path for B2B payment links.
        Merchants can offer checkout where the payer&rsquo;s wallet is hidden from the business,
        and funds are tracked via commitments and nullifiers on a Soroban{" "}
        <strong>PoolManager</strong> contract. This page explains what that gives you today,
        what <strong>real</strong> cryptographic privacy looks like on Stellar, and how we plan
        to migrate from our Phase&nbsp;1 stack to a full zero-knowledge pool.
      </DocP>
      <DocNote variant="info">
        Private settlement is enabled when{" "}
        <Mono>NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID</Mono> is set (or{" "}
        <Mono>NEXT_PUBLIC_ENABLE_PRIVATE_SETTLEMENT=true</Mono>). It targets{" "}
        <strong>Stellar testnet only</strong> and is <strong>not audited</strong>.
      </DocNote>

      <h3 id="real-vs-operational" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Real vs operational privacy
      </h3>
      <DocP>
        Not all &ldquo;private payments&rdquo; are equal. Hypertron Phase&nbsp;1 and a full ZK
        privacy pool solve different problems.
      </DocP>
      <DocTable
        head={["Guarantee", "Phase 1 (Hypertron today)", "ZK pool (Nethermind target)"]}
        rows={[
          [
            "Hide payer from merchant",
            "Yes — relayer + hash memo + UI",
            "Yes — shielded UTXO inside pool",
          ],
          [
            "Hide payer from chain analyst",
            "No — payer → relayer → pool is traceable",
            "Yes — ZK proofs break on-chain links",
          ],
          ["Hide amount", "No — visible on Horizon payment", "Yes — inside pool"],
          [
            "Unlinkable withdrawal",
            "No — direct pool → recipient payout",
            "Yes — nullifier spend via ZK proof",
          ],
          [
            "Server cannot spend user funds",
            "No — server derives secrets, signs commits",
            "Yes — client holds note keys",
          ],
          [
            "Trust model",
            "Trust Hypertron backend + pool operator",
            "Trustless on-chain verification",
          ],
        ]}
      />
      <DocNote variant="warn">
        <p className="mb-2">
          <strong>Operational privacy</strong> (Phase&nbsp;1) is appropriate for &ldquo;the
          merchant shouldn&rsquo;t see who paid.&rdquo; <strong>Cryptographic privacy</strong>{" "}
          (Phase&nbsp;2) is required for unlinkable, trustless settlement — the standard set by
          Nethermind&rsquo;s reference implementation.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Phase&nbsp;1</strong> solves a real merchant problem.
          </li>
          <li>
            <strong>Phase&nbsp;2</strong> adds cryptographic privacy via Nethermind&rsquo;s stack.
          </li>
        </ul>
      </DocNote>

      <h3 id="reference-nethermind" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Nethermind reference implementation
      </h3>
      <DocP>
        The Stellar Privacy Engineering team at Nethermind maintains the canonical open-source
        privacy pool for Soroban. It is the intended upgrade path for Hypertron&rsquo;s ZK layer
        and is explicitly referenced in our PoolManager source.
      </DocP>
      <DocBullets
        items={[
          <>
            <strong>Repository:</strong>{" "}
            <a
              href="https://github.com/NethermindEth/stellar-private-payments"
              target="_blank"
              rel="noopener noreferrer"
              className={githubLinkClass}
            >
              github.com/NethermindEth/stellar-private-payments ↗
            </a>
          </>,
          <>
            <strong>Live demo:</strong>{" "}
            <a
              href="https://nethermindeth.github.io/stellar-private-payments/"
              target="_blank"
              rel="noopener noreferrer"
              className={githubLinkClass}
            >
              nethermindeth.github.io/stellar-private-payments ↗
            </a>
          </>,
          <>
            <strong>Stack:</strong> Circom circuits, Groth16 proofs (browser WASM), Pool +
            CircomGroth16Verifier + ASP Membership + ASP Non-Membership Soroban contracts
          </>,
          <>
            <strong>Model:</strong> 2-in / 2-out UTXO transactions — deposit, private transfer,
            and withdraw inside the pool with balance conservation proved in zero knowledge
          </>,
          <>
            <strong>Compliance:</strong> Association Set Provider (ASP) membership and
            non-membership Merkle proofs enforced inside the circuit
          </>,
          <>
            <strong>Status:</strong> Work in progress, not audited — same caution as Hypertron
            testnet beta
          </>,
        ]}
      />
      <DocNote variant="warn">
        We do <strong>not</strong> fork or reimplement Nethermind&rsquo;s circuits from scratch.
        Phase&nbsp;2 embeds their pool, verifier, and prover as the settlement layer while
        Hypertron remains the B2B orchestration layer (payment links, vaults, dashboard, KYB).
      </DocNote>

      <h3 id="current-architecture" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Current architecture (Phase 1)
      </h3>
      <DocP>
        Phase&nbsp;1 splits settlement across <strong>classic Horizon payments</strong> (fund
        custody) and a <strong>Soroban commitment registry</strong> (double-spend bookkeeping).
        Privacy is achieved at the application layer, not inside a shielded pool.
      </DocP>
      <FlowChart
        title="Phase 1: operational private checkout"
        nodes={[
          { kind: "start", label: "Customer opts in to private settlement" },
          { kind: "process", label: "POST prepare-pay → SHA-256 memo hash", sub: "PendingPaymentMemo in DB" },
          { kind: "decision", label: "Relayer configured?" },
          {
            kind: "branch",
            left: {
              label: "Yes",
              nodes: [
                { kind: "onchain", label: "Payer → relayer (hash memo)" },
                { kind: "onchain", label: "Relayer → pool G-address (same memo)" },
              ],
            },
            right: {
              label: "No",
              nodes: [{ kind: "onchain", label: "Payer → pool / vault (hash memo)" }],
            },
          },
          { kind: "process", label: "Horizon match + attribution", sub: "status poll / relayer inbox" },
          {
            kind: "process",
            label: "Server derives secret + nullifier",
            sub: "hashToScalar(payer, businessId, amount)",
          },
          { kind: "onchain", label: "PoolManager.commit (Soroban)", sub: "Poseidon leaf + nullifier reg" },
          { kind: "process", label: "Virtual balance updated (Prisma)" },
          { kind: "end", label: "Merchant sees Paid ✓ (no payer address)" },
        ]}
      />
      <DocP>Key components in the repo:</DocP>
      <DocTable
        head={["Layer", "Files / contracts", "Role"]}
        rows={[
          [
            "Checkout UX",
            <>
              <GhFile path="frontend/src/app/pay/[id]/page.tsx">pay/[id]</GhFile>,{" "}
              <GhFile path="frontend/src/lib/privacy-features.ts">privacy-features.ts</GhFile>
            </>,
            "Opt-in toggle, prepare-pay, Freighter signing",
          ],
          [
            "Hash memo",
            <GhFile key="prepare" path="frontend/src/app/api/payment-link/[id]/prepare-pay/route.ts">
              prepare-pay
            </GhFile>,
            "One-time opaque memo; no link id on chain",
          ],
          [
            "Relayer",
            <GhFile key="relayer" path="frontend/src/lib/relayer.ts">
              relayer.ts
            </GhFile>,
            "Hide payer from pool observer; forward to pool",
          ],
          [
            "Attribution",
            <GhFile key="status" path="frontend/src/app/api/payment-link/[id]/status/route.ts">
              status/route.ts
            </GhFile>,
            "Horizon match → commit → update PaymentLink",
          ],
          [
            "Soroban client",
            <>
              <GhFile path="frontend/src/lib/soroban-commit-server.ts">soroban-commit-server.ts</GhFile>,{" "}
              <GhFile path="frontend/src/lib/soroban-poolmanager.ts">soroban-poolmanager.ts</GhFile>
            </>,
            "Server-side commit / withdraw invocations",
          ],
          [
            "PoolManager (PoC)",
            <GhTree key="pm" path="contracts/poolmanager">
              contracts/poolmanager
            </GhTree>,
            "Poseidon leaf, nullifier registry, ASP approve/block, stub ZK verifier",
          ],
          [
            "Virtual balance",
            <GhFile key="vb" path="frontend/src/lib/virtual-balance.ts">
              virtual-balance.ts
            </GhFile>,
            "Off-chain ledger of unspent nullifiers per business",
          ],
          [
            "Withdrawal",
            <>
              <GhFile path="frontend/src/app/api/withdraw/route.ts">/api/withdraw</GhFile>,{" "}
              <GhFile path="frontend/src/lib/payout-server.ts">payout-server.ts</GhFile>
            </>,
            "Mark nullifiers on Soroban + Horizon payout from pool account",
          ],
        ]}
      />
      <DocNote variant="warn">
        PoolManager stores <Mono>depositor</Mono> and <Mono>amount</Mono> on chain, uses a
        rolling Poseidon accumulator (not a Merkle tree), and{" "}
        <Mono>verify_proof_stub</Mono> accepts any non-empty proof. These are intentional PoC
        shortcuts — not production privacy guarantees.
      </DocNote>

      <h3 id="current-status" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Where we are today
      </h3>
      <StatusList
        items={[
          {
            label: "Opt-in private settlement on payment links (testnet beta)",
            status: "done",
          },
          { label: "Hash-memo dark pool (prepare-pay + PendingPaymentMemo)", status: "done" },
          { label: "Relayer: payer hidden from merchant / pool memo match", status: "done" },
          { label: "Fee sponsorship (CAP-40) on private checkout", status: "done" },
          {
            label: "PoolManager commit + nullifier registry on Soroban testnet",
            status: "done",
            note: "PoC contract; SDK call shape may lag contract ABI",
          },
          { label: "Virtual balance + /api/withdraw treasury flow", status: "done" },
          { label: "Groth16 on-chain proof verification", status: "planned" },
          { label: "Client-side WASM prover (Circom)", status: "planned" },
          { label: "Merkle commitment tree + membership proofs", status: "planned" },
          { label: "Single shielded pool custody (no split Horizon + Soroban)", status: "planned" },
          { label: "Privacy relay (multi-hop ephemeral wallets)", status: "planned", note: "Described in README; not implemented — superseded by ZK path for real unlinkability" },
          { label: "Security audit before mainnet", status: "planned" },
        ]}
      />

      <h3 id="target-architecture" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Target architecture (Phase 2)
      </h3>
      <DocP>
        Phase&nbsp;2 keeps Hypertron as the product layer and swaps the settlement engine for
        Nethermind&rsquo;s shielded pool when the customer opts in. Standard checkout (direct
        vault payment) stays unchanged.
      </DocP>
      <FlowChart
        title="Phase 2: opt-in ZK private checkout"
        nodes={[
          { kind: "start", label: "Customer selects Private (ZK) checkout" },
          { kind: "process", label: "Browser loads WASM prover", sub: "Nethermind circuit artifacts" },
          { kind: "process", label: "Client generates deposit proof + note", sub: "User holds secrets" },
          { kind: "onchain", label: "Pool.transact(proof, ext_data)", sub: "Tokens locked in pool contract" },
          { kind: "process", label: "Hypertron indexes pool events", sub: "Update merchant virtual balance" },
          { kind: "end", label: "Merchant sees Paid ✓ (cryptographically private)" },
        ]}
      />
      <DocP>Nethermind contracts to deploy alongside (or instead of) stub PoolManager:</DocP>
      <DocTable
        head={["Contract", "Purpose"]}
        rows={[
          ["Pool", "Merkle UTXO pool — transact (deposit / transfer / withdraw)"],
          ["CircomGroth16Verifier", "On-chain Groth16 proof verification (BN254)"],
          ["ASPMembership", "Merkle tree of approved note public keys"],
          ["ASPNonMembership", "Sparse Merkle exclusion list"],
        ]}
      />
      <DocP>What Hypertron keeps vs replaces:</DocP>
      <DocTable
        head={["Keep (Hypertron)", "Replace / embed (Nethermind)"]}
        rows={[
          ["Payment links, /pay checkout, fee sponsorship", "PoolManager stub → Pool + Verifier"],
          ["Business vaults, treasury UX, virtual balance display", "Server hashToScalar secrets → client UTXO notes"],
          ["Relayer (optional pre-pool obfuscation)", "Horizon-only custody → in-contract token lock"],
          ["KYB / compliance dashboard", "Inline approve/block maps → ASP Merkle + circuit proofs"],
          ["Prisma attribution (link id ↔ payment)", "Event sync from pool NewCommitment / NewNullifier events"],
        ]}
      />

      <h3 id="migration-plan" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Migration plan
      </h3>
      <DocP>
        Migration is phased so merchants can ship confidential checkout now while ZK settlement
        is integrated without breaking standard payments.
      </DocP>

      <h4 className="pt-2 text-sm font-semibold text-white/90">Phase 1 — Shipped (operational privacy)</h4>
      <DocBullets
        items={[
          "Hash-memo + relayer + PoolManager PoC commits",
          "Market honestly as “payer hidden from merchant” — not ZK-shielded",
          "Fix contract ↔ SDK ABI alignment if continuing PoC commits on testnet",
        ]}
      />

      <h4 className="pt-2 text-sm font-semibold text-white/90">Phase 2 — Nethermind integration (real privacy)</h4>
      <DocBullets
        items={[
          <>
            Deploy Nethermind contracts to testnet using their{" "}
            <Mono>deployments/scripts/deploy.sh</Mono> (pool levels, ASP levels, verification key)
          </>,
          "Bundle Circom WASM prover + circuit keys in the private checkout path only",
          "Replace executeCommit with client-side Pool.transact() deposit flow",
          "Replace sendPayout + stub withdraw with ZK withdraw transact from pool",
          "Sync virtual balances from pool contract events (replace server-derived nullifier tracking where possible)",
          "Wire KYB-approved businesses into ASP membership tree (admin UI or CLI)",
        ]}
      />

      <h4 className="pt-2 text-sm font-semibold text-white/90">Phase 3 — Production hardening</h4>
      <DocBullets
        items={[
          "Joint or independent security audit (Hypertron BFF + Nethermind pool path)",
          "Trusted setup / verification key governance documented for deployers",
          "Mainnet deploy only after Protocol 25 X-Ray verifier is stable on public network",
          "Deprecate stub PoolManager; migrate open nullifiers or sunset testnet pool",
        ]}
      />

      <SequenceDiagram
        title="Migration: dual settlement backends"
        actors={["Pay page", "Hypertron API", "Phase 1 path", "Nethermind Pool", "Merchant"]}
        steps={[
          { from: "Pay page", to: "Pay page", label: "User chooses Standard vs Private (ZK)", kind: "self" },
          {
            from: "Pay page",
            to: "Phase 1 path",
            label: "Standard → Horizon payment to vault/pool G-address",
          },
          {
            from: "Pay page",
            to: "Nethermind Pool",
            label: "Private (ZK) → WASM proof + transact deposit",
          },
          { from: "Phase 1 path", to: "Hypertron API", label: "Memo match + optional commit", kind: "return" },
          { from: "Nethermind Pool", to: "Hypertron API", label: "Pool events → virtual balance", kind: "return" },
          { from: "Hypertron API", to: "Merchant", label: "Dashboard: Paid ✓" },
        ]}
      />

      <h3 id="dual-mode-checkout" className="scroll-mt-20 pt-3 text-base font-semibold text-white">
        Opt-in dual-mode checkout
      </h3>
      <DocP>
        The product goal is a single payment link with two modes — defaulting to standard
        (simple, auditable) and offering private settlement as an explicit opt-in:
      </DocP>
      <DocTable
        head={["Mode", "User experience", "Privacy level", "Backend"]}
        rows={[
          [
            "Standard",
            "Pay vault / pool directly; text or fixed memo",
            "Public on-chain payment",
            "Current Hypertron Horizon flow",
          ],
          [
            "Confidential (Phase 1)",
            "Hash memo; optional relayer; payer hidden from merchant",
            "Operational",
            "relayer.ts + PoolManager PoC + virtual balance",
          ],
          [
            "Private / ZK (Phase 2)",
            "Freighter signs ZK deposit; note stored client-side",
            "Cryptographic",
            "Nethermind Pool + WASM prover + ASP",
          ],
        ]}
      />
      <DocP>
        Environment flags today:{" "}
        <Mono>NEXT_PUBLIC_ENABLE_PRIVATE_SETTLEMENT</Mono>,{" "}
        <Mono>NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID</Mono>,{" "}
        <Mono>NEXT_PUBLIC_RELAYER_PUBLIC_KEY</Mono> / <Mono>RELAYER_SECRET_KEY</Mono>,{" "}
        <Mono>SOROBAN_COMMIT_SOURCE_SECRET</Mono>. Phase&nbsp;2 adds Nethermind contract IDs,
        circuit key paths, and prover bundle config (TBD).
      </DocP>
      <DocNote variant="info">
        Related docs:{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("flows")}>
          End to end flows
        </Link>
        ,{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("contracts")}>
          Smart contracts &amp; deployments
        </Link>
        ,{" "}
        <Link className="text-blue-400 hover:text-blue-300" href={technicalHref("roadmap")}>
          Work in progress
        </Link>
        .
      </DocNote>
    </div>
  );
}

const CONTENT: Record<string, () => JSX.Element> = {
  overview: OverviewContent,
  architecture: ArchitectureContent,
  modules: ModulesContent,
  protocols: ProtocolsContent,
  "data-model": DataModelContent,
  flows: FlowsContent,
  "privacy-payments": PrivacyPaymentsContent,
  contracts: ContractsContent,
  roadmap: RoadmapContent,
};

export function TechnicalPageContent({ slug }: { slug: string }) {
  const Component = CONTENT[slug];
  if (!Component) return null;
  return <Component />;
}
