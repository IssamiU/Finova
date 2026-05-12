import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orcamento")({
  component: OrcamentoPage,
});

function OrcamentoPage() {
  const { categories, transactions } = useFinanceData();
  const { user } = useAuth();
  const [month, setMonth] = useState(monthKey());
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("budgets").select("*").eq("month", `${month}-01`).then(({ data }) => {
      const map: Record<string, number> = {};
      (data ?? []).forEach((b: any) => (map[b.category_id] = Number(b.amount)));
      setBudgets(map);
    });
  }, [user, month]);

  const expenseCats = categories.filter((c) => c.type === "expense");
  const spentByCat = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense" && t.date.startsWith(month))
      .forEach((t) => { if (t.category_id) map[t.category_id] = (map[t.category_id] ?? 0) + t.amount; });
    return map;
  }, [transactions, month]);

  async function save(catId: string) {
    if (!user) return;
    const v = Number(draft[catId] ?? "");
    if (!Number.isFinite(v) || v < 0) return;
    const { error } = await supabase.from("budgets").upsert({
      user_id: user.id, category_id: catId, month: `${month}-01`, amount: v,
    }, { onConflict: "user_id,category_id,month" });
    if (error) toast.error(error.message);
    else { setBudgets((b) => ({ ...b, [catId]: v })); setDraft((d) => { const n = { ...d }; delete n[catId]; return n; }); toast.success("Orçamento salvo"); }
  }

  return (
    <AppLayout
      title="Orçamento" subtitle={`Limites de saída para ${monthLabel(month)}`}
      actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm" />}
    >
      <div className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Categoria</div>
          <div className="col-span-3">Saída</div>
          <div className="col-span-3">Limite</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        {expenseCats.map((c) => {
          const spent = spentByCat[c.id] ?? 0;
          const limit = budgets[c.id] ?? 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const tone = pct > 100 ? "destructive" : pct > 80 ? "warning" : "success";
          return (
            <div key={c.id} className="grid grid-cols-12 gap-3 px-5 py-4 border-t items-center">
              <div className="col-span-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="col-span-3 text-sm">{formatCurrency(spent)}</div>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="number" min="0" step="0.01"
                  value={draft[c.id] ?? (limit ? String(limit) : "")}
                  onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })}
                  placeholder="0,00" className="h-9"
                />
                {draft[c.id] !== undefined && <Button size="sm" onClick={() => save(c.id)}>OK</Button>}
              </div>
              <div className="col-span-2">
                <div className="text-xs text-right mb-1 font-medium">{limit > 0 ? `${pct.toFixed(0)}%` : "—"}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={"h-full transition-all " + (tone === "destructive" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success")}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {expenseCats.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">Crie categorias de saída primeiro.</div>}
      </div>
    </AppLayout>
  );
}
