interface TagSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const TagSelect = ({ options, selected, onChange }: TagSelectProps) => (
  <div className="flex flex-wrap gap-2">
    {options.map((tag) => {
      const active = selected.includes(tag);
      return (
        <button
          key={tag}
          type="button"
          onClick={() => {
            onChange(active ? selected.filter((s) => s !== tag) : [...selected, tag]);
          }}
          className="px-3 py-1.5 rounded-full text-sm font-body transition-all"
          style={{
            background: active ? "rgba(248,220,138,0.40)" : "var(--ms-surface-2)",
            border: active ? "1px solid #C9941E" : "1px solid var(--ms-border)",
            color: active ? "#F5C842" : "var(--ms-text-muted)",
          }}
        >
          {tag}
        </button>
      );
    })}
  </div>
);

export default TagSelect;
