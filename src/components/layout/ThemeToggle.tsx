import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ms-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ms-theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
};

export default ThemeToggle;
