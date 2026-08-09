import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

type JsonFieldProps = {
  name: string;
  label: string;
  defaultValue?: unknown;
  hint?: string;
  rows?: number;
  disabled?: boolean;
  /** When set, shows Improve with AI for Work draft fields. */
  improveField?: string;
  improveEntityId?: string;
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
  improveField,
  improveEntityId,
}: JsonFieldProps) {
  return (
    <label className="admin-field block">
      <span className="admin-label flex items-center justify-between gap-2">
        {label}
        {improveField && improveEntityId ? (
          <ImproveFieldButton
            entityType="WORK"
            entityId={improveEntityId}
            field={improveField}
          />
        ) : null}
      </span>
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
