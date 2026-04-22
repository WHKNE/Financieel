"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, X, ChevronDown, TrendingDown } from "lucide-react";
import { Budget, Category } from "@/types";
import { formatCurrency, getCurrentMonthYear } from "@/lib/utils";
import toast from "react-hot-toast";

const MONTHS = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

export default function BudgettenPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [budRes, catRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch("/api/categories"),
    ]);
    setBudgets(await budRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const expenseCats = categories.filter((c) => c.type === "expense");
  const usedCatIds = new Set(budgets.map((b) => b.categoryId));
  const availableCats = expenseCats.filter((c) => !usedCatIds.has(c.id) || editBudget?.categoryId === c.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month selector + button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select className="form-input !w-auto text-sm py-2" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-input !w-auto text-sm py-2" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditBudget(null); setShowModal(true); }} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" />
          Budget toevoegen
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Totaal budget", value: totalBudget, color: "#3b82f6", icon: "💰" },
          { label: "Besteed", value: totalSpent, color: totalSpent > totalBudget ? "#ef4444" : "#f59e0b", icon: "💸" },
          { label: "Resterend", value: totalRemaining, color: totalRemaining >= 0 ? "#10b981" : "#ef4444", icon: "🏦" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5" style={{ borderColor: `${s.color}20` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-sm text-slate-400">{s.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Budget cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
          Laden...
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <TrendingDown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Geen budgetten ingesteld voor {MONTHS[month - 1]} {year}</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm mt-4 px-6">
            <Plus className="w-4 h-4" />
            Budget toevoegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
            const over = spent > b.amount;
            const remaining = b.amount - spent;

            return (
              <div key={b.id} className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: `${b.category.color}20`, color: b.category.color }}
                    >
                      {b.category.nameNl.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{b.category.nameNl}</p>
                      <p className="text-xs text-slate-500">Budget: {formatCurrency(b.amount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditBudget(b); setShowModal(true); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Besteed: <span className={over ? "text-red-400 font-medium" : "text-white font-medium"}>{formatCurrency(spent)}</span></span>
                    <span className={`font-medium ${over ? "text-red-400" : "text-emerald-400"}`}>
                      {over ? `- ${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} over`}
                    </span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${over ? "progress-fill-danger" : ""}`}
                      style={{
                        width: `${pct}%`,
                        background: !over ? `linear-gradient(90deg, ${b.category.color} 0%, ${b.category.color}cc 100%)` : undefined,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{pct.toFixed(0)}% gebruikt</span>
                    {over && (
                      <span className="badge badge-red text-[10px] py-0.5">Over budget</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          budget={editBudget}
          categories={availableCats}
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function BudgetModal({
  budget, categories, month, year, onClose, onSave,
}: {
  budget: Budget | null;
  categories: Category[];
  month: number;
  year: number;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    categoryId: budget?.categoryId || "",
    amount: budget?.amount?.toString() || "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month, year }),
    });
    if (res.ok) {
      toast.success(budget ? "Budget bijgewerkt" : "Budget toegevoegd");
      onSave();
    } else {
      toast.error("Fout bij opslaan");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white">{budget ? "Budget bewerken" : "Budget toevoegen"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!budget && (
            <div>
              <label className="form-label">Categorie</label>
              <div className="relative">
                <select
                  className="form-input appearance-none pr-10"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Selecteer categorie...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameNl}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Budgetbedrag (€)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="form-input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Annuleren</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
