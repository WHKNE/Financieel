"use client";

import { useEffect, useState } from "react";
import { Plus, X, Users, Globe, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function InstellingenPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const isAdmin = sessionUser?.role === "admin";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [locale, setLocale] = useState("nl");

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
    const saved = document.cookie.split("; ").find((r) => r.startsWith("locale="))?.split("=")[1] || "nl";
    setLocale(saved);
  }, []);

  function changeLocale(newLocale: string) {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    setLocale(newLocale);
    toast.success(newLocale === "nl" ? "Taal ingesteld op Nederlands" : "Language set to English");
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Language */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-400 font-medium">Voorkeur</p>
            <h3 className="font-bold text-white">Taal / Language</h3>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { code: "nl", label: "🇳🇱 Nederlands", desc: "Standaard taal" },
            { code: "en", label: "🇬🇧 English", desc: "Switch to English" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLocale(lang.code)}
              className={`flex-1 p-4 rounded-xl border transition-all text-left ${
                locale === lang.code
                  ? "border-blue-500/40 bg-blue-500/10"
                  : "border-[#1a2744] hover:border-[#243558] bg-transparent"
              }`}
            >
              <p className={`font-medium text-sm mb-0.5 ${locale === lang.code ? "text-blue-400" : "text-white"}`}>{lang.label}</p>
              <p className="text-xs text-slate-500">{lang.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-400 font-medium">Beheer</p>
              <h3 className="font-bold text-white">Gezinsleden</h3>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4">
              <Plus className="w-4 h-4" />
              Toevoegen
            </button>
          )}
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-[#1a2744] hover:border-[#243558] transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <span className={`badge text-xs ${u.role === "admin" ? "badge-blue" : "badge-purple"}`}>
                {u.role === "admin" ? "Beheerder" : "Lid"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Privacy</p>
            <h3 className="font-bold text-white">Over FamilyFinance</h3>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p>✓ Alle gegevens worden lokaal opgeslagen (SQLite database)</p>
          <p>✓ Geen externe diensten of cloud-opslag</p>
          <p>✓ Volledig privé — alleen toegankelijk via uw netwerk</p>
          <p className="text-slate-600 text-xs pt-2">FamilyFinance v1.0 · Privé gebruik</p>
        </div>
      </div>

      {showModal && isAdmin && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetch("/api/users").then((r) => r.json()).then(setUsers);
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Gebruiker toegevoegd");
      onSave();
    } else {
      toast.error("Fout bij toevoegen");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white">Gezinslid toevoegen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Naam</label>
            <input type="text" className="form-input" placeholder="Volledige naam" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">E-mailadres</label>
            <input type="email" className="form-input" placeholder="naam@familie.nl" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Wachtwoord</label>
            <input type="password" className="form-input" placeholder="Minimaal 8 tekens" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select className="form-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="member">Lid</option>
              <option value="admin">Beheerder</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">Annuleren</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
