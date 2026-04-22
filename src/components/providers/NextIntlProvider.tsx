"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useEffect, useState } from "react";

export function NextIntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("nl");
  const [messages, setMessages] = useState<AbstractIntlMessages>({});

  useEffect(() => {
    const savedLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] || "nl";
    setLocale(savedLocale);

    import(`@/messages/${savedLocale}.json`).then((mod) => {
      setMessages(mod.default);
    });
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
