import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/finance/StatCard";
import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, categories, transactions, loading, reload } = useFinanceData();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthKey());

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month],
  );

  const incomeFromTx = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const baseSalary = Number(profile?.base_salary ?? 0);
  const totalIncome = incomeFromTx + baseSalary;
  const totalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      const k = t.category_id ?? "none";
      map.set(k, (map.get(k) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([id, value]) => {
        const c = categories.find((c) => c.id === id);
        return { id, name: c?.name ?? "Sem categoria", color: c?.color ?? "#e9b8c9", value };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTx, categories]);

  const last6 = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const k = monthKey(d);
      const txs = transactions.filter((t) => t.date.startsWith(k));
      return {
        month: d.toLocaleDateString("pt-BR", { month: "short" }),
        entradas: txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) + baseSalary,
        saidas: txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, baseSalary]);

  const fmtTooltip = (v: any) => formatCurrency(Number(v));

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Resumo de ${monthLabel(month)}`}
      actions={
        <>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <Button onClick={() => setOpen(true)} className="text-white" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="h-4 w-4 mr-1" /> Novo lançamento
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Valor sobrando na conta" tone={balance >= 0 ? "primary" : "danger"}
              value={formatCurrency(balance)} icon={<Wallet className="h-5 w-5" />}
              hint={`${savingsRate.toFixed(1)}% economizado`}
            />
            <StatCard
              label="Valor de entrada" tone="success"
              value={formatCurrency(totalIncome)} icon={<ArrowDownCircle className="h-5 w-5" />}
              hint={baseSalary > 0 ? `Inclui salário ${formatCurrency(baseSalary)}` : `${monthTx.filter(t=>t.type==='income').length} lançamentos`}
            />
            <StatCard
              label="Valor de saída" tone="danger"
              value={formatCurrency(totalExpense)} icon={<ArrowUpCircle className="h-5 w-5" />}
              hint={`${expenseRate.toFixed(0)}% da renda`}
            />
            <StatCard
              label="Comprometimento" tone={expenseRate > 90 ? "danger" : expenseRate > 70 ? "warning" : "success"}
              value={`${expenseRate.toFixed(0)}%`} icon={<PiggyBank className="h-5 w-5" />}
              hint={expenseRate > 90 ? "Atenção: orçamento crítico" : expenseRate > 70 ? "Atenção ao gasto" : "Saúde financeira boa"}
            />
          </div>

          {expenseRate > 90 && totalIncome > 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Orçamento comprometido</div>
                <p className="text-sm text-muted-foreground">Suas saídas estão consumindo mais de 90% da renda este mês. Reveja gastos variáveis e categorias com maior peso.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Entradas vs Saídas</h3>
                  <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={fmtTooltip} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="entradas" fill="oklch(0.8 0.09 160)" name="Entradas" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="saidas" fill="oklch(0.78 0.11 350)" name="Saídas" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-semibold mb-4">Saídas por categoria</h3>
              {byCat.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem saídas neste mês</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                        {byCat.map((c) => <Cell key={c.id} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={fmtTooltip} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-3 space-y-1.5 max-h-32 overflow-auto">
                {byCat.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-medium">{((c.value / totalExpense) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Últimos lançamentos</h3>
              <a href="/transacoes" className="text-sm text-primary hover:underline">Ver tudo →</a>
            </div>
            {monthTx.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum lançamento neste mês.{" "}
                <button onClick={() => setOpen(true)} className="text-primary font-medium hover:underline">Criar agora</button>
              </div>
            ) : (
              <div className="divide-y">
                {monthTx.slice(0, 6).map((t) => {
                  const cat = categories.find((c) => c.id === t.category_id);
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: (cat?.color ?? "#e9b8c9") + "33", color: cat?.color ?? "#c084a7" }}>
                          {t.type === "income" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.description}</div>
                          <div className="text-xs text-muted-foreground">{cat?.name ?? "Sem categoria"} · {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                        </div>
                      </div>
                      <div className={t.type === "income" ? "text-success-foreground font-semibold" : "text-primary font-semibold"}>
                        {t.type === "income" ? "+" : "−"} {formatCurrency(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <TransactionDialog open={open} onOpenChange={setOpen} categories={categories} onSaved={reload} />
    </AppLayout>
  );
}
