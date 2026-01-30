import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white shadow-sm hover:opacity-90",
        secondary: "bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]/80",
        outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]",
        ghost: "text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };












