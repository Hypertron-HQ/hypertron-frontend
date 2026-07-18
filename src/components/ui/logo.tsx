import React from 'react'
import { HypertronLogoMark } from "@/components/global/hypertron-logo-mark";
import { cn } from "@/utils";

interface Props {
    variant?: "icon" | "text" | "full";
    className?: string;
}

const HypertronWordmark = ({ className }: { className?: string }) => (
    <span className={cn("text-lg font-semibold tracking-tight text-slate-900", className)}>
        Hypertron
    </span>
);

const Logo = ({ variant = "icon", className }: Props) => {
    return (
        <>
            {variant === "icon" ? (
                <div className={cn("transition-all", className)}>
                    <HypertronLogoMark size={32} />
                </div>
            ) : variant === "text" ? (
                <HypertronWordmark className={className} />
            ) : (
                <div className={cn("flex h-8 w-auto items-center space-x-2 transition-all", className)}>
                    <HypertronLogoMark size={32} />
                    <HypertronWordmark className="text-base" />
                </div>
            )}
        </>
    )
};

export default Logo
