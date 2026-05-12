import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Receipt, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contas-a-pagar")({
  component: BillsPage,
});

interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category_id: string | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

function BillsPage() {
  const { user } = useAuth();
  const { categories } = useFinanceData();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  // form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");

  const expenseCats = categories.filter((c) => c.type === "expense");

  async function reload() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("bills").select("*").order("due_date", { ascending: true });
    setBills(((data as any[]) ?? []).map((b) => ({ ...b, amount: Number(b.amount) })));
    setLoading(false);
  }

  useEffect(() => { if (user) reload(); }, [user]);

  async function create() {
    if (!user || !name.trim() || !amount) {
      toast.error("Informe nome e valor.");
      return;
    }
    const { error } = await supabase.from("bills").insert({
      user_id: user.id,
      name: name.trim(),
      amount: Number(amount),
      due_date: dueDate,
      category_id: categoryId || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Conta adicionada");
      setOpen(false);
      setName(""); setAmount(""); setCategoryId("");
      setDueDate(new Date().toISOString().slice(0, 10));
      reload();
    }
  }

  async function togglePaid(b: Bill) {
    const next = !b.is_paid;
    const { error } = await supabase.from("bills").update({
      is_paid: next,
      paid_at: next ? new Date().toISOString() : null,
    }).eq("id", b.id);
    if (error) toast.error(error.message);
    else reload();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta conta?")) return;
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluída"); reload(); }
  }

  const filtered = useMemo(() => {
    return bills.filter((b) => filter === "all" || (filter === "paid" ? b.is_paid : !b.is_paid));
  }, [bills, filter]);

  const today = new Date().toISOString().slice(0, 10);
  const pendingTotal = bills.filter((b) => !b.is_paid).reduce((s, b) => s + b.amount, 0);
  const paidTotal = bills.filter((b) => b.is_paid).reduce((s, b) => s + b.amount, 0);
  const overdueCount = bills.filter((b) => !b.is_paid && b.due_date < today).length;

  return (
    <AppLayout
      title="Contas a pagar"
      subtitle="Acompanhe vencimentos e marque como pago"
      actions={
        <Button onClick={() => setOpen(true)} className="text-white" style={{ background: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4 mr-1" /> Nova conta
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground tracking-wide">Pendente</div>
              <div className="text-2xl font-bold mt-1 text-primary">{formatCurrency(pendingTotal)}</div>
              <div className="text-xs text-muted-foreground">{bills.filter(b=>!b.is_paid).length} contas{overdueCount > 0 ? ` · ${overdueCount} vencidas` : ""}</div>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-primary)" }}>
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground tracking-wide">Pago</div>
              <div className="text-2xl font-bold mt-1 text-success-foreground">{formatCurrency(paidTotal)}</div>
              <div className="text-xs text-muted-foreground">{bills.filter(b=>b.is_paid).length} contas</div>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-success/30 text-success-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground tracking-wide">Total</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(pendingTotal + paidTotal)}</div>
              <div className="text-xs text-muted-foreground">{bills.length} contas no total</div>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border",
              filter === f
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50",
            )}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Pagas"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium mb-1">Nenhuma conta {filter === "paid" ? "paga" : filter === "pending" ? "pendente" : ""}</div>
            <p className="text-sm text-muted-foreground mb-4">Adicione contas como aluguel, internet, cartão...</p>
            <Button variant="outline" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova conta</Button>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((b) => {
              const cat = expenseCats.find((c) => c.id === b.category_id);
              const overdue = !b.is_paid && b.due_date < today;
              return (
                <li
                  key={b.id}
                  className={cn(
                    "px-5 py-4 flex items-center gap-4 transition-colors",
                    b.is_paid ? "bg-success/5" : overdue ? "bg-destructive/5" : "hover:bg-muted/30",
                  )}
                >
                  <Checkbox
                    checked={b.is_paid}
                    onCheckedChange={() => togglePaid(b)}
                    className="h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium", b.is_paid && "line-through text-muted-foreground")}>{b.name}</span>
                      {cat && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: cat.color + "33", color: cat.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </span>
                      )}
                      {b.is_paid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-success/25 text-success-foreground">
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-destructive/15 text-destructive">
                          <CalendarClock className="h-3 w-3" /> Vencida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-warning/30 text-warning-foreground">
                          <Clock3 className="h-3 w-3" /> Pendente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Vencimento: {formatDate(b.due_date)}
                    </div>
                  </div>
                  <div className={cn("font-semibold", b.is_paid ? "text-muted-foreground line-through" : "text-foreground")}>
                    {formatCurrency(b.amount)}
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova conta a pagar</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Aluguel, Internet, Cartão..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria (opcional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {expenseCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} className="text-white" style={{ background: "var(--gradient-primary)" }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
