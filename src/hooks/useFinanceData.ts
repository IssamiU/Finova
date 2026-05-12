import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  is_fixed: boolean;
  installments: number | null;
  installment_no: number | null;
  notes: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  base_salary: number;
  currency: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

export function useFinanceData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [p, c, t, g] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("financial_goals").select("*").order("created_at", { ascending: false }),
    ]);
    if (p.data) setProfile(p.data as Profile);
    if (c.data) setCategories(c.data as Category[]);
    if (t.data) setTransactions((t.data as any[]).map((x) => ({ ...x, amount: Number(x.amount) })));
    if (g.data)
      setGoals(
        (g.data as any[]).map((x) => ({
          ...x,
          target_amount: Number(x.target_amount),
          current_amount: Number(x.current_amount),
        })),
      );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  return { profile, categories, transactions, goals, loading, reload, setProfile };
}
