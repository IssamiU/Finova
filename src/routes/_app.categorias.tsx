import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/categorias")({
  component: CategoriasPage,
});

function CategoriasPage() {
  const { categories, reload } = useFinanceData();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("#f3a6c4");

  async function create() {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("categories").insert({ user_id: user.id, name: name.trim(), type, color });
    if (error) toast.error(error.message);
    else { toast.success("Categoria criada"); setOpen(false); setName(""); reload(); }
  }
  async function remove(id: string) {
    if (!confirm("Excluir categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluída"); reload(); }
  }

  return (
    <AppLayout
      title="Categorias" subtitle="Organize suas entradas e saídas"
      actions={<Button onClick={() => setOpen(true)} className="text-white" style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4 mr-1" /> Nova</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(["income", "expense"] as const).map((tp) => (
          <div key={tp} className="rounded-2xl border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-3">{tp === "income" ? "Entradas" : "Saídas"}</h3>
            <div className="space-y-2">
              {categories.filter((c) => c.type === tp).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg" style={{ background: c.color + "44", border: `2px solid ${c.color}` }} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <button onClick={() => remove(c.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {categories.filter((c) => c.type === tp).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Streaming" /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Saída</SelectItem>
                  <SelectItem value="income">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cor</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} className="text-white" style={{ background: "var(--gradient-primary)" }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
