"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Upload, Search, ArrowUpRight, ArrowDownRight, Edit2, Trash2, X, ChevronDown } from "lucide-react";
import { Transaction, Category } from "@/types";
import { formatCurrency, formatDate, getCurrentMonthYear } from "@/lib/utils";
import toast from "react-hot-toast";

const MONTHS = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

export default function TransactiesPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [delTx, setDelTx] = useState<Transaction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?month=${month}&year=${year}&limit=500`),
      fetch("/api/categories"),
    ]);
    setTransactions(await txRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = transactions.filter((t) => {
    const matchType = filter === "all" || t.type === filter;
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.nameNl.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  async function handleDelete() {
    if (!delTx) return;
    await fetch(`/api/transactions/${delTx.id}`, { method: "DELETE" });
    toast.success("Transactie verwijderd");
    setDelTx(null);
    fetchData();
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/transactions/import", { method: "POST", body: formData });
    const data = await res.json();
    toast.success(`${data.imported} transacties geïmporteerd`);
    fetchData();
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="form-input !w-auto text-sm py-2"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="form-input !w-auto text-sm py-2"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm py-2 px-4">
            <Upload className="w-4 h-4" />
            CSV importeren
          </button>
          <button onClick={() => { setEditTx(null); setShowModal(true); }} className="btn-primary text-sm py-2 px-4">
            <Plus className="w-4 h-4" />
            Toevoegen
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Inkomsten", value: totalIncome, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Uitgaven", value: totalExpense, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { label: "Saldo", value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? "#3b82f6" : "#ef4444", bg: "rgba(59,130,246,0.1)" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4" style={{ borderColor: `${s.color}20` }}>
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Zoeken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              style={filter === f ? { background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" } : {}}
            >
              {f === "all" ? "Alle" : f === "income" ? "Inkomsten" : "Uitgaven"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
            Laden...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <p className="text-sm">Geen transacties gevonden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2744]">
                {["Datum", "Omschrijving", "Categorie", "Gezinslid", "Type", "Bedrag", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2744]">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-5 py-3.5 text-sm text-white font-medium">{t.description}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge text-xs" style={{
                      background: `${t.category.color}15`,
                      color: t.category.color,
                      borderColor: `${t.category.color}30`,
                    }}>
                      {t.category.nameNl}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{t.user.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-xs ${t.type === "income" ? "badge-green" : "badge-red"}`}>
                      {t.type === "income" ? "Inkomsten" : "Uitgave"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className={`flex items-center gap-1 text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.type === "income" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {formatCurrency(t.amount)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditTx(t); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDelTx(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <TransactionModal
          transaction={editTx}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchData(); }}
        />
      )}

      {/* Delete confirm */}
      {delTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-2">Transactie verwijderen</h3>
            <p className="text-sm text-slate-400 mb-6">
              Weet u zeker dat u <span className="text-white">"{delTx.description}"</span> wilt verwijderen?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelTx(null)} className="btn-secondary flex-1 justify-center py-2.5">Annuleren</button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors justify-center flex items-center"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionModal({
  transaction, categories, onClose, onSave,
}: {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    description: transaction?.description || "",
    amount: transaction?.amount?.toString() || "",
    type: transaction?.type || "expense",
    date: transaction?.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    categoryId: transaction?.categoryId || "",
  });
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const filteredCats = form.type === "income" ? incomeCategories : expenseCategories;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const method = transaction ? "PUT" : "POST";
    const url = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(transaction ? "Transactie bijgewerkt" : "Transactie toegevoegd");
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
          <h3 className="font-bold text-white">{transaction ? "Transactie bewerken" : "Transactie toevoegen"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-[#151e35] rounded-xl">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, categoryId: "" }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.type === t ? "text-white shadow-md" : "text-slate-400"
                }`}
                style={form.type === t ? { background: t === "income" ? "linear-gradient(135deg, #10b981, #06b6d4)" : "linear-gradient(135deg, #ef4444, #f59e0b)" } : {}}
              >
                {t === "income" ? "Inkomsten" : "Uitgave"}
              </button>
            ))}
          </div>

          <div>
            <label className="form-label">Omschrijving</label>
            <input
              type="text"
              className="form-input"
              placeholder="bijv. Boodschappen Albert Heijn"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Bedrag (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Datum</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
          </div>

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
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameNl}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">
              Annuleren
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
