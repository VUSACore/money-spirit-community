import { useState } from "react";
import { X } from "lucide-react";

const BANNER_TEXT =
  "Money Spirit provides financial education and community — not financial advice. For advice tailored to your situation, please consult a qualified financial adviser.";

const EducationBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-accent/10 border border-accent/30 text-primary rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
      <p className="text-sm font-body flex-1">{BANNER_TEXT}</p>
      <button
        onClick={() => setDismissed(true)}
        className="text-primary/60 hover:text-primary mt-0.5 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default EducationBanner;
