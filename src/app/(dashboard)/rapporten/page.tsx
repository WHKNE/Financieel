"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

const MONTHS_NL = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const MONTHS_FULL = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

export default function RapportenPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthlyData, setMonthlyData] = useState<{ month: string; inkomsten: number; uitgaven: number; saldo: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const monthly = [];
    const catMap = new Map<string, { value: number; color: string }>();

    for (let m = 1; m <= 12; m++) {
      const res = await fetch(`/api/transactions?month=${m}&year=${year}&limit=1000`);
      const data: Transaction[] = await res.json();

      const income = data.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = data.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      monthly.push({ month: MONTHS_NL[m - 1], inkomsten: income, uitgaven: expenses, saldo: income - expenses });

      data.filter((t) => t.type === "expense").forEach((t) => {
        const existing = catMap.get(t.category.nameNl);
        if (existing) {
          existing.value += t.amount;
        } else {
          catMap.set(t.category.nameNl, { value: t.amount, color: t.category.color });
        }
      });
    }

    setMonthlyData(monthly);
    setCategoryData(
      Array.from(catMap.entries())
        .map(([name, { value, color }]) => ({ name, value, color }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalIncome = monthlyData.reduce((s, m) => s + m.inkomsten, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.uitgaven, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                year === y ? "text-white" : "text-slate-400 hover:text-white border border-[#1a2744] hover:border-[#243558]"
              }`}
              style={year === y ? { background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" } : {}}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Jaarinkomsten", value: formatCurrency(totalIncome), color: "#10b981", sub: "Totaal " + year },
          { label: "Jaaruitgaven", value: formatCurrency(totalExpenses), color: "#ef4444", sub: "Totaal " + year },
          { label: "Jaarbesparing", value: formatCurrency(totalSavings), color: totalSavings >= 0 ? "#3b82f6" : "#ef4444", sub: "Inkomsten - Uitgaven" },
          { label: "Spaarquote", value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? "#10b981" : savingsRate >= 10 ? "#f59e0b" : "#ef4444", sub: "Van inkomsten" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4" style={{ borderColor: `${s.color}20` }}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
          Gegevens laden...
        </div>
      ) : (
        <>
          {/* Area chart - saldo trend */}
          <div className="glass-card p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-blue-400 font-medium mb-1">Trend</p>
              <h3 className="font-bold text-white">Maandelijks saldo {year}</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  contentStyle={{ background: "#0f1628", border: "1px solid #1a2744", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="url(#saldoGrad)" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar + Pie */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium mb-1">Vergelijking</p>
                <h3 className="font-bold text-white">Inkomsten vs. Uitgaven</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#0f1628", border: "1px solid #1a2744", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="inkomsten" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="uitgaven" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wider text-purple-400 font-medium mb-1">Verdeling</p>
                <h3 className="font-bold text-white">Uitgaven per categorie</h3>
              </div>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0f1628", border: "1px solid #1a2744", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-slate-500 text-sm">
                  Geen gegevens beschikbaar
                </div>
              )}
            </div>
          </div>

          {/* Monthly table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-[#1a2744]">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">Detailoverzicht</p>
              <h3 className="font-bold text-white">Maandelijkse samenvatting {year}</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2744]">
                  {["Maand", "Inkomsten", "Uitgaven", "Saldo", "Spaarquote"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2744]">
                {monthlyData.map((row, i) => {
                  const saldo = row.saldo;
                  const rate = row.inkomsten > 0 ? (saldo / row.inkomsten) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-sm text-white font-medium">{MONTHS_FULL[i]}</td>
                      <td className="px-5 py-3 text-sm text-emerald-400 font-medium">{formatCurrency(row.inkomsten)}</td>
                      <td className="px-5 py-3 text-sm text-red-400 font-medium">{formatCurrency(row.uitgaven)}</td>
                      <td className={`px-5 py-3 text-sm font-semibold ${saldo >= 0 ? "text-blue-400" : "text-red-400"}`}>{formatCurrency(saldo)}</td>
                      <td className="px-5 py-3">
                        <span className={`badge text-xs ${rate >= 20 ? "badge-green" : rate >= 10 ? "badge-blue" : rate >= 0 ? "badge-purple" : "badge-red"}`}>
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
