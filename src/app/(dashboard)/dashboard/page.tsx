"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Transaction, Budget } from "@/types";
import { formatCurrency, formatDate, getCurrentMonthYear } from "@/lib/utils";

const MONTHS_NL = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

export default function DashboardPage() {
  const { month, year } = getCurrentMonthYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; inkomsten: number; uitgaven: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [txRes, budRes] = await Promise.all([
      fetch(`/api/transactions?month=${month}&year=${year}&limit=5`),
      fetch(`/api/budgets?month=${month}&year=${year}`),
    ]);
    const [txData, budData] = await Promise.all([txRes.json(), budRes.json()]);
    setTransactions(txData);
    setBudgets(budData);

    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const res = await fetch(`/api/transactions?month=${m}&year=${year}&limit=1000`);
      const data: Transaction[] = await res.json();
      const income = data.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = data.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      monthly.push({ month: MONTHS_NL[m - 1], inkomsten: income, uitgaven: expenses });
    }
    setMonthlyData(monthly);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const categoryData = budgets
    .filter((b) => b.spent && b.spent > 0)
    .map((b) => ({ name: b.category.nameNl, value: b.spent || 0, color: b.category.color }))
    .slice(0, 6);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
        Laden...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Inkomsten"
          value={formatCurrency(income)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#10b981"
          gradient="linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.05) 100%)"
          trend="+0%"
          positive
        />
        <StatCard
          title="Uitgaven"
          value={formatCurrency(expenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="#ef4444"
          gradient="linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.05) 100%)"
          trend="+0%"
          positive={false}
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(balance)}
          icon={<Wallet className="w-5 h-5" />}
          color={balance >= 0 ? "#3b82f6" : "#ef4444"}
          gradient="linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.05) 100%)"
          trend={balance >= 0 ? "Positief" : "Negatief"}
          positive={balance >= 0}
        />
        <StatCard
          title="Budget gebruikt"
          value={`${budgetPct.toFixed(0)}%`}
          icon={<Target className="w-5 h-5" />}
          color={budgetPct > 90 ? "#ef4444" : "#8b5cf6"}
          gradient="linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.05) 100%)"
          trend={`${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
          positive={budgetPct <= 80}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400 font-medium mb-1">Jaaroverzicht</p>
              <h3 className="font-bold text-white">Inkomsten vs. Uitgaven {year}</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                contentStyle={{ background: "#0f1628", border: "1px solid #1a2744", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="inkomsten" fill="url(#incomeGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uitgaven" fill="url(#expenseGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-purple-400 font-medium mb-1">Deze maand</p>
            <h3 className="font-bold text-white">Uitgaven per categorie</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f1628", border: "1px solid #1a2744", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-slate-500 text-sm">
              Geen uitgaven deze maand
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400 font-medium mb-1">Overzicht</p>
              <h3 className="font-bold text-white">Recente transacties</h3>
            </div>
            <a href="/transacties" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Alle bekijken →
            </a>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Geen transacties gevonden</p>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[#1a2744] last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: `${t.category.color}20`, color: t.category.color }}
                    >
                      {t.category.nameNl.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">{t.description}</p>
                      <p className="text-xs text-slate-500">{formatDate(t.date)} · {t.category.nameNl}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.type === "income" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budget overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-400 font-medium mb-1">Budget</p>
              <h3 className="font-bold text-white">Budget overzicht</h3>
            </div>
            <a href="/budgetten" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Beheren →
            </a>
          </div>
          <div className="space-y-4">
            {budgets.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Geen budgetten ingesteld</p>
            ) : (
              budgets.slice(0, 5).map((b) => {
                const pct = b.amount > 0 ? Math.min(((b.spent || 0) / b.amount) * 100, 100) : 0;
                const over = (b.spent || 0) > b.amount;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white font-medium">{b.category.nameNl}</span>
                      <span className={`text-xs font-medium ${over ? "text-red-400" : "text-slate-400"}`}>
                        {formatCurrency(b.spent || 0)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${over ? "progress-fill-danger" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, color, gradient, trend, positive,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <div className="glass-card glass-card-hover p-5" style={{ background: gradient, borderColor: `${color}20` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-400">{title} · deze maand</p>
    </div>
  );
}
