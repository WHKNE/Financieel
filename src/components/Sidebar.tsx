"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelNl: "Dashboard", labelEn: "Dashboard" },
  { href: "/transacties", icon: ArrowLeftRight, labelNl: "Transacties", labelEn: "Transactions" },
  { href: "/budgetten", icon: Target, labelNl: "Budgetten", labelEn: "Budgets" },
  { href: "/rapporten", icon: BarChart3, labelNl: "Rapporten", labelEn: "Reports" },
  { href: "/instellingen", icon: Settings, labelNl: "Instellingen", labelEn: "Settings" },
];

interface SidebarProps {
  locale: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ locale, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isNl = locale === "nl";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-50 flex flex-col",
          "bg-[#0a0f1e] border-r border-[#1a2744]",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a2744]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">FamilyFinance</p>
              <p className="text-[10px] text-slate-500 leading-tight">Financieel beheer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 px-3 mb-3 font-medium">
            {isNl ? "Navigatie" : "Navigation"}
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                style={
                  isActive
                    ? { background: "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(6,182,212,0.1) 100%)", borderLeft: "2px solid #3b82f6" }
                    : {}
                }
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-400" : "")} />
                {isNl ? item.labelNl : item.labelEn}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#1a2744]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            {isNl ? "Uitloggen" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
