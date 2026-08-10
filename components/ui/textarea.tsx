import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  description?: string;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function Textarea({
  className,
  label,
  description,
  error,
  optional,
  id,
  wrapperClassName,
  ...props
}: TextareaProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const field = (
    <textarea
      id={inputId}
      className={cn(
        "min-h-[5rem] w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-error" : "border-border-strong",
        className,
      )}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );

  if (!label) return field;

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      <label htmlFor={inputId} className="text-label flex items-center gap-1">
        {label}
        {optional ? (
          <span className="text-subtle font-normal">(optional)</span>
        ) : null}
      </label>
      {description ? (
        <p className="text-small text-subtle">{description}</p>
      ) : null}
      {field}
      {error ? (
        <p className="text-small text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
