import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData, type Transaction } from "@/hooks/useFinanceData";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/transacoes")({
  component: TransacoesPage,
});

function TransacoesPage() {
  const { transactions, categories, loading, reload } = useFinanceData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (catFilter !== "all" && t.category_id !== catFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, type, catFilter, search]);

  async function remove(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Lançamento excluído");
      reload();
    }
  }

  return (
    <AppLayout
      title="Lançamentos"
      subtitle="Todas as entradas e saídas"
      actions={
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="text-white" style={{ background: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      }
    >
      <div className="rounded-2xl border bg-card p-4 mb-4 flex flex-wrap gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-muted-foreground mb-3">Nenhum lançamento encontrado.</div>
            <Button variant="outline" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Criar lançamento
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Descrição</th>
                <th className="text-left px-5 py-3">Categoria</th>
                <th className="text-left px-5 py-3">Data</th>
                <th className="text-right px-5 py-3">Valor</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                const isIncome = t.type === "income";
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: (cat?.color ?? "#e9b8c9") + "33", color: cat?.color ?? "#c084a7" }}>
                          {isIncome ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{t.description}</div>
                          {t.is_fixed && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Fixo</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {cat ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: cat.color + "33", color: cat.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(t.date)}</td>
                    <td className={"px-5 py-3 text-right font-semibold " + (isIncome ? "text-success-foreground" : "text-primary")}>
                      {isIncome ? "+" : "−"} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(t); setOpen(true); }} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(t.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TransactionDialog open={open} onOpenChange={setOpen} categories={categories} editing={editing} onSaved={reload} />
    </AppLayout>
  );
}
