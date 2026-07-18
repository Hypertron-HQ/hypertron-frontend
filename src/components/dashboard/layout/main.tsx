"use client";

import { cn } from "@/utils";

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  fluid?: boolean;
};

export function DashboardMain({
  fixed,
  className,
  fluid,
  ...props
}: MainProps) {
  return (
    <main
      data-layout={fixed ? "fixed" : "auto"}
      className={cn(
        "flex-1 px-4 py-8 md:px-8 md:py-10",
        fixed && "flex grow flex-col overflow-hidden",
        !fluid && "mx-auto w-full max-w-7xl",
        className
      )}
      {...props}
    />
  );
}
