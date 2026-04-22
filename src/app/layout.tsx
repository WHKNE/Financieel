import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { NextIntlProvider } from "@/components/providers/NextIntlProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "FamilyFinance | Financieel Beheer",
  description: "Persoonlijk financieel beheersysteem voor het gezin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body>
        <div className="stars" />
        <div className="particle-bg" />
        <NextAuthProvider>
          <NextIntlProvider>
            <div className="relative z-10">{children}</div>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#0f1628",
                  color: "#f1f5f9",
                  border: "1px solid #1a2744",
                  borderRadius: "10px",
                },
                success: { iconTheme: { primary: "#10b981", secondary: "#0f1628" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#0f1628" } },
              }}
            />
          </NextIntlProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
