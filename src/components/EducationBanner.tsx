import { useState } from "react";
import { X } from "lucide-react";

const BANNER_TEXT =
  "Money Spirit provides financial education and community — not financial advice. For advice tailored to your situation, please consult a qualified financial adviser.";

const EducationBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="rounded-md px-4 py-3 mb-6 flex items-start gap-3"
      style={{
        background: "rgba(201,148,30,0.08)",
        borderLeft: "3px solid #C9941E",
      }}
    >
      <p className="text-[13px] font-body flex-1" style={{ color: "var(--ms-text-secondary)" }}>{BANNER_TEXT}</p>
      <button
        onClick={() => setDismissed(true)}
        className="mt-0.5 flex-shrink-0 transition-colors"
        style={{ color: "var(--ms-text-muted)" }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default EducationBanner;
