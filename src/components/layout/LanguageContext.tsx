import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, SupportedLang, TranslationKey } from "@/lib/i18n/translations";

interface LanguageContextType {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<SupportedLang>(() => {
    const stored = localStorage.getItem("ms-lang");
    return (stored as SupportedLang) || "en";
  });

  const setLang = (l: SupportedLang) => {
    setLangState(l);
    localStorage.setItem("ms-lang", l);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
