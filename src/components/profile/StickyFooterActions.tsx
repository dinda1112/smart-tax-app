"use client";

import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type Props = {
    canContinue: boolean;
    onSave: () => void;
    onContinue: () => void;
    savingLabel?: string;
  };
  
  export function StickyFooterActions({ canContinue, onSave, onContinue, savingLabel }: Props) {
    const { language } = useLanguage();
    const displayLabel = savingLabel || t(language, "common.saveProfile");
    
    return (
      <div 
        className="sticky-footer-actions sticky z-30 mt-6 mb-24 border-t border-[var(--border)] backdrop-blur-md bg-[var(--surface)]/95"
        data-sticky-footer-actions="1"
          style={{ 
  bottom: 'calc(4.5rem + var(--safe-area-bottom, 0px))',
  paddingBottom: 'calc(1rem + var(--safe-area-bottom, 0px))'
}}
      >
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="sticky-footer-hint order-2 text-xs text-[var(--text-secondary)] sm:order-1">
              {t(language, "common.completeRequiredFields")}
            </div>

            <div className="order-1 flex justify-end gap-2 sm:order-2">
              <button
                type="button"
                onClick={onSave}
                className="sticky-footer-secondary h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-extrabold text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
              >
                {displayLabel}
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className="h-11 rounded-2xl bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
              >
                {t(language, "common.continueArrow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  