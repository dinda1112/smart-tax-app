import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border text-[10px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        done: "border-[var(--badge-success-border)] bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]",
        incomplete: "border-[var(--badge-neutral-border)] bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]",
        required: "border-[var(--badge-neutral-border)] bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)] uppercase tracking-wide",
        optional: "border-[var(--badge-neutral-border)] bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)] uppercase tracking-wide",
      },
      size: {
        default: "px-2.5 py-1",
        sm: "px-1.5 py-0.5",
      },
    },
    defaultVariants: {
      variant: "incomplete",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon: Icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
