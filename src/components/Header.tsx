"use client";

import { useSession } from "next-auth/react";
import { Menu, Globe, Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
}

export function Header({ title, subtitle, onMenuClick, locale, onLocaleChange }: HeaderProps) {
  const { data: session } = useSession();
  const [showLangMenu, setShowLangMenu] = useState(false);

  function toggleLocale(newLocale: string) {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    onLocaleChange(newLocale);
    setShowLangMenu(false);
    window.location.reload();
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-[#1a2744] bg-[#080b14]/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:text-white border border-[#1a2744] hover:border-[#243558] transition-all"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase font-medium">{locale}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 glass-card py-1 min-w-[120px] z-50 shadow-xl">
              {[
                { code: "nl", label: "Nederlands" },
                { code: "en", label: "English" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLocale(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    locale === lang.code
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications placeholder */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[#1a2744] text-slate-400 hover:text-white hover:border-[#243558] transition-all">
          <Bell className="w-4 h-4" />
        </button>

        {/* User avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
          title={session?.user?.name || ""}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
