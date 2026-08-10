import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
  optional?: boolean;
  wrapperClassName?: string;
};

export function Input({
  className,
  label,
  description,
  error,
  optional,
  id,
  wrapperClassName,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const field = (
    <input
      id={inputId}
      className={cn(
        "h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground",
        "placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-error" : "border-border-strong",
        className,
      )}
      aria-invalid={error ? true : undefined}
      aria-describedby={
        error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined
      }
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
        <p id={`${inputId}-desc`} className="text-small text-subtle">
          {description}
        </p>
      ) : null}
      {field}
      {error ? (
        <p id={`${inputId}-error`} className="text-small text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type InputLabelProps = { children: ReactNode; htmlFor: string; optional?: boolean };

export function InputLabel({ children, htmlFor, optional }: InputLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-label flex items-center gap-1">
      {children}
      {optional ? <span className="text-subtle font-normal">(optional)</span> : null}
    </label>
  );
}
