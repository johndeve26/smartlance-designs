"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
};

export function SearchInput({
  className,
  wrapperClassName,
  placeholder = "Search…",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
        aria-hidden
      />
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm",
          "placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className,
        )}
        {...props}
      />
    </div>
  );
}
