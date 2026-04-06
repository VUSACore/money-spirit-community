import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-body transition-colors"
      >
        <Globe size={14} />
        {lang}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-44 rounded-lg bg-navy border border-white/10 py-1 shadow-lg z-50 max-h-64 overflow-y-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${
                lang === l.code
                  ? "text-gold bg-white/5"
                  : "text-white/70 hover:text-gold hover:bg-white/5"
              }`}
            >
              {l.label} ({l.code})
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
