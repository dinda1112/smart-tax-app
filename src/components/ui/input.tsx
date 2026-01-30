import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-sm outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };












