import { BarChart3Icon, FolderOpenIcon, WandSparklesIcon, ShieldCheckIcon, EyeIcon, LockIcon, CoinsIcon, GitBranchIcon, SparklesIcon } from "lucide-react";

export const DEFAULT_AVATAR_URL = "https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear&backgroundRotation=0,360&seed=";

export const PAGINATION_LIMIT = 10;

export const COMPANIES: { name: string; logo: string }[] = [];

export const PROCESS = [
    {
        title: "Create your account & workflow",
        description: "Sign up, verify your business, and define your onboarding flow: client info, documents, scope, payment terms, and milestones.",
        icon: FolderOpenIcon,
    },
    {
        title: "Invite clients to the workflow",
        description: "Clients, borrowers, or investors complete onboarding and documents in one guided flow, with no manual chasing.",
        icon: WandSparklesIcon,
    },
    {
        title: "Receive payment & track progress",
        description: "Funds go to escrow or you get paid through the platform. Track deal progress, milestones, and releases in your dashboard.",
        icon: BarChart3Icon,
    },
] as const;

export const FEATURES = [
    {
        title: "Privacy pool & execution",
        description:
            "Soroban-backed pool with commitment and nullifier flows: onboarding to payment to pool to private payout, with relayer integration for opt-in privacy.",
        icon: LockIcon,
    },
    {
        title: "XLM receivables & tracking",
        description:
            "Collect inbound XLM with clear memos and attribution while you monitor status and settlement in one dashboard.",
        icon: CoinsIcon,
    },
    {
        title: "Workflows & AI dashboard",
        description:
            "Guided onboarding, wallet abstraction where it helps, and an AI-assisted dashboard to design and monitor workflows, not a patchwork of tools.",
        icon: SparklesIcon,
    },
    {
        title: "Real-time visibility",
        description:
            "See who joined each workflow, completed KYC and documents, and paid, without losing the thread across email and spreadsheets.",
        icon: EyeIcon,
    },
    {
        title: "Compliance in the flow",
        description: "KYB, document checks, and approvals embedded in the same workflow as payments and milestones.",
        icon: ShieldCheckIcon,
    },
    {
        title: "One programmable pipeline",
        description: "Encode onboarding, compliance touchpoints, and payment terms in a single operational flow so nothing slips through.",
        icon: GitBranchIcon,
    },
] as const;

export const REVIEWS = [
    { name: "Michael Smith", username: "@michaelsmith", avatar: "https://randomuser.me/api/portraits/men/1.jpg", rating: 5, review: "We onboard clients in half the time. Escrow and approvals are built in, with no more spreadsheets or manual follow-ups." },
    { name: "Emily Johnson", username: "@emilyjohnson", avatar: "https://randomuser.me/api/portraits/women/1.jpg", rating: 5, review: "Unified onboarding and payments finally in one place. Our RWA deals run smoothly from commitment to disbursement." },
    { name: "Daniel Williams", username: "@danielwilliams", avatar: "https://randomuser.me/api/portraits/men/2.jpg", rating: 5, review: "The guided workflow is a game-changer. Clients complete everything themselves; we just track and get paid." },
    { name: "Sophia Brown", username: "@sophiabrown", avatar: "https://randomuser.me/api/portraits/women/2.jpg", rating: 5, review: "Replaced our manual onboarding with one pipeline. Faster conversions and way less admin." },
    { name: "James Taylor", username: "@jamestaylor", avatar: "https://randomuser.me/api/portraits/men/3.jpg", rating: 5, review: "As an agency, we needed this. One workflow for scope, docs, and payment. Highly recommend." },
    { name: "Olivia Martinez", username: "@oliviamartinez", avatar: "https://randomuser.me/api/portraits/women/3.jpg", rating: 5, review: "Clean, guided experience for our borrowers. We see progress in real time and funds are secure until milestones." },
    { name: "William Garcia", username: "@williamgarcia", avatar: "https://randomuser.me/api/portraits/men/4.jpg", rating: 5, review: "Best B2B onboarding tool we've used. Escrow and approvals give us and our clients peace of mind." },
    { name: "Mia Rodriguez", username: "@miarodriguez", avatar: "https://randomuser.me/api/portraits/women/4.jpg", rating: 5, review: "From proposal to payment in one flow. Our operations are finally seamless." },
    { name: "Henry Lee", username: "@henrylee", avatar: "https://randomuser.me/api/portraits/men/5.jpg", rating: 5, review: "We run structured client and borrower interactions through one platform. Couldn't imagine going back." },
] as const;
