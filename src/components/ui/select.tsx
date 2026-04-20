import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-10 text-sm font-medium text-[var(--text-primary)] shadow-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };