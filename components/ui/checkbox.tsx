import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function Checkbox({
  className,
  label,
  description,
  id,
  ...props
}: CheckboxProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-start gap-2.5">
      <input
        type="checkbox"
        id={inputId}
        className={cn(
          "mt-0.5 h-4 w-4 rounded border-border-strong text-cta",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className,
        )}
        {...props}
      />
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? (
          <p className="text-small text-subtle">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
