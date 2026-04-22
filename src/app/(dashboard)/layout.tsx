"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { nl: string; en: string; subtitleNl: string; subtitleEn: string }> = {
  "/dashboard": { nl: "Dashboard", en: "Dashboard", subtitleNl: "Financieel overzicht", subtitleEn: "Financial overview" },
  "/transacties": { nl: "Transacties", en: "Transactions", subtitleNl: "Alle inkomsten en uitgaven", subtitleEn: "All income and expenses" },
  "/budgetten": { nl: "Budgetten", en: "Budgets", subtitleNl: "Maandelijkse budgetten", subtitleEn: "Monthly budgets" },
  "/rapporten": { nl: "Rapporten", en: "Reports", subtitleNl: "Trends en analyses", subtitleEn: "Trends and analytics" },
  "/instellingen": { nl: "Instellingen", en: "Settings", subtitleNl: "Gebruikers en voorkeuren", subtitleEn: "Users and preferences" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState("nl");

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((r) => r.startsWith("locale="))
      ?.split("=")[1] || "nl";
    setLocale(saved);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Laden...
        </div>
      </div>
    );
  }

  const pageInfo = pageTitles[pathname] || pageTitles["/dashboard"];
  const isNl = locale === "nl";

  return (
    <div className="min-h-screen flex">
      <Sidebar
        locale={locale}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header
          title={isNl ? pageInfo.nl : pageInfo.en}
          subtitle={isNl ? pageInfo.subtitleNl : pageInfo.subtitleEn}
          onMenuClick={() => setMobileOpen(true)}
          locale={locale}
          onLocaleChange={setLocale}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
