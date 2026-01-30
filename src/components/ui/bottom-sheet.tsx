"use client";

import * as React from "react";
import { Drawer } from "vaul";

interface BottomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  zIndex?: number;
}

const BottomSheet = ({ open, onOpenChange, children, title, description, zIndex = 50 }: BottomSheetProps) => {
  // iOS Safari: lock background scroll while open (prevents bounce/jank during keyboard transitions).
  React.useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyTouchAction: (body.style as any).touchAction as string,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    (body.style as any).touchAction = "none";

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      (body.style as any).touchAction = prev.bodyTouchAction || "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
          style={{ zIndex }}
        />
        <Drawer.Content 
          className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-[20px] border-t border-[var(--border)] bg-[var(--background)] outline-none"
          onOpenAutoFocus={(e) => {
            // iOS Safari: prevent Vaul/Radix from auto-focusing the first focusable element on open
            // (which can trigger the keyboard if an input is present).
            e.preventDefault();
          }}
          style={{
            zIndex,
            // Avoid margin/percentage-based positioning (iOS Safari keyboard can "teleport" these).
            // Keep strictly bottom-anchored and size from the visual viewport.
            height:
              "calc(var(--visual-viewport-height, 100dvh) - (24px + env(safe-area-inset-top, 0px)))",
            maxHeight:
              "calc(var(--visual-viewport-height, 100dvh) - (24px + env(safe-area-inset-top, 0px)))",
            // Help Safari interpret gestures consistently.
            touchAction: "pan-y",
          }}
        >
          <div
            className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-[var(--border)]"
            style={{ touchAction: "pan-y" }}
          />
          {(title || description) && (
            <div className="shrink-0 px-6 pt-4 pb-2">
              {title && (
                <Drawer.Title className="text-lg font-extrabold text-[var(--text-primary)]">
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="mt-1 text-sm text-[var(--text-secondary)]">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6"
            style={{
              paddingBottom: "calc(1.5rem + var(--safe-area-bottom))",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

BottomSheet.Trigger = Drawer.Trigger;
BottomSheet.Close = Drawer.Close;

export { BottomSheet };

