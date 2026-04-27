interface PillSelectProps {
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}

const PillSelect = ({ options, value, onChange }: PillSelectProps) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="px-4 py-2 rounded-full text-sm font-body transition-all"
          style={{
            background: active ? "rgba(201,148,30,0.12)" : "var(--ms-surface-2)",
            border: active ? "1px solid #C9941E" : "1px solid var(--ms-border)",
            color: active ? "#F5C842" : "var(--ms-text-muted)",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default PillSelect;
