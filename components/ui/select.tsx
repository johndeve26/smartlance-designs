import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  description?: string;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function Select({
  className,
  label,
  description,
  error,
  optional,
  id,
  children,
  wrapperClassName,
  ...props
}: SelectProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const field = (
    <select
      id={inputId}
      className={cn(
        "h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-error" : "border-border-strong",
        className,
      )}
      aria-invalid={error ? true : undefined}
      {...props}
    >
      {children}
    </select>
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
