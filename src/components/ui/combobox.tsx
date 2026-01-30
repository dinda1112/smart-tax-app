"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import type { LanguageCode } from "@/lib/types";

export type ComboboxOption = {
  value: string;
  label: string;
};

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
}

export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      className,
      error,
      searchable = true,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = React.useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value]
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !search.trim()) return options;
      const searchLower = search.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchLower) ||
          opt.value.toLowerCase().includes(searchLower)
      );
    }, [options, search, searchable]);

    React.useEffect(() => {
      if (selectedOption) {
        setSearch(selectedOption.label);
      } else {
        setSearch("");
      }
    }, [selectedOption]);

    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    const handleSelect = (option: ComboboxOption) => {
      onChange?.(option.value);
      setSearch(option.label);
      setIsOpen(false);
      inputRef.current?.blur();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearch = e.target.value;
      setSearch(newSearch);
      setIsOpen(true);
      
      // If user clears the input, clear the value
      if (!newSearch.trim()) {
        onChange?.("");
      }
    };

    const handleInputFocus = () => {
      setIsOpen(true);
    };

    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    React.useEffect(() => {
      if (!isOpen) {
        setHighlightedIndex(-1);
      }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-10 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-[var(--danger)]"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {value && !disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.("");
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--text-secondary)] transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </div>
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full whitespace-normal break-words px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors first:rounded-t-2xl last:rounded-b-2xl",
                    option.value === value && "bg-[var(--surface-elevated)]",
                    highlightedIndex === index && "bg-[var(--surface-elevated)]"
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-[var(--text-secondary)] text-center">
                No results
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
Combobox.displayName = "Combobox";
