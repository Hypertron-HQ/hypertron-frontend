import { cn } from "@/utils";

export function LogoMark({
  className,
  outerClassName,
  innerClassName,
}: {
  className?: string;
  outerClassName?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-foreground/60 flex items-center justify-center",
          outerClassName ?? "h-7 w-7",
        )}
      >
        <div
          className={cn(
            "rounded-full border border-foreground/60",
            innerClassName ?? "h-3 w-3",
          )}
        />
      </div>
    </div>
  );
}
