import { Globe } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageContext";
import { LANGUAGE_LABELS, SupportedLang } from "@/lib/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const langs = Object.entries(LANGUAGE_LABELS) as [SupportedLang, string][];

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="px-3">
      <Select value={lang} onValueChange={(v) => setLang(v as SupportedLang)}>
        <SelectTrigger className="w-full bg-transparent border-white/10 text-white/70 hover:text-white text-sm font-body h-9 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <SelectValue>{lang.toUpperCase()}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {langs.map(([code, label]) => (
            <SelectItem key={code} value={code} className="font-body text-sm">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
