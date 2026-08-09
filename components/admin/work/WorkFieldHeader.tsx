import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

export function WorkFieldHeader({
  label,
  workId,
  field,
  aiLabel,
  enableAi = true,
}: {
  label: string;
  workId: string;
  field: string;
  aiLabel?: string;
  enableAi?: boolean;
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      {label}
      {enableAi ? (
        <ImproveFieldButton
          entityType="WORK"
          entityId={workId}
          field={field}
          label={aiLabel}
        />
      ) : null}
    </span>
  );
}
