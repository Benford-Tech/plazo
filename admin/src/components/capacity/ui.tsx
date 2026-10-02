import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Buttons of the internal tool (mockup: 44 px high, capitals, sharp corners). */
export const ToolButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "map"; active?: boolean }>(
  function ToolButton({ variant = "outline", active, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center justify-center px-4 text-[15px] font-bold uppercase leading-tight tracking-[0.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === "outline" && "border border-border text-foreground hover:bg-accent",
          variant === "map" && "border border-border bg-background/70 text-foreground backdrop-blur-sm hover:bg-background/90",
          active && "border-primary bg-primary text-primary-foreground hover:bg-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

export function PanelLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-1 text-xs font-semibold uppercase tracking-[1px] text-muted-foreground", className)}>{children}</div>;
}

export function Aside({ children, wide, className }: { children: React.ReactNode; wide?: boolean; className?: string }) {
  return (
    <aside className={cn("flex min-h-0 shrink-0 flex-col gap-3.5 border-l border-border p-[18px]", wide ? "w-[420px]" : "w-[360px]", className)}>{children}</aside>
  );
}

/** Bottom of the side panel: the step's actions, right-aligned. */
export function AsideActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex justify-end gap-2 pt-2">{children}</div>;
}
