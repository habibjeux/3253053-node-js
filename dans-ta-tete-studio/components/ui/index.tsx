import type { ComponentProps, ReactNode } from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-line bg-surface/80 p-4 backdrop-blur", className)} {...p} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" };
export function Button({ className, variant = "primary", ...p }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition active:scale-[.98] disabled:opacity-50",
        variant === "primary" && "bg-violet text-white shadow-[0_0_24px_-6px_rgb(124_58_237/.8)] hover:bg-violet/90",
        variant === "ghost" && "border border-line bg-surface-2 text-text hover:border-violet/60",
        variant === "danger" && "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        className,
      )}
      {...p}
    />
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "violet" | "demo" | "ok" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "violet" && "bg-violet/15 text-violet-soft",
        tone === "demo" && "border border-warn/40 bg-warn/10 text-warn",
        tone === "ok" && "bg-ok/10 text-ok",
        tone === "warn" && "bg-warn/10 text-warn",
      )}
    >
      {children}
    </span>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  return show ? <Badge tone="demo">Démo</Badge> : null;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line p-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
