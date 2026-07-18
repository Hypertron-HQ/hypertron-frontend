import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/utils";
import { ArrowRightIcon, BarChart3Icon, FileTextIcon, Link2Icon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Integrations } from "./integrations";
import { Label } from "./label";

export const CARDS = [
    {
        Icon: Link2Icon,
        name: "One workflow link",
        description: "Create a workflow, generate your link, and share it with clients or borrowers. They complete onboarding and payments in one place.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-1",
        background: (
            <Card className="absolute top-10 left-10 origin-top rounded-none rounded-tl-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105 border border-border border-r-0">
                <CardHeader>
                    <CardTitle>Create workflow</CardTitle>
                    <CardDescription>Define steps, documents, and payment terms. Generate your link.</CardDescription>
                </CardHeader>
                <CardContent className="-mt-4">
                    <Label>Workflow link</Label>
                    <Input type="text" placeholder="hypertron.io/w/your-workflow" className="w-full focus-visible:ring-0 focus-visible:ring-transparent" />
                </CardContent>
            </Card>
        ),
    },
    {
        Icon: WalletIcon,
        name: "Escrow & payments",
        description: "Accept payments, lock funds in escrow, and release when milestones are met. Secure settlement built in.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-2",
        background: (
            <Card className="absolute right-10 top-10 w-[70%] origin-top rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105 p-4">
                <CardHeader className="p-0">
                    <CardTitle className="text-sm">Payment & escrow</CardTitle>
                    <CardDescription className="text-xs">Funds held securely until conditions are met.</CardDescription>
                </CardHeader>
                <CardContent className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="px-3 py-2 hover:bg-muted rounded-md">Milestone 1 — Pending</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md">Milestone 2 — Approved</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md">Release — Ready</div>
                </CardContent>
            </Card>
        ),
    },
    {
        Icon: FileTextIcon,
        name: "Document vault",
        description: "Collect required documents from clients in one place. Templates and secure storage included.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-2 max-w-full overflow-hidden",
        background: (
            <Integrations className="absolute right-2 pl-28 md:pl-0 top-4 h-[300px] w-[600px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
        ),
    },
    {
        Icon: BarChart3Icon,
        name: "Track progress",
        description: "See who opened the link, completed steps, uploaded docs, and payment status in real time.",
        className: "col-span-3 lg:col-span-1",
        href: "#",
        cta: "Learn more",
        background: (
            <Calendar
                mode="single"
                selected={new Date(2022, 4, 11, 0, 0, 0)}
                className="absolute right-0 top-10 origin-top rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
            />
        ),
    },
];

const BentoGrid = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
                className,
            )}
        >
            {children}
        </div>
    );
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: {
    name: string;
    className: string;
    background: ReactNode;
    Icon: any;
    description: string;
    href: string;
    cta: string;
}) => (
    <div
        key={name}
        className={cn(
            "group relative col-span-3 flex flex-col justify-between border border-blue-500/20 overflow-hidden rounded-xl bg-blue-950/20 hover:border-blue-500/30",
            "[box-shadow:0_-20px_80px_-20px_rgba(59,130,246,0.08)_inset]",
            className,
        )}
    >
        <div>{background}</div>
        <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-12 w-12 origin-left text-blue-400/90 transition-all duration-300 ease-in-out group-hover:scale-75" />
            <h3 className="text-xl font-semibold text-blue-100">
                {name}
            </h3>
            <p className="max-w-lg text-blue-200/70">{description}</p>
        </div>

        <div
            className={cn(
                "absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
            )}
        >
            <Link href={href} className={buttonVariants({ size: "sm", variant: "ghost", className: "cursor-pointer" })}>
                {cta}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
        </div>
        <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
    </div>
);

export { BentoCard, BentoGrid };
