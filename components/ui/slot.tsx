import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SlotProps = {
  children: ReactNode;
  className?: string;
};

/** Minimal asChild helper — merges className onto a single child element. */
export function Slot({ children, className }: SlotProps) {
  const child = Children.only(children);

  if (!isValidElement(child)) {
    return null;
  }

  const element = child as ReactElement<{ className?: string }>;

  return cloneElement(element, {
    className: cn(className, element.props.className),
  });
}
