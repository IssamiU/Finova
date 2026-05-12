import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Target, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/metas")({
  component: MetasPage,
});

function MetasPage() {
  const { goals, reload } = useFinanceData();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  async function create() {
    if (!user || !name.trim() || !target) return;
    const { error } = await supabase.from("financial_goals").insert({
      user_id: user.id, name: name.trim(),
      target_amount: Number(target), current_amount: Number(current || 0),
      deadline: deadline || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Meta criada"); setOpen(false); setName(""); setTarget(""); setCurrent(""); setDeadline(""); reload(); }
  }
  async function remove(id: string) {
    if (!confirm("Excluir meta?")) return;
    const { error } = await supabase.from("financial_goals").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluída"); reload(); }
  }
  async function updateCurrent(id: string, value: number) {
    const { error } = await supabase.from("financial_goals").update({ current_amount: value }).eq("id", id);
    if (error) toast.error(error.message); else reload();
  }

  return (
    <AppLayout
      title="Metas financeiras" subtitle="Defina e acompanhe seus objetivos"
      actions={<Button onClick={() => setOpen(true)} style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4 mr-1" /> Nova meta</Button>}
    >
      {goals.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium mb-1">Nenhuma meta ainda</div>
          <p className="text-sm text-muted-foreground mb-4">Crie objetivos como reserva de emergência ou viagem.</p>
          <Button onClick={() => setOpen(true)}>Criar primeira meta</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const remaining = g.target_amount - g.current_amount;
            return (
              <div key={g.id} className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{g.name}</div>
                    {g.deadline && <div className="text-xs text-muted-foreground">Até {new Date(g.deadline + "T00:00:00").toLocaleDateString("pt-BR")}</div>}
                  </div>
                  <button onClick={() => remove(g.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(g.current_amount)}</div>
                <div className="text-xs text-muted-foreground mb-3">de {formatCurrency(g.target_amount)} · faltam {formatCurrency(Math.max(remaining, 0))}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div className="h-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: "var(--gradient-success)" }} />
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" step="0.01" placeholder="Adicionar"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = Number((e.target as HTMLInputElement).value);
                        if (Number.isFinite(v)) { updateCurrent(g.id, g.current_amount + v); (e.target as HTMLInputElement).value = ""; }
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Valor alvo</Label><Input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
              <div className="space-y-2"><Label>Já guardado</Label><Input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Prazo (opcional)</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} style={{ background: "var(--gradient-primary)" }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
