import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  Target,
  PieChart,
  Settings,
  LogOut,
  Heart,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transacoes", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/contas-a-pagar", label: "Contas a pagar", icon: Receipt },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/orcamento", label: "Orçamento", icon: Wallet },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/relatorios", label: "Relatórios", icon: PieChart },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative z-10">
      <div className="px-6 py-6 flex items-center gap-2 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--gradient-primary)" }}>
          <Heart className="h-5 w-5 text-white" fill="currentColor" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">Finova</div>
          <div className="text-xs text-sidebar-foreground/60">Controle financeiro</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="h-9 w-9 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ background: "var(--gradient-primary)" }}>
            {(user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <div className="text-xs text-sidebar-foreground/60">Conta pessoal</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              nav({ to: "/login" });
            }}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
