import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.display_name ?? ""); setSalary(String(data.base_salary ?? "")); }
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: name, base_salary: Number(salary || 0),
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Perfil atualizado");
  }

  return (
    <AppLayout title="Configurações" subtitle="Perfil e preferências da conta">
      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-semibold mb-4">Perfil</h3>
          <div className="space-y-4">
            <div className="space-y-2"><Label>E-mail</Label><Input value={user?.email ?? ""} disabled /></div>
            <div className="space-y-2"><Label>Nome de exibição</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Salário base mensal (R$)</Label>
              <Input type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0,00" />
              <p className="text-xs text-muted-foreground">Será somado automaticamente como receita em todos os meses.</p>
            </div>
            <Button onClick={save} disabled={saving} style={{ background: "var(--gradient-primary)" }}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
