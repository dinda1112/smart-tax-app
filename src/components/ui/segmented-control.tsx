"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  // Calculate the position of the selected pill
  const [pillStyle, setPillStyle] = React.useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // Update pill position when value changes or component mounts
  React.useEffect(() => {
    if (!containerRef.current || selectedIndex === -1) return;

    const updatePillPosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const buttons = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      const selectedButton = buttons[selectedIndex];

      if (selectedButton) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        setPillStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    };

    // Update immediately
    updatePillPosition();

    // Update after a brief delay to handle initial layout
    const timeoutId = setTimeout(updatePillPosition, 0);

    // Update on window resize
    window.addEventListener("resize", updatePillPosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updatePillPosition);
    };
  }, [value, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (disabled) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    // Skip disabled options
    while (options[nextIndex]?.disabled && nextIndex !== currentIndex) {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "Home") {
        nextIndex = nextIndex > 0 ? nextIndex - 1 : options.length - 1;
      } else {
        nextIndex = nextIndex < options.length - 1 ? nextIndex + 1 : 0;
      }
    }

    if (options[nextIndex] && !options[nextIndex].disabled) {
      onChange(options[nextIndex].value);
      // Focus the next button
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={name ? undefined : "Select option"}
      className={cn(
        "relative inline-flex w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1 shadow-sm",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Animated selected pill */}
      <AnimatePresence>
        {selectedOption && (
          <motion.div
            initial={false}
            animate={{
              left: pillStyle.left,
              width: pillStyle.width,
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 500,
            }}
            className="absolute top-1 bottom-1 rounded-lg bg-[var(--surface)] shadow-sm pointer-events-none"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
            }}
          />
        )}
      </AnimatePresence>

      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
            className={cn(
              "relative z-10 flex-1 rounded-lg px-3 py-1 text-xs font-semibold outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-elevated)]",
              "active:scale-[0.98]",
              isSelected
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
