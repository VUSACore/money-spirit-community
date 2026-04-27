import { useState } from "react";
import { X } from "lucide-react";

const BANNER_TEXT =
  "Money Spirit provides financial education and community — not financial advice. For advice tailored to your situation, please consult a qualified financial adviser.";

const EducationBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{
      background: 'rgba(201,148,30,0.06)',
      border: '1px solid rgba(201,148,30,0.15)',
      borderRadius: 'var(--r-md)',
      padding: '12px 16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <p style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-2)' }}>{BANNER_TEXT}</p>
      <button onClick={() => setDismissed(true)} className="mt-0.5 flex-shrink-0 transition-colors" style={{ color: 'var(--text-4)' }} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
};

export default EducationBanner;
