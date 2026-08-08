type JsonFieldProps = {
  name: string;
  label: string;
  defaultValue?: unknown;
  hint?: string;
  rows?: number;
  disabled?: boolean;
};

function stringifyJson(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function JsonField({
  name,
  label,
  defaultValue,
  hint,
  rows = 8,
  disabled,
}: JsonFieldProps) {
  return (
    <label className="admin-field block">
      <span className="admin-label">{label}</span>
      {hint ? <span className="admin-hint">{hint}</span> : null}
      <textarea
        name={name}
        rows={rows}
        disabled={disabled}
        defaultValue={stringifyJson(defaultValue)}
        className="admin-input font-mono text-xs leading-relaxed"
        spellCheck={false}
      />
    </label>
  );
}
