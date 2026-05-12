import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) nav({ to: "/dashboard" });
  }, [session, nav]);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">Finova</span>
        </div>
        <div className="space-y-4 max-w-md relative z-10">
          <h2 className="text-4xl font-bold leading-tight">Suas finanças, organizadas como uma planilha — bonita como um app.</h2>
          <p className="text-white/80 text-lg">
            Cadastre receitas, despesas fixas e variáveis. Veja seu saldo, orçamento e metas em tempo real.
          </p>
        </div>
        <div className="text-sm text-white/60">© {new Date().getFullYear()} Finova</div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Finova</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? "Bem-vindo de volta" : "Criar conta"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Entre para acessar seu painel financeiro." : "Comece em segundos. Grátis para uso pessoal."}
          </p>

          <form onSubmit={handle} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-medium" style={{ background: "var(--gradient-primary)" }}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Voltar para o início</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
