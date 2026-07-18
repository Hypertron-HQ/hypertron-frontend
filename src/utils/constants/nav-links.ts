import { FileTextIcon, LineChartIcon, Link2Icon, WalletIcon } from "lucide-react";

export const NAV_LINKS = [
    { title: "About", href: "/#about" },
    {
        title: "Features",
        href: "/features",
        menu: [
            { title: "Workflows", tagline: "One link for onboarding and payments.", href: "/features/link-shortening", icon: Link2Icon },
            { title: "Document Vault", tagline: "Collect and store client documents.", href: "/features/password-protection", icon: FileTextIcon },
            { title: "Payment & escrow", tagline: "Secure payments and release on milestones.", href: "/features/analytics", icon: WalletIcon },
            { title: "Tracking", tagline: "Real-time progress and completion status.", href: "/features/qr-codes", icon: LineChartIcon },
        ],
    },
    { title: "Pricing", href: "/pricing" },
];
