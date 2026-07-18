export const PLANS = [
    {
        name: "Starter",
        info: "For small teams and freelancers",
        price: { monthly: 0, yearly: 0 },
        features: [
            { text: "Up to 3 workflows" },
            { text: "Basic onboarding steps", tooltip: "Collect info and documents" },
            { text: "1 workflow link", tooltip: "Share with clients or borrowers" },
            { text: "Community support", tooltip: "Get help in our Discord" },
        ],
        btn: { text: "Start for free", href: "/?launch=1", variant: "default" },
    },
    {
        name: "Pro",
        info: "For agencies and growing businesses",
        price: { monthly: 9, yearly: Math.round(9 * 12 * (1 - 0.12)) },
        features: [
            { text: "Unlimited workflows" },
            { text: "Escrow & payment collection", tooltip: "Accept payments and hold in escrow" },
            { text: "Document vault", tooltip: "Store and manage client documents" },
            { text: "Milestones & approvals", tooltip: "Release funds on milestone completion" },
            { text: "Real-time tracking", tooltip: "See completion and payment status" },
            { text: "Priority support", tooltip: "24/7 chat support" },
        ],
        btn: { text: "Get started", href: "/?launch=1", variant: "purple" },
    },
    {
        name: "Business",
        info: "For large organizations and RWA",
        price: { monthly: 49, yearly: Math.round(49 * 12 * (1 - 0.12)) },
        features: [
            { text: "Everything in Pro" },
            { text: "Custom branding", tooltip: "White-label workflow experience" },
            { text: "Approval workflows", tooltip: "Internal finance/legal approval layers" },
            { text: "Export & reporting", tooltip: "Export deal and payment data" },
            { text: "Dedicated manager", tooltip: "Priority support from our team" },
        ],
        btn: { text: "Contact team", href: "/?launch=1", variant: "default" },
    },
];

export const PRICING_FEATURES = [
    { text: "Workflow builder", tooltip: "Define onboarding and payment steps" },
    { text: "Escrow & settlements", tooltip: "Secure payments until conditions are met" },
    { text: "Document vault", tooltip: "Collect and store client documents" },
    { text: "Real-time tracking", tooltip: "See who completed steps and payment status" },
    { text: "Community support", tooltip: "Available for free users" },
    { text: "Priority support", tooltip: "Get priority support from our team" },
];

export const WORKSPACE_LIMIT = 2;
