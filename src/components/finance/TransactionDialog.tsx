import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Category, Transaction } from "@/hooks/useFinanceData";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: Category[];
  editing?: Transaction | null;
  onSaved: () => void;
}

export function TransactionDialog({ open, onOpenChange, categories, editing, onSaved }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");
  const [isFixed, setIsFixed] = useState(false);
  const [installments, setInstallments] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setCategoryId(editing.category_id ?? "");
      setIsFixed(editing.is_fixed);
      setInstallments(editing.installments ? String(editing.installments) : "");
      setNotes(editing.notes ?? "");
    } else {
      setType("expense");
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategoryId("");
      setIsFixed(false);
      setInstallments("");
      setNotes("");
    }
  }, [editing, open]);

  // Reset campos exclusivos de saída quando trocar para entrada
  function changeType(next: "income" | "expense") {
    setType(next);
    setCategoryId(""); // categorias são filtradas por tipo
    if (next === "income") {
      setIsFixed(false);
      setInstallments("");
    }
  }

  const filteredCats = categories.filter((c) => c.type === type);
  const isIncome = type === "income";

  async function save() {
    if (!user) return;
    if (!description.trim() || !amount) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        type,
        description: description.trim(),
        amount: Number(amount),
        date,
        category_id: categoryId || null,
        is_fixed: isIncome ? false : isFixed,
        installments: isIncome ? null : (installments ? Number(installments) : null),
        installment_no: isIncome ? null : (installments ? 1 : null),
        notes: notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Lançamento atualizado");
      } else {
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) throw error;
        toast.success("Lançamento criado");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => changeType("income")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                isIncome ? "bg-card shadow-sm text-success-foreground ring-1 ring-success/40" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => changeType("expense")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                !isIncome ? "bg-card shadow-sm text-primary ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Saída
            </button>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isIncome ? "Ex: Freelance" : "Ex: Mercado do mês"} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{isIncome ? "Valor de entrada (R$)" : "Valor de saída (R$)"}</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria {isIncome ? "(entradas)" : "(saídas)"}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={filteredCats.length ? "Selecione" : "Crie uma categoria primeiro"} /></SelectTrigger>
              <SelectContent>
                {filteredCats.map((c) => (
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

          {!isIncome && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Saída fixa</Label>
                  <p className="text-xs text-muted-foreground">Recorrente todo mês</p>
                </div>
                <Switch checked={isFixed} onCheckedChange={setIsFixed} />
              </div>
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Input type="number" min="1" value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="—" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Opcional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} style={{ background: "var(--gradient-primary)" }}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
