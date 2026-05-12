import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { HeartsBackground } from "@/components/HeartsBackground";

export function AppLayout({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex text-foreground relative">
      <HeartsBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="px-6 md:px-10 py-6 border-b border-border bg-card/40 backdrop-blur">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 px-6 md:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
