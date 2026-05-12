import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, monthKey } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { transactions, profile } = useFinanceData();
  const baseSalary = Number(profile?.base_salary ?? 0);

  const last12 = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const k = monthKey(d);
      const txs = transactions.filter((t) => t.date.startsWith(k));
      const entradas = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) + baseSalary;
      const saidas = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), entradas, saidas, saldo: entradas - saidas };
    });
  }, [transactions, baseSalary]);

  const totals = useMemo(() => {
    const entradas = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const saidas = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { entradas, saidas, saldo: entradas - saidas, count: transactions.length };
  }, [transactions]);

  const fmtTooltip = (v: any) => formatCurrency(Number(v));

  return (
    <AppLayout title="Relatórios" subtitle="Evolução financeira ao longo do tempo">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Total de entradas" value={formatCurrency(totals.entradas)} tone="success" />
        <Stat label="Total de saídas" value={formatCurrency(totals.saidas)} tone="primary" />
        <Stat label="Saldo acumulado" value={formatCurrency(totals.saldo)} tone={totals.saldo >= 0 ? "primary" : "danger"} />
        <Stat label="Lançamentos" value={String(totals.count)} />
      </div>

      <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="font-semibold mb-4">Evolução dos últimos 12 meses</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip formatter={fmtTooltip} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="entradas" stroke="oklch(0.8 0.09 160)" strokeWidth={2.5} dot={{ r: 3 }} name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="oklch(0.78 0.11 350)" strokeWidth={2.5} dot={{ r: 3 }} name="Saídas" />
              <Line type="monotone" dataKey="saldo" stroke="oklch(0.75 0.12 320)" strokeWidth={2.5} dot={{ r: 3 }} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" | "primary" }) {
  const c = { default: "", success: "text-success-foreground", danger: "text-destructive", primary: "text-primary" }[tone];
  return (
    <div className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={"text-2xl font-bold mt-1 " + c}>{value}</div>
    </div>
  );
}
