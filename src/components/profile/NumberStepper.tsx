import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const NumberStepper = ({ value, onChange, min = 0, max = 10 }: NumberStepperProps) => (
  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
      style={{ background: "var(--ms-surface-2)", border: "1px solid var(--ms-border)", color: "var(--ms-text-primary)" }}
    >
      <Minus size={16} />
    </button>
    <div className="text-center min-w-[60px]">
      <span className="text-lg font-body font-semibold" style={{ color: "var(--ms-text-primary)" }}>{value}</span>
      {value === 0 && <p className="text-xs font-body" style={{ color: "var(--ms-text-muted)" }}>No children</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
      style={{ background: "var(--ms-surface-2)", border: "1px solid var(--ms-border)", color: "var(--ms-text-primary)" }}
    >
      <Plus size={16} />
    </button>
  </div>
);

export default NumberStepper;
