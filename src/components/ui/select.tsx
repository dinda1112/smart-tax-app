import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
