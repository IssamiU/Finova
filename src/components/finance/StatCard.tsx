import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "danger" | "warning" | "primary";
  trend?: { value: string; positive?: boolean };
}) {
  const tones = {
    default: "from-card to-card",
    success: "from-card to-[oklch(0.96_0.04_160)] dark:to-[oklch(0.32_0.04_160)]",
    danger: "from-card to-[oklch(0.97_0.03_25)] dark:to-[oklch(0.32_0.04_25)]",
    warning: "from-card to-[oklch(0.97_0.04_75)] dark:to-[oklch(0.32_0.04_75)]",
    primary: "from-card to-[oklch(0.97_0.03_350)] dark:to-[oklch(0.34_0.05_350)]",
  };
  const iconTones = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/25 text-success-foreground",
    danger: "bg-destructive/15 text-destructive",
    warning: "bg-warning/25 text-warning-foreground",
    primary: "bg-primary/20 text-primary-foreground",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        tones[tone],
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold tracking-tight truncate">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconTones[tone])}
            style={tone === "primary" ? { background: "var(--gradient-primary)", color: "white" } : undefined}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn("mt-3 inline-flex items-center text-xs font-medium px-2 py-1 rounded-md", trend.positive ? "bg-success/20 text-success-foreground" : "bg-destructive/15 text-destructive")}>
          {trend.value}
        </div>
      )}
    </div>
  );
}
